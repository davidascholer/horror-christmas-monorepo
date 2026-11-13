// @vitest-environment node
/**
 * Static page rendering tests (Task 6.2). Fixtures are full typed models; no
 * network. Covers Requirements 9.1, 9.2, 15.1 and the content rules of 3.1-3.4, 4.1-4.4.
 */
import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile, readdir, rm, stat, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderSite as renderSiteWith, type RenderedPage } from './render-site';
import { writePages } from './write-pages';
import { generateStatic, formatSummary } from './generate-static';
import type {
  CharacterDetail,
  CharacterSummary,
  CollectionDetail,
  CollectionSummary,
  MovieDetail,
  MovieSummary,
  ProductDetail,
  ProductSummary,
} from '../types/api-contracts';

const TS = '2026-01-01T00:00:00.000Z';
import { TEST_ASSETS, homeFeaturing, visibleHtml, type EntityBuildData } from './test-fixtures';
const SITE = 'https://example.test';
const renderSite = (d: Parameters<typeof renderSiteWith>[0]) => renderSiteWith(d, { assets: TEST_ASSETS, siteUrl: SITE });

const colSummary = (slug: string, title: string): CollectionSummary => ({
  id: `id-${slug}`, slug, title, summary: null, type: 'THEME', heroImageUrl: null, featured: false, seasonal: false,
});
const movieSummary = (slug: string, title: string, year: number | null = 1984): MovieSummary => ({
  id: `id-${slug}`, slug, title, releaseYear: year, mediaType: 'FILM', posterUrl: null, synopsis: null,
});
const charSummary = (slug: string, name: string): CharacterSummary => ({
  id: `id-${slug}`, slug, name, summary: null, imageUrl: null,
});
const prodSummary = (slug: string, name: string): ProductSummary => ({
  id: `id-${slug}`, slug, name, description: null, imageUrl: null, price: null, currency: null, category: null,
});

function collection(over: Partial<CollectionDetail> = {}): CollectionDetail {
  return {
    id: 'c1', slug: 'cozy-slashers', title: 'Cozy Slashers', type: 'THEME',
    introduction: 'First paragraph.\n\nSecond paragraph.', curatorNotes: 'Curator view of the set.',
    summary: 'A short summary.', heroImageUrl: 'https://img.test/hero.jpg', heroImageAlt: 'Snowy house at night',
    seoTitle: null, seoDescription: null, featured: true, seasonal: true,
    publishedAt: TS, createdAt: TS, updatedAt: TS,
    movies: [
      { movie: movieSummary('black-christmas', 'Black Christmas', 1974), sortOrder: 1, curatorNote: 'Start here.' },
      { movie: movieSummary('silent-night', 'Silent Night', 1984), sortOrder: 2, curatorNote: null },
      { movie: movieSummary('better-watch-out', 'Better Watch Out', null), sortOrder: 3, curatorNote: 'Twisty.' },
    ],
    characters: [{ character: charSummary('billy', 'Billy'), sortOrder: 1, curatorNote: 'Iconic.' }],
    products: [{ product: prodSummary('mug', 'Slay Bells Mug'), sortOrder: 1, curatorNote: 'Great gift.' }],
    franchises: [{ franchise: { id: 'f1', slug: 'sng', name: 'Silent Night Series' }, sortOrder: 1 }],
    tags: [{ id: 't1', slug: 'slasher', name: 'Slasher' }],
    relatedCollections: [{ collection: colSummary('gift-guide', 'Gift Guide'), sortOrder: 1 }],
    ...over,
  };
}

function movie(over: Partial<MovieDetail> = {}): MovieDetail {
  return {
    id: 'm1', slug: 'black-christmas', title: 'Black Christmas', originalTitle: null, mediaType: 'FILM',
    releaseYear: 1974, releaseDate: '1974-10-16', runtime: 98, synopsis: 'Sorority house, phone calls.',
    posterUrl: 'https://img.test/p.jpg', heroImageUrl: null, trailerUrl: 'https://video.test/t',
    seoTitle: null, seoDescription: null, featured: false, franchise: null,
    publishedAt: TS, createdAt: TS, updatedAt: TS,
    characters: [{ character: charSummary('billy', 'Billy'), role: 'Caller', sortOrder: 1 }],
    collections: [colSummary('cozy-slashers', 'Cozy Slashers')],
    tags: [{ id: 't1', slug: 'slasher', name: 'Slasher' }],
    relatedProducts: [prodSummary('mug', 'Slay Bells Mug')],
    ...over,
  };
}

function character(over: Partial<CharacterDetail> = {}): CharacterDetail {
  return {
    id: 'ch1', slug: 'billy', name: 'Billy', summary: 'Menacing.', biography: 'Origin story.',
    imageUrl: null, seoTitle: null, seoDescription: null, featured: false,
    franchise: { id: 'f1', slug: 'sng', name: 'Silent Night Series' },
    publishedAt: TS, createdAt: TS, updatedAt: TS,
    movies: [movieSummary('black-christmas', 'Black Christmas')],
    products: [prodSummary('mug', 'Slay Bells Mug')],
    collections: [colSummary('cozy-slashers', 'Cozy Slashers')],
    tags: [{ id: 't1', slug: 'slasher', name: 'Slasher' }],
    ...over,
  };
}

function product(over: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: 'p1', slug: 'mug', name: 'Slay Bells Mug', description: 'A mug.', category: 'Kitchen',
    imageUrl: 'https://img.test/mug.jpg', imageAlt: 'A red mug', price: '24.90', currency: 'USD',
    seoTitle: null, seoDescription: null, featured: false, franchise: null,
    affiliateLinks: [
      { id: 'a1', provider: 'Amazon', url: 'https://amazon.test/mug', productId: 'p1' },
      { id: 'a2', provider: 'Evil', url: 'javascript:alert(1)', productId: 'p1' },
    ],
    publishedAt: TS, createdAt: TS, updatedAt: TS,
    characters: [{ character: charSummary('billy', 'Billy'), sortOrder: 1 }],
    collections: [colSummary('cozy-slashers', 'Cozy Slashers')],
    tags: [],
    ...over,
  };
}

const data = (over: Partial<EntityBuildData> = {}): EntityBuildData => ({
  collections: [collection()], movies: [movie()], characters: [character()], products: [product()], warnings: [],
  updatedAt: { collections: new Map(), movies: new Map(), characters: new Map(), products: new Map() },
  ...over,
});

const rawPageOf = (pages: RenderedPage[], type: RenderedPage['type']): RenderedPage => {
  const p = pages.find((x) => x.type === type);
  if (!p) throw new Error(`no ${type} page`);
  return p;
};
// Content assertions look at the visible markup: data scripts (JSON-LD, hydration data) and React's
// hydration text separators are removed first (see visibleHtml). Raw HTML is asserted where it matters.
const pageOf = (pages: RenderedPage[], type: RenderedPage['type']): RenderedPage => {
  const p = rawPageOf(pages, type);
  return { ...p, html: visibleHtml(p.html) };
};
const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe('renderSite', () => {
  it('emits one page per model at the exact slug-based routes', () => {
    const pages = renderSite(data());
    expect(pages.map((p) => [p.path, p.outputPath])).toEqual([
      ['/collections/cozy-slashers/', 'collections/cozy-slashers/index.html'],
      ['/movies/black-christmas/', 'movies/black-christmas/index.html'],
      ['/characters/billy/', 'characters/billy/index.html'],
      ['/products/mug/', 'products/mug/index.html'],
    ]);
  });

  it('every page is a full document with one h1, landmarks, and no executable scripts', () => {
    for (const p of renderSite(data())) {
      expect(p.html.startsWith('<!doctype html>')).toBe(true);
      expect(count(p.html, /<h1[\s>]/g)).toBe(1);
      for (const tag of ['header', 'nav', 'main', 'footer']) expect(p.html).toContain(`<${tag}`);
      // Allowed scripts, exactly: JSON-LD, the one client entry module, the hydration data blob.
      // No inline executable script and no inline event handlers.
      const scripts = [...p.html.matchAll(/<script\b[^>]*>/gi)].map((m) => m[0]);
      expect(scripts).toEqual([
        '<script type="application/ld+json">',
        `<script type="module" src="${TEST_ASSETS.entry}">`,
        '<script type="application/json" id="__PAGE_DATA__">',
      ]);
      expect(p.html).not.toMatch(/\son[a-z]+=/i);
      // Visible text never shows null/undefined (the hydration data legitimately contains JSON null).
      const visible = visibleHtml(p.html);
      expect(visible).not.toMatch(/>\s*(null|undefined)\s*</);
      expect(visible).not.toMatch(/\b(null|undefined)\b/);
    }
  });

  it('collection page: content, items in given order with curator notes, related collections, slug links', () => {
    // gift-guide must be among the built collections for its link to be a link (Task 6.5).
    const html = pageOf(
      renderSite(data({ collections: [collection(), collection({ id: 'c2', slug: 'gift-guide', title: 'Gift Guide', relatedCollections: [] })] })),
      'collection',
    ).html;
    expect(html).toContain('<h1>Cozy Slashers</h1>');
    expect(html).toContain('<p>First paragraph.</p><p>Second paragraph.</p>');
    expect(html).toContain('Curator view of the set.');
    expect(html).toContain('alt="Snowy house at night"');
    const a = html.indexOf('/movies/black-christmas/');
    const b = html.indexOf('/movies/silent-night/');
    const c = html.indexOf('/movies/better-watch-out/');
    expect(a).toBeGreaterThan(-1);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(html).toContain('<ol><li><a href="/movies/black-christmas/">Black Christmas</a> (1974)<p>Start here.</p></li>');
    expect(html).toContain('Twisty.');
    expect(html).toContain('Great gift.');
    expect(html).toContain('<a href="/characters/billy/">Billy</a>');
    expect(html).toContain('<a href="/products/mug/">Slay Bells Mug</a>');
    expect(html).toContain('<a href="/collections/gift-guide/">Gift Guide</a>');
    expect(html).toContain('Silent Night Series');
    expect(html).toContain('Slasher');
  });

  it('movie page: details, trailer, placeholder, links back to collections (Req 1.3)', () => {
    const html = pageOf(renderSite(data()), 'movie').html;
    expect(html).toContain('<h1>Black Christmas</h1>');
    expect(html).toContain('1974-10-16');
    expect(html).toContain('98 minutes');
    expect(html).toContain('Sorority house, phone calls.');
    expect(html).toContain('href="https://video.test/t"');
    expect(html).toContain('<a href="/characters/billy/">Billy</a> (Caller)');
    expect(html).toContain('<a href="/collections/cozy-slashers/">Cozy Slashers</a>');
    expect(html).toContain('<a href="/products/mug/">Slay Bells Mug</a>');
    expect(html).toMatch(/<div hidden="" data-placeholder="add-to-watchlist"/);
  });

  it('character page: biography, franchise, and relationship links', () => {
    const html = pageOf(renderSite(data()), 'character').html;
    expect(html).toContain('<h1>Billy</h1>');
    expect(html).toContain('Origin story.');
    expect(html).toContain('Franchise: Silent Night Series');
    expect(html).toContain('<a href="/movies/black-christmas/">Black Christmas</a>');
    expect(html).toContain('<a href="/products/mug/">Slay Bells Mug</a>');
    expect(html).toContain('<a href="/collections/cozy-slashers/">Cozy Slashers</a>');
  });

  it('product page: price string preserved, affiliate links sponsored, unsafe URLs dropped', () => {
    const html = pageOf(renderSite(data()), 'product').html;
    expect(html).toContain('<dd>24.90 USD</dd>');
    expect(html).toContain('rel="sponsored noopener"');
    expect(html).toContain('href="https://amazon.test/mug"');
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('alt="A red mug"');
    expect(html).toContain('<a href="/characters/billy/">Billy</a>');
    expect(html).toContain('<a href="/collections/cozy-slashers/">Cozy Slashers</a>');
    expect(count(html, /rel="sponsored noopener"/g)).toBe(1);
  });

  it('omits optional sections cleanly when data is missing', () => {
    const pages = renderSite({
      collections: [collection({
        introduction: '', curatorNotes: '', summary: null, heroImageUrl: null, heroImageAlt: null,
        movies: [], characters: [], products: [], franchises: [], tags: [], relatedCollections: [],
      })],
      movies: [movie({
        originalTitle: null, releaseYear: null, releaseDate: null, runtime: null, synopsis: null,
        trailerUrl: null, posterUrl: null, characters: [], collections: [], tags: [], relatedProducts: [],
      })],
      characters: [character({ summary: null, biography: null, franchise: null, movies: [], products: [], collections: [], tags: [] })],
      products: [product({ description: null, category: null, price: null, currency: null, imageUrl: null, imageAlt: null, affiliateLinks: [], characters: [], collections: [], tags: [] })],
    });
    for (const p of pages) {
      const html = visibleHtml(p.html); // the hydration data legitimately holds JSON null
      expect(html).not.toMatch(/\b(null|undefined)\b/);
      expect(html).not.toContain('<h2');
      // Task 6.5: no image data means the fallback image, the only <img> (was: no <img>).
      expect(html.match(/<img\b[^>]*>/g)).toEqual([
        '<img src="/images/fallback.svg" alt="" role="presentation" decoding="async" loading="eager" fetchPriority="high"/>',
      ]);
      expect(html).not.toContain('<ul></ul>');
      expect(count(html, /<h1[\s>]/g)).toBe(1);
    }
    const m = pageOf(pages, 'movie').html;
    expect(m).not.toContain('Runtime');
    expect(m).not.toContain('Released');
    expect(pageOf(pages, 'product').html).not.toContain('Price');
  });

  it('uses the entity name as alt when the model has no alt text (was: omitted the image)', () => {
    const html = pageOf(renderSite(data({ products: [product({ imageAlt: null })] })), 'product').html;
    expect(html).toContain('<img src="https://img.test/mug.jpg" alt="Slay Bells Mug"');
  });

  it('escapes hostile strings in every page type', () => {
    const evil = '<script>alert("x")</script>';
    const pages = renderSite({
      collections: [collection({ title: evil, introduction: evil, movies: [{ movie: movieSummary('m', evil), sortOrder: 1, curatorNote: evil }] })],
      movies: [movie({ title: evil, synopsis: evil })],
      characters: [character({ name: evil, biography: evil })],
      products: [product({ name: evil, description: evil, imageAlt: evil })],
    });
    for (const p of pages) {
      // Only the three known scripts (JSON-LD, entry module, hydration data); hostile text never adds another,
      // and the raw hostile markup appears nowhere, data blocks included.
      expect(p.html.toLowerCase().split('<script').length - 1).toBe(3);
      expect(p.html).not.toContain('<script>alert');
      expect(p.html).toContain('&lt;script&gt;');
    }
  });

  it('keeps unparsed text as given: no number coercion of the price', () => {
    const html = pageOf(renderSite(data({ products: [product({ price: '0010.500', currency: null })] })), 'product').html;
    expect(html).toContain('<dd>0010.500</dd>');
  });

  it('rejects slugs that cannot be a single path segment', () => {
    expect(() => renderSite(data({ movies: [movie({ slug: '../evil' })] }))).toThrow(/Invalid movie slug/);
    expect(() => renderSite(data({ products: [product({ slug: '' })] }))).toThrow(/Invalid product slug/);
  });

  it('renders nothing for empty data without crashing', () => {
    expect(renderSite({ collections: [], movies: [], characters: [], products: [] })).toEqual([]);
  });
});

describe('writePages and generateStatic', () => {
  async function tmp() {
    return mkdtemp(path.join(tmpdir(), 'static-'));
  }

  it('writes {slug}/index.html under the output directory', async () => {
    const dir = await tmp();
    try {
      const pages = renderSite(data());
      expect(await writePages(pages, dir)).toBe(4);
      const html = await readFile(path.join(dir, 'movies/black-christmas/index.html'), 'utf8');
      expect(html).toBe(rawPageOf(pages, 'movie').html);
      expect((await stat(path.join(dir, 'collections/cozy-slashers/index.html'))).isFile()).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('clears stale page directories but leaves other files alone', async () => {
    const dir = await tmp();
    try {
      await mkdir(path.join(dir, 'movies/old'), { recursive: true });
      await writeFile(path.join(dir, 'movies/old/index.html'), 'stale');
      await writeFile(path.join(dir, 'keep.txt'), 'keep');
      await writePages(renderSite(data()), dir);
      expect(await readdir(path.join(dir, 'movies'))).toEqual(['black-christmas']);
      expect(await readFile(path.join(dir, 'keep.txt'), 'utf8')).toBe('keep');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('writes nothing for zero pages', async () => {
    const dir = await tmp();
    try {
      expect(await writePages([], dir)).toBe(0);
      expect(await readdir(dir)).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  function fakeFetch(models: Record<string, unknown>, lists: Record<string, string[]>): typeof fetch {
    return (async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const [, first, second] = url.pathname.split('/');
      if (first === 'home') return new Response(JSON.stringify(homeFeaturing(lists.collections ?? [])), { status: 200 });
      if (first === 'build') {
        const body = (lists[second] ?? []).map((slug) => ({ slug, updatedAt: TS }));
        return new Response(JSON.stringify(body), { status: 200 });
      }
      const model = models[`${first}/${second}`];
      return model ? new Response(JSON.stringify(model), { status: 200 }) : new Response('', { status: 404 });
    }) as typeof fetch;
  }

  it('generates from API data, summarizes, and reports a clear message when empty', async () => {
    const dir = await tmp();
    try {
      const f = fakeFetch(
        // SEO fields are required by the Task 6.5 publication validation.
        {
          'collections/cozy-slashers': collection({ seoTitle: 'Cozy', seoDescription: 'Cozy slashers.' }),
          'movies/black-christmas': movie({ seoTitle: 'BC', seoDescription: 'A classic.' }),
        },
        { collections: ['cozy-slashers'], movies: ['black-christmas', 'gone'], characters: [], products: [] },
      );
      const summary = await generateStatic({ assets: TEST_ASSETS, env: { API_BASE_URL: 'http://api.test', SITE_URL: SITE }, outDir: dir, fetch: f });
      expect(summary.counts).toEqual({ home: 1, collections: 1, movies: 1, characters: 0, products: 0, total: 3 });
      // "gone" (404), the homepage's fallback og:image (Task 7.1), and the collection's unbuilt related collection gift-guide (Task 6.5).
      expect(summary.warnings.map((w) => w.message)).toEqual([
        expect.stringContaining('"gone"'),
        expect.stringMatching(/^home "\/": no usable image/),
        expect.stringContaining('references collection "gift-guide"'),
      ]);
      const text = formatSummary(summary);
      expect(text).toContain('Generated 3 pages');
      expect(text).toContain('homepage:    1');
      expect(text).toContain('movies:      1');
      expect(text).toContain('"gone"');

      const empty = await generateStatic({
        assets: TEST_ASSETS, env: { API_BASE_URL: 'http://api.test', SITE_URL: SITE }, outDir: dir + '-none',
        fetch: fakeFetch({}, { collections: [], movies: [], characters: [], products: [] }),
      });
      expect(empty.counts.total).toBe(0);
      expect(formatSummary(empty)).toContain('No published content found');
      // Empty build: no pages, no sitemap, but robots.txt is still written.
      // The static assets (images/fallback.svg, Task 6.5) are copied even with no pages.
      expect(await readdir(dir + '-none')).toEqual(['images', 'robots.txt']);
    } finally {
      await rm(dir, { recursive: true, force: true });
      await rm(dir + '-none', { recursive: true, force: true });
    }
  });

  it('fails when API_BASE_URL is missing', async () => {
    await expect(generateStatic({ assets: TEST_ASSETS, env: {} })).rejects.toThrow(/API_BASE_URL/);
  });
});
