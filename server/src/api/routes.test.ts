/**
 * API contract tests (Task 4.4)
 *
 * No HTTP framework is selected yet, so the contract is verified at the
 * service layer through the framework-neutral route table in ./routes.ts.
 * Covers: every method/path, optional query parameters (incl. the movie
 * pagination default 50 / maximum 200), status behavior (200/404/400),
 * serialized response shape against api-contracts.ts, the public content
 * boundary (DRAFT/ARCHIVED never leak) and decimal-safe product prices.
 *
 * Self-contained: fixture rows share a unique slug prefix and are removed in
 * afterAll. Boundary checks additionally sweep the whole database (seed data
 * included) read-only.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Prisma } from '@prisma/client';
import { HomeService } from '../services/home.service.js';
import { CollectionService } from '../services/collection.service.js';
import { MovieService, DEFAULT_MOVIE_PAGE_SIZE, MAX_MOVIE_PAGE_SIZE } from '../services/movie.service.js';
import { CharacterService } from '../services/character.service.js';
import { ProductService } from '../services/product.service.js';
import { SearchService } from '../services/search.service.js';
import { BuildService } from '../services/build.service.js';
import { createCatalogFixture, CatalogFixture, ISO_8601 } from '../services/test-fixtures.js';
import { routes, findRoute, dispatch, ApiServices, RouteResult, RawQuery } from './routes.js';
import type {
  HomeResponse,
  CollectionSummary,
  Collection,
  CollectionDetail,
  CollectionMovie,
  CollectionCharacter,
  CollectionProduct,
  RelatedCollection,
  MovieSummary,
  Movie,
  MovieDetail,
  MovieCharacter,
  CharacterSummary,
  Character,
  CharacterDetail,
  ProductSummary,
  Product,
  ProductDetail,
  ProductCharacter,
  AffiliateLink,
  FranchiseSummary,
  TagSummary,
} from '../types/api-contracts.js';

const prisma = new PrismaClient();
const services: ApiServices = {
  home: new HomeService(prisma),
  collections: new CollectionService(prisma),
  movies: new MovieService(prisma),
  characters: new CharacterService(prisma),
  products: new ProductService(prisma),
  search: new SearchService(prisma),
  build: new BuildService(prisma),
};

let fx: CatalogFixture;
let bulkToken: string;
let extra: { priceTrailingZero: string; priceLarge: string; productArchived: string; collectionArchived: string; characterArchived: string; characterDraftFeatured: string; movieDraftFeatured: string };

const get = (path: string, query: RawQuery = {}) => dispatch(services, 'GET', path, query);
const wire = <T = any>(r: RouteResult): T => JSON.parse(JSON.stringify(r.body)) as T;
const ks = (o: object) => Object.keys(o).sort();

// ---------------------------------------------------------------------------
// Compile-time checked key sets: `satisfies Record<keyof T, true>` fails to
// compile when a contract field is missing or an unknown one is added.
// ---------------------------------------------------------------------------
const COLLECTION_SUMMARY = ks({ id: true, slug: true, title: true, summary: true, type: true, heroImageUrl: true, featured: true, seasonal: true } satisfies Record<keyof CollectionSummary, true>);
const MOVIE_SUMMARY = ks({ id: true, slug: true, title: true, releaseYear: true, mediaType: true, posterUrl: true, synopsis: true } satisfies Record<keyof MovieSummary, true>);
const CHARACTER_SUMMARY = ks({ id: true, slug: true, name: true, summary: true, imageUrl: true } satisfies Record<keyof CharacterSummary, true>);
const PRODUCT_SUMMARY = ks({ id: true, slug: true, name: true, description: true, imageUrl: true, price: true, currency: true, category: true } satisfies Record<keyof ProductSummary, true>);
const FRANCHISE_SUMMARY = ks({ id: true, slug: true, name: true } satisfies Record<keyof FranchiseSummary, true>);
const TAG_SUMMARY = ks({ id: true, slug: true, name: true } satisfies Record<keyof TagSummary, true>);
const AFFILIATE_LINK = ks({ id: true, provider: true, url: true, productId: true } satisfies Record<keyof AffiliateLink, true>);

const COLLECTION_FIELDS = { id: true, slug: true, title: true, type: true, introduction: true, curatorNotes: true, summary: true, heroImageUrl: true, heroImageAlt: true, seoTitle: true, seoDescription: true, featured: true, seasonal: true, publishedAt: true, createdAt: true, updatedAt: true } satisfies Record<keyof Collection, true>;
const MOVIE_FIELDS = { id: true, slug: true, title: true, originalTitle: true, mediaType: true, releaseYear: true, releaseDate: true, runtime: true, synopsis: true, posterUrl: true, heroImageUrl: true, trailerUrl: true, seoTitle: true, seoDescription: true, featured: true, franchise: true, publishedAt: true, createdAt: true, updatedAt: true } satisfies Record<keyof Movie, true>;
const CHARACTER_FIELDS = { id: true, slug: true, name: true, summary: true, biography: true, imageUrl: true, seoTitle: true, seoDescription: true, featured: true, franchise: true, publishedAt: true, createdAt: true, updatedAt: true } satisfies Record<keyof Character, true>;
const PRODUCT_FIELDS = { id: true, slug: true, name: true, description: true, category: true, imageUrl: true, imageAlt: true, price: true, currency: true, seoTitle: true, seoDescription: true, featured: true, franchise: true, affiliateLinks: true, publishedAt: true, createdAt: true, updatedAt: true } satisfies Record<keyof Product, true>;

const COLLECTION_DETAIL = ks({ ...COLLECTION_FIELDS, movies: true, characters: true, products: true, franchises: true, tags: true, relatedCollections: true } satisfies Record<keyof CollectionDetail, true>);
const MOVIE_DETAIL = ks({ ...MOVIE_FIELDS, characters: true, collections: true, tags: true, relatedProducts: true } satisfies Record<keyof MovieDetail, true>);
const CHARACTER_DETAIL = ks({ ...CHARACTER_FIELDS, movies: true, products: true, collections: true, tags: true } satisfies Record<keyof CharacterDetail, true>);
const PRODUCT_DETAIL = ks({ ...PRODUCT_FIELDS, characters: true, collections: true, tags: true } satisfies Record<keyof ProductDetail, true>);

const COLLECTION_MOVIE = ks({ movie: true, sortOrder: true, curatorNote: true } satisfies Record<keyof CollectionMovie, true>);
const COLLECTION_CHARACTER = ks({ character: true, sortOrder: true, curatorNote: true } satisfies Record<keyof CollectionCharacter, true>);
const COLLECTION_PRODUCT = ks({ product: true, sortOrder: true, curatorNote: true } satisfies Record<keyof CollectionProduct, true>);
const RELATED_COLLECTION = ks({ collection: true, sortOrder: true } satisfies Record<keyof RelatedCollection, true>);
const MOVIE_CHARACTER = ks({ character: true, role: true, sortOrder: true } satisfies Record<keyof MovieCharacter, true>);
const PRODUCT_CHARACTER = ks({ character: true, sortOrder: true } satisfies Record<keyof ProductCharacter, true>);

const HOME = ks({ featuredCollections: true, seasonalCollections: true, featuredMovie: true, featuredCharacter: true, giftCollection: true } satisfies Record<keyof HomeResponse, true>);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Every object in a payload must have exactly `keys` (null, never missing). */
function expectKeys(obj: object, keys: string[]) {
  expect(ks(obj)).toEqual(keys);
}

/** Fails if a raw (pre-JSON) body holds anything JSON would silently alter. */
function assertWireSafe(value: unknown, path = '$'): void {
  if (value === undefined) throw new Error(`undefined at ${path} (must be null)`);
  if (value === null) return;
  if (value instanceof Date) throw new Error(`Date instance at ${path} (must be an ISO string)`);
  if (typeof value === 'bigint') throw new Error(`bigint at ${path}`);
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`non-finite number at ${path}`);
  if (Array.isArray(value)) return value.forEach((v, i) => assertWireSafe(v, `${path}[${i}]`));
  if (typeof value === 'object') {
    if (typeof (value as { toFixed?: unknown }).toFixed === 'function') throw new Error(`Decimal object at ${path}`);
    if (Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`non-plain object at ${path}`);
    for (const [k, v] of Object.entries(value)) assertWireSafe(v, `${path}.${k}`);
  }
}

function collectBy(value: unknown, key: string, out: unknown[] = []): unknown[] {
  if (Array.isArray(value)) value.forEach((v) => collectBy(v, key, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === key) out.push(v);
      collectBy(v, key, out);
    }
  }
  return out;
}

const PRICE = /^\d+\.\d{2}$/;
const CURRENCY = /^[A-Z]{3}$/;

beforeAll(async () => {
  fx = await createCatalogFixture(prisma, 'api');
  const p = fx.prefix;
  const publishedAt = new Date('2026-11-02T12:00:00.000Z');

  const main = await prisma.collection.findUniqueOrThrow({ where: { slug: fx.slugs.collection } });
  const movieOld = await prisma.movie.findUniqueOrThrow({ where: { slug: fx.slugs.movieOld } });
  const movieArchived = await prisma.movie.findUniqueOrThrow({ where: { slug: fx.slugs.movieArchived } });
  const charA = await prisma.character.findUniqueOrThrow({ where: { slug: fx.slugs.characterA } });

  // ARCHIVED / featured-DRAFT rows, all linked into published parents.
  const colArchived = await prisma.collection.create({
    data: { slug: `${p}collection-archived`, title: `${fx.token} Archived Col`, type: 'GIFT', introduction: 'i', curatorNotes: 'n', status: 'ARCHIVED', featured: true, seasonal: true, publishedAt },
  });
  const charArchived = await prisma.character.create({
    data: { slug: `${p}character-archived`, name: `${fx.token} Archived Char`, status: 'ARCHIVED', featured: true },
  });
  const charDraftFeatured = await prisma.character.create({
    data: { slug: `${p}character-draft-featured`, name: `${fx.token} Draft Featured Char`, status: 'DRAFT', featured: true },
  });
  const movieDraftFeatured = await prisma.movie.create({
    data: { slug: `${p}movie-draft-featured`, title: `${fx.token} Draft Featured Movie`, status: 'DRAFT', featured: true },
  });
  const productArchived = await prisma.product.create({
    data: { slug: `${p}product-archived`, name: `${fx.token} Archived Product`, status: 'ARCHIVED', price: new Prisma.Decimal('5.00'), currency: 'USD' },
  });
  // Published products with awkward decimals for the price tests.
  const priceTrailingZero = await prisma.product.create({
    data: { slug: `${p}product-ten-cents`, name: `${fx.token} Ten Cents`, status: 'PUBLISHED', price: new Prisma.Decimal('0.10'), currency: 'USD', publishedAt },
  });
  const priceLarge = await prisma.product.create({
    data: { slug: `${p}product-large`, name: `${fx.token} Large`, status: 'PUBLISHED', price: new Prisma.Decimal('1234567.89'), currency: 'EUR', publishedAt },
  });

  await prisma.collectionMovie.createMany({
    data: [
      { collectionId: main.id, movieId: movieArchived.id, sortOrder: 91 },
      { collectionId: colArchived.id, movieId: movieOld.id, sortOrder: 1 },
    ],
  });
  await prisma.collectionCharacter.createMany({
    data: [
      { collectionId: main.id, characterId: charArchived.id, sortOrder: 91 },
      { collectionId: main.id, characterId: charDraftFeatured.id, sortOrder: 92 },
    ],
  });
  await prisma.collectionProduct.createMany({
    data: [
      { collectionId: main.id, productId: productArchived.id, sortOrder: 91 },
      { collectionId: main.id, productId: priceTrailingZero.id, sortOrder: 92 },
      { collectionId: main.id, productId: priceLarge.id, sortOrder: 93 },
    ],
  });
  await prisma.collectionRelated.create({
    data: { sourceCollectionId: main.id, targetCollectionId: colArchived.id, sortOrder: 91 },
  });
  await prisma.movieCharacter.createMany({
    data: [
      { movieId: movieOld.id, characterId: charArchived.id, sortOrder: 91 },
      { movieId: movieDraftFeatured.id, characterId: charA.id, sortOrder: 1 },
    ],
  });
  await prisma.productCharacter.createMany({
    data: [
      { productId: productArchived.id, characterId: charA.id, sortOrder: 91 },
      { productId: priceTrailingZero.id, characterId: charA.id, sortOrder: 92 },
      { productId: priceLarge.id, characterId: charA.id, sortOrder: 93 },
    ],
  });

  // 52 published movies to exercise the default page size of 50.
  bulkToken = `${fx.token}bulk`;
  await prisma.movie.createMany({
    data: Array.from({ length: 52 }, (_, i) => ({
      slug: `${p}bulk-${String(i).padStart(2, '0')}`,
      title: `${bulkToken} ${String(i).padStart(2, '0')}`,
      status: 'PUBLISHED' as const,
      releaseYear: 1990,
    })),
  });

  extra = {
    priceTrailingZero: priceTrailingZero.slug,
    priceLarge: priceLarge.slug,
    productArchived: productArchived.slug,
    collectionArchived: colArchived.slug,
    characterArchived: charArchived.slug,
    characterDraftFeatured: charDraftFeatured.slug,
    movieDraftFeatured: movieDraftFeatured.slug,
  };
});

afterAll(async () => {
  await fx.cleanup();
  await prisma.$disconnect();
});

// ===========================================================================
// 1. Route table: every method/path
// ===========================================================================
describe('route table', () => {
  const EXPECTED = [
    'GET /home',
    'GET /collections',
    'GET /collections/:slug',
    'GET /collections/:slug/movies',
    'GET /collections/:slug/characters',
    'GET /collections/:slug/products',
    'GET /collections/:slug/related',
    'GET /movies',
    'GET /movies/:slug',
    'GET /movies/:slug/collections',
    'GET /characters',
    'GET /characters/:slug',
    'GET /search',
    'GET /products',
    'GET /products/:slug',
    'GET /build/collections',
    'GET /build/movies',
    'GET /build/characters',
    'GET /build/products',
  ];

  it('contains exactly the Design 4.2-4.5 routes that exist so far', () => {
    expect(routes.map((r) => `${r.method} ${r.path}`)).toEqual(EXPECTED);
  });

  it('has no watchlist routes yet (later phase)', () => {
    expect(routes.some((r) => /watchlist/.test(r.path))).toBe(false);
  });

  it('declares only the optional query parameters from the design', () => {
    const q = Object.fromEntries(routes.map((r) => [`${r.method} ${r.path}`, [...r.queryParams]]));
    expect(q['GET /collections']).toEqual(['featured', 'seasonal', 'type']);
    expect(q['GET /movies']).toEqual(['q', 'year', 'genre', 'page', 'pageSize']);
    expect(q['GET /search']).toEqual(['q']);
    const others = EXPECTED.filter((e) => !['GET /collections', 'GET /movies', 'GET /search'].includes(e));
    for (const e of others) expect(q[e]).toEqual([]);
  });

  it('declares statuses: lists 200, slug routes 200/404, filtered lists 200/400', () => {
    for (const r of routes) {
      // /search takes a free-text q that can never be invalid: always 200.
      const expected = r.path.includes(':slug')
        ? [200, 404]
        : r.queryParams.length && r.path !== '/search'
          ? [200, 400]
          : [200];
      expect([...r.statuses]).toEqual(expected);
    }
  });

  it('uses slugs only in public paths (no internal IDs)', () => {
    for (const r of routes) {
      const params = r.path.split('/').filter((s) => s.startsWith(':'));
      for (const param of params) expect(param).toBe(':slug');
      expect(r.path).not.toMatch(/id/i);
    }
  });

  it('resolves paths to routes and slug params', () => {
    expect(findRoute('GET', '/home')?.route.path).toBe('/home');
    expect(findRoute('get', '/collections/abc/related')).toMatchObject({ params: { slug: 'abc' } });
    expect(findRoute('GET', '/movies/a%20b')?.params).toEqual({ slug: 'a b' });
    for (const [m, p] of [['POST', '/movies'], ['GET', '/movies/'], ['GET', '/nope'], ['GET', '/movies/a/b'], ['GET', '/movies/%E0%A4%A']] as const) {
      expect(findRoute(m, p)).toBeNull();
    }
    expect(findRoute('GET', '/search')?.route.path).toBe('/search');
    expect(findRoute('POST', '/search')).toBeNull();
    expect(findRoute('POST', '/watchlists')).toBeNull();
  });

  it('dispatch returns 404 for an unknown route', async () => {
    expect((await get('/nope')).status).toBe(404);
  });
});

describe('GET /search', () => {
  it('returns 200 with exact SearchResult fields for a matching published record', async () => {
    const r = await get('/search', { q: fx.token });
    expect(r.status).toBe(200);
    const results = wire<{ type: string; id: string; slug: string; title: string; summary: string }[]>(r);
    const own = results.filter((x) => x.slug.startsWith(fx.prefix));
    expect(own.length).toBeGreaterThan(0);
    for (const x of own) expect(ks(x)).toEqual(['id', 'slug', 'summary', 'title', 'type']);
    expect(own.some((x) => x.slug === fx.slugs.collectionDraft)).toBe(false);
  });

  it('returns 200 with [] for missing, empty and whitespace-only q', async () => {
    for (const q of [{}, { q: '' }, { q: '   ' }, { q: '\t\n' }]) {
      const r = await get('/search', q);
      expect(r).toEqual({ status: 200, body: [] });
    }
  });

  it('returns 200 (not 500) for malformed tsquery-style input', async () => {
    for (const q of ["'", '"', 'a & | !', "x'; DROP TABLE \"Movie\"; --", '(((', ':*']) {
      const r = await get('/search', { q });
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body)).toBe(true);
    }
  });
});

// ===========================================================================
// 2. Status behavior
// ===========================================================================
describe('status behavior', () => {
  const slugRoutes = (s: CatalogFixture['slugs']) => [
    ['collections', s.collection, ['', '/movies', '/characters', '/products', '/related'], [s.collectionDraft]],
    ['movies', s.movieOld, ['', '/collections'], [s.movieDraft, s.movieArchived]],
    ['characters', s.characterA, [''], [s.characterDraft]],
    ['products', s.productPriced, [''], [s.productDraft]],
  ] as const;

  it('returns 200 with data for published slugs on every slug route', async () => {
    for (const [base, slug, suffixes] of slugRoutes(fx.slugs)) {
      for (const suffix of suffixes) {
        const r = await get(`/${base}/${slug}${suffix}`);
        expect(r.status, `/${base}/${slug}${suffix}`).toBe(200);
        expect(r.body).not.toBeNull();
      }
    }
  });

  it('returns 404 for missing, DRAFT and ARCHIVED slugs on every slug route', async () => {
    const archived = {
      collections: extra.collectionArchived,
      characters: extra.characterArchived,
      products: extra.productArchived,
      movies: fx.slugs.movieArchived,
    } as const;
    for (const [base, , suffixes, drafts] of slugRoutes(fx.slugs)) {
      const missing = [`${fx.prefix}does-not-exist`, ...drafts, archived[base]];
      for (const slug of missing) {
        for (const suffix of suffixes) {
          const r = await get(`/${base}/${slug}${suffix}`);
          expect(r.status, `/${base}/${slug}${suffix}`).toBe(404);
          expect(r.body).toEqual({ error: { code: 'NOT_FOUND', message: expect.any(String) } });
        }
      }
    }
  });

  it('returns 200 with an empty JSON array for a published collection with no items', async () => {
    const r = await get(`/collections/${fx.slugs.collectionEmpty}/movies`);
    expect(r.status).toBe(200);
    expect(wire(r)).toEqual({ movies: [] });
  });

  it('list routes always return 200', async () => {
    for (const path of ['/collections', '/movies', '/characters', '/products']) {
      expect((await get(path)).status).toBe(200);
    }
    expect((await get('/home')).status).toBe(200);
    expect((await get('/movies', { q: `${fx.token}-no-such-movie` })).body).toEqual([]);
  });
});

// ===========================================================================
// 3. Optional query parameters
// ===========================================================================
describe('GET /collections query parameters', () => {
  const own = (r: RouteResult) => (r.body as CollectionSummary[]).map((c) => c.slug).filter((s) => s.startsWith(fx.prefix));

  it('featured / seasonal / type filter published collections', async () => {
    expect(own(await get('/collections', { featured: 'true' }))).toEqual([fx.slugs.collection]);
    expect(own(await get('/collections', { seasonal: 'true' }))).toEqual([fx.slugs.collectionGift]);
    expect(own(await get('/collections', { type: 'CHARACTER' }))).toEqual([fx.slugs.collectionCharacter]);
    const notFeatured = own(await get('/collections', { featured: 'false' }));
    expect(notFeatured).not.toContain(fx.slugs.collection);
    expect(notFeatured).toContain(fx.slugs.collectionGift);
  });

  it('combines filters', async () => {
    expect(own(await get('/collections', { seasonal: 'true', type: 'GIFT' }))).toEqual([fx.slugs.collectionGift]);
    expect(own(await get('/collections', { seasonal: 'true', type: 'CHARACTER' }))).toEqual([]);
  });

  it('maps invalid values to 400', async () => {
    for (const query of [{ featured: 'yes' }, { featured: '1' }, { seasonal: 'TRUE' }, { type: 'BOGUS' }, { type: 'theme' }]) {
      const r = await get('/collections', query);
      expect(r.status, JSON.stringify(query)).toBe(400);
      expect(r.body).toEqual({ error: { code: 'BAD_REQUEST', message: expect.any(String) } });
    }
  });

  it('ignores unknown parameters', async () => {
    expect((await get('/collections', { bogus: 'x' })).status).toBe(200);
  });
});

describe('GET /movies query parameters', () => {
  const slugs = (r: RouteResult) => (r.body as MovieSummary[]).map((m) => m.slug);

  it('q filters by case-insensitive substring', async () => {
    expect(slugs(await get('/movies', { q: `${fx.token} SPECIAL` }))).toEqual([fx.slugs.movieSpecial]);
  });

  it('year filters by release year (published only)', async () => {
    expect(slugs(await get('/movies', { q: fx.token, year: '1984' }))).toEqual([fx.slugs.movieOld]);
  });

  it('genre filters by tag slug', async () => {
    expect(slugs(await get('/movies', { genre: fx.slugs.tagAlpha }))).toEqual([fx.slugs.movieOld]);
  });

  it('page and pageSize page through results without overlap', async () => {
    const q = { q: fx.token, pageSize: '1' };
    const p1 = slugs(await get('/movies', { ...q, page: '1' }));
    const p2 = slugs(await get('/movies', { ...q, page: '2' }));
    expect(p1).toHaveLength(1);
    expect(p2).toHaveLength(1);
    expect(p1[0]).not.toBe(p2[0]);
    expect(slugs(await get('/movies', q))).toEqual(p1); // page defaults to 1
  });

  it('defaults pageSize to 50 when omitted (page defaults to 1)', async () => {
    expect(DEFAULT_MOVIE_PAGE_SIZE).toBe(50);
    const first = slugs(await get('/movies', { q: bulkToken }));
    const second = slugs(await get('/movies', { q: bulkToken, page: '2' }));
    expect(first).toHaveLength(50);
    expect(second).toHaveLength(2);
    expect(new Set([...first, ...second]).size).toBe(52);
    // Unfiltered list is bounded too (the database holds more than 50 published movies)
    expect(slugs(await get('/movies'))).toHaveLength(50);
  });

  it('accepts pageSize up to the maximum of 200', async () => {
    expect(MAX_MOVIE_PAGE_SIZE).toBe(200);
    const r = await get('/movies', { q: bulkToken, pageSize: '200' });
    expect(r.status).toBe(200);
    expect(slugs(r)).toHaveLength(52);
    expect((await get('/movies', { pageSize: '200' })).status).toBe(200);
  });

  it('rejects pageSize above 200 with 400 instead of clamping', async () => {
    for (const pageSize of ['201', '1000', '100000']) {
      const r = await get('/movies', { q: bulkToken, pageSize });
      expect(r.status, pageSize).toBe(400);
      expect(r.body).toEqual({ error: { code: 'BAD_REQUEST', message: expect.stringContaining('200') } });
    }
  });

  it('maps invalid page, pageSize and year to 400', async () => {
    const bad = [
      { page: '0' }, { page: '-1' }, { page: '1.5' }, { page: 'abc' }, { page: '' },
      { pageSize: '0' }, { pageSize: '-5' }, { pageSize: '2.5' }, { pageSize: 'many' },
      { year: '19.84' }, { year: 'nineteen' }, { year: '' },
    ];
    for (const query of bad) {
      expect((await get('/movies', query)).status, JSON.stringify(query)).toBe(400);
    }
  });
});

// ===========================================================================
// 4. Serialized response shape
// ===========================================================================
describe('serialized response shape', () => {
  it('GET /home has exactly the HomeResponse fields, null for missing items', async () => {
    const r = await get('/home');
    assertWireSafe(r.body);
    const home = wire<HomeResponse>(r);
    expectKeys(home, HOME);
    expect(Array.isArray(home.featuredCollections)).toBe(true);
    expect(Array.isArray(home.seasonalCollections)).toBe(true);
    for (const c of [...home.featuredCollections, ...home.seasonalCollections]) expectKeys(c, COLLECTION_SUMMARY);
    if (home.featuredMovie) expectKeys(home.featuredMovie, MOVIE_SUMMARY);
    if (home.featuredCharacter) expectKeys(home.featuredCharacter, CHARACTER_SUMMARY);
    if (home.giftCollection) expectKeys(home.giftCollection, COLLECTION_SUMMARY);
  });

  it('list routes return JSON arrays of exact summary shapes', async () => {
    const checks: [string, string[]][] = [
      ['/collections', COLLECTION_SUMMARY],
      ['/movies', MOVIE_SUMMARY],
      ['/characters', CHARACTER_SUMMARY],
      ['/products', PRODUCT_SUMMARY],
    ];
    for (const [path, keys] of checks) {
      const r = await get(path);
      assertWireSafe(r.body);
      const list = wire<object[]>(r);
      expect(Array.isArray(list), path).toBe(true);
      expect(list.length, path).toBeGreaterThan(0);
      for (const item of list) expectKeys(item, keys);
    }
  });

  it('collection detail has Collection fields plus all relationships, ISO-8601 timestamps, null optionals', async () => {
    const r = await get(`/collections/${fx.slugs.collection}`);
    assertWireSafe(r.body);
    const c = wire<CollectionDetail>(r);
    expectKeys(c, COLLECTION_DETAIL);
    expect(c.publishedAt).toBe('2026-11-01T12:00:00.000Z');
    expect(c.createdAt).toMatch(ISO_8601);
    expect(c.updatedAt).toMatch(ISO_8601);
    expect(c.seoTitle).toBeNull();
    expect(c.seoDescription).toBeNull();
    for (const x of c.movies) { expectKeys(x, COLLECTION_MOVIE); expectKeys(x.movie, MOVIE_SUMMARY); }
    for (const x of c.characters) { expectKeys(x, COLLECTION_CHARACTER); expectKeys(x.character, CHARACTER_SUMMARY); }
    for (const x of c.products) { expectKeys(x, COLLECTION_PRODUCT); expectKeys(x.product, PRODUCT_SUMMARY); }
    for (const x of c.relatedCollections) { expectKeys(x, RELATED_COLLECTION); expectKeys(x.collection, COLLECTION_SUMMARY); }
    for (const x of c.franchises) { expectKeys(x, ks({ franchise: true, sortOrder: true })); expectKeys(x.franchise, FRANCHISE_SUMMARY); }
    for (const x of c.tags) expectKeys(x, TAG_SUMMARY);
    expect(c.movies.find((m) => m.curatorNote === null)).toBeDefined();
  });

  it('collection sub-routes wrap lists in the documented response objects', async () => {
    const base = `/collections/${fx.slugs.collection}`;
    const m = wire(await get(`${base}/movies`));
    const ch = wire(await get(`${base}/characters`));
    const p = wire(await get(`${base}/products`));
    const rel = wire(await get(`${base}/related`));
    expectKeys(m, ['movies']);
    expectKeys(ch, ['characters']);
    expectKeys(p, ['products']);
    expectKeys(rel, ['related']);
    expect(m.movies.length).toBeGreaterThan(0);
    for (const x of m.movies) expectKeys(x, COLLECTION_MOVIE);
    for (const x of ch.characters) expectKeys(x, COLLECTION_CHARACTER);
    for (const x of p.products) expectKeys(x, COLLECTION_PRODUCT);
    for (const x of rel.related) expectKeys(x, RELATED_COLLECTION);
    for (const r of [m, ch, p, rel]) assertWireSafe(r);
  });

  it('movie detail has Movie fields plus relationships; ISO-8601 dates; null optionals', async () => {
    const full = wire<MovieDetail>(await get(`/movies/${fx.slugs.movieOld}`));
    expectKeys(full, MOVIE_DETAIL);
    expect(full.releaseDate).toBe('1984-12-07T00:00:00.000Z');
    expect(full.publishedAt).toBe('2026-11-01T12:00:00.000Z');
    expect(full.createdAt).toMatch(ISO_8601);
    expect(full.updatedAt).toMatch(ISO_8601);
    expect(full.franchise).not.toBeNull();
    expectKeys(full.franchise!, FRANCHISE_SUMMARY);
    for (const x of full.characters) { expectKeys(x, MOVIE_CHARACTER); expectKeys(x.character, CHARACTER_SUMMARY); }
    for (const x of full.collections) expectKeys(x, COLLECTION_SUMMARY);
    for (const x of full.tags) expectKeys(x, TAG_SUMMARY);
    for (const x of full.relatedProducts) expectKeys(x, PRODUCT_SUMMARY);

    const sparseResult = await get(`/movies/${fx.slugs.movieSpecial}`);
    assertWireSafe(sparseResult.body);
    const sparse = wire<MovieDetail>(sparseResult);
    expectKeys(sparse, MOVIE_DETAIL);
    for (const k of ['originalTitle', 'releaseDate', 'runtime', 'synopsis', 'posterUrl', 'heroImageUrl', 'trailerUrl', 'seoTitle', 'seoDescription', 'franchise', 'publishedAt'] as const) {
      expect(sparse[k], k).toBeNull();
    }
  });

  it('GET /movies/:slug/collections wraps the list', async () => {
    const r = await get(`/movies/${fx.slugs.movieOld}/collections`);
    assertWireSafe(r.body);
    const body = wire(r);
    expectKeys(body, ['collections']);
    expect(Array.isArray(body.collections)).toBe(true);
    for (const c of body.collections) expectKeys(c, COLLECTION_SUMMARY);
  });

  it('character detail has Character fields plus relationships', async () => {
    const r = await get(`/characters/${fx.slugs.characterA}`);
    assertWireSafe(r.body);
    const c = wire<CharacterDetail>(r);
    expectKeys(c, CHARACTER_DETAIL);
    expect(c.createdAt).toMatch(ISO_8601);
    expect(c.publishedAt).toBe('2026-11-01T12:00:00.000Z');
    expect(c.imageUrl).toBeNull();
    expect(c.seoTitle).toBeNull();
    for (const x of c.movies) expectKeys(x, MOVIE_SUMMARY);
    for (const x of c.products) expectKeys(x, PRODUCT_SUMMARY);
    for (const x of c.collections) expectKeys(x, COLLECTION_SUMMARY);
    for (const x of c.tags) expectKeys(x, TAG_SUMMARY);
    const sparse = wire<CharacterDetail>(await get(`/characters/${fx.slugs.characterB}`));
    expect(sparse.publishedAt).toBeNull();
    expect(sparse.biography).toBeNull();
    expect(sparse.franchise).toBeNull();
  });

  it('product detail has Product fields, affiliate links and relationships', async () => {
    const r = await get(`/products/${fx.slugs.productPriced}`);
    assertWireSafe(r.body);
    const p = wire<ProductDetail>(r);
    expectKeys(p, PRODUCT_DETAIL);
    expect(p.createdAt).toMatch(ISO_8601);
    expect(p.affiliateLinks).toHaveLength(2);
    for (const l of p.affiliateLinks) expectKeys(l, AFFILIATE_LINK);
    for (const x of p.characters) { expectKeys(x, PRODUCT_CHARACTER); expectKeys(x.character, CHARACTER_SUMMARY); }
    for (const x of p.collections) expectKeys(x, COLLECTION_SUMMARY);
    for (const x of p.tags) expectKeys(x, TAG_SUMMARY);

    const bare = wire<ProductDetail>(await get(`/products/${fx.slugs.productUnpriced}`));
    expectKeys(bare, PRODUCT_DETAIL);
    expect(bare.affiliateLinks).toEqual([]);
    for (const k of ['description', 'category', 'imageUrl', 'imageAlt', 'price', 'currency', 'seoTitle', 'seoDescription', 'franchise', 'publishedAt'] as const) {
      expect(bare[k], k).toBeNull();
    }
  });

  it('every fixture response is JSON-stable (round trip is lossless)', async () => {
    for (const path of ['/home', '/collections', '/movies', '/characters', '/products',
      `/collections/${fx.slugs.collection}`, `/movies/${fx.slugs.movieOld}`, `/characters/${fx.slugs.characterA}`, `/products/${fx.slugs.productPriced}`]) {
      const r = await get(path);
      assertWireSafe(r.body);
      expect(wire(r), path).toEqual(r.body);
    }
  });
});

// ===========================================================================
// 5. Public content boundary
// ===========================================================================
describe('public content boundary', () => {
  let nonPublished: Set<string>;
  let publishedBySection: { collections: { id: string; slug: string }[]; movies: { id: string; slug: string }[]; characters: { id: string; slug: string }[]; products: { id: string; slug: string }[] };

  beforeAll(async () => {
    const np = { where: { status: { not: 'PUBLISHED' as const } }, select: { slug: true } };
    const pub = { where: { status: 'PUBLISHED' as const }, select: { id: true, slug: true } };
    const [c, m, ch, p, pc, pm, pch, pp] = await Promise.all([
      prisma.collection.findMany(np), prisma.movie.findMany(np), prisma.character.findMany(np), prisma.product.findMany(np),
      prisma.collection.findMany(pub), prisma.movie.findMany(pub), prisma.character.findMany(pub), prisma.product.findMany(pub),
    ]);
    nonPublished = new Set([...c, ...m, ...ch, ...p].map((x) => x.slug));
    publishedBySection = { collections: pc, movies: pm, characters: pch, products: pp };
  });

  const leaks = (body: unknown) => (collectBy(body, 'slug') as string[]).filter((s) => nonPublished.has(s));

  it('fixture contains DRAFT and ARCHIVED rows of every entity type (guards the sweep)', () => {
    for (const s of [fx.slugs.collectionDraft, fx.slugs.movieDraft, fx.slugs.movieArchived, fx.slugs.characterDraft, fx.slugs.productDraft,
      extra.collectionArchived, extra.characterArchived, extra.productArchived, extra.movieDraftFeatured, extra.characterDraftFeatured]) {
      expect(nonPublished.has(s), s).toBe(true);
    }
  });

  it('lists and home never contain DRAFT or ARCHIVED items', async () => {
    for (const path of ['/home', '/collections', '/characters', '/products']) {
      expect(leaks((await get(path)).body), path).toEqual([]);
    }
    for (const query of [{}, { q: fx.token }, { q: fx.token, pageSize: '200' }, { year: '1984' }, { genre: fx.slugs.tagAlpha }]) {
      expect(leaks((await get('/movies', query)).body), JSON.stringify(query)).toEqual([]);
    }
    for (const query of [{ featured: 'true' }, { seasonal: 'true' }, { type: 'GIFT' }]) {
      expect(leaks((await get('/collections', query)).body), JSON.stringify(query)).toEqual([]);
    }
  });

  it('home skips featured DRAFT/ARCHIVED rows', async () => {
    const home = wire<HomeResponse>(await get('/home'));
    expect(home.featuredCollections.map((c) => c.slug)).not.toContain(fx.slugs.collectionDraft);
    expect(home.featuredCollections.map((c) => c.slug)).not.toContain(extra.collectionArchived);
    expect(home.seasonalCollections.map((c) => c.slug)).not.toContain(extra.collectionArchived);
    expect(home.featuredMovie?.slug).not.toBe(extra.movieDraftFeatured);
    expect(home.featuredCharacter?.slug).not.toBe(extra.characterDraftFeatured);
    expect(home.featuredCharacter?.slug).not.toBe(extra.characterArchived);
  });

  it('every non-published slug returns 404 on every slug route', async () => {
    const sections: [keyof typeof publishedBySection, string[]][] = [
      ['collections', ['', '/movies', '/characters', '/products', '/related']],
      ['movies', ['', '/collections']],
      ['characters', ['']],
      ['products', ['']],
    ];
    const [c, m, ch, p] = await Promise.all([
      prisma.collection.findMany({ where: { status: { not: 'PUBLISHED' } }, select: { slug: true } }),
      prisma.movie.findMany({ where: { status: { not: 'PUBLISHED' } }, select: { slug: true } }),
      prisma.character.findMany({ where: { status: { not: 'PUBLISHED' } }, select: { slug: true } }),
      prisma.product.findMany({ where: { status: { not: 'PUBLISHED' } }, select: { slug: true } }),
    ]);
    const bySection = { collections: c, movies: m, characters: ch, products: p };
    for (const [section, suffixes] of sections) {
      expect(bySection[section].length, section).toBeGreaterThan(0);
      for (const { slug } of bySection[section]) {
        for (const suffix of suffixes) {
          expect((await get(`/${section}/${slug}${suffix}`)).status, `/${section}/${slug}${suffix}`).toBe(404);
        }
      }
    }
  });

  it('no detail or sub-route response for any published item leaks a DRAFT/ARCHIVED item', async () => {
    const found: string[] = [];
    const sweep = async (path: string) => {
      const r = await get(path);
      expect(r.status, path).toBe(200);
      for (const s of leaks(r.body)) found.push(`${path} -> ${s}`);
    };
    for (const { slug } of publishedBySection.collections) {
      for (const suffix of ['', '/movies', '/characters', '/products', '/related']) await sweep(`/collections/${slug}${suffix}`);
    }
    for (const { slug } of publishedBySection.movies) {
      for (const suffix of ['', '/collections']) await sweep(`/movies/${slug}${suffix}`);
    }
    for (const { slug } of publishedBySection.characters) await sweep(`/characters/${slug}`);
    for (const { slug } of publishedBySection.products) await sweep(`/products/${slug}`);
    expect(found).toEqual([]);
  });

  it('internal IDs do not resolve as public path segments', async () => {
    for (const [section, items] of Object.entries(publishedBySection)) {
      for (const { id } of items.slice(0, 5)) {
        expect((await get(`/${section}/${id}`)).status, `/${section}/${id}`).toBe(404);
      }
    }
  });
});

// ===========================================================================
// 6. Decimal-safe product price
// ===========================================================================
describe('decimal-safe product price', () => {
  const productsEverywhere = async () => {
    const bodies: [string, unknown][] = [
      ['/products', (await get('/products')).body],
      [`/products/${fx.slugs.productPriced}`, (await get(`/products/${fx.slugs.productPriced}`)).body],
      [`/collections/${fx.slugs.collection}`, (await get(`/collections/${fx.slugs.collection}`)).body],
      [`/collections/${fx.slugs.collection}/products`, (await get(`/collections/${fx.slugs.collection}/products`)).body],
      [`/characters/${fx.slugs.characterA}`, (await get(`/characters/${fx.slugs.characterA}`)).body],
      [`/movies/${fx.slugs.movieOld}`, (await get(`/movies/${fx.slugs.movieOld}`)).body],
    ];
    return bodies;
  };

  it('price is a two-decimal string with a 3-letter currency, or both null, on every route that carries products', async () => {
    let priced = 0;
    for (const [path, body] of await productsEverywhere()) {
      for (const holder of collectBy(body, 'price')) {
        expect(typeof holder === 'string' || holder === null, `${path}: ${String(holder)}`).toBe(true);
        if (typeof holder === 'string') {
          expect(holder).toMatch(PRICE);
          priced++;
        }
      }
      for (const cur of collectBy(body, 'currency')) {
        expect(cur === null || (typeof cur === 'string' && CURRENCY.test(cur)), `${path}: ${String(cur)}`).toBe(true);
      }
    }
    expect(priced).toBeGreaterThan(0);
  });

  it('keeps price and currency paired (both set or both null)', async () => {
    const list = (await get('/products')).body as ProductSummary[];
    for (const p of list) expect(p.price === null, p.slug).toBe(p.currency === null);
  });

  it('preserves exact values including trailing zeros through JSON.stringify/parse', async () => {
    const expected: Record<string, [string, string]> = {
      [fx.slugs.productPriced]: ['12.50', 'USD'],
      [extra.priceTrailingZero]: ['0.10', 'USD'],
      [extra.priceLarge]: ['1234567.89', 'EUR'],
    };
    const list = (await get('/products')).body as ProductSummary[];
    for (const [slug, [price, currency]] of Object.entries(expected)) {
      const summary = list.find((p) => p.slug === slug)!;
      expect(summary.price).toBe(price);
      expect(summary.currency).toBe(currency);

      const detailResult = await get(`/products/${slug}`);
      const json = JSON.stringify(detailResult.body);
      expect(json).toContain(`"price":"${price}"`);
      const parsed = JSON.parse(json) as ProductDetail;
      expect(parsed.price).toBe(price);
      expect(parsed.currency).toBe(currency);
      expect(parsed).toEqual(detailResult.body);
    }
  });

  it('is never a JS number and unpriced products serialize price/currency as null', async () => {
    for (const [path, body] of await productsEverywhere()) {
      for (const holder of collectBy(body, 'price')) expect(typeof holder, path).not.toBe('number');
    }
    const unpriced = wire<ProductDetail>(await get(`/products/${fx.slugs.productUnpriced}`));
    expect(unpriced.price).toBeNull();
    expect(unpriced.currency).toBeNull();
    expect('price' in unpriced).toBe(true);
    // A float round trip would turn "0.10" into 0.1; the string must not.
    const ten = wire<ProductDetail>(await get(`/products/${extra.priceTrailingZero}`));
    expect(Number(ten.price)).toBe(0.1);
    expect(ten.price).not.toBe(String(Number(ten.price)));
  });
});
