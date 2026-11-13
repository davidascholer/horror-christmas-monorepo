/**
 * Browser startup, kept apart from the entry file so tests can run it.
 *
 * - The container already holds server-rendered HTML (a built page): hydrate
 *   it with hydrateRoot. The embedded page data (#__PAGE_DATA__) is read first,
 *   so the tree renders from the same data as the server and nothing is refetched.
 * - The container is empty (Vite dev server, client-only): render with createRoot.
 *   There is no page data then; entity routes show a notice (route-elements.tsx).
 *
 * The QueryClientProvider is browser-only: the server render needs no cache and
 * the provider adds no DOM, so hydration is unaffected.
 */
import { hydrateRoot, createRoot, type Root } from 'react-dom/client';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { App } from '../app/App';
import { readHydrationPayload } from '../app/page-data';

export interface MountOptions {
  container: HTMLElement;
  queryClient: QueryClient;
  /** Defaults to the container's document. */
  doc?: Document;
  /** Receives hydration problems React recovers from. Default: console.error. */
  onRecoverableError?: (error: unknown) => void;
}

export interface Mounted {
  root: Root;
  mode: 'hydrate' | 'render';
}

export function mountApp({ container, queryClient, doc = container.ownerDocument, onRecoverableError }: MountOptions): Mounted {
  const payload = readHydrationPayload(doc);
  const tree = (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App payload={payload} />
      </BrowserRouter>
    </QueryClientProvider>
  );
  const hasServerHtml = container.hasChildNodes();
  if (hasServerHtml && payload) {
    const root = hydrateRoot(container, tree, {
      onRecoverableError: onRecoverableError ?? ((error) => console.error(error)),
    });
    return { root, mode: 'hydrate' };
  }
  if (hasServerHtml) {
    // Server markup without its data cannot be hydrated faithfully: render fresh instead of guessing.
    console.error('Server-rendered content found without embedded page data (#__PAGE_DATA__); rendering client-side.');
  }
  const root = createRoot(container);
  root.render(tree);
  return { root, mode: 'render' };
}
