// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ApiConfigError, ApiRequestError, createApiClient, normalizeApiBaseUrl } from './client';
import type { HomeResponse } from '../types/api-contracts';

const HOME: HomeResponse = {
  featuredCollections: [], seasonalCollections: [], featuredMovie: null, featuredCharacter: null, giftCollection: null,
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A fake fetch that records requests and answers with `reply`. */
function fakeFetch(reply: (url: string) => Response | Promise<Response>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return reply(String(input));
  }) as typeof fetch;
  return { fn, calls };
}

describe('normalizeApiBaseUrl', () => {
  it('trims and removes trailing slashes', () => {
    expect(normalizeApiBaseUrl(' http://127.0.0.1:3000// ')).toBe('http://127.0.0.1:3000');
  });
  it.each([undefined, '', '   ', 'not a url', 'ftp://x.test', 'http://x.test?a=1', 'http://x.test#h'])('rejects %j', (v) => {
    expect(() => normalizeApiBaseUrl(v)).toThrow(ApiConfigError);
  });
  it('names the env variable in the message', () => {
    expect(() => normalizeApiBaseUrl(undefined)).toThrow(/VITE_API_BASE_URL is not set/);
  });
});

describe('createApiClient.getHome', () => {
  it('requests GET {base}/home as JSON and returns the typed body', async () => {
    const f = fakeFetch(() => json(HOME));
    const home = await createApiClient({ baseUrl: 'http://api.test/', fetch: f.fn }).getHome();
    expect(home).toEqual(HOME);
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].url).toBe('http://api.test/home');
    expect(f.calls[0].init?.headers).toEqual({ Accept: 'application/json' });
  });

  it('passes the abort signal through, and lets an abort through unchanged', async () => {
    const controller = new AbortController();
    const f = fakeFetch(() => json(HOME));
    await createApiClient({ baseUrl: 'http://api.test', fetch: f.fn }).getHome({ signal: controller.signal });
    expect(f.calls[0].init?.signal).toBe(controller.signal);

    const aborting = (async () => {
      throw new DOMException('aborted', 'AbortError');
    }) as typeof fetch;
    await expect(createApiClient({ baseUrl: 'http://api.test', fetch: aborting }).getHome()).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('turns a non-OK answer into ApiRequestError with status and the API error code', async () => {
    const f = fakeFetch(() => json({ error: { code: 'NOT_FOUND', message: 'home not found' } }, 404));
    const error = await createApiClient({ baseUrl: 'http://api.test', fetch: f.fn }).getHome().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ kind: 'http', status: 404, code: 'NOT_FOUND', url: 'http://api.test/home' });
    expect((error as Error).message).toContain('404');
    expect((error as Error).message).toContain('home not found');
  });

  it('still reports a non-OK answer whose body is not JSON', async () => {
    const f = fakeFetch(() => new Response('<html>bad gateway</html>', { status: 502 }));
    await expect(createApiClient({ baseUrl: 'http://api.test', fetch: f.fn }).getHome()).rejects.toMatchObject({
      kind: 'http', status: 502, code: null,
    });
  });

  it('turns a network failure into ApiRequestError(network) and keeps the cause', async () => {
    const cause = new TypeError('Failed to fetch');
    const down = (async () => {
      throw cause;
    }) as typeof fetch;
    const error = await createApiClient({ baseUrl: 'http://api.test', fetch: down }).getHome().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ kind: 'network', status: null });
    expect((error as Error).cause).toBe(cause);
  });

  it.each([
    ['a body that is not JSON', () => new Response('nope', { status: 200 })],
    ['JSON that is not an object', () => json('just a string')],
    ['JSON null', () => json(null)],
  ])('rejects %s as invalid-response', async (_n, reply) => {
    const f = fakeFetch(reply);
    await expect(createApiClient({ baseUrl: 'http://api.test', fetch: f.fn }).getHome()).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('rejects an invalid base URL when the client is created', () => {
    expect(() => createApiClient({ baseUrl: '' })).toThrow(ApiConfigError);
  });
});
