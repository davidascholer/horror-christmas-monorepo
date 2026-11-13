// @vitest-environment node
/**
 * Static asset copy and the fallback image asset (Task 6.5; Requirements 15.2, 18.2).
 */
import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DEFAULT_PUBLIC_DIR, assertFallbackImageExists, copyPublicAssets } from './write-pages';
import { generateStatic } from './generate-static';
import { FALLBACK_IMAGE_PATH } from '../pages/image-sources';
import { SITE, TEST_ASSETS, TS, collection, homeFeaturing, movie } from './test-fixtures';

async function tmp(prefix: string) {
  return mkdtemp(path.join(tmpdir(), `${prefix}-`));
}

describe('web/public/images/fallback.svg', () => {
  it('exists, is a small plain SVG with no external references or scripts, and is accessible', async () => {
    const svg = await readFile(path.join(DEFAULT_PUBLIC_DIR, FALLBACK_IMAGE_PATH), 'utf8');
    expect(svg.length).toBeLessThan(2000);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('<title');
    expect(svg).not.toMatch(/<script|<image|<foreignObject|<style|href=|xlink|url\(|@import|\son[a-z]+=/i);
    expect(svg.match(/https?:\/\/[^"'\s]+/g)).toEqual(['http://www.w3.org/2000/svg']); // only the XML namespace
  });
});

describe('copyPublicAssets', () => {
  it('copies nested files keeping relative paths', async () => {
    const pub = await tmp('pub');
    const out = await tmp('out');
    try {
      await mkdir(path.join(pub, 'images/deep'), { recursive: true });
      await writeFile(path.join(pub, 'images/fallback.svg'), '<svg/>');
      await writeFile(path.join(pub, 'images/deep/a.txt'), 'a');
      await writeFile(path.join(pub, 'favicon.ico'), 'ico');
      expect(await copyPublicAssets(pub, out)).toEqual(['favicon.ico', 'images/deep/a.txt', 'images/fallback.svg']);
      expect(await readFile(path.join(out, 'images/fallback.svg'), 'utf8')).toBe('<svg/>');
      expect(await readFile(path.join(out, 'images/deep/a.txt'), 'utf8')).toBe('a');
    } finally {
      await rm(pub, { recursive: true, force: true });
      await rm(out, { recursive: true, force: true });
    }
  });

  it('overwrites same-named files but never deletes other output files', async () => {
    const pub = await tmp('pub');
    const out = await tmp('out');
    try {
      await mkdir(path.join(pub, 'images'), { recursive: true });
      await writeFile(path.join(pub, 'images/fallback.svg'), 'new');
      await mkdir(path.join(out, 'images'), { recursive: true });
      await writeFile(path.join(out, 'images/fallback.svg'), 'old');
      await writeFile(path.join(out, 'images/other.png'), 'keep');
      await writeFile(path.join(out, 'sitemap.xml'), 'keep');
      await copyPublicAssets(pub, out);
      expect(await readFile(path.join(out, 'images/fallback.svg'), 'utf8')).toBe('new');
      expect(await readFile(path.join(out, 'images/other.png'), 'utf8')).toBe('keep');
      expect(await readFile(path.join(out, 'sitemap.xml'), 'utf8')).toBe('keep');
    } finally {
      await rm(pub, { recursive: true, force: true });
      await rm(out, { recursive: true, force: true });
    }
  });

  it('skips dotfiles and symlinks, so nothing from outside public/ is copied or written outside the output', async () => {
    const parent = await tmp('sandbox');
    try {
      const pub = path.join(parent, 'pub');
      const out = path.join(parent, 'out');
      const secret = path.join(parent, 'secret');
      await mkdir(path.join(pub, 'images'), { recursive: true });
      await mkdir(secret, { recursive: true });
      await writeFile(path.join(secret, 'key.txt'), 'secret');
      await writeFile(path.join(pub, 'images/ok.svg'), '<svg/>');
      await writeFile(path.join(pub, '.DS_Store'), 'junk');
      await symlink(path.join(secret, 'key.txt'), path.join(pub, 'images/link.txt'));
      await symlink(secret, path.join(pub, 'linked-dir'));
      expect(await copyPublicAssets(pub, out)).toEqual(['images/ok.svg']);
      expect((await readdir(out)).sort()).toEqual(['images']);
      expect((await readdir(parent)).sort()).toEqual(['out', 'pub', 'secret']);
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  });

  it('copies nothing when the public directory does not exist', async () => {
    const out = await tmp('out');
    try {
      expect(await copyPublicAssets(path.join(out, 'no-such-dir'), out)).toEqual([]);
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  });
});

describe('assertFallbackImageExists', () => {
  it('passes for the real public directory and fails with a clear message otherwise', async () => {
    await expect(assertFallbackImageExists(DEFAULT_PUBLIC_DIR)).resolves.toBeUndefined();
    const empty = await tmp('empty');
    try {
      await expect(assertFallbackImageExists(empty)).rejects.toThrow(/Fallback image not found.*fallback\.svg/);
    } finally {
      await rm(empty, { recursive: true, force: true });
    }
  });
});

describe('generateStatic and the fallback asset', () => {
  const env = { API_BASE_URL: 'http://api.test', SITE_URL: SITE };
  const lists: Record<string, string[]> = { collections: ['cozy-slashers', 'gift-guide'], movies: ['black-christmas'], characters: [], products: [] };
  const models: Record<string, unknown> = {
    'collections/cozy-slashers': collection(),
    'collections/gift-guide': collection({ id: 'c2', slug: 'gift-guide' }),
    // no poster and no hero: this page uses the fallback image
    'movies/black-christmas': movie({ posterUrl: null, heroImageUrl: null }),
  };
  const fake = (async (input: RequestInfo | URL) => {
    const [, first, second] = new URL(String(input)).pathname.split('/');
    if (first === 'home') return new Response(JSON.stringify(homeFeaturing(lists.collections)));
    if (first === 'build') return new Response(JSON.stringify((lists[second] ?? []).map((slug) => ({ slug, updatedAt: TS }))));
    const model = models[`${first}/${second}`];
    return model ? new Response(JSON.stringify(model)) : new Response('', { status: 404 });
  }) as typeof fetch;

  it('copies /images/fallback.svg into the output and the movie page and og:image point at it', async () => {
    const out = await tmp('gen');
    try {
      const summary = await generateStatic({ assets: TEST_ASSETS, env, outDir: out, fetch: fake });
      expect((await stat(path.join(out, 'images/fallback.svg'))).isFile()).toBe(true);
      expect(await readFile(path.join(out, 'images/fallback.svg'), 'utf8')).toBe(
        await readFile(path.join(DEFAULT_PUBLIC_DIR, 'images/fallback.svg'), 'utf8'),
      );
      const html = await readFile(path.join(out, 'movies/black-christmas/index.html'), 'utf8');
      expect(html).toContain('<img src="/images/fallback.svg" alt=""');
      expect(html).toContain(`<meta property="og:image" content="${SITE}/images/fallback.svg"/>`);
      expect(html).toContain('<meta name="twitter:card" content="summary"/>');
      expect(summary.warnings.map((w) => w.message)).toEqual([
        // The homepage (Task 7.1) uses the fallback og:image too, with the same warning policy.
        expect.stringMatching(/^home "\/": no usable image; using fallback image/),
        expect.stringMatching(/^movie "black-christmas": no usable image; using fallback image/),
      ]);
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  });

  it('fails before writing anything when the fallback asset is missing from the public directory', async () => {
    const out = path.join(await tmp('gen-missing'), 'out');
    const emptyPublic = await tmp('empty-public');
    try {
      await expect(generateStatic({ assets: TEST_ASSETS, env, outDir: out, publicDir: emptyPublic, fetch: fake })).rejects.toThrow(/Fallback image not found/);
      await expect(readdir(out)).rejects.toThrow();
    } finally {
      await rm(path.dirname(out), { recursive: true, force: true });
      await rm(emptyPublic, { recursive: true, force: true });
    }
  });

  it('copies other public files too (custom public directory)', async () => {
    const out = await tmp('gen-custom');
    const pub = await tmp('custom-public');
    try {
      await mkdir(path.join(pub, 'images'), { recursive: true });
      await writeFile(path.join(pub, 'images/fallback.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
      await writeFile(path.join(pub, 'extra.txt'), 'extra');
      await generateStatic({ assets: TEST_ASSETS, env, outDir: out, publicDir: pub, fetch: fake });
      expect(await readFile(path.join(out, 'extra.txt'), 'utf8')).toBe('extra');
    } finally {
      await rm(out, { recursive: true, force: true });
      await rm(pub, { recursive: true, force: true });
    }
  });
});
