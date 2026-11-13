/**
 * Test support for hydration tests: load a rendered page into the jsdom
 * document and run the real client startup on it.
 */
import { act } from 'react';
import { createQueryClient } from '../api/query-client';
import { mountApp, type Mounted } from './mount';
import type { RenderedPage } from '../build/render-site';

export interface HydrateResult extends Mounted {
  /** The whole document before and after hydration. */
  before: string;
  after: string;
}

export async function hydrateWith(
  page: RenderedPage,
  options: { mutate?: (root: HTMLElement) => void; onRecoverableError?: (error: unknown) => void } = {},
): Promise<HydrateResult> {
  // Everything between <html ...> and </html>; scripts inserted this way never execute, so only the client startup below runs.
  const inner = page.html.replace(/^<!doctype html>/i, '').replace(/^<html[^>]*>/i, '').replace(/<\/html>$/i, '');
  document.documentElement.innerHTML = inner;
  window.history.replaceState(null, '', page.path);
  const container = document.getElementById('root') as HTMLElement;
  options.mutate?.(container);
  const before = document.documentElement.outerHTML;
  let mounted!: Mounted;
  await act(async () => {
    mounted = mountApp({ container, queryClient: createQueryClient(), onRecoverableError: options.onRecoverableError });
  });
  return { ...mounted, before, after: document.documentElement.outerHTML };
}
