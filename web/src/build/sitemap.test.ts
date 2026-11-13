// @vitest-environment node
/**
 * sitemap.xml / robots.txt tests (Task 6.4, Requirements 9.6, 3.8, 11.6).
 * Models are minimal stand-ins (only the fields these functions read), cast to
 * the contract types.
 */
import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  MAX_SITEMAP_URLS,
  STATIC_SITEMAP_ROUTES,
  SitemapError,
  buildRobotsTxt,
  buildSitemapXml,
  collectSitemapEntries,
  escapeXml,
  formatLastmod,
  renderSeoFiles,
} from './sitemap';
import { canonicalUrl } from './site-url';
import { resolvePageMetadata, type PageModel } from './page-head';
import { writeSeoFiles } from './write-pages';
import { generateStatic, formatSummary } from './generate-static';
import { SiteUrlError } from './site-url';

import { TEST_ASSETS, emptyHome, homeFeaturing, type EntityBuildData } from './test-fixtures';
const SITE = 'https://example.test';
const TS = '2026-01-01T00:00:00.000Z';

const stub = (slug: string) =>
  ({
    slug, title: slug, name: slug, seoTitle: null, seoDescription: null, summary: null, introduction: null,
    synopsis: null, biography: null, description: null, heroImageUrl: null, posterUrl: null, imageUrl: null,
    movies: [], characters: [], products: [], collections: [], tags: [], franchises: [], relatedMovies: [],
    relatedCharacters: [], relatedProducts: [], relatedCollections: [], appearances: [], affiliateLinks: [], price: null, currency: null,
    releaseYear: null, releaseDate: null, runtimeMinutes: null,
  }) as never;

function build(slugs: Partial<Record<'collections' | 'movies' | 'characters' | 'products', string[]>>, updatedAt = TS): EntityBuildData {
  const data: EntityBuildData = {
    collections: [], movies: [], characters: [], products: [], warnings: [],
    updatedAt: { collections: new Map(), movies: new Map(), characters: new Map(), products: new Map() },
  };
  for (const key of ['collections', 'movies', 'characters', 'products'] as const) {
    for (const slug of slugs[key] ?? []) {
      (data[key] as unknown[]).push(stub(slug));
      if (updatedAt) data.updatedAt[key].set(slug, updatedAt);
    }
  }
  return data;
}

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

describe('buildSitemapXml', () => {
  it('emits a sitemaps.org urlset with the XML declaration and namespace', () => {
    const xml = buildSitemapXml([{ url: 'https://example.test/movies/a/', lastmod: TS }]);
    expect(xml).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        '  <url>\n    <loc>https://example.test/movies/a/</loc>\n    <lastmod>2026-01-01T00:00:00.000Z</lastmod>\n  </url>\n' +
        '</urlset>\n',
    );
    expect(xml).not.toMatch(/priority|changefreq/);
  });

  it('omits lastmod when missing or invalid, and normalizes offsets to UTC', () => {
    const xml = buildSitemapXml([
      { url: 'https://e.test/a/' },
      { url: 'https://e.test/b/', lastmod: 'not a date' },
      { url: 'https://e.test/c/', lastmod: '2026-03-04T05:06:07+02:00' },
    ]);
    expect(xml.match(/<lastmod>/g)).toHaveLength(1);
    expect(xml).toContain('<lastmod>2026-03-04T03:06:07.000Z</lastmod>');
    expect(formatLastmod('')).toBeNull();
    expect(formatLastmod(null)).toBeNull();
  });

  it('escapes XML special characters in URLs', () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f');
    const xml = buildSitemapXml([{ url: `https://e.test/?a=1&b=<2>"'` }]);
    expect(xml).toContain('<loc>https://e.test/?a=1&amp;b=&lt;2&gt;&quot;&apos;</loc>');
  });

  it('fails clearly over 50,000 URLs and accepts exactly 50,000', () => {
    const entry = (i: number) => ({ url: `https://e.test/p/${i}/` });
    expect(() => buildSitemapXml(Array.from({ length: MAX_SITEMAP_URLS }, (_, i) => entry(i)))).not.toThrow();
    let err: unknown;
    try {
      buildSitemapXml(Array.from({ length: MAX_SITEMAP_URLS + 1 }, (_, i) => entry(i)));
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(SitemapError);
    expect((err as Error).message).toMatch(/sitemap index/);
  });

  it('fails clearly over 50 MB', () => {
    const long = 'https://e.test/' + 'a'.repeat(2000);
    expect(() => buildSitemapXml(Array.from({ length: 30_000 }, () => ({ url: long })))).toThrow(/50 MB/);
  });

  it('refuses an empty list', () => {
    expect(() => buildSitemapXml([])).toThrow(SitemapError);
  });
});

describe('collectSitemapEntries', () => {
  it('orders the homepage first, then collections, movies, characters, products, each by slug, with absolute trailing-slash URLs', () => {
    const entries = collectSitemapEntries(
      build({ products: ['p-b', 'p-a'], characters: ['ch'], movies: ['m-b', 'm-a'], collections: ['z', 'a'] }),
      SITE,
    );
    expect(entries.map((e) => e.url)).toEqual([
      'https://example.test/', // the homepage (Task 7.1) is the first entry
      'https://example.test/collections/a/',
      'https://example.test/collections/z/',
      'https://example.test/movies/m-a/',
      'https://example.test/movies/m-b/',
      'https://example.test/characters/ch/',
      'https://example.test/products/p-a/',
      'https://example.test/products/p-b/',
    ]);
  });

  it('keeps a SITE_URL path prefix and normalizes trailing slashes', () => {
    const entries = collectSitemapEntries(build({ movies: ['m'] }), 'https://example.test/base/');
    expect(entries.map((e) => e.url)).toEqual(['https://example.test/base/', 'https://example.test/base/movies/m/']);
  });

  it('uses the /build updatedAt for lastmod, and none when unavailable', () => {
    const data = build({ movies: ['with', 'without'] });
    data.updatedAt.movies.delete('without');
    const [home, a, b] = collectSitemapEntries(data, SITE);
    expect(home.lastmod).toBeNull(); // the homepage has no lastmod
    expect(a.lastmod).toBe(TS);
    expect(b.lastmod).toBeNull();
    expect(collectSitemapEntries({ ...data, updatedAt: undefined }, SITE).every((e) => e.lastmod === null)).toBe(true);
  });

  it('contains exactly the supplied published models and nothing else', () => {
    const xml = buildSitemapXml(collectSitemapEntries(build({ collections: ['pub-c'], movies: ['pub-m'] }), SITE));
    expect(locs(xml)).toEqual(['https://example.test/', 'https://example.test/collections/pub-c/', 'https://example.test/movies/pub-m/']);
    expect(xml).not.toMatch(/draft|archived/);
  });

  it('rejects an unusable slug and an invalid SITE_URL', () => {
    expect(() => collectSitemapEntries(build({ movies: ['a/b'] }), SITE)).toThrow(/Invalid movie slug/);
    expect(() => collectSitemapEntries(build({ movies: ['m'] }), 'ftp://x')).toThrow(SiteUrlError);
  });

  it('equals the canonical URL from the metadata module for the same models', () => {
    const data = build({ collections: ['c1'], movies: ['m1'], characters: ['ch1'], products: ['p1'] });
    const pages: PageModel[] = [
      { type: 'collection', model: data.collections[0] },
      { type: 'movie', model: data.movies[0] },
      { type: 'character', model: data.characters[0] },
      { type: 'product', model: data.products[0] },
    ];
    for (const site of [SITE, 'https://example.test/base/']) {
      const canon = pages.map((p) => resolvePageMetadata(p, site).canonicalUrl);
      const homeCanon = resolvePageMetadata({ type: 'home', model: emptyHome() }, site).canonicalUrl;
      expect(collectSitemapEntries(data, site).map((e) => e.url)).toEqual([homeCanon, ...canon]);
    }
  });

  it('the homepage is a static route: first, without lastmod, equal to its canonical URL', () => {
    expect(STATIC_SITEMAP_ROUTES).toEqual(['/']);
    const entries = collectSitemapEntries(build({ movies: ['m'] }), SITE);
    expect(entries.map((e) => e.url)).toEqual(['https://example.test/', 'https://example.test/movies/m/']);
    expect(entries[0].lastmod).toBeNull();
    expect(entries[0].url).toBe(canonicalUrl(SITE, '/'));
    // The extension point still takes other static routes, or none.
    expect(collectSitemapEntries(build({ movies: ['m'] }), SITE, ['/', '/search/']).map((e) => e.url).slice(0, 2)).toEqual(['https://example.test/', 'https://example.test/search/']);
    expect(collectSitemapEntries(build({ movies: ['m'] }), SITE, []).map((e) => e.url)).toEqual(['https://example.test/movies/m/']);
  });
  it('lists no homepage when nothing is published (the homepage is not generated then either)', () => {
    expect(collectSitemapEntries(build({}), SITE)).toEqual([]);
  });
});
describe('buildRobotsTxt', () => {
  it('has the exact content, trailing newline and absolute Sitemap line', () => {
    expect(buildRobotsTxt('https://example.test/')).toBe(
      'User-agent: *\nDisallow: /admin\nAllow: /\n\nSitemap: https://example.test/sitemap.xml\n',
    );
  });
  it('keeps a path prefix in the Sitemap URL', () => {
    expect(buildRobotsTxt('https://example.test/base')).toContain('Sitemap: https://example.test/base/sitemap.xml\n');
  });
  it('omits the Sitemap line when there is no sitemap', () => {
    expect(buildRobotsTxt(SITE, { hasSitemap: false })).toBe('User-agent: *\nDisallow: /admin\nAllow: /\n');
  });
  it('rejects an invalid SITE_URL', () => {
    expect(() => buildRobotsTxt('')).toThrow(SiteUrlError);
  });
});

describe('renderSeoFiles', () => {
  it('returns sitemap.xml and robots.txt, robots referencing the sitemap', () => {
    const { files, urlCount } = renderSeoFiles(build({ collections: ['c'] }), SITE);
    expect(urlCount).toBe(2); // the homepage and the collection
    expect(files.map((f) => f.path)).toEqual(['sitemap.xml', 'robots.txt']);
    expect(files[1].content).toContain('Sitemap: https://example.test/sitemap.xml');
  });
  it('with no published content returns only robots.txt, without a Sitemap line', () => {
    const { files, urlCount } = renderSeoFiles(build({}), SITE);
    expect(urlCount).toBe(0);
    expect(files.map((f) => f.path)).toEqual(['robots.txt']);
    expect(files[0].content).not.toContain('Sitemap');
  });
});

describe('writeSeoFiles and generateStatic', () => {
  const tmp = () => mkdtemp(path.join(tmpdir(), 'seo-'));

  it('writes both files at the output root and replaces stale ones', async () => {
    const dir = await tmp();
    try {
      await writeFile(path.join(dir, 'sitemap.xml'), 'stale');
      await writeFile(path.join(dir, 'robots.txt'), 'stale');
      await writeSeoFiles(renderSeoFiles(build({ movies: ['m'] }), SITE).files, dir);
      expect(await readFile(path.join(dir, 'sitemap.xml'), 'utf8')).toContain('/movies/m/');
      expect(await readFile(path.join(dir, 'robots.txt'), 'utf8')).toContain('Disallow: /admin');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('removes a stale sitemap when nothing is published, and touches nothing else', async () => {
    const parent = await tmp();
    const dir = path.join(parent, 'out');
    try {
      await mkdir(path.join(dir, 'movies/old'), { recursive: true });
      await writeFile(path.join(dir, 'movies/old/index.html'), 'keep');
      await writeFile(path.join(dir, 'sitemap.xml'), 'stale');
      await writeFile(path.join(dir, 'other.txt'), 'keep');
      await writeFile(path.join(parent, 'sitemap.xml'), 'outside');
      await writeSeoFiles(renderSeoFiles(build({}), SITE).files, dir);
      expect((await readdir(dir)).sort()).toEqual(['movies', 'other.txt', 'robots.txt']);
      expect(await readFile(path.join(dir, 'movies/old/index.html'), 'utf8')).toBe('keep');
      expect(await readFile(path.join(parent, 'sitemap.xml'), 'utf8')).toBe('outside');
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  });

  it('refuses files that are not the two root SEO files', async () => {
    const dir = await tmp();
    try {
      await expect(writeSeoFiles([{ path: '../evil.txt', content: 'x' }], dir)).rejects.toThrow(/Refusing/);
      await expect(writeSeoFiles([{ path: 'a/sitemap.xml', content: 'x' }], dir)).rejects.toThrow(/Refusing/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('generateStatic writes the sitemap with lastmod from /build and reports it in the summary', async () => {
    const dir = await tmp();
    try {
      const fakeFetch = (async (input: RequestInfo | URL) => {
        const [, first, second] = new URL(String(input)).pathname.split('/');
        if (first === 'home') return new Response(JSON.stringify(homeFeaturing([])));
        if (first === 'build') {
          const list = second === 'movies' ? [{ slug: 'm1', updatedAt: '2026-02-03T04:05:06.000Z' }] : [];
          return new Response(JSON.stringify(list));
        }
        return new Response(JSON.stringify(stubDetail(second)));
      }) as typeof fetch;
      const summary = await generateStatic({ assets: TEST_ASSETS, env: { API_BASE_URL: 'http://api.test', SITE_URL: SITE }, outDir: dir, fetch: fakeFetch });
      expect(summary.sitemapUrls).toBe(2); // the homepage and the movie
      const xml = await readFile(path.join(dir, 'sitemap.xml'), 'utf8');
      expect(xml).toContain('<loc>https://example.test/</loc>');
      expect(xml.indexOf('<loc>https://example.test/</loc>')).toBeLessThan(xml.indexOf('/movies/m1/'));
      expect(xml).toContain('<loc>https://example.test/movies/m1/</loc>');
      expect(xml).toContain('<lastmod>2026-02-03T04:05:06.000Z</lastmod>');
      const text = formatSummary(summary);
      expect(text).toContain('sitemap:     2 URLs');
      expect(text).toContain('robots:');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // Task 6.5: generateStatic validates publication metadata, so the stub model carries SEO fields.
  function stubDetail(slug: string) {
    return { ...(stub(slug) as object), seoTitle: 'Title', seoDescription: 'Description' };
  }
});
