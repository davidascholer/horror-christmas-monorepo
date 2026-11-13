// @vitest-environment node
/**
 * "Image unavailable" placeholder (owner review of Task 7.1): the single asset, and the build-time
 * substitution of root-relative image URLs whose file is not under public/.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MISSING_IMAGES_EXAMPLES, missingImagesWarning, publicPathSegments, substituteMissingImages } from './missing-images';
import { renderSite } from './render-site';
import { FALLBACK_IMAGE_PATH } from '../pages/image-sources';
import { SITE, TEST_ASSETS, character, charSummary, colSummary, collection, emptyHome, movie, movieSummary, product, validData } from './test-fixtures';
import type { HomeResponse } from '../types/api-contracts';

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));
const WEB_DIR = fileURLToPath(new URL('../..', import.meta.url));

let root: string;
let pub: string;
beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'hc-missing-img-'));
  pub = path.join(root, 'public');
  await mkdir(path.join(pub, 'images/movies'), { recursive: true });
  await writeFile(path.join(pub, 'images/movies/real.jpg'), 'jpg');
  await writeFile(path.join(root, 'secret.txt'), 'secret');
  await writeFile(path.join(pub, '.hidden.jpg'), 'x');
  await symlink(path.join(root, 'secret.txt'), path.join(pub, 'images/link.jpg')); // file symlink to outside
  await symlink(root, path.join(pub, 'images/dirlink')); // directory symlink to outside
});
afterAll(() => rm(root, { recursive: true, force: true }));

const withHero = (url: string | null) => ({ ...validData(), collections: [collection({ heroImageUrl: url })] });

describe('the placeholder asset', () => {
  it('is the only placeholder: one small, valid, self-contained SVG, and nothing refers to the old path', async () => {
    const images = await readdir(path.join(PUBLIC_DIR, 'images'));
    expect(images).toEqual(['image-unavailable.svg']);
    expect(FALLBACK_IMAGE_PATH).toBe('/images/image-unavailable.svg');
    const svg = await readFile(path.join(PUBLIC_DIR, 'images/image-unavailable.svg'), 'utf8');
    expect((await stat(path.join(PUBLIC_DIR, 'images/image-unavailable.svg'))).size).toBeLessThan(4096);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg.trim().endsWith('</svg>')).toBe(true);
    expect(svg).toContain('Image unavailable');
    // No external reference of any kind (the xmlns is a namespace, not a fetch), no script, no web font.
    expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', '')).not.toMatch(/https?:|href=|url\(|<script|@import|@font-face|<image|<foreignObject|\son\w+=/i);
  });

  it('no source, test, doc or script mentions the removed fallback.svg', async () => {
    const skip = new Set(['node_modules', 'dist', 'dist-static', '.git', 'coverage']);
    const hits: string[] = [];
    const walk = async (dir: string): Promise<void> => {
      for (const e of await readdir(dir, { withFileTypes: true })) {
        if (skip.has(e.name)) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) await walk(full);
        else if (/\.(tsx?|md|json|svg|html|css|sh)$/.test(e.name) && e.name !== 'missing-images.test.ts') {
          if ((await readFile(full, 'utf8')).includes('fallback.svg')) hits.push(path.relative(WEB_DIR, full));
        }
      }
    };
    await walk(WEB_DIR);
    expect(hits).toEqual([]);
  });
});

describe('publicPathSegments', () => {
  it.each([
    '/../secret', '/images/../../x', '/images/%2e%2e/%2e%2e/x', '/%2E%2E/x', '/images\\..\\x', '/images/..%5cx', '/images/a%00.jpg',
    '//evil.test/x.jpg', '/\\evil', '/images//x.jpg', '/images/./x.jpg', '/images/%zz', '/.hidden.jpg', '/images/',
  ])('rejects %s', (url) => {
    expect(publicPathSegments(url)).toBeNull();
  });
  it('decodes and splits a plain path, ignoring query and fragment', () => {
    expect(publicPathSegments('/images/movies/a%20b.jpg?v=1#x')).toEqual(['images', 'movies', 'a b.jpg']);
  });
});

describe('substituteMissingImages', () => {
  it('keeps a real file, replaces a missing one, leaves absolute URLs and nulls alone', async () => {
    const data = {
      ...validData(),
      collections: [collection({ heroImageUrl: '/images/movies/real.jpg' }), collection({ id: 'c2', slug: 'two', heroImageUrl: '/images/collections/nope.jpg' })],
      movies: [movie({ posterUrl: 'https://cdn.test/p.jpg', heroImageUrl: null })],
      characters: [character({ imageUrl: '/images/characters/nope.jpg' })],
    };
    const result = await substituteMissingImages(data, pub);
    expect(result.data.collections.map((c) => c.heroImageUrl)).toEqual(['/images/movies/real.jpg', FALLBACK_IMAGE_PATH]);
    expect(result.data.movies[0].posterUrl).toBe('https://cdn.test/p.jpg');
    expect(result.data.movies[0].heroImageUrl).toBeNull();
    expect(result.data.characters[0].imageUrl).toBe(FALLBACK_IMAGE_PATH);
    expect(result.missing).toEqual(['/images/characters/nope.jpg', '/images/collections/nope.jpg']);
    expect(result.references).toBe(2);
    expect(data.collections[1].heroImageUrl).toBe('/images/collections/nope.jpg'); // input untouched
  });

  it('treats traversal, encoded traversal, backslashes, dotfiles and symlinks as missing', async () => {
    const urls = [
      '/../secret.txt', '/images/../../secret.txt', '/images/%2e%2e/%2e%2e/secret.txt', '/images\\..\\..\\secret.txt',
      '/images/link.jpg', '/images/dirlink/secret.txt', '/.hidden.jpg', '/images/MOVIES/real.jpg',
    ];
    for (const url of urls) {
      const r = await substituteMissingImages(withHero(url), pub);
      expect(r.data.collections[0].heroImageUrl, url).toBe(url.startsWith('//') ? url : FALLBACK_IMAGE_PATH);
    }
  });

  it('picks up a file added later without any code change', async () => {
    const dir = path.join(root, 'public2');
    await mkdir(path.join(dir, 'images/movies'), { recursive: true });
    await writeFile(path.join(dir, 'images/movies/there.jpg'), 'x');
    const data = { ...validData(), movies: [movie({ posterUrl: '/images/movies/there.jpg' }), movie({ id: 'm2', slug: 'm2', posterUrl: '/images/movies/absent.jpg' })] };
    const r = await substituteMissingImages(data, dir);
    expect(r.data.movies.map((m) => m.posterUrl)).toEqual(['/images/movies/there.jpg', FALLBACK_IMAGE_PATH]);
    await writeFile(path.join(dir, 'images/movies/absent.jpg'), 'x');
    expect((await substituteMissingImages(data, dir)).data.movies.map((m) => m.posterUrl)).toEqual(['/images/movies/there.jpg', '/images/movies/absent.jpg']);
  });
});

describe('missingImagesWarning', () => {
  it('is null when nothing was replaced, otherwise one deterministic sorted line', () => {
    expect(missingImagesWarning({ missing: [], references: 0 })).toBeNull();
    const missing = ['/a/1.jpg', '/a/2.jpg', '/a/3.jpg', '/a/4.jpg', '/a/5.jpg', '/a/6.jpg'];
    const w = missingImagesWarning({ missing, references: 9 })!;
    expect(w.message).toBe(
      `images: 6 image files were not found under public/ and use the placeholder ${FALLBACK_IMAGE_PATH} ` +
        `(9 references; first ${MISSING_IMAGES_EXAMPLES}: /a/1.jpg, /a/2.jpg, /a/3.jpg, /a/4.jpg, /a/5.jpg, ...)`,
    );
    expect(missingImagesWarning({ missing, references: 9 })).toEqual(w);
  });
});

describe('placeholder on every page type', () => {
  const home: HomeResponse = {
    ...emptyHome(),
    featuredCollections: [{ ...colSummary('col-a', 'Col A'), heroImageUrl: '/images/collections/gone.jpg' }],
    seasonalCollections: [{ ...colSummary('col-b', 'Col B'), heroImageUrl: 'javascript:alert(1)' }],
    giftCollection: { ...colSummary('col-c', 'Col C'), heroImageUrl: null },
    featuredMovie: { ...movieSummary('m1', 'M One'), posterUrl: '/images/movies/gone.jpg' },
    featuredCharacter: { ...charSummary('billy', 'Billy'), imageUrl: '/images/characters/gone.jpg' },
  };
  const data = {
    ...validData(),
    collections: [collection({ heroImageUrl: '/images/collections/gone.jpg' })],
    movies: [movie({ posterUrl: '/images/movies/gone.jpg', heroImageUrl: null })],
    characters: [character({ imageUrl: '/images/characters/gone.jpg' })],
    products: [product({ imageUrl: '/images/products/gone.jpg' })],
    home,
  };

  it('every <img> on every page is the placeholder or an existing file, decorative, and server markup equals the data', async () => {
    const r = await substituteMissingImages(data, pub);
    const pages = renderSite(r.data, { siteUrl: SITE, assets: TEST_ASSETS });
    expect(pages.map((p) => p.type).sort()).toEqual(['character', 'collection', 'home', 'movie', 'product']);
    for (const p of pages) {
      const srcs = [...p.html.matchAll(/<img [^>]*?src="([^"]*)"/g)].map((m) => m[1]);
      expect(srcs.length, p.type).toBeGreaterThan(0);
      for (const s of srcs) expect(s, `${p.type} img`).toBe(FALLBACK_IMAGE_PATH);
      for (const m of p.html.matchAll(/<img [^>]*>/g)) expect(m[0], p.type).toMatch(/alt=""[^>]*role="presentation"/);
      // The embedded data carries the substituted values (the browser does not recompute them).
      expect(p.html, p.type).not.toContain('gone.jpg');
      expect(p.html, p.type).toContain(`<meta property="og:image" content="${SITE}${FALLBACK_IMAGE_PATH}"/>`);
    }
  });
});
