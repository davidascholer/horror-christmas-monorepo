// @vitest-environment node
/**
 * Build data retrieval tests (Task 6.1). A fake fetch is injected; there is no
 * real network access. Page models are minimal stand-ins cast to the contract
 * types, because only routing and error handling are under test.
 */
import { describe, it, expect } from 'vitest';
import {
  fetchBuildData,
  readApiBaseUrl,
  BuildDataError,
} from './fetch-build-data';

const BASE = 'http://api.test';
const TYPES = ['collections', 'movies', 'characters', 'products'] as const;

type Lists = Record<(typeof TYPES)[number], string[]>;

const EMPTY_HOME = { featuredCollections: [], seasonalCollections: [], featuredMovie: null, featuredCharacter: null, giftCollection: null };

interface FakeOptions {
  lists: Lists;
  /** path -> status override for detail routes (e.g. 404 or 500) */
  detailStatus?: Record<string, number>;
  /** path -> status override for /build routes */
  listStatus?: Record<string, number>;
  /** throw (network error) for this path */
  throwOn?: string;
  /** Body of GET /home (default: a valid empty projection) and its status. */
  home?: unknown;
  homeStatus?: number;
  delayMs?: number;
}

function makeFake(opts: FakeOptions) {
  const requested: string[] = [];
  let inFlight = 0;
  let maxInFlight = 0;

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  const fake = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const path = url.slice(BASE.length);
    requested.push(path);
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    try {
      if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
      if (path === opts.throwOn) throw new TypeError('connect ECONNREFUSED');
      if (path === '/home') {
        if (opts.homeStatus) return json({ error: 'x' }, opts.homeStatus);
        return json(opts.home ?? EMPTY_HOME);
      }
      const listMatch = /^\/build\/(\w+)$/.exec(path);
      if (listMatch) {
        const status = opts.listStatus?.[path];
        if (status) return json({ error: 'x' }, status);
        return json(opts.lists[listMatch[1] as keyof Lists].map((slug) => ({ slug, updatedAt: '2026-01-01T00:00:00.000Z' })));
      }
      const detailStatus = opts.detailStatus?.[path];
      if (detailStatus) return json({ error: { code: 'X', message: 'x' } }, detailStatus);
      const m = /^\/(\w+)\/([^/]+)$/.exec(path);
      return json({ slug: decodeURIComponent(m![2]), kind: m![1] });
    } finally {
      inFlight--;
    }
  }) as typeof fetch;

  return { fake, requested, maxInFlight: () => maxInFlight };
}

const lists = (over: Partial<Lists> = {}): Lists => ({
  collections: ['c-a', 'c-b'],
  movies: ['m-a'],
  characters: ['ch-a'],
  products: ['p-a', 'p-b'],
  ...over,
});

describe('fetchBuildData', () => {
  it('retrieves every page model per entity type from the matching detail route', async () => {
    const f = makeFake({ lists: lists() });
    const data = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake });

    expect(data.collections.map((m) => (m as unknown as { slug: string }).slug)).toEqual(['c-a', 'c-b']);
    expect(data.movies).toHaveLength(1);
    expect(data.characters).toHaveLength(1);
    expect(data.products).toHaveLength(2);
    expect((data.products[1] as unknown as { kind: string }).kind).toBe('products');
    expect(data.warnings).toEqual([]);
    expect(f.requested).toContain('/collections/c-a');
    expect(f.requested).toContain('/movies/m-a');
    expect(f.requested).toContain('/characters/ch-a');
    expect(f.requested).toContain('/products/p-b');
  });

  it('requests only /home, the four /build lists and the slugs they return', async () => {
    const f = makeFake({ lists: lists({ collections: ['only-one'], movies: [], characters: [], products: [] }) });
    await fetchBuildData({ apiBaseUrl: `${BASE}///`, fetch: f.fake });
    expect([...f.requested].sort()).toEqual(
      ['/build/characters', '/build/collections', '/build/movies', '/build/products', '/collections/only-one', '/home'].sort(),
    );
  });

  it('returns empty results when nothing is published', async () => {
    const f = makeFake({ lists: { collections: [], movies: [], characters: [], products: [] } });
    const data = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake });
    expect(data).toEqual({
      collections: [], movies: [], characters: [], products: [], home: EMPTY_HOME,
      updatedAt: { collections: new Map(), movies: new Map(), characters: new Map(), products: new Map() },
      warnings: [],
    });
  });

  it('preserves the /build updatedAt per slug, and drops it for slugs skipped on 404', async () => {
    const f = makeFake({ lists: lists({ collections: ['c-a', 'c-b'] }), detailStatus: { '/collections/c-b': 404 } });
    const data = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake });
    expect(data.updatedAt.collections).toEqual(new Map([['c-a', '2026-01-01T00:00:00.000Z']]));
    expect(data.updatedAt.movies.get('m-a')).toBe('2026-01-01T00:00:00.000Z');
    expect(data.updatedAt.products.size).toBe(2);
  });
  it('treats a non-string updatedAt as absent', async () => {
    const fake = (async (input: RequestInfo | URL) => {
      const path = String(input).slice(BASE.length);
      if (path === '/home') return new Response(JSON.stringify(EMPTY_HOME));
      if (path === '/build/movies') return new Response(JSON.stringify([{ slug: 'm', updatedAt: 5 }]));
      if (path.startsWith('/build/')) return new Response('[]');
      return new Response(JSON.stringify({ slug: 'm' }));
    }) as typeof fetch;
    const data = await fetchBuildData({ apiBaseUrl: BASE, fetch: fake });
    expect(data.movies).toHaveLength(1);
    expect(data.updatedAt.movies.size).toBe(0);
  });
  it('percent-encodes slugs in detail URLs', async () => {
    const f = makeFake({ lists: lists({ collections: ['a b'], movies: [], characters: [], products: [] }) });
    const data = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake });
    expect(f.requested).toContain('/collections/a%20b');
    expect(data.collections).toHaveLength(1);
  });

  it('bounds concurrent detail requests to the configured limit', async () => {
    const many = Array.from({ length: 30 }, (_, i) => `x-${i}`);
    let current = 0;
    let max = 0;
    const base = makeFake({ lists: lists({ collections: [], movies: many, characters: [], products: [] }) });
    const fake = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const isDetail = !String(input).includes('/build/') && !String(input).endsWith('/home');
      if (isDetail) {
        current++;
        max = Math.max(max, current);
        await new Promise((r) => setTimeout(r, 3));
      }
      try {
        return await base.fake(input, init);
      } finally {
        if (isDetail) current--;
      }
    }) as typeof fetch;
    await fetchBuildData({ apiBaseUrl: BASE, fetch: fake, concurrency: 5 });
    expect(max).toBe(5);
  });

  it('fails with the URL and status when a /build list is not OK', async () => {
    const f = makeFake({ lists: lists(), listStatus: { '/build/movies': 503 } });
    const err = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake }).catch((e) => e);
    expect(err).toBeInstanceOf(BuildDataError);
    expect(err.message).toContain(`${BASE}/build/movies`);
    expect(err.message).toContain('503');
    // No page model requested after a failed discovery.
    expect(f.requested.some((p) => !p.startsWith('/build/') && p !== '/home')).toBe(false);
  });

  it('fails with the URL when a /build list has a network error', async () => {
    const f = makeFake({ lists: lists(), throwOn: '/build/products' });
    const err = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake }).catch((e) => e);
    expect(err).toBeInstanceOf(BuildDataError);
    expect(err.message).toContain(`${BASE}/build/products`);
    expect(err.message).toContain('ECONNREFUSED');
  });

  it('fails when a /build list body is not an array of { slug }', async () => {
    const fake = (async () => new Response(JSON.stringify({ nope: true }), { status: 200 })) as typeof fetch;
    await expect(fetchBuildData({ apiBaseUrl: BASE, fetch: fake })).rejects.toThrow(/not an array/);
  });

  it('warns and skips a 404 page model without failing the build', async () => {
    const f = makeFake({ lists: lists(), detailStatus: { '/movies/m-a': 404, '/products/p-a': 404 } });
    const data = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake });
    expect(data.movies).toEqual([]);
    expect(data.products).toHaveLength(1);
    expect(data.collections).toHaveLength(2);
    expect(data.warnings.map((w) => [w.entityType, w.slug])).toEqual([
      ['movie', 'm-a'],
      ['product', 'p-a'],
    ]);
    expect(data.warnings[0].message).toContain('m-a');
  });

  it('fails the build on a non-404 detail error, naming type, slug and status', async () => {
    const f = makeFake({ lists: lists(), detailStatus: { '/characters/ch-a': 500 } });
    const err = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake }).catch((e) => e);
    expect(err).toBeInstanceOf(BuildDataError);
    expect(err.message).toContain('character');
    expect(err.message).toContain('ch-a');
    expect(err.message).toContain('500');
  });

  it('fails the build on a detail network error', async () => {
    const f = makeFake({ lists: lists(), throwOn: '/collections/c-b' });
    await expect(fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake })).rejects.toThrow(/collection "c-b"/);
  });

  it('stops starting new requests after a failure', async () => {
    const many = Array.from({ length: 50 }, (_, i) => `m-${String(i).padStart(2, '0')}`);
    const f = makeFake({
      lists: lists({ collections: [], movies: many, characters: [], products: [] }),
      detailStatus: { '/movies/m-00': 500 },
      delayMs: 2,
    });
    await expect(fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake, concurrency: 2 })).rejects.toThrow(BuildDataError);
    expect(f.requested.filter((p) => p.startsWith('/movies/')).length).toBeLessThan(10);
  });

  it('rejects an invalid concurrency value', async () => {
    const f = makeFake({ lists: lists() });
    await expect(fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake, concurrency: 0 })).rejects.toThrow(/concurrency/);
  });
});

describe('fetchBuildData: GET /home (Task 7.1)', () => {
  const full = {
    featuredCollections: [{ id: 'a', slug: 'f-1', title: 'F 1', summary: null, type: 'THEME', heroImageUrl: null, featured: true, seasonal: false }],
    seasonalCollections: [],
    featuredMovie: { id: 'm', slug: 'mov', title: 'Mov', releaseYear: 1974, mediaType: 'FILM', posterUrl: null, synopsis: null },
    featuredCharacter: { id: 'c', slug: 'chr', name: 'Chr', summary: null, imageUrl: null },
    giftCollection: { id: 'g', slug: 'gift', title: 'Gift', summary: null, type: 'GIFT', heroImageUrl: null, featured: false, seasonal: false },
  };

  it('retrieves /home as part of BuildData, unchanged', async () => {
    const f = makeFake({ lists: lists(), home: full });
    const data = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake });
    expect(data.home).toEqual(full);
    expect(f.requested.filter((p) => p === '/home')).toHaveLength(1);
  });

  it('keeps only the contract keys of the response', async () => {
    const f = makeFake({ lists: lists(), home: { ...full, extra: 'not published', internal: 1 } });
    const data = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake });
    expect(Object.keys(data.home).sort()).toEqual(
      ['featuredCharacter', 'featuredCollections', 'featuredMovie', 'giftCollection', 'seasonalCollections'],
    );
  });

  it('fails the build with the URL and status when /home is not OK, and requests no page model', async () => {
    const f = makeFake({ lists: lists(), homeStatus: 500 });
    const err = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake }).catch((e) => e);
    expect(err).toBeInstanceOf(BuildDataError);
    expect(err.message).toContain(`${BASE}/home`);
    expect(err.message).toContain('500');
    expect(f.requested.some((p) => !p.startsWith('/build/') && p !== '/home')).toBe(false);
  });

  it('fails the build with the URL on a /home network error', async () => {
    const f = makeFake({ lists: lists(), throwOn: '/home' });
    const err = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake }).catch((e) => e);
    expect(err).toBeInstanceOf(BuildDataError);
    expect(err.message).toContain(`${BASE}/home`);
    expect(err.message).toContain('ECONNREFUSED');
  });

  it('fails when /home is not valid JSON', async () => {
    const fake = (async (input: RequestInfo | URL) => {
      const path = String(input).slice(BASE.length);
      return path === '/home' ? new Response('<html>oops', { status: 200 }) : new Response('[]');
    }) as typeof fetch;
    await expect(fetchBuildData({ apiBaseUrl: BASE, fetch: fake })).rejects.toThrow(/\/home is not valid JSON|Home response .*\/home is not valid JSON/);
  });

  it.each([
    ['an array', []],
    ['a string', 'home'],
    ['missing keys', {}],
    ['featuredCollections not an array', { ...full, featuredCollections: {} }],
    ['seasonalCollections not an array', { ...full, seasonalCollections: null }],
    ['a collection without a slug', { ...full, featuredCollections: [{ title: 'No slug' }] }],
    ['a collection with an empty slug', { ...full, seasonalCollections: [{ slug: '', title: 'x' }] }],
    ['a collection without a title', { ...full, featuredCollections: [{ slug: 'x' }] }],
    ['featuredMovie undefined (key missing)', { ...full, featuredMovie: undefined }],
    ['featuredMovie a string', { ...full, featuredMovie: 'krampus' }],
    ['featuredCharacter without a name', { ...full, featuredCharacter: { slug: 'x' } }],
    ['giftCollection an array', { ...full, giftCollection: [] }],
  ])('fails the build on a malformed body: %s', async (_name, home) => {
    const f = makeFake({ lists: lists(), home });
    const err = await fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake }).catch((e) => e);
    expect(err).toBeInstanceOf(BuildDataError);
    expect(err.message).toContain(`${BASE}/home`);
    expect(err.message).toMatch(/not a valid homepage projection/);
  });

  it('accepts null for the three optional values and empty arrays', async () => {
    const f = makeFake({ lists: lists(), home: EMPTY_HOME });
    await expect(fetchBuildData({ apiBaseUrl: BASE, fetch: f.fake })).resolves.toMatchObject({ home: EMPTY_HOME });
  });
});

describe('readApiBaseUrl', () => {
  it('returns the trimmed API_BASE_URL', () => {
    expect(readApiBaseUrl({ API_BASE_URL: ' http://localhost:3000 ' })).toBe('http://localhost:3000');
  });

  it('throws a clear error when unset or blank (no default host)', () => {
    expect(() => readApiBaseUrl({})).toThrow(/API_BASE_URL is not set/);
    expect(() => readApiBaseUrl({ API_BASE_URL: '  ' })).toThrow(/API_BASE_URL is not set/);
  });
});
