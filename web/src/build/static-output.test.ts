// @vitest-environment node
/**
 * Black-box verification of the generated static site (Task 6.6, the Phase 6
 * checkpoint). Runs the REAL pipeline (generateStatic: fetch, validate, render,
 * write) against a fixture API served by an injected fetch, then inspects only
 * the files on disk with strict, dependency-free parsers (markup-test-helpers).
 *
 * This is deliberately not a restatement of the unit tests: it checks that the
 * pieces agree with each other (page <-> sitemap <-> links <-> JSON-LD) and
 * that the output is usable on its own, with the API gone.
 *
 * The output directory first receives a fake Vite client build (manifest + assets), exactly
 * what `vite build` leaves there, so the generator's real manifest path is exercised.
 *
 * Requirements: 9.1-9.8, 15.1, 15.2, 15.4, 18.2, 18.3, 3.8, 4.8, 11.6.
 * Design 9, properties 7 (static output) and 8 (SEO fallback).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateStatic, type GenerateSummary } from './generate-static';
import { renderSite } from './render-site';
import { writePages } from './write-pages';
import { TEST_ASSETS, validData, visibleHtml, collection, movie, character, product, emptyHome } from './test-fixtures';
import { startStaticServer, CONTENT_TYPES } from './static-server';
import { writeFakeClientBuild } from './client-build-fixture';
import {
  API_BASE, HOSTILE, SITE, createFakeApi, makeFixture, type Fixture, type Kind,
} from './static-output-fixture';
import { byTag, findAll, parseMarkup, textOf, visibleText, type MNode } from './markup-test-helpers';

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));
const ENV = { API_BASE_URL: API_BASE, SITE_URL: SITE };
const KINDS: Kind[] = ['collections', 'movies', 'characters', 'products'];

/**
 * Links that no generated page backs. EMPTY since the homepage exists (Task 7.1): `/` is a generated
 * page now, so a link to it is checked like any other and a dead link to `/` is caught again.
 */
const ALLOWED_NON_GENERATED_LINKS = new Set<string>();
/** Root-relative image URLs that come from fixture data and live on the CDN/API, not in the output. */
const ALLOWED_EXTERNAL_ROOT_IMAGES = new Set(['/uploads/jack-frost.png', '/uploads/poster.png']);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const tmpDirs: string[] = [];
const tmp = async (): Promise<string> => {
  const d = await mkdtemp(path.join(tmpdir(), 'hc-static-output-'));
  tmpDirs.push(d);
  return d;
};

async function listFiles(root: string, rel = ''): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(path.join(root, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await listFiles(root, r)));
    else out.push(r);
  }
  return out.sort();
}

/** relative path -> sha256 of the bytes. */
async function snapshot(root: string): Promise<Record<string, string>> {
  const snap: Record<string, string> = {};
  for (const f of await listFiles(root)) snap[f] = createHash('sha256').update(await readFile(path.join(root, f))).digest('hex');
  return snap;
}

interface Generated {
  out: string;
  fx: Fixture;
  summary: GenerateSummary;
  requested: string[];
  /** Files the fake client build put in the output (manifest and assets). */
  clientFiles: string[];
}
async function generate(opts: { reverseLists?: boolean; jitterMs?: number; out?: string; mutate?: (fx: Fixture) => void } = {}): Promise<Generated> {
  const out = opts.out ?? (await tmp());
  const fx = makeFixture();
  opts.mutate?.(fx);
  const api = createFakeApi(fx, opts);
  const clientFiles = await writeFakeClientBuild(out);
  const summary = await generateStatic({ env: ENV, outDir: out, publicDir: PUBLIC_DIR, fetch: api.fetch });
  return { out, fx, summary, requested: api.requested, clientFiles };
}

interface Page {
  kind: Kind;
  slug: string;
  route: string;
  rel: string;
  html: string;
  html$: MNode; // <html>
  head: MNode;
  body: MNode;
  main: MNode;
  model: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const one = <T,>(items: T[], what: string): T => {
  expect(items, what).toHaveLength(1);
  return items[0];
};
const metaValues = (head: MNode, attr: 'name' | 'property', key: string): string[] =>
  byTag(head, 'meta').filter((m) => m.attrs[attr] === key).map((m) => m.attrs.content);
const routeOf = (kind: Kind, slug: string) => `/${kind}/${slug}/`;
const relOf = (kind: Kind, slug: string) => `${kind}/${slug}/index.html`;

function parsePage(kind: Kind, model: Record<string, any>, html: string): Page { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { root, prolog } = parseMarkup(html, 'html');
  expect(prolog?.toLowerCase(), `${model.slug} doctype`).toBe('<!doctype html>');
  const htmlEl = one(root.children.filter((c): c is MNode => typeof c !== 'string'), 'root element');
  expect(htmlEl.name).toBe('html');
  return {
    kind, slug: model.slug, route: routeOf(kind, model.slug), rel: relOf(kind, model.slug), html, html$: htmlEl, model,
    head: one(byTag(htmlEl, 'head'), 'head'), body: one(byTag(htmlEl, 'body'), 'body'), main: one(byTag(htmlEl, 'main'), 'main'),
  };
}

const nameOf = (p: Page): string => (p.kind === 'collections' || p.kind === 'movies' ? p.model.title : p.model.name);

function jsonLdOf(p: Page): Record<string, any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const scripts = byTag(p.head, 'script').filter((x) => x.attrs.type === 'application/ld+json');
  const s = one(scripts, `${p.slug} ld+json script elements`);
  expect(s.attrs.type).toBe('application/ld+json');
  const raw = s.children[0] as string;
  return JSON.parse(raw);
}

/** Asserts no null / undefined / empty string / empty array / empty object anywhere. */
function expectNoEmptyValues(value: unknown, where: string): void {
  if (value === null || value === undefined) throw new Error(`${where}: null/undefined`);
  if (typeof value === 'string') {
    if (value.trim() === '') throw new Error(`${where}: empty string`);
    if (/^(null|undefined|NaN)$/.test(value)) throw new Error(`${where}: literal ${value}`);
  } else if (Array.isArray(value)) {
    if (value.length === 0) throw new Error(`${where}: empty array`);
    value.forEach((v, i) => expectNoEmptyValues(v, `${where}[${i}]`));
  } else if (typeof value === 'object') {
    const entries = Object.entries(value as object);
    if (entries.length === 0) throw new Error(`${where}: empty object`);
    entries.forEach(([k, v]) => expectNoEmptyValues(v, `${where}.${k}`));
  }
}

/** Expected og:image / own image for a model, derived from the contract fields (not from the generator). */
function expectedImage(kind: Kind, m: Record<string, any>): { url: string; own: boolean } { // eslint-disable-line @typescript-eslint/no-explicit-any
  const candidates: Array<string | null> =
    kind === 'collections' ? [m.heroImageUrl] : kind === 'movies' ? [m.posterUrl, m.heroImageUrl] : [m.imageUrl];
  const own = candidates.find((c) => !!c);
  if (!own) return { url: `${SITE}/images/fallback.svg`, own: false };
  return { url: own.startsWith('/') ? SITE + own : own, own: true };
}

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim();
const lastmodOf = (updatedAt?: string): string | undefined =>
  updatedAt && !Number.isNaN(new Date(updatedAt).getTime()) ? new Date(updatedAt).toISOString() : undefined;

// ---------------------------------------------------------------------------
// shared run
// ---------------------------------------------------------------------------
let main: Generated;
let files: string[];
let pages: Page[];
/** The homepage (index.html), parsed; not part of `pages` because it is not an entity page. */
let homeDoc: HomeDoc;
let publicFiles: string[];
interface HomeDoc { rel: 'index.html'; route: '/'; html: string; html$: MNode; head: MNode; body: MNode; main: MNode }
function parseHome(html: string): HomeDoc {
  const { root, prolog } = parseMarkup(html, 'html');
  expect(prolog?.toLowerCase(), 'home doctype').toBe('<!doctype html>');
  const htmlEl = one(root.children.filter((c): c is MNode => typeof c !== 'string'), 'home root element');
  return {
    rel: 'index.html', route: '/', html, html$: htmlEl,
    head: one(byTag(htmlEl, 'head'), 'home head'), body: one(byTag(htmlEl, 'body'), 'home body'), main: one(byTag(htmlEl, 'main'), 'home main'),
  };
}
const pageBy = (kind: Kind, slug: string): Page => {
  const p = pages.find((x) => x.kind === kind && x.slug === slug);
  if (!p) throw new Error(`no page for ${kind}/${slug}`);
  return p;
};

beforeAll(async () => {
  main = await generate();
  files = await listFiles(main.out);
  publicFiles = await listFiles(PUBLIC_DIR);
  homeDoc = parseHome(await readFile(path.join(main.out, 'index.html'), 'utf8'));
  pages = [];
  for (const kind of KINDS) {
    for (const model of main.fx.published[kind]) {
      const html = await readFile(path.join(main.out, relOf(kind, model.slug)), 'utf8');
      pages.push(parsePage(kind, model as unknown as Record<string, any>, html)); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }
});
afterAll(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
});

const read = (rel: string) => readFile(path.join(main.out, rel), 'utf8');

// ---------------------------------------------------------------------------
// 1. static routes
// ---------------------------------------------------------------------------
describe('static routes', () => {
  it('writes exactly one {type}/{slug}/index.html per published slug, the homepage index.html, plus the SEO files, public assets and the client build, and nothing else', () => {
    const expected = [
      ...KINDS.flatMap((k) => main.fx.published[k].map((m) => relOf(k, m.slug))),
      'index.html', 'sitemap.xml', 'robots.txt', ...publicFiles, ...main.clientFiles,
    ].sort();
    expect(files).toEqual(expected);
    // 3 collections + 4 movies + 2 characters + 3 products
    expect(pages.map((p) => p.kind).filter((k) => k === 'collections')).toHaveLength(3);
    expect(files.filter((f) => f.endsWith('/index.html'))).toHaveLength(12);
  });

  it('builds no page for DRAFT/ARCHIVED records even though the API serves them at detail routes', async () => {
    const draftSlugs = KINDS.flatMap((k) => main.fx.unpublished[k].map((m) => ({ k, slug: m.slug })));
    expect(draftSlugs.length).toBeGreaterThanOrEqual(6);
    for (const { k, slug } of draftSlugs) {
      expect(files, slug).not.toContain(relOf(k, slug));
      // The build must not even have asked for them: only /build lists decide what exists.
      expect(main.requested, slug).not.toContain(`/${k}/${slug}`);
    }
    for (const f of files.filter((f) => /\.(html|xml|txt)$/.test(f))) {
      const text = await read(f);
      expect(text, f).not.toContain('UNPUBLISHED-MARKER');
      for (const { slug } of draftSlugs) expect(text, `${f} mentions ${slug}`).not.toContain(slug);
    }
  });

  it('skips a slug that is listed in /build but whose detail route 404s: warning, no file, no sitemap entry', async () => {
    expect(main.fx.lists.movies.map((e) => e.slug)).toContain('vanished-movie');
    expect(main.requested).toContain('/movies/vanished-movie');
    expect(files).not.toContain('movies/vanished-movie/index.html');
    expect(main.summary.warnings.filter((w) => w.slug === 'vanished-movie').map((w) => w.message).join('\n')).toMatch(/404/);
    expect(await read('sitemap.xml')).not.toContain('vanished-movie');
    // 12 entity pages + the homepage (Task 7.1)
    expect(main.summary.counts).toEqual({ home: 1, collections: 3, movies: 4, characters: 2, products: 3, total: 13 });
  });

  it('uses slug-based routes and exposes no internal ids anywhere in the output', async () => {
    expect(main.fx.ids.length).toBeGreaterThan(30);
    for (const f of files) expect(f, 'file name').not.toMatch(/\bc[a-z0-9]{24}\b/);
    for (const f of files.filter((f) => /\.(html|xml|txt)$/.test(f))) {
      const text = await read(f);
      for (const id of main.fx.ids) expect(text, `${f} contains id ${id}`).not.toContain(id);
      expect(text, `${f} has a cuid-looking token`).not.toMatch(/\bc[a-z0-9]{24}\b/);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. complete HTML
// ---------------------------------------------------------------------------
describe('complete HTML documents', () => {
  it('every page is a full, well-formed document with landmarks, one h1 and only the three known scripts', () => {
    for (const p of pages) {
      const w = p.rel;
      expect(p.html.startsWith('<!doctype html>'), w).toBe(true);
      expect(p.html$.attrs.lang, w).toBe('en');
      expect(byTag(p.head, 'meta').some((m) => m.attrs.charset === 'utf-8'), `${w} charset`).toBe(true);
      expect(metaValues(p.head, 'name', 'viewport'), w).toHaveLength(1);
      one(byTag(p.head, 'title'), `${w} title`);
      one(byTag(p.body, 'main'), `${w} main`);
      one(byTag(p.body, 'footer'), `${w} footer`);
      expect(byTag(p.body, 'header').length, `${w} header`).toBeGreaterThanOrEqual(1);
      expect(one(byTag(p.body, 'nav'), `${w} nav`).attrs['aria-label'], w).toBeTruthy();
      expect(textOf(one(byTag(p.body, 'h1'), `${w} h1`)), w).toBe(collapse(nameOf(p)));
      // No inline executable script. Exactly three scripts: the ld+json block and the entry module (head),
      // then the hydration data blob (end of body). Only the entry module has a src.
      expect(p.html.match(/<script/gi), w).toHaveLength(3);
      expect(p.html.match(/<\/script/gi), w).toHaveLength(3);
      const scripts = findAll(p.html$, (e) => e.name === 'script');
      expect(scripts.map((s) => s.attrs.type), w).toEqual(['application/ld+json', 'module', 'application/json']);
      expect(scripts.filter((s) => 'src' in s.attrs).map((s) => s.attrs.src), w).toEqual(['/assets/entry-client-FAKE.js']);
      expect(scripts.filter((s) => !('src' in s.attrs)).map((s) => s.attrs.id ?? null), w).toEqual([null, '__PAGE_DATA__']);
      expect(scripts.filter((s) => 'src' in s.attrs).every((s) => s.children.join('') === ''), w).toBe(true);
      // Stylesheet and modulepreload links come from the manifest.
      expect(byTag(p.head, 'link').filter((l) => l.attrs.rel === 'stylesheet').map((l) => l.attrs.href), w).toEqual(['/assets/entry-client-FAKE.css']);
      expect(byTag(p.head, 'link').filter((l) => l.attrs.rel === 'modulepreload').map((l) => l.attrs.href), w).toEqual(['/assets/vendor-FAKE.js']);
      expect(findAll(p.html$, (e) => Object.keys(e.attrs).some((a) => /^on/i.test(a))), `${w} inline handlers`).toEqual([]);
      for (const e of findAll(p.html$, (x) => 'href' in x.attrs || 'src' in x.attrs)) {
        expect(`${e.attrs.href ?? ''} ${e.attrs.src ?? ''}`, w).not.toMatch(/javascript:/i);
      }
      expect(byTag(p.html$, 'noscript'), w).toEqual([]);
      expect(visibleText(p.body), `${w} visible text`).not.toMatch(/\b(undefined|null|NaN)\b|\[object/);
    }
  });

  it('collection pages put the real content in the HTML: items in sortOrder with curator notes next to them', () => {
    for (const c of main.fx.published.collections) {
      const p = pageBy('collections', c.slug);
      const groups: Array<{ heading: string; items: Array<{ sortOrder: number; curatorNote: string | null; href: string; label: string }> }> = [
        { heading: 'Movies', items: c.movies.map((x) => ({ ...x, href: `/movies/${x.movie.slug}/`, label: x.movie.title })) },
        { heading: 'Characters', items: c.characters.map((x) => ({ ...x, href: `/characters/${x.character.slug}/`, label: x.character.name })) },
        { heading: 'Products', items: c.products.map((x) => ({ ...x, href: `/products/${x.product.slug}/`, label: x.product.name })) },
      ];
      for (const g of groups) {
        const section = byTag(p.main, 'section').find((s) => textOf(byTag(s, 'h2')[0]) === g.heading);
        if (g.items.length === 0) {
          expect(section, `${c.slug} ${g.heading} section must be absent`).toBeUndefined();
          continue;
        }
        expect(section, `${c.slug} ${g.heading}`).toBeDefined();
        // The fixture API serves items in sortOrder; the page must keep that order.
        const sorted = [...g.items].sort((a, b) => a.sortOrder - b.sortOrder);
        expect(g.items.map((i) => i.href), `${c.slug} fixture sanity`).toEqual(sorted.map((i) => i.href));
        const lis = byTag(one(byTag(section!, 'ol'), `${c.slug} ${g.heading} ol`), 'li');
        expect(lis.map((li) => one(byTag(li, 'a'), 'item link').attrs.href), `${c.slug} ${g.heading} order`).toEqual(g.items.map((i) => i.href));
        lis.forEach((li, i) => {
          expect(textOf(byTag(li, 'a')[0])).toBe(collapse(g.items[i].label));
          const note = byTag(li, 'p');
          if (g.items[i].curatorNote) expect(note.map(textOf), `${c.slug} note ${i}`).toEqual([collapse(g.items[i].curatorNote!)]);
          else expect(note, `${c.slug} ${g.heading} item ${i} has no note`).toEqual([]);
        });
      }
    }
    // Explicitly: the seasonal challenge is ordered by sortOrder, not alphabetically.
    const advent = pageBy('collections', 'advent-challenge');
    const hrefs = byTag(advent.main, 'a').map((a) => a.attrs.href).filter((h) => h.startsWith('/movies/'));
    expect(hrefs).toEqual(['/movies/jack-frost/', '/movies/krampus/', '/movies/black-christmas/', '/movies/silent-night/']);
  });

  it('shows introduction paragraphs, curator notes, franchises and tags as text, with no link for them', () => {
    const full = pageBy('collections', 'full-collection');
    const intro = byTag(full.main, 'section').find((s) => textOf(byTag(s, 'h2')[0]) === 'Introduction')!;
    expect(byTag(intro, 'p').map(textOf)).toEqual(['First paragraph.', 'Second paragraph & more.']);
    const notes = byTag(full.main, 'section').find((s) => textOf(byTag(s, 'h2')[0]) === 'Curator notes')!;
    expect(textOf(notes)).toContain('Curated with "care".');
    for (const heading of ['Franchises', 'Tags']) {
      const s = byTag(full.main, 'section').find((x) => textOf(byTag(x, 'h2')[0]) === heading)!;
      expect(byTag(s, 'a'), heading).toEqual([]);
    }
    expect(textOf(full.main)).toContain('Krampus Franchise');
    // Minimal collection: optional sections are absent, not empty.
    const min = pageBy('collections', 'minimal-collection');
    const headings = byTag(min.main, 'h2').map(textOf);
    expect(headings).toEqual(['Introduction', 'Curator notes', 'Related collections', 'Movies']);
  });

  it('keeps aria-labelledby references resolvable on every page', () => {
    for (const p of pages) {
      const ids = new Set(findAll(p.html$, (e) => 'id' in e.attrs).map((e) => e.attrs.id));
      for (const s of findAll(p.html$, (e) => 'aria-labelledby' in e.attrs)) {
        expect(ids.has(s.attrs['aria-labelledby']), `${p.rel}: ${s.attrs['aria-labelledby']}`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. metadata in the written head
// ---------------------------------------------------------------------------
describe('metadata in the written head', () => {
  const OG_TYPE = { collections: 'website', movies: 'website', characters: 'article', products: 'product' } as const;

  it('writes title (SEO title replaces the whole title), one description and one canonical per page', () => {
    for (const p of pages) {
      const title = textOf(one(byTag(p.head, 'title'), p.rel));
      expect(title, p.rel).toBe(collapse(p.model.seoTitle));
      expect(title, p.rel).not.toMatch(/\| Horror Christmas$/); // an SEO title is used as given
      expect(metaValues(p.head, 'name', 'description'), p.rel).toEqual([collapse(p.model.seoDescription)]);
      const canon = byTag(p.head, 'link').filter((l) => l.attrs.rel === 'canonical');
      expect(one(canon, `${p.rel} canonical`).attrs.href).toBe(`${SITE}${p.route}`);
    }
    expect(textOf(byTag(pageBy('collections', 'full-collection').head, 'title')[0])).toBe('Full Collection | Our Picks'); // padded in the API
  });

  it('canonical equals the sitemap loc of the same page, for every page', async () => {
    const locs = new Set(byTag(parseMarkup(await read('sitemap.xml'), 'xml').root, 'loc').map(textOf));
    for (const p of pages) {
      const href = byTag(p.head, 'link').find((l) => l.attrs.rel === 'canonical')!.attrs.href;
      expect(locs.has(href), `${p.rel}: ${href} missing from sitemap`).toBe(true);
    }
    expect(locs.size).toBe(pages.length + 1); // plus the homepage
    expect(locs.has(byTag(homeDoc.head, 'link').find((l) => l.attrs.rel === 'canonical')!.attrs.href), 'homepage canonical in sitemap').toBe(true);
  });

  it('writes a consistent Open Graph and Twitter set, with absolute og:image including the fallback case', () => {
    for (const p of pages) {
      const once = (key: string, attr: 'name' | 'property' = 'property') => one(metaValues(p.head, attr, key), `${p.rel} ${key}`);
      const title = textOf(byTag(p.head, 'title')[0]);
      expect(once('og:site_name'), p.rel).toBe('Horror Christmas');
      expect(once('og:type'), p.rel).toBe(OG_TYPE[p.kind]);
      expect(once('og:title'), p.rel).toBe(title);
      expect(once('og:description'), p.rel).toBe(metaValues(p.head, 'name', 'description')[0]);
      expect(once('og:url'), p.rel).toBe(byTag(p.head, 'link').find((l) => l.attrs.rel === 'canonical')!.attrs.href);
      const img = expectedImage(p.kind, p.model);
      const ogImage = once('og:image');
      expect(ogImage, p.rel).toBe(img.url);
      expect(new URL(ogImage).protocol, `${p.rel} og:image is absolute`).toMatch(/^https?:$/);
      expect(once('twitter:card', 'name'), p.rel).toBe(img.own ? 'summary_large_image' : 'summary');
    }
    // The interesting ones, spelled out.
    expect(metaValues(pageBy('movies', 'silent-night').head, 'property', 'og:image')).toEqual([`${SITE}/images/fallback.svg`]);
    expect(metaValues(pageBy('movies', 'krampus').head, 'property', 'og:image')).toEqual(['https://img.test/krampus-hero.jpg']);
    expect(metaValues(pageBy('movies', 'jack-frost').head, 'property', 'og:image')).toEqual([`${SITE}/uploads/jack-frost.png`]);
    expect(metaValues(pageBy('movies', 'jack-frost').head, 'name', 'twitter:card')).toEqual(['summary_large_image']);
    expect(metaValues(pageBy('characters', 'krampus-beast').head, 'name', 'twitter:card')).toEqual(['summary']);
  });

  it('escapes hostile text in head attributes and title, and keeps it round-trippable', () => {
    const p = pageBy('products', 'hostile-product');
    expect(textOf(byTag(p.head, 'title')[0])).toBe('Evil </script> title');
    expect(metaValues(p.head, 'name', 'description')).toEqual([collapse(HOSTILE)]);
    expect(p.html).not.toContain('<img src=x');
    expect(p.html).not.toContain('<script>alert');
  });
});

// ---------------------------------------------------------------------------
// 4. structured data
// ---------------------------------------------------------------------------
describe('structured data', () => {
  it('every page has exactly one ld+json block that parses, with no empty values and a matching url', () => {
    for (const p of pages) {
      const ld = jsonLdOf(p);
      expect(ld['@context'], p.rel).toBe('https://schema.org');
      expect(ld.url, p.rel).toBe(`${SITE}${p.route}`);
      expect(ld.name, p.rel).toBe(nameOf(p));
      expectNoEmptyValues(ld, p.rel);
      const raw = (byTag(p.head, 'script').find((x) => x.attrs.type === 'application/ld+json')!.children[0] as string);
      expect(raw, `${p.rel} raw ld+json`).not.toMatch(/[<>&\u2028\u2029]/);
    }
  });

  it('collections are CollectionPage with an ItemList in order, positions from 1, absolute item urls that exist', async () => {
    const locs = new Set(byTag(parseMarkup(await read('sitemap.xml'), 'xml').root, 'loc').map(textOf));
    for (const c of main.fx.published.collections) {
      const ld = jsonLdOf(pageBy('collections', c.slug));
      expect(ld['@type']).toBe('CollectionPage');
      const list = ld.mainEntity;
      expect(list['@type']).toBe('ItemList');
      const expected = [
        ...c.movies.map((x) => ({ name: x.movie.title, url: `${SITE}/movies/${x.movie.slug}/` })),
        ...c.characters.map((x) => ({ name: x.character.name, url: `${SITE}/characters/${x.character.slug}/` })),
        ...c.products.map((x) => ({ name: x.product.name, url: `${SITE}/products/${x.product.slug}/` })),
      ];
      expect(list.numberOfItems).toBe(expected.length);
      expect(list.itemListElement.map((i: any) => i.position)).toEqual(expected.map((_, i) => i + 1)); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(list.itemListElement.map((i: any) => ({ name: i.name, url: i.url }))).toEqual(expected); // eslint-disable-line @typescript-eslint/no-explicit-any
      for (const e of expected) expect(locs.has(e.url), `${c.slug}: ${e.url} is not a built page`).toBe(true);
    }
  });

  it('movie, character and product pages use Movie, Thing and Product; offers only when priced, with the exact price string', () => {
    const bc = jsonLdOf(pageBy('movies', 'black-christmas'));
    expect(bc).toMatchObject({ '@type': 'Movie', datePublished: '1974-10-16', duration: 'PT1H38M', image: 'https://img.test/bc.jpg' });
    const kr = jsonLdOf(pageBy('movies', 'krampus'));
    expect(kr).toMatchObject({ datePublished: '2015', duration: 'PT2H', image: 'https://img.test/krampus-hero.jpg' });
    const sn = jsonLdOf(pageBy('movies', 'silent-night'));
    expect(Object.keys(sn).sort()).toEqual(['@context', '@type', 'description', 'name', 'url']); // nothing invented for missing data

    expect(jsonLdOf(pageBy('characters', 'billy'))).toMatchObject({ '@type': 'Thing', image: 'https://img.test/billy.jpg' });
    expect(jsonLdOf(pageBy('characters', 'krampus-beast'))).not.toHaveProperty('image');

    const mug = jsonLdOf(pageBy('products', 'santa-mug'));
    expect(mug['@type']).toBe('Product');
    expect(mug.offers).toEqual({ '@type': 'Offer', price: '24.90', priceCurrency: 'USD', url: 'https://shop.test/mug?ref=hc&x=1' });
    expect(typeof mug.offers.price).toBe('string');
    expect(jsonLdOf(pageBy('products', 'plain-poster'))).not.toHaveProperty('offers');
    expect(jsonLdOf(pageBy('products', 'hostile-product'))).not.toHaveProperty('offers');
  });

  it('hostile content cannot break out of the script element and parses back unchanged', () => {
    const p = pageBy('products', 'hostile-product');
    const ld = jsonLdOf(p);
    expect(ld.name).toBe(`Evil ${HOSTILE}`);
    expect(ld.description).toBe(HOSTILE);
    // Three scripts (ld+json, entry module, hydration data): hostile text adds none.
    expect(p.html.match(/<script/gi)).toHaveLength(3);
    // The hydration data blob is escaped like the ld+json block and parses back to the same hostile text.
    const blob = byTag(p.body, 'script').find((x) => x.attrs.id === '__PAGE_DATA__')!.children[0] as string;
    expect(blob).not.toMatch(/[<>&\u2028\u2029]/);
    expect(JSON.parse(blob).page.model.description).toBe(HOSTILE);
    // The collection page lists the hostile product in its ItemList and body too.
    const full = pageBy('collections', 'full-collection');
    expect(full.html.match(/<script/gi)).toHaveLength(3);
    const names = jsonLdOf(full).mainEntity.itemListElement.map((i: any) => i.name); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(names).toContain(`Evil ${HOSTILE}`);
    // ...and renders as inert text in the body.
    expect(textOf(byTag(p.main, 'h1')[0])).toBe(collapse(`Evil ${HOSTILE}`));
    expect(byTag(p.html$, 'img').filter((i) => i.attrs.src === 'x')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 5. sitemap.xml and robots.txt
// ---------------------------------------------------------------------------
describe('sitemap.xml and robots.txt', () => {
  it('is well-formed XML in the sitemap namespace with only loc and lastmod children', async () => {
    const { root, prolog } = parseMarkup(await read('sitemap.xml'), 'xml');
    expect(prolog).toBe('<?xml version="1.0" encoding="UTF-8"?>');
    const urlset = root.children.find((c): c is MNode => typeof c !== 'string')!;
    expect(urlset.name).toBe('urlset');
    expect(urlset.attrs).toEqual({ xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });
    for (const u of urlset.children.filter((c): c is MNode => typeof c !== 'string')) {
      expect(u.name).toBe('url');
      const kids = u.children.filter((c): c is MNode => typeof c !== 'string').map((k) => k.name);
      expect(['loc'], kids.join()).toEqual(kids.slice(0, 1));
      expect(kids.slice(1).every((k) => k === 'lastmod')).toBe(true);
      expect(kids.length).toBeLessThanOrEqual(2);
    }
  });

  it('lists exactly the generated pages, collections first, each group by slug, with lastmod only where valid', async () => {
    const { root } = parseMarkup(await read('sitemap.xml'), 'xml');
    const urls = byTag(root, 'url').map((u) => ({
      loc: textOf(byTag(u, 'loc')[0]),
      lastmod: byTag(u, 'lastmod').length ? textOf(byTag(u, 'lastmod')[0]) : undefined,
    }));
    const expected = [
      { loc: `${SITE}/`, lastmod: undefined }, // the homepage is the first entry and has no lastmod
      ...KINDS.flatMap((k) =>
        main.fx.lists[k]
          .filter((e) => e.slug !== 'vanished-movie')
          .map((e) => ({ loc: `${SITE}/${k}/${e.slug}/`, lastmod: lastmodOf(e.updatedAt) })),
      ),
    ];
    expect(urls).toEqual(expected);
    // Same set as the pages on disk.
    // `/` for index.html, `/{type}/{slug}/` for the others.
    expect(new Set(urls.map((u) => u.loc))).toEqual(new Set(files.filter((f) => f.endsWith('index.html')).map((f) => `${SITE}/${f.replace('index.html', '')}`)));
    expect(urls[0].loc).toBe(`${SITE}/`);
    expect(urls.slice(1, 4).every((u) => u.loc.startsWith(`${SITE}/collections/`))).toBe(true);
    for (const u of urls) if (u.lastmod) expect(u.lastmod).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    expect(urls.find((u) => u.loc.endsWith('/movies/silent-night/'))!.lastmod).toBeUndefined(); // API gave "not-a-date"
    expect(urls.find((u) => u.loc.endsWith('/characters/krampus-beast/'))!.lastmod).toBe('2025-03-04T08:00:00.000Z'); // offset normalized to UTC
  });

  it('robots.txt has the exact expected content', async () => {
    expect(await read('robots.txt')).toBe(`User-agent: *\nDisallow: /admin\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  });

  it('mentions no draft, archived or vanished record', async () => {
    const text = (await read('sitemap.xml')) + (await read('robots.txt'));
    expect(text).not.toMatch(/draft|archived|vanished|ghost/i);
  });
});

// ---------------------------------------------------------------------------
// 6. fallback behavior
// ---------------------------------------------------------------------------
describe('fallback behavior', () => {
  const noImage: Array<[Kind, string]> = [['movies', 'silent-night'], ['characters', 'krampus-beast'], ['products', 'hostile-product']];

  it('renders the fallback image where there is no usable image, and ships a byte-identical fallback.svg', async () => {
    for (const [k, slug] of noImage) {
      const imgs = byTag(pageBy(k, slug).main, 'img');
      expect(imgs.map((i) => ({ src: i.attrs.src, alt: i.attrs.alt, role: i.attrs.role })), slug).toEqual([
        { src: '/images/fallback.svg', alt: '', role: 'presentation' },
      ]);
    }
    expect(files).toContain('images/fallback.svg');
    const shipped = await readFile(path.join(main.out, 'images/fallback.svg'));
    expect(shipped.equals(await readFile(path.join(PUBLIC_DIR, 'images/fallback.svg')))).toBe(true);
    // Real images keep their own URL and a non-empty alt.
    const bc = byTag(pageBy('movies', 'black-christmas').main, 'img')[0];
    expect(bc.attrs.src).toBe('https://img.test/bc.jpg');
    expect(bc.attrs.alt).toBe('Black Christmas');
  });

  it('emits exactly the expected build warnings', () => {
    const msgs = main.summary.warnings.map((w) => w.message);
    const fallback = msgs.filter((m) => m.includes('no usable image; using fallback image'));
    // The homepage (Task 7.1) has no brand image: it uses the fallback og:image like an entity, with the same warning.
    expect(fallback.map((m) => m.split(':')[0]).sort()).toEqual(['character "krampus-beast"', 'home "/"', 'movie "silent-night"', 'product "hostile-product"']);
    const missing = msgs.filter((m) => m.includes('references collection "ghost-collection"'));
    // ...and /home lists the unbuilt ghost-collection among the seasonal collections.
    expect(missing.map((m) => m.split(':')[0]).sort()).toEqual(['collection "full-collection"', 'home "/"', 'movie "black-christmas"']);
    expect(msgs.filter((m) => m.includes('404'))).toHaveLength(1);
    expect(msgs.filter((m) => /no meta description/.test(m))).toEqual([]); // validation guarantees SEO descriptions
    expect(msgs).toHaveLength(8);
  });

  it('renders an unresolved collection reference as plain text with no dead link anywhere', async () => {
    const full = pageBy('collections', 'full-collection');
    const related = byTag(full.main, 'section').find((s) => s.attrs['data-link-group'] === 'related-collections')!;
    const lis = byTag(related, 'li');
    expect(lis.map(textOf)).toEqual(['Minimal Collection', 'Ghost Collection']);
    expect(byTag(lis[0], 'a').map((a) => a.attrs.href)).toEqual(['/collections/minimal-collection/']);
    expect(byTag(lis[1], 'a')).toEqual([]);
    const bc = pageBy('movies', 'black-christmas');
    const feat = byTag(bc.main, 'section').find((s) => s.attrs['data-link-group'] === 'related-collections')!;
    expect(byTag(feat, 'li').map(textOf)).toEqual(['Full Collection', 'Minimal Collection', 'Ghost Collection']);
    expect(byTag(feat, 'a').map((a) => a.attrs.href)).toEqual(['/collections/full-collection/', '/collections/minimal-collection/']);
    // The slug is still in the page's embedded data (the model references it and the client needs it to
    // render the same plain text); it must be in no markup, sitemap or robots.txt. Data scripts are excluded.
    for (const f of files.filter((f) => /\.(html|xml|txt)$/.test(f))) {
      const text = f.endsWith('.html') ? visibleHtml(await read(f)) : await read(f);
      expect(text, f).not.toContain('ghost-collection');
    }
    expect(visibleHtml(full.html)).not.toContain('/collections/ghost-collection');
  });
});

// ---------------------------------------------------------------------------
// 6b. fallbacks that publication validation makes unreachable in build:static
//     (pure render + writer, as the unit tests use them), checked on disk
// ---------------------------------------------------------------------------
describe('SEO fallbacks through render + writer (no publication gate)', () => {
  it('title format, description fallback order, excerpt limit, and omission with a warning', async () => {
    const long = 'Snow falls on the old house. '.repeat(20).trim();
    const data = validData({
      collections: [
        collection({ id: 'a', slug: 'col-seo', title: 'Col Seo', seoTitle: null, seoDescription: 'Explicit description.', summary: 'Ignored summary.' }),
        collection({ id: 'b', slug: 'col-summary', title: 'Col Summary', seoTitle: '   ', seoDescription: '   ', summary: 'From the summary.' }),
      ],
      movies: [movie({ slug: 'mov-excerpt', title: 'Mov Excerpt', seoTitle: null, seoDescription: null, synopsis: long })],
      characters: [character({ slug: 'chr-bio', name: 'Chr Bio', seoTitle: null, seoDescription: null, summary: null, biography: 'Short bio.' })],
      products: [product({ slug: 'prd-none', name: 'Prd None', seoTitle: null, seoDescription: null, description: null })],
    });
    const warnings: Array<{ message: string }> = [];
    const out = await tmp();
    await writePages(renderSite(data, { assets: TEST_ASSETS, siteUrl: SITE, warnings: warnings as never }), out);
    const doc = async (rel: string) => parsePage('collections', { slug: 'x' }, await readFile(path.join(out, rel), 'utf8'));
    const head = async (rel: string) => (await doc(rel)).head;

    const h1 = await head('collections/col-seo/index.html');
    expect(textOf(byTag(h1, 'title')[0])).toBe('Col Seo | Horror Christmas');
    expect(metaValues(h1, 'name', 'description')).toEqual(['Explicit description.']);
    expect(metaValues(await head('collections/col-summary/index.html'), 'name', 'description')).toEqual(['From the summary.']);

    const hm = await head('movies/mov-excerpt/index.html');
    const [excerpt] = metaValues(hm, 'name', 'description');
    expect(excerpt.length).toBeLessThanOrEqual(160);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(long.startsWith(excerpt.slice(0, -1).trimEnd())).toBe(true);
    expect(metaValues(hm, 'property', 'og:description')).toEqual([excerpt]);
    expect(metaValues(await head('characters/chr-bio/index.html'), 'name', 'description')).toEqual(['Short bio.']);

    const hp = await head('products/prd-none/index.html');
    expect(textOf(byTag(hp, 'title')[0])).toBe('Prd None | Horror Christmas');
    expect(metaValues(hp, 'name', 'description')).toEqual([]);
    expect(metaValues(hp, 'property', 'og:description')).toEqual([]);
    expect(warnings.filter((w) => /product "prd-none".*no meta description/.test(w.message))).toHaveLength(1);
    // Still valid JSON-LD without a description.
    const ld = JSON.parse(byTag(hp, 'script')[0].children[0] as string);
    expect(ld).not.toHaveProperty('description');
  });
});

// ---------------------------------------------------------------------------
// 7. internal link integrity and priority
// ---------------------------------------------------------------------------
describe('internal links', () => {
  /** Every document in the output that the crawl visits: the homepage and the entity pages. */
  const documents = (): Array<{ rel: string; html$: MNode }> => [{ rel: homeDoc.rel, html$: homeDoc.html$ }, ...pages.map((p) => ({ rel: p.rel, html$: p.html$ }))];
  const htmlByRoute = (): Map<string, MNode> => new Map([['/', homeDoc.html$], ...pages.map((p): [string, MNode] => [p.route, p.html$])]);
  const linkKind = (href: string) => /^\/(collections|movies|characters|products)\//.exec(href)?.[1] as Kind | undefined;

  /** Routes the output files define: `index.html` is `/`, `{x}/index.html` is `/{x}/`. */
  const routesOf = (fileList: readonly string[]): Set<string> =>
    new Set(fileList.filter((f) => f.endsWith('index.html')).map((f) => `/${f.slice(0, -'index.html'.length)}`));

  /** Crawls every internal reference of the homepage and the entity pages against `fileList` (the output files). */
  function crawl(fileList: readonly string[]) {
    const routes = routesOf(fileList);
    const dead: string[] = [];
    const relative: string[] = [];
    let internal = 0;
    const byRoute = htmlByRoute();
    for (const p of documents()) {
      for (const el of findAll(p.html$, (e) => 'href' in e.attrs && (e.name === 'a' || e.name === 'link'))) {
        let href = el.attrs.href;
        if (el.name === 'link' && (el.attrs.rel === 'stylesheet' || el.attrs.rel === 'modulepreload')) {
          // Client build files from the manifest must exist in the output.
          if (!fileList.includes(href.slice(1))) dead.push(`${p.rel} ${el.attrs.rel} -> ${href}`);
          continue;
        }
        if (el.name === 'a' && href.startsWith('#')) {
          // Same-page anchor (skip link, hero call to action): its target must exist on the page.
          const id = href.slice(1);
          if (!findAll(p.html$, (e) => e.attrs.id === id).length) dead.push(`${p.rel} anchor -> ${href}`);
          continue;
        }
        if (el.name === 'link' && el.attrs.rel === 'preload') {
          // React's image preload: same rule as <img src>.
          expect(el.attrs.as, `${p.rel} preload`).toBe('image');
          if (href.startsWith('/') && !fileList.includes(href.slice(1)) && !ALLOWED_EXTERNAL_ROOT_IMAGES.has(href)) dead.push(`${p.rel} preload -> ${href}`);
          continue;
        }
        if (href.startsWith(SITE + '/')) href = href.slice(SITE.length);
        else if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue; // external
        if (!href.startsWith('/') || href.startsWith('//')) {
          relative.push(`${p.rel}: ${href}`);
          continue;
        }
        internal++;
        const target = href.split(/[?#]/)[0];
        if (routes.has(target) || fileList.includes(target.slice(1))) {
          // A fragment (for example `/#featured-collections`) must name an id that exists on the target page.
          const fragment = /#(.+)$/.exec(href)?.[1];
          const doc = byRoute.get(target);
          if (fragment && doc && !findAll(doc, (e) => e.attrs.id === fragment).length) dead.push(`${p.rel} -> ${href} (no element with id "${fragment}" on ${target})`);
          continue;
        }
        if (ALLOWED_NON_GENERATED_LINKS.has(target)) continue;
        dead.push(`${p.rel} -> ${href}`);
      }
      for (const sc of findAll(p.html$, (e) => e.name === 'script' && 'src' in e.attrs)) {
        if (!fileList.includes(sc.attrs.src.slice(1))) dead.push(`${p.rel} script -> ${sc.attrs.src}`);
      }
      for (const img of findAll(p.html$, (e) => e.name === 'img' && e.attrs.src?.startsWith('/'))) {
        if (!fileList.includes(img.attrs.src.slice(1)) && !ALLOWED_EXTERNAL_ROOT_IMAGES.has(img.attrs.src)) dead.push(`${p.rel} img -> ${img.attrs.src}`);
      }
    }
    return { dead, relative, internal };
  }

  it('every internal href on every page, the homepage included, resolves to a generated file (the allow-list is empty)', () => {
    const { dead, relative, internal } = crawl(files);
    expect(relative, 'relative hrefs').toEqual([]);
    expect(dead, `DEAD INTERNAL LINKS:\n${dead.join('\n')}`).toEqual([]);
    expect(internal).toBeGreaterThan(60); // the crawl really saw the links
    expect([...ALLOWED_NON_GENERATED_LINKS]).toEqual([]);
  });

  it('a dead link to `/` is caught again: with the homepage file missing, every link to `/` (brand, Collections) is reported', () => {
    const { dead } = crawl(files.filter((f) => f !== 'index.html'));
    const toHome = dead.filter((d) => / -> \/(#[^ ]*)?$/.test(d));
    expect(toHome.length).toBeGreaterThan(pages.length); // at least the brand link on every entity page
    expect(toHome.some((d) => d.endsWith('-> /#featured-collections'))).toBe(true);
  });

  it('a link to a fragment that does not exist on the homepage is caught', () => {
    const doc = homeDoc.html$;
    const section = findAll(doc, (e) => e.attrs.id === 'featured-collections')[0];
    section.attrs.id = 'renamed';
    try {
      const { dead } = crawl(files);
      expect(dead.some((d) => d.includes('(no element with id "featured-collections" on /)'))).toBe(true);
      expect(dead.some((d) => d.includes('anchor -> #featured-collections'))).toBe(true); // the hero call to action
    } finally {
      section.attrs.id = 'featured-collections';
    }
  });

  it('no page links to a target outside the output: `/` is a built page', () => {
    const routes = routesOf(files);
    expect(routes.has('/')).toBe(true);
    const seen = new Set<string>();
    for (const p of documents()) {
      for (const a of byTag(p.html$, 'a')) {
        const h = a.attrs.href.split(/[?#]/)[0];
        if (h.startsWith('/') && !routes.has(h) && !files.includes(h.slice(1))) seen.add(h);
      }
    }
    expect([...seen]).toEqual([]);
  });

  it('every page is reachable: some other page links to it (no orphans)', () => {
    const linked = new Set<string>();
    for (const p of pages) for (const a of byTag(p.main, 'a')) linked.add(a.attrs.href);
    for (const a of byTag(homeDoc.main, 'a')) linked.add(a.attrs.href); // the homepage links to collections, a character and a movie
    // advent-challenge is linked from movies, krampus-beast from krampus, etc.
    const orphans = pages.filter((p) => !linked.has(p.route)).map((p) => p.route);
    expect(orphans).toEqual([]);
  });

  it('orders internal link groups by Requirement 9.8 on every page', () => {
    const GROUP_ORDER = ['related-collections', 'collection-items', 'characters', 'movies', 'products'];
    const ENTITY_RANK: Record<string, number> = { collections: 0, characters: 1, movies: 2, products: 3 };
    const COLLECTION_RANK: Record<string, number> = { collections: 0, movies: 1, characters: 2, products: 3 };
    for (const p of pages) {
      const groups = byTag(p.main, 'section').map((s) => s.attrs['data-link-group']).filter(Boolean);
      const ranks = groups.map((g) => GROUP_ORDER.indexOf(g));
      expect(ranks.every((r) => r >= 0), `${p.rel} unknown group in ${groups}`).toBe(true);
      expect(ranks, `${p.rel} groups ${groups}`).toEqual([...ranks].sort((a, b) => a - b));
      // Same thing seen from the links themselves.
      const rank = p.kind === 'collections' ? COLLECTION_RANK : ENTITY_RANK;
      const kinds = byTag(p.main, 'a').map((a) => linkKind(a.attrs.href)).filter((k): k is Kind => !!k);
      const seq = kinds.map((k) => rank[k]);
      expect(seq, `${p.rel} link kinds ${kinds}`).toEqual([...seq].sort((a, b) => a - b));
    }
    const kindsOf = (k: Kind, slug: string) => [...new Set(byTag(pageBy(k, slug).main, 'a').map((a) => linkKind(a.attrs.href)).filter(Boolean))];
    expect(kindsOf('collections', 'full-collection')).toEqual(['collections', 'movies', 'characters', 'products']);
    expect(kindsOf('movies', 'black-christmas')).toEqual(['collections', 'characters', 'products']);
    expect(kindsOf('characters', 'billy')).toEqual(['collections', 'movies', 'products']);
    expect(kindsOf('products', 'santa-mug')).toEqual(['collections', 'characters']);
  });

  it('outbound links: affiliate links are sponsored and open a new tab; unsafe URLs are dropped', () => {
    const mug = pageBy('products', 'santa-mug');
    const aff = byTag(mug.main, 'a').filter((a) => a.attrs.href.startsWith('https://shop.test/'));
    expect(aff).toHaveLength(1);
    expect(aff[0].attrs).toMatchObject({ rel: 'sponsored noopener', target: '_blank', href: 'https://shop.test/mug?ref=hc&x=1' });
    const evil = pageBy('products', 'hostile-product');
    expect(byTag(evil.main, 'a').filter((a) => !a.attrs.href.startsWith('/')).map((a) => a.attrs.href)).toEqual(['https://shop.test/x?a="b"&c=<d>']);
    // The unsafe URL stays in the embedded (inert JSON) page data, since the browser re-applies the same
    // filter when it renders; it must be in no href/src and nowhere in the markup.
    expect(visibleHtml(evil.html)).not.toContain('javascript:');
    for (const e of findAll(evil.html$, (x) => 'href' in x.attrs || 'src' in x.attrs)) {
      expect(`${e.attrs.href ?? ''} ${e.attrs.src ?? ''}`).not.toMatch(/javascript:/i);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. validation failure
// ---------------------------------------------------------------------------
describe('validation failure', () => {
  it('fails with one aggregated error and leaves a pre-populated output directory untouched', async () => {
    const out = await tmp();
    const seed: Record<string, string> = {
      'collections/stale/index.html': 'STALE COLLECTION',
      'movies/old/index.html': 'STALE MOVIE',
      'sitemap.xml': 'OLD SITEMAP',
      'robots.txt': 'OLD ROBOTS',
      'images/fallback.svg': 'OLD SVG',
      'keep/me.txt': 'unrelated',
    };
    for (const [rel, body] of Object.entries(seed)) {
      await mkdir(path.dirname(path.join(out, rel)), { recursive: true });
      await writeFile(path.join(out, rel), body);
    }
    const before = await snapshot(out);
    const fx = makeFixture();
    fx.published.collections.find((c) => c.slug === 'full-collection')!.curatorNotes = '   ';
    fx.published.movies.find((m) => m.slug === 'krampus')!.seoTitle = null;
    fx.published.products.find((p) => p.slug === 'santa-mug')!.seoDescription = '';
    const api = createFakeApi(fx);
    const error = await generateStatic({ assets: TEST_ASSETS, env: ENV, outDir: out, publicDir: PUBLIC_DIR, fetch: api.fetch }).then(
      () => null,
      (e: Error) => e,
    );
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/Publication validation failed: 3 problems in 3 published entities\. Nothing was written\./);
    expect(error!.message).toContain('collection "full-collection": curatorNotes (missing)');
    expect(error!.message).toContain('movie "krampus": seoTitle (missing)');
    expect(error!.message).toContain('product "santa-mug": seoDescription (missing)');
    expect(await snapshot(out)).toEqual(before);
  });

  it('fails on a missing SITE_URL before making any API request or writing anything', async () => {
    const out = await tmp();
    const api = createFakeApi(makeFixture());
    await expect(generateStatic({ assets: TEST_ASSETS, env: { API_BASE_URL: API_BASE }, outDir: out, publicDir: PUBLIC_DIR, fetch: api.fetch })).rejects.toThrow(/SITE_URL/);
    expect(api.requested).toEqual([]);
    expect(await listFiles(out)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 9. determinism
// ---------------------------------------------------------------------------
describe('determinism', () => {
  it('generating again from the same data gives byte-identical output, whatever the request timing or list order', async () => {
    const reference = await snapshot(main.out);
    const again = await generate({ jitterMs: 6 });
    expect(await snapshot(again.out)).toEqual(reference);
    expect(again.summary.warnings).toEqual(main.summary.warnings);
    const reversed = await generate({ reverseLists: true, jitterMs: 6 });
    expect(await snapshot(reversed.out)).toEqual(reference);
    // Re-running into the same directory changes nothing either (no stale or timestamped files).
    await generateStatic({ env: ENV, outDir: main.out, publicDir: PUBLIC_DIR, fetch: createFakeApi(makeFixture()).fetch });
    expect(await snapshot(main.out)).toEqual(reference);
  });
});

// ---------------------------------------------------------------------------
// 10. independence from the API after the build
// ---------------------------------------------------------------------------
describe('independence from the API after the build', () => {
  it('serves every generated route, sitemap.xml and robots.txt from files alone, identical to disk', async () => {
    // The build is over. Serving is files only: the fixture API (which recorded every build request)
    // must not see a single further request, and the pages must not point at it.
    const requestsAfterBuild = main.requested.length;
    const server = await startStaticServer(main.out);
    try {
      const targets = [
        ...pages.map((p) => ({ url: p.route, rel: p.rel, type: CONTENT_TYPES['.html'] })),
        { url: '/', rel: 'index.html', type: CONTENT_TYPES['.html'] },
        { url: '/sitemap.xml', rel: 'sitemap.xml', type: CONTENT_TYPES['.xml'] },
        { url: '/robots.txt', rel: 'robots.txt', type: CONTENT_TYPES['.txt'] },
        { url: '/images/fallback.svg', rel: 'images/fallback.svg', type: CONTENT_TYPES['.svg'] },
        { url: '/assets/entry-client-FAKE.js', rel: 'assets/entry-client-FAKE.js', type: CONTENT_TYPES['.js'] },
        { url: '/assets/entry-client-FAKE.css', rel: 'assets/entry-client-FAKE.css', type: CONTENT_TYPES['.css'] },
      ];
      expect(targets.length).toBe(pages.length + 6);
      const apiHost = new URL(API_BASE);
      for (const t of targets) {
        const res = await fetch(server.origin + t.url);
        expect(res.status, t.url).toBe(200);
        expect(res.headers.get('content-type'), t.url).toBe(t.type);
        const bytes = Buffer.from(await res.arrayBuffer());
        expect(bytes.equals(await readFile(path.join(main.out, t.rel))), `${t.url} bytes`).toBe(true);
        if (t.rel.endsWith('.html')) {
          const text = bytes.toString('utf8');
          expect(text, t.url).not.toContain(apiHost.hostname);
          expect(text, t.url).not.toContain(`:${apiHost.port}`);
          const doc = parseMarkup(text, 'html').root;
          const refs = findAll(doc, (e) => 'href' in e.attrs || 'src' in e.attrs || 'action' in e.attrs);
          for (const e of refs) {
            for (const v of [e.attrs.href, e.attrs.src, e.attrs.action]) {
              if (v) expect(v.startsWith(API_BASE), `${t.url} references the API: ${v}`).toBe(false);
            }
          }
          expect(byTag(doc, 'form'), t.url).toEqual([]);
          const types = byTag(doc, 'script').map((s) => s.attrs.type);
          expect(types, t.url).toEqual(['application/ld+json', 'module', 'application/json']);
          for (const s of byTag(doc, 'script')) expect(s.children.join('')).not.toContain(apiHost.hostname);
        }
      }
      expect((await fetch(server.origin + '/movies/draft-movie/')).status).toBe(404);
      expect((await fetch(server.origin + '/movies/vanished-movie/')).status).toBe(404);
      expect(main.requested.length).toBe(requestsAfterBuild);
    } finally {
      await server.close();
    }
  });

  it('the API is only needed while building: a dead API fails the build and writes nothing', async () => {
    const out = await tmp();
    const down = (async () => { throw new TypeError('connect ECONNREFUSED'); }) as typeof fetch;
    // /home and the /build lists are requested together; whichever failure surfaces first fails the build.
    await expect(generateStatic({ assets: TEST_ASSETS, env: ENV, outDir: out, publicDir: PUBLIC_DIR, fetch: down })).rejects.toThrow(/(Home|Build list) request failed/);
    expect(await listFiles(out)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 11. the homepage (Task 7.1, Part B)
// ---------------------------------------------------------------------------
describe('homepage', () => {
  const hrefs = (n: MNode) => byTag(n, 'a').map((a) => a.attrs.href);
  const sectionById = (id: string) => byTag(homeDoc.main, 'section').find((s) => s.attrs.id === id);
  const headingTexts = (level: string) => byTag(homeDoc.main, level).map(textOf);

  it('is a complete document: landmarks, one h1 with the brand promise, only the three known scripts, no inline handlers', () => {
    const doc = homeDoc;
    expect(doc.html$.attrs.lang).toBe('en');
    one(byTag(doc.body, 'nav'), 'nav');
    one(byTag(doc.body, 'footer'), 'footer');
    expect(byTag(doc.body, 'a').find((a) => a.attrs.href === '#main'), 'skip link').toBeDefined();
    expect(textOf(one(byTag(doc.body, 'h1'), 'h1'))).toBe('Everything Christmas Horror. One Home.');
    const scripts = findAll(doc.html$, (e) => e.name === 'script');
    expect(scripts.map((x) => x.attrs.type)).toEqual(['application/ld+json', 'module', 'application/json']);
    expect(doc.html.match(/<script/gi)).toHaveLength(3);
    expect(findAll(doc.html$, (e) => Object.keys(e.attrs).some((a) => /^on/i.test(a)))).toEqual([]);
    expect(byTag(doc.html$, 'noscript')).toEqual([]);
    expect(visibleText(doc.body)).not.toMatch(/\b(undefined|null|NaN)\b|\[object/);
  });

  it('has a sane outline: h1, then one h2 per section in priority order, then card titles as h3', () => {
    expect(headingTexts('h1')).toHaveLength(1);
    expect(headingTexts('h2')).toEqual(['Featured collections', 'Seasonal collections', 'Gift ideas', 'Featured character', 'Featured movie']);
    expect(headingTexts('h3')).toEqual([
      'Minimal Collection', 'Full Collection', // featured, API order (not alphabetical)
      'Advent Challenge', 'Ghost Collection', // seasonal
      'Full Collection', // gift
      'Billy', // featured character
      `Krampus ${HOSTILE}`.replace(/\s+/g, ' '), // featured movie
    ]);
    for (const s of byTag(homeDoc.main, 'section')) expect(s.attrs['aria-labelledby'], 'section is labelled').toBeTruthy();
  });

  it('shows /home in API order, as list items with meaningful link text', () => {
    const featured = sectionById('featured-collections')!;
    const items = byTag(one(byTag(featured, 'ul'), 'featured list'), 'li');
    expect(items.map((li) => one(byTag(li, 'a'), 'card link').attrs.href)).toEqual(['/collections/minimal-collection/', '/collections/full-collection/']);
    expect(items.map((li) => textOf(byTag(li, 'a')[0]))).toEqual(['Minimal Collection', 'Full Collection']);
    // Only fields that exist on the summaries: type label and summary text.
    expect(textOf(items[0])).toContain('Theme collection');
    expect(textOf(items[0])).toContain('Short & sweet.');
    for (const a of byTag(homeDoc.main, 'a')) expect(textOf(a).toLowerCase(), 'link text').not.toMatch(/^(click here|here|more|read more)$/);
  });

  it('keeps the link groups in the homepage priority order in the DOM: featured, seasonal, gift, character, movie', () => {
    const groups = byTag(homeDoc.main, 'section').map((s) => s.attrs['data-link-group']).filter(Boolean);
    expect(groups).toEqual(['featured-collections', 'seasonal-collections', 'gift-collection', 'characters', 'movies']);
    // The hero comes before all of them.
    const first = byTag(homeDoc.main, 'section')[0];
    expect(first.attrs['data-link-group']).toBeUndefined();
    expect(byTag(first, 'h1')).toHaveLength(1);
    // And the kinds of the links follow: collections, then character, then movie (Req 9.8).
    const kinds = hrefs(homeDoc.main).filter((h) => h.startsWith('/')).map((h) => h.split('/')[1]);
    const rank: Record<string, number> = { collections: 0, characters: 1, movies: 2 };
    const seq = kinds.map((k) => rank[k]);
    expect(seq).toEqual([...seq].sort((a, b) => a - b));
  });

  it('links only to built pages; an unbuilt reference is plain text and a warning, never a dead link', () => {
    const seasonal = sectionById('seasonal-collections')!;
    const lis = byTag(seasonal, 'li');
    expect(lis.map((li) => byTag(li, 'a').map((a) => a.attrs.href))).toEqual([['/collections/advent-challenge/'], []]);
    expect(textOf(byTag(lis[1], 'h3')[0])).toBe('Ghost Collection');
    expect(visibleHtml(homeDoc.html)).not.toContain('ghost-collection');
    expect(main.summary.warnings.map((w) => w.message).filter((m) => m.startsWith('home "/": references collection "ghost-collection"'))).toHaveLength(1);
    // Every content link resolves to a file (the crawl in "internal links" also checks this).
    const built = new Set(pages.map((p) => p.route));
    for (const h of hrefs(homeDoc.main).filter((x) => x.startsWith('/'))) expect(built.has(h), h).toBe(true);
  });

  it('escapes hostile catalog text and keeps it as inert text', () => {
    const movieSection = sectionById('featured-movie')!;
    expect(textOf(byTag(movieSection, 'h3')[0])).toBe(`Krampus ${HOSTILE}`.replace(/\s+/g, ' '));
    expect(textOf(movieSection)).toContain(HOSTILE.replace(/\s+/g, ' '));
    expect(homeDoc.html).not.toContain('<img src=x');
    expect(homeDoc.html).not.toContain('<script>alert');
    expect(byTag(homeDoc.html$, 'img').filter((i) => i.attrs.src === 'x')).toEqual([]);
    expect(homeDoc.html.match(/<script/gi)).toHaveLength(3);
  });

  it('the call to action and the nav link jump to the featured collections section, which exists', () => {
    const cta = byTag(homeDoc.main, 'a').find((a) => a.attrs.href === '#featured-collections');
    expect(cta, 'hero call to action').toBeDefined();
    expect(textOf(cta!)).toBe('Explore featured collections');
    expect(sectionById('featured-collections')).toBeDefined();
    const nav = one(byTag(homeDoc.body, 'nav'), 'nav');
    expect(byTag(nav, 'a').map((a) => [a.attrs.href, textOf(a)])).toEqual([['/', 'Horror Christmas'], ['/#featured-collections', 'Collections']]);
    // Every entity page carries the same nav link.
    for (const p of pages) expect(byTag(one(byTag(p.body, 'nav'), 'nav'), 'a').map((a) => a.attrs.href), p.rel).toEqual(['/', '/#featured-collections']);
  });

  it('renders every image lazily (none is eager or high priority) and adds no image preload', () => {
    const imgs = byTag(homeDoc.main, 'img');
    expect(imgs).toHaveLength(7); // one per card
    for (const i of imgs) {
      expect(i.attrs.loading, i.attrs.src).toBe('lazy');
      expect(i.attrs.decoding).toBe('async');
      expect('fetchpriority' in i.attrs || 'fetchPriority' in i.attrs).toBe(false);
      expect('alt' in i.attrs, 'alt attribute present').toBe(true);
    }
    expect(byTag(homeDoc.head, 'link').filter((l) => l.attrs.rel === 'preload')).toEqual([]);
    // Real images keep their URL and the card title as alt; a missing image uses the decorative fallback.
    const min = imgs.find((i) => i.attrs.src === 'https://img.test/min.jpg')!;
    expect(min.attrs.alt).toBe('Minimal Collection');
    expect(imgs.filter((i) => i.attrs.src === '/images/fallback.svg').every((i) => i.attrs.alt === '' && i.attrs.role === 'presentation')).toBe(true);
    expect(byTag(byTag(homeDoc.main, 'section')[0], 'img'), 'the hero has no image').toEqual([]);
  });

  it('has the homepage metadata: title, description <= 160, canonical, Open Graph with the fallback image, summary card', () => {
    const head = homeDoc.head;
    expect(textOf(one(byTag(head, 'title'), 'title'))).toBe('Horror Christmas | Everything Christmas Horror. One Home.');
    const [description] = metaValues(head, 'name', 'description');
    expect(description.length).toBeGreaterThan(40);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(one(byTag(head, 'link').filter((l) => l.attrs.rel === 'canonical'), 'canonical').attrs.href).toBe(`${SITE}/`);
    const once = (key: string, attr: 'name' | 'property' = 'property') => one(metaValues(head, attr, key), key);
    expect(once('og:type')).toBe('website');
    expect(once('og:title')).toBe('Horror Christmas | Everything Christmas Horror. One Home.');
    expect(once('og:description')).toBe(description);
    expect(once('og:url')).toBe(`${SITE}/`);
    expect(once('og:site_name')).toBe('Horror Christmas');
    expect(once('og:image')).toBe(`${SITE}/images/fallback.svg`);
    expect(once('twitter:card', 'name')).toBe('summary');
  });

  it('writes WebSite and an ItemList of the featured collections as JSON-LD: absolute urls, positions from 1, no search action', async () => {
    const raw = one(byTag(homeDoc.head, 'script').filter((x) => x.attrs.type === 'application/ld+json'), 'ld+json').children[0] as string;
    expect(raw).not.toMatch(/[<>&\u2028\u2029]/);
    const ld = JSON.parse(raw);
    expect(ld['@context']).toBe('https://schema.org');
    const [site, list] = ld['@graph'];
    expect(site).toMatchObject({ '@type': 'WebSite', name: 'Horror Christmas', url: `${SITE}/` });
    expect(site).not.toHaveProperty('potentialAction');
    expect(JSON.stringify(ld)).not.toContain('SearchAction');
    expect(list['@type']).toBe('ItemList');
    expect(list.numberOfItems).toBe(2);
    expect(list.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Minimal Collection', url: `${SITE}/collections/minimal-collection/` },
      { '@type': 'ListItem', position: 2, name: 'Full Collection', url: `${SITE}/collections/full-collection/` },
    ]);
    expectNoEmptyValues(ld, 'home ld+json');
    const locs = new Set(byTag(parseMarkup(await read('sitemap.xml'), 'xml').root, 'loc').map(textOf));
    for (const item of list.itemListElement) expect(locs.has(item.url), item.url).toBe(true);
  });

  it('embeds the /home projection once, without internal ids, with the built slugs the browser needs', () => {
    const blob = byTag(homeDoc.body, 'script').find((x) => x.attrs.id === '__PAGE_DATA__')!.children[0] as string;
    const payload = JSON.parse(blob);
    expect(payload.page.type).toBe('home');
    expect(payload.page.model.featuredCollections.map((c: { slug: string }) => c.slug)).toEqual(['minimal-collection', 'full-collection']);
    for (const id of main.fx.ids) expect(blob).not.toContain(id);
    expect(payload.knownMovieSlugs).toEqual([...payload.knownMovieSlugs].sort());
    expect(payload.knownMovieSlugs).toContain('krampus');
    expect(payload.knownCharacterSlugs).toContain('billy');
  });

  it('with every optional part absent the page still builds: hero only, no sections, no call to action, no placeholder text', async () => {
    const g = await generate({ mutate: (fx) => { fx.home = emptyHome(); } });
    const html = await readFile(path.join(g.out, 'index.html'), 'utf8');
    const doc = parseHome(html);
    expect(textOf(one(byTag(doc.body, 'h1'), 'h1'))).toBe('Everything Christmas Horror. One Home.');
    expect(byTag(doc.main, 'h2')).toEqual([]);
    expect(byTag(doc.main, 'li')).toEqual([]);
    expect(byTag(doc.main, 'a')).toEqual([]); // no call to action without a section to jump to
    expect(visibleText(doc.body)).not.toMatch(/\b(undefined|null|NaN)\b/);
    // Structured data: WebSite only (an empty ItemList says nothing).
    const ld = JSON.parse(one(byTag(doc.head, 'script').filter((x) => x.attrs.type === 'application/ld+json'), 'ld').children[0] as string);
    expect(ld['@graph'].map((x: { '@type': string }) => x['@type'])).toEqual(['WebSite']);
    // Build warning (not an error) naming the empty featured collections.
    expect(g.summary.warnings.map((w) => w.message).some((m) => m.startsWith('home "/": NO FEATURED COLLECTIONS'))).toBe(true);
    // Still in the sitemap, first.
    expect(locs(await readFile(path.join(g.out, 'sitemap.xml'), 'utf8'))[0]).toBe(`${SITE}/`);
  });

  it('a /home reference to a movie or character that is not built is plain text with a warning', async () => {
    const g = await generate({
      mutate: (fx) => {
        fx.home.featuredMovie = { ...fx.home.featuredMovie!, slug: 'not-built-movie', title: 'Phantom Movie' };
        fx.home.featuredCharacter = { ...fx.home.featuredCharacter!, slug: 'not-built-character', name: 'Phantom Character' };
      },
    });
    const html = await readFile(path.join(g.out, 'index.html'), 'utf8');
    const doc = parseHome(html);
    expect(textOf(byTag(doc.main, 'h3').find((h) => textOf(h) === 'Phantom Movie')!)).toBe('Phantom Movie');
    expect(byTag(doc.main, 'a').map((a) => a.attrs.href).filter((h) => /phantom|not-built/.test(h))).toEqual([]);
    expect(visibleHtml(html)).not.toContain('not-built');
    const msgs = g.summary.warnings.map((w) => w.message);
    expect(msgs.some((m) => m.startsWith('home "/": references movie "not-built-movie" (featured movie)'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('home "/": references character "not-built-character" (featured character)'))).toBe(true);
  });

  const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
});
