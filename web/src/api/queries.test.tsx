import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApiClient } from './client';
import { createQueryClient } from './query-client';
import { homeQueryOptions, queryKeys, useHome } from './queries';
import type { HomeResponse } from '../types/api-contracts';
import { movieSummary } from '../build/test-fixtures';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const HOME: HomeResponse = {
  featuredCollections: [], seasonalCollections: [], featuredMovie: movieSummary('black-christmas', 'Black Christmas'),
  featuredCharacter: null, giftCollection: null,
};
const fakeApi = (reply: () => Response) => {
  let calls = 0;
  const fetchFn = (async () => {
    calls++;
    return reply();
  }) as typeof fetch;
  return { api: createApiClient({ baseUrl: 'http://api.test', fetch: fetchFn }), calls: () => calls };
};
const ok = () => new Response(JSON.stringify(HOME), { status: 200 });

describe('homeQueryOptions', () => {
  it('fetches /home through the client and caches it under the home key', async () => {
    const { api, calls } = fakeApi(ok);
    const qc = createQueryClient();
    expect(await qc.fetchQuery(homeQueryOptions(api))).toEqual(HOME);
    expect(qc.getQueryData(queryKeys.home)).toEqual(HOME);
    await qc.fetchQuery(homeQueryOptions(api)); // fresh (staleTime): served from cache
    expect(calls()).toBe(1);
  });

  it('surfaces API errors as query errors', async () => {
    const { api } = fakeApi(() => new Response('{}', { status: 404 }));
    const qc = createQueryClient();
    await expect(qc.fetchQuery({ ...homeQueryOptions(api), retry: false })).rejects.toMatchObject({ kind: 'http', status: 404 });
  });
});

describe('useHome', () => {
  let container: HTMLElement;
  let root: Root;
  let qc: QueryClient;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    qc = createQueryClient();
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    qc.clear();
  });

  function Probe({ api }: { api: ReturnType<typeof createApiClient> }) {
    const q = useHome(api);
    return <p>{q.isPending ? 'loading' : q.isError ? `error:${q.error.message}` : `movie:${q.data.featuredMovie?.title}`}</p>;
  }
  const settle = async () => {
    for (let i = 0; i < 20 && /loading/.test(container.textContent ?? ''); i++) {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 5));
      });
    }
  };

  it('goes from loading to the data', async () => {
    const { api } = fakeApi(ok);
    await act(async () => root.render(<QueryClientProvider client={qc}><Probe api={api} /></QueryClientProvider>));
    expect(container.textContent).toBe('loading');
    await settle();
    expect(container.textContent).toBe('movie:Black Christmas');
  });

  it('reports a 404 as an error without retrying', async () => {
    const { api, calls } = fakeApi(() => new Response('{}', { status: 404 }));
    await act(async () => root.render(<QueryClientProvider client={qc}><Probe api={api} /></QueryClientProvider>));
    await settle();
    expect(container.textContent).toMatch(/^error:.*404/);
    expect(calls()).toBe(1);
  });
});
