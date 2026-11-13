/**
 * Public API route table (Task 4.4)
 *
 * Framework-neutral description of the public read API from design sections
 * 4.2-4.5. The HTTP framework is still an open decision (OPEN-DECISIONS.md),
 * so nothing here imports one. A future adapter only needs to:
 *   1. call findRoute(method, pathname) to resolve a route + path params,
 *   2. call route.handle(services, params, query) with the raw string query,
 *   3. write result.status and JSON.stringify(result.body).
 *
 * Status behavior (decided mapping, applied here rather than in the adapter):
 *   200  data found (lists are always 200, possibly an empty JSON array)
 *   404  service returned null (slug missing, DRAFT or ARCHIVED)
 *   400  invalid query value (unparseable string, unknown enum, RangeError)
 * Any other thrown error is NOT swallowed; the adapter should map it to 500.
 *
 * Public paths use slugs only. Internal database IDs never appear in paths.
 * Watchlist routes belong to a later phase and are intentionally absent.
 */

import {
  CollectionListQuery,
  CollectionType,
  MovieListQuery,
  HomeResponse,
  CollectionSummary,
  CollectionDetail,
  CollectionMoviesResponse,
  CollectionCharactersResponse,
  CollectionProductsResponse,
  CollectionRelatedResponse,
  MovieSummary,
  MovieDetail,
  MovieCollectionsResponse,
  CharacterSummary,
  CharacterDetail,
  ProductSummary,
  ProductDetail,
  SearchResult,
  BuildSlugEntry,
} from '../types/api-contracts.js';
import type { HomeService } from '../services/home.service.js';
import type { CollectionService } from '../services/collection.service.js';
import type { MovieService } from '../services/movie.service.js';
import type { CharacterService } from '../services/character.service.js';
import type { ProductService } from '../services/product.service.js';
import type { SearchService } from '../services/search.service.js';
import type { BuildService } from '../services/build.service.js';

export interface ApiServices {
  search: SearchService;
  home: HomeService;
  collections: CollectionService;
  movies: MovieService;
  characters: CharacterService;
  products: ProductService;
  build: BuildService;
}

export interface ApiError {
  error: { code: 'NOT_FOUND' | 'BAD_REQUEST'; message: string };
}

export type RouteResult<T = unknown> =
  | { status: 200; body: T }
  | { status: 404; body: ApiError }
  | { status: 400; body: ApiError };

/** Raw, unparsed query string values as an HTTP adapter would supply them. */
export type RawQuery = Record<string, string | undefined>;
export type PathParams = Record<string, string>;

export interface RouteDefinition {
  method: 'GET';
  /** Express-style pattern; only `:slug` params are used. */
  path: string;
  /** Service method(s) the route maps to, for documentation and tests. */
  service: string;
  /** Optional query parameters the route understands (others are ignored). */
  queryParams: readonly string[];
  /** Statuses this route can produce. */
  statuses: readonly (200 | 400 | 404)[];
  handle(services: ApiServices, params: PathParams, query: RawQuery): Promise<RouteResult>;
}

// ---------------------------------------------------------------------------
// Result helpers
// ---------------------------------------------------------------------------

const ok = <T>(body: T): RouteResult<T> => ({ status: 200, body });

const notFound = (what: string): RouteResult => ({
  status: 404,
  body: { error: { code: 'NOT_FOUND', message: `${what} not found` } },
});

const badRequest = (message: string): RouteResult => ({
  status: 400,
  body: { error: { code: 'BAD_REQUEST', message } },
});

/** 200 with the value, or 404 when the service returned null. */
function foundOr404<T>(value: T | null, what: string, wrap: (v: T) => unknown = (v) => v): RouteResult {
  return value === null ? notFound(what) : ok(wrap(value));
}

// ---------------------------------------------------------------------------
// Query parsing (raw strings -> typed contract queries). Throws QueryError.
// ---------------------------------------------------------------------------

class QueryError extends Error {}

const COLLECTION_TYPES: readonly CollectionType[] = [
  'CHARACTER',
  'THEME',
  'BEGINNER',
  'GIFT',
  'SEASONAL_CHALLENGE',
  'TRADITION',
];

function parseBoolean(name: string, raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new QueryError(`${name} must be "true" or "false"`);
}

function parseInteger(name: string, raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  if (!/^-?\d+$/.test(raw)) throw new QueryError(`${name} must be an integer`);
  const n = Number(raw);
  if (!Number.isSafeInteger(n)) throw new QueryError(`${name} must be an integer`);
  return n;
}

export function parseCollectionListQuery(query: RawQuery): CollectionListQuery {
  const type = query.type;
  if (type !== undefined && !COLLECTION_TYPES.includes(type as CollectionType)) {
    throw new QueryError(`type must be one of ${COLLECTION_TYPES.join(', ')}`);
  }
  return {
    featured: parseBoolean('featured', query.featured),
    seasonal: parseBoolean('seasonal', query.seasonal),
    type: type as CollectionType | undefined,
  };
}

export function parseMovieListQuery(query: RawQuery): MovieListQuery {
  return {
    q: query.q,
    year: parseInteger('year', query.year),
    genre: query.genre,
    page: parseInteger('page', query.page),
    pageSize: parseInteger('pageSize', query.pageSize),
  };
}

/** Runs a service call, mapping query/range problems to 400. */
async function guarded(run: () => Promise<RouteResult>): Promise<RouteResult> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof QueryError || error instanceof RangeError) {
      return badRequest(error.message);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Route table
// ---------------------------------------------------------------------------

const S_LIST = [200] as const;
const S_DETAIL = [200, 404] as const;
const S_FILTERED_LIST = [200, 400] as const;

export const routes: readonly RouteDefinition[] = [
  {
    method: 'GET',
    path: '/home',
    service: 'HomeService.getHome',
    queryParams: [],
    statuses: S_LIST,
    handle: async (s) => ok<HomeResponse>(await s.home.getHome()),
  },

  // Collections ------------------------------------------------------------
  {
    method: 'GET',
    path: '/collections',
    service: 'CollectionService.listCollections',
    queryParams: ['featured', 'seasonal', 'type'],
    statuses: S_FILTERED_LIST,
    handle: (s, _p, q) =>
      guarded(async () => ok<CollectionSummary[]>(await s.collections.listCollections(parseCollectionListQuery(q)))),
  },
  {
    method: 'GET',
    path: '/collections/:slug',
    service: 'CollectionService.getCollectionDetail',
    queryParams: [],
    statuses: S_DETAIL,
    handle: async (s, p) =>
      foundOr404<CollectionDetail>(await s.collections.getCollectionDetail(p.slug), 'Collection'),
  },
  {
    method: 'GET',
    path: '/collections/:slug/movies',
    service: 'CollectionService.getCollectionMovies',
    queryParams: [],
    statuses: S_DETAIL,
    handle: async (s, p) =>
      foundOr404(await s.collections.getCollectionMovies(p.slug), 'Collection', (movies): CollectionMoviesResponse => ({
        movies,
      })),
  },
  {
    method: 'GET',
    path: '/collections/:slug/characters',
    service: 'CollectionService.getCollectionCharacters',
    queryParams: [],
    statuses: S_DETAIL,
    handle: async (s, p) =>
      foundOr404(
        await s.collections.getCollectionCharacters(p.slug),
        'Collection',
        (characters): CollectionCharactersResponse => ({ characters }),
      ),
  },
  {
    method: 'GET',
    path: '/collections/:slug/products',
    service: 'CollectionService.getCollectionProducts',
    queryParams: [],
    statuses: S_DETAIL,
    handle: async (s, p) =>
      foundOr404(
        await s.collections.getCollectionProducts(p.slug),
        'Collection',
        (products): CollectionProductsResponse => ({ products }),
      ),
  },
  {
    method: 'GET',
    path: '/collections/:slug/related',
    service: 'CollectionService.getRelatedCollections',
    queryParams: [],
    statuses: S_DETAIL,
    handle: async (s, p) =>
      foundOr404(
        await s.collections.getRelatedCollections(p.slug),
        'Collection',
        (related): CollectionRelatedResponse => ({ related }),
      ),
  },

  // Movies -----------------------------------------------------------------
  {
    method: 'GET',
    path: '/movies',
    service: 'MovieService.listMovies',
    queryParams: ['q', 'year', 'genre', 'page', 'pageSize'],
    statuses: S_FILTERED_LIST,
    handle: (s, _p, q) =>
      guarded(async () => ok<MovieSummary[]>(await s.movies.listMovies(parseMovieListQuery(q)))),
  },
  {
    method: 'GET',
    path: '/movies/:slug',
    service: 'MovieService.getMovieDetail',
    queryParams: [],
    statuses: S_DETAIL,
    handle: async (s, p) => foundOr404<MovieDetail>(await s.movies.getMovieDetail(p.slug), 'Movie'),
  },
  {
    method: 'GET',
    path: '/movies/:slug/collections',
    service: 'MovieService.getMovieCollections',
    queryParams: [],
    statuses: S_DETAIL,
    handle: async (s, p) =>
      foundOr404(
        await s.movies.getMovieCollections(p.slug),
        'Movie',
        (collections): MovieCollectionsResponse => ({ collections }),
      ),
  },

  // Characters -------------------------------------------------------------
  {
    method: 'GET',
    path: '/characters',
    service: 'CharacterService.listCharacters',
    queryParams: [],
    statuses: S_LIST,
    handle: async (s) => ok<CharacterSummary[]>(await s.characters.listCharacters()),
  },
  {
    method: 'GET',
    path: '/characters/:slug',
    service: 'CharacterService.getCharacterDetail',
    queryParams: [],
    statuses: S_DETAIL,
    handle: async (s, p) =>
      foundOr404<CharacterDetail>(await s.characters.getCharacterDetail(p.slug), 'Character'),
  },

  // Search -----------------------------------------------------------------
  {
    // An empty, missing or whitespace-only q is a valid request: 200 with [].
    // Malformed query syntax is neutralised by the service, so there is no 400.
    method: 'GET',
    path: '/search',
    service: 'SearchService.search',
    queryParams: ['q'],
    statuses: S_LIST,
    handle: async (s, _p, q) => ok<SearchResult[]>(await s.search.search(q.q)),
  },

  // Products ---------------------------------------------------------------
  {
    method: 'GET',
    path: '/products',
    service: 'ProductService.listProducts',
    queryParams: [],
    statuses: S_LIST,
    handle: async (s) => ok<ProductSummary[]>(await s.products.listProducts()),
  },
  {
    method: 'GET',
    path: '/products/:slug',
    service: 'ProductService.getProductDetail',
    queryParams: [],
    statuses: S_DETAIL,
    handle: async (s, p) => foundOr404<ProductDetail>(await s.products.getProductDetail(p.slug), 'Product'),
  },

  // Build discovery (static generation, Design 6.2) ------------------------
  // Bare arrays of { slug, updatedAt }; published only; slug ascending.
  {
    method: 'GET',
    path: '/build/collections',
    service: 'BuildService.listCollectionSlugs',
    queryParams: [],
    statuses: S_LIST,
    handle: async (s) => ok<BuildSlugEntry[]>(await s.build.listCollectionSlugs()),
  },
  {
    method: 'GET',
    path: '/build/movies',
    service: 'BuildService.listMovieSlugs',
    queryParams: [],
    statuses: S_LIST,
    handle: async (s) => ok<BuildSlugEntry[]>(await s.build.listMovieSlugs()),
  },
  {
    method: 'GET',
    path: '/build/characters',
    service: 'BuildService.listCharacterSlugs',
    queryParams: [],
    statuses: S_LIST,
    handle: async (s) => ok<BuildSlugEntry[]>(await s.build.listCharacterSlugs()),
  },
  {
    method: 'GET',
    path: '/build/products',
    service: 'BuildService.listProductSlugs',
    queryParams: [],
    statuses: S_LIST,
    handle: async (s) => ok<BuildSlugEntry[]>(await s.build.listProductSlugs()),
  },
];

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

function matchPath(pattern: string, pathname: string): PathParams | null {
  const want = pattern.split('/');
  const have = pathname.split('/');
  if (want.length !== have.length) return null;
  const params: PathParams = {};
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) {
      if (have[i] === '') return null;
      try {
        params[want[i].slice(1)] = decodeURIComponent(have[i]);
      } catch {
        return null;
      }
    } else if (want[i] !== have[i]) {
      return null;
    }
  }
  return params;
}

/** Resolve a request to a route and its path params, or null (adapter responds 404). */
export function findRoute(
  method: string,
  pathname: string,
): { route: RouteDefinition; params: PathParams } | null {
  for (const route of routes) {
    if (route.method !== method.toUpperCase()) continue;
    const params = matchPath(route.path, pathname);
    if (params) return { route, params };
  }
  return null;
}

/** Convenience for tests and simple adapters: resolve and execute in one call. */
export async function dispatch(
  services: ApiServices,
  method: string,
  pathname: string,
  query: RawQuery = {},
): Promise<RouteResult> {
  const match = findRoute(method, pathname);
  if (!match) return notFound('Route');
  return match.route.handle(services, match.params, query);
}
