/**
 * Hydration: a page rendered by the real server path (renderSite: Document +
 * StaticRouter + App) is loaded into jsdom and hydrated by the real client
 * startup (mountApp). React reports any mismatch between server markup and
 * client render through console.error / onRecoverableError; both must stay
 * silent, and the document must not change.
 */
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../api/query-client';
import { mountApp } from './mount';
import { renderSite, type RenderedPage } from '../build/render-site';
import { SITE, TEST_ASSETS, character, charSummary, colSummary, collection, emptyHome, movie, movieSummary, product, validData } from '../build/test-fixtures';
import { hydrateWith } from './hydration-helpers';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Includes a collection mention that is NOT published (rendered as plain text) and hostile text.
const data = validData({
  collections: [
    collection({
      relatedCollections: [{ collection: colSummary('cozy-slashers', 'Cozy Slashers'), sortOrder: 1 }, { collection: colSummary('ghost', 'Ghost'), sortOrder: 2 }],
    }),
  ],
  movies: [movie({ title: 'Evil </script><b>x</b> & "q"', collections: [colSummary('cozy-slashers', 'Cozy Slashers'), colSummary('ghost', 'Ghost')] })],
  characters: [character()],
  products: [product()],
});
// The homepage (Task 7.1): every section present, hostile text, and references that are not built (plain text).
const fullHome = {
  featuredCollections: [colSummary('cozy-slashers', 'Cozy </script>& "Slashers"'), colSummary('ghost', 'Ghost')],
  seasonalCollections: [{ ...colSummary('cozy-slashers', 'Cozy Slashers'), seasonal: true, summary: 'Seasonal & <b>bold</b>' }],
  giftCollection: { ...colSummary('ghost-gift', 'Ghost Gift'), type: 'GIFT' as const },
  featuredCharacter: { ...charSummary('billy', 'Billy'), imageUrl: 'https://img.test/b.jpg' },
  featuredMovie: movieSummary('not-built-movie', 'Not Built'),
};
const pages = renderSite({ ...data, home: fullHome }, { siteUrl: SITE, assets: TEST_ASSETS });
// All optional sections absent / empty lists.
const emptyHomePage = renderSite({ ...data, home: emptyHome() }, { siteUrl: SITE, assets: TEST_ASSETS })[0];

const mounted: Root[] = [];
let errors: unknown[][];

beforeEach(() => {
  errors = [];
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args);
  });
});
afterEach(async () => {
  vi.restoreAllMocks();
  for (const root of mounted.splice(0)) await act(async () => root.unmount());
  document.documentElement.innerHTML = '<head></head><body></body>';
});

async function hydrate(page: RenderedPage, mutate?: (root: HTMLElement) => void) {
  const recoverable: unknown[] = [];
  const result = await hydrateWith(page, { mutate, onRecoverableError: (e) => recoverable.push(e) });
  mounted.push(result.root);
  return { ...result, recoverable };
}

describe('hydration of server-rendered pages', () => {
  it.each(pages.map((p) => [p.type, p] as const))('%s page hydrates without mismatch and without changing the document', async (_type, page) => {
    const { mode, before, after, recoverable } = await hydrate(page);
    expect(mode).toBe('hydrate');
    expect(errors).toEqual([]);
    expect(recoverable).toEqual([]);
    expect(after).toBe(before);
    // The server HTML really was reused: it holds the page and the embedded data.
    expect(document.getElementById('__PAGE_DATA__')).not.toBeNull();
    expect(document.querySelector('main h1')).not.toBeNull();
  });

  it('the homepage with every optional section absent hydrates without mismatch', async () => {
    expect(emptyHomePage.type).toBe('home');
    const { mode, before, after, recoverable } = await hydrate(emptyHomePage);
    expect(mode).toBe('hydrate');
    expect(errors).toEqual([]);
    expect(recoverable).toEqual([]);
    expect(after).toBe(before);
    expect(document.querySelectorAll('main h1')).toHaveLength(1);
    expect(document.querySelectorAll('main h2')).toHaveLength(0);
  });

  it('the homepage keeps unbuilt references as plain text after hydration (same as the server)', async () => {
    const page = pages.find((p) => p.type === 'home')!;
    await hydrate(page);
    expect(errors).toEqual([]);
    const hrefs = [...document.querySelectorAll('main a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['#featured-collections', '/collections/cozy-slashers/', '/collections/cozy-slashers/', '/characters/billy/']);
    expect(document.querySelector('main')!.textContent).toContain('Not Built');
  });

  it('has a working control: a changed server markup IS reported as a mismatch', async () => {
    const page = pages.find((p) => p.type === 'movie')!;
    const { recoverable } = await hydrate(page, (root) => {
      root.querySelector('main h1')!.textContent = 'Tampered';
    });
    expect(errors.length + recoverable.length).toBeGreaterThan(0);
  });

  it('falls back to client-only rendering when the container is empty (dev server)', async () => {
    document.documentElement.innerHTML = '<head></head><body><div id="root"></div></body>';
    window.history.replaceState(null, '', '/movies/black-christmas/');
    const container = document.getElementById('root')!;
    let result!: ReturnType<typeof mountApp>;
    await act(async () => {
      result = mountApp({ container, queryClient: createQueryClient() });
    });
    mounted.push(result.root);
    expect(result.mode).toBe('render');
    expect(container.textContent).toContain('Page data not available');
    expect(container.querySelector('nav')).not.toBeNull();
    expect(errors).toEqual([]);
  });

  it('does not hydrate server markup that has no embedded data: renders fresh and says so', async () => {
    const page = pages.find((p) => p.type === 'product')!;
    const { mode } = await hydrate(page, () => {
      document.getElementById('__PAGE_DATA__')!.remove();
    });
    expect(mode).toBe('render');
    expect(errors.some((a) => String(a[0]).includes('without embedded page data'))).toBe(true);
  });
});
