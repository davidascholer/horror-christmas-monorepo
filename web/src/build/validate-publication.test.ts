// @vitest-environment node
/**
 * Build-time publication validation (Task 6.5; Requirements 12.1, 12.2, 18.3).
 */
import { describe, it, expect } from 'vitest';
import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  PublicationValidationError, assertPublishable, findPublicationProblems, formatPublicationProblems,
} from './validate-publication';
import { generateStatic } from './generate-static';
import { SITE, TEST_ASSETS, TS, character, collection, homeFeaturing, movie, product, validData } from './test-fixtures';
import type { CollectionDetail } from '../types/api-contracts';

const fields = (data: Parameters<typeof findPublicationProblems>[0]) =>
  findPublicationProblems(data).map((p) => `${p.entityType}:${p.slug}:${p.field}`);

describe('findPublicationProblems', () => {
  it('a complete data set has no problems', () => {
    expect(findPublicationProblems(validData())).toEqual([]);
    expect(() => assertPublishable(validData())).not.toThrow();
    expect(findPublicationProblems({ collections: [], movies: [], characters: [], products: [] })).toEqual([]);
  });

  it.each<[keyof CollectionDetail, Partial<CollectionDetail>]>([
    ['introduction', { introduction: '' }],
    ['curatorNotes', { curatorNotes: '' }],
    ['heroImageUrl', { heroImageUrl: null }],
    ['heroImageAlt', { heroImageAlt: null }],
    ['seoTitle', { seoTitle: null }],
    ['seoDescription', { seoDescription: null }],
    ['movies', { movies: [] }],
    ['relatedCollections', { relatedCollections: [] }],
  ])('collection: missing %s is reported', (field, over) => {
    expect(fields({ collections: [collection(over)], movies: [], characters: [], products: [] })).toEqual([`collection:cozy-slashers:${field}`]);
  });

  it.each(['seoTitle', 'seoDescription'] as const)('movie, character and product: missing %s is reported', (field) => {
    const data = {
      collections: [], movies: [movie({ [field]: null })], characters: [character({ [field]: null })], products: [product({ [field]: null })],
    };
    expect(fields(data)).toEqual([`movie:black-christmas:${field}`, `character:billy:${field}`, `product:mug:${field}`]);
  });

  it('blank and whitespace-only values count as missing', () => {
    const blank = ['', ' ', '\n\t ', '\u00a0'];
    for (const v of blank) {
      expect(fields({ collections: [collection({ introduction: v, curatorNotes: v, heroImageUrl: v, heroImageAlt: v, seoTitle: v, seoDescription: v })], movies: [], characters: [], products: [] }))
        .toEqual(['introduction', 'curatorNotes', 'heroImageUrl', 'heroImageAlt', 'seoTitle', 'seoDescription'].map((f) => `collection:cozy-slashers:${f}`));
      expect(fields({ collections: [], movies: [movie({ seoTitle: v, seoDescription: v })], characters: [], products: [] }))
        .toEqual(['movie:black-christmas:seoTitle', 'movie:black-christmas:seoDescription']);
    }
  });

  it('a hero image URL that is present but unusable is an error, not a silent fallback', () => {
    for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AA', '//cdn.test/a.jpg', 'relative.jpg']) {
      const [p] = findPublicationProblems({ collections: [collection({ heroImageUrl: bad })], movies: [], characters: [], products: [] });
      expect(p).toMatchObject({ entityType: 'collection', field: 'heroImageUrl' });
      expect(p.problem).toMatch(/not a valid image URL/);
    }
    // root-relative is fine
    expect(findPublicationProblems({ collections: [collection({ heroImageUrl: '/images/h.jpg' })], movies: [], characters: [], products: [] })).toEqual([]);
  });

  it('missing OPTIONAL data is not an error: images, summaries, descriptions, alt on non-collections', () => {
    const data = {
      collections: [collection({ summary: null })],
      movies: [movie({ posterUrl: null, heroImageUrl: null, synopsis: null })],
      characters: [character({ imageUrl: null, summary: null, biography: null })],
      products: [product({ imageUrl: null, imageAlt: null, description: null, price: null })],
    };
    expect(findPublicationProblems(data)).toEqual([]);
  });
});

describe('PublicationValidationError message', () => {
  it('aggregates every entity type, slug and field, not just the first', () => {
    const data = {
      collections: [collection({ heroImageAlt: ' ', movies: [] }), collection({ id: 'c2', slug: 'second', introduction: '' })],
      movies: [movie({ seoTitle: null, seoDescription: null })],
      characters: [character({ seoDescription: '' })],
      products: [product({ seoTitle: ' ' })],
    };
    let error: unknown;
    try {
      assertPublishable(data);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(PublicationValidationError);
    const err = error as PublicationValidationError;
    expect(err.problems).toHaveLength(7);
    const lines = err.message.split('\n');
    expect(lines[0]).toBe('Publication validation failed: 7 problems in 5 published entities. Nothing was written.');
    expect(lines.slice(1, 6)).toEqual([
      '  - collection "cozy-slashers": heroImageAlt (missing), movies (no items (at least one movie is required))',
      '  - collection "second": introduction (missing)',
      '  - movie "black-christmas": seoTitle (missing), seoDescription (missing)',
      '  - character "billy": seoDescription (missing)',
      '  - product "mug": seoTitle (missing)',
    ]);
  });

  it('uses singular wording for one problem', () => {
    expect(formatPublicationProblems([{ entityType: 'movie', slug: 'm', field: 'seoTitle', problem: 'missing' }]))
      .toMatch(/^Publication validation failed: 1 problem in 1 published entity\./);
  });
});

describe('generateStatic runs the validator before writing anything', () => {
  function fakeFetch(models: Record<string, unknown>, lists: Record<string, string[]>): typeof fetch {
    return (async (input: RequestInfo | URL) => {
      const [, first, second] = new URL(String(input)).pathname.split('/');
      if (first === 'home') return new Response(JSON.stringify(homeFeaturing(lists.collections ?? [])));
      if (first === 'build') return new Response(JSON.stringify((lists[second] ?? []).map((slug) => ({ slug, updatedAt: TS }))));
      const model = models[`${first}/${second}`];
      return model ? new Response(JSON.stringify(model)) : new Response('', { status: 404 });
    }) as typeof fetch;
  }
  const env = { API_BASE_URL: 'http://api.test', SITE_URL: SITE };
  const lists = { collections: ['cozy-slashers', 'gift-guide'], movies: ['black-christmas'], characters: ['billy'], products: ['mug'] };
  const models = (over: Record<string, unknown> = {}) => ({
    'collections/cozy-slashers': collection(),
    'collections/gift-guide': collection({ id: 'c2', slug: 'gift-guide' }),
    'movies/black-christmas': movie(),
    'characters/billy': character(),
    'products/mug': product(),
    ...over,
  });

  it('valid models build; warnings do not fail the build', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'val-ok-'));
    try {
      // gift-guide relates to a collection that is built; the movie has no poster -> warning only
      const summary = await generateStatic({
        assets: TEST_ASSETS, env, outDir: dir,
        fetch: fakeFetch(models({ 'movies/black-christmas': movie({ posterUrl: null }) }), lists),
      });
      // 2 collections + movie + character + product, plus the homepage (Task 7.1).
      expect(summary.counts.total).toBe(6);
      expect(summary.warnings.length).toBeGreaterThan(0);
      expect((await readdir(dir)).sort()).toEqual(['characters', 'collections', 'images', 'index.html', 'movies', 'products', 'robots.txt', 'sitemap.xml']);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('fails with an aggregated error and leaves an existing output directory untouched', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'val-bad-'));
    try {
      await mkdir(path.join(dir, 'movies/old'), { recursive: true });
      await writeFile(path.join(dir, 'movies/old/index.html'), 'previous build');
      await writeFile(path.join(dir, 'sitemap.xml'), 'previous sitemap');
      const bad = models({
        'collections/cozy-slashers': collection({ heroImageAlt: null }),
        'movies/black-christmas': movie({ seoDescription: '  ' }),
      });
      const error = await generateStatic({ assets: TEST_ASSETS, env, outDir: dir, fetch: fakeFetch(bad, lists) }).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PublicationValidationError);
      expect((error as Error).message).toContain('collection "cozy-slashers": heroImageAlt (missing)');
      expect((error as Error).message).toContain('movie "black-christmas": seoDescription (missing)');
      expect((await readdir(dir)).sort()).toEqual(['movies', 'sitemap.xml']);
      expect(await readFile(path.join(dir, 'movies/old/index.html'), 'utf8')).toBe('previous build');
      expect(await readFile(path.join(dir, 'sitemap.xml'), 'utf8')).toBe('previous sitemap');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('a failing run does not even create a missing output directory', async () => {
    const dir = path.join(await mkdtemp(path.join(tmpdir(), 'val-none-')), 'out');
    try {
      await expect(
        generateStatic({ assets: TEST_ASSETS, env, outDir: dir, fetch: fakeFetch(models({ 'products/mug': product({ seoTitle: '' }) }), lists) }),
      ).rejects.toThrow(/product "mug": seoTitle/);
      await expect(readdir(dir)).rejects.toThrow();
    } finally {
      await rm(path.dirname(dir), { recursive: true, force: true });
    }
  });
});
