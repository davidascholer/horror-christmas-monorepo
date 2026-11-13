/**
 * Build-time data retrieval (Task 6.1, Design 6.2, Requirements 9.2 and 9.3)
 *
 * Step 1 and 2 of the static generation sequence:
 *   1. Discover published slugs from GET /build/{collections,movies,characters,products}.
 *      The homepage projection GET /home (Task 7.1) is retrieved in the same step.
 *   2. Retrieve each page model from GET /{collections,movies,characters,products}/:slug.
 *
 * The API is the only content source. Nothing here reads hardcoded records or
 * JSON files, and nothing is invented for missing data. Rendering, metadata,
 * sitemap and images belong to later tasks.
 *
 * Self-contained: imports only from web/. Uses the built-in fetch (Node 18+),
 * which can be replaced with a fake for tests via `options.fetch`.
 *
 * Configuration: the API base URL comes from the API_BASE_URL environment
 * variable (see readApiBaseUrl). The wider environment-variable approach is
 * still an open decision (OPEN-DECISIONS.md).
 *
 * Failure behavior:
 *   - /build list non-OK, network error, or malformed body: BuildDataError naming the URL.
 *   - /home non-OK, network error, or malformed body: the same (BuildDataError naming the URL and status).
 *   - Detail 404 (listed but no longer published): recorded as a warning, skipped.
 *   - Any other detail failure: BuildDataError; no further requests are started.
 */

import type {
  BuildSlugEntry,
  CharacterSummary,
  CollectionDetail,
  CollectionSummary,
  HomeResponse,
  MovieSummary,
  MovieDetail,
  CharacterDetail,
  ProductDetail,
} from '../types/api-contracts';

/** `home` is the homepage (warnings about /home content use it; there is no home slug). */
export type BuildEntityType = 'collection' | 'movie' | 'character' | 'product' | 'home';

export interface BuildWarning {
  entityType: BuildEntityType;
  slug: string;
  message: string;
}

/** Retrieved page models in /build order (slug ascending), plus warnings. */
export interface BuildData {
  collections: CollectionDetail[];
  movies: MovieDetail[];
  characters: CharacterDetail[];
  products: ProductDetail[];
  /** The `GET /home` projection (Task 7.1). Always present: a missing or malformed /home fails the build. */
  home: HomeResponse;
  /**
   * `updatedAt` from the /build lists (Task 6.4), keyed by slug, for the
   * sitemap `lastmod`. Only slugs whose page model was retrieved are present.
   * Kept apart from the page models because those do not all carry it. A
   * missing or non-string value from the API is simply absent here.
   */
  updatedAt: BuildUpdatedAt;
  warnings: BuildWarning[];
}

export type BuildUpdatedAt = Record<'collections' | 'movies' | 'characters' | 'products', Map<string, string>>;

export interface FetchBuildDataOptions {
  /** API origin and optional path prefix, e.g. http://localhost:3000. No default. */
  apiBaseUrl: string;
  /** Injected for tests. Defaults to the global fetch. */
  fetch?: typeof fetch;
  /** Maximum simultaneous detail requests. Defaults to DEFAULT_CONCURRENCY. */
  concurrency?: number;
}

export const API_BASE_URL_ENV = 'API_BASE_URL';
export const DEFAULT_CONCURRENCY = 8;

export class BuildDataError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'BuildDataError';
  }
}

/** Reads API_BASE_URL from an environment object; throws if missing or blank. */
export function readApiBaseUrl(env: Record<string, string | undefined>): string {
  const value = env[API_BASE_URL_ENV]?.trim();
  if (!value) {
    throw new BuildDataError(
      `${API_BASE_URL_ENV} is not set. Set it to the API origin used for static generation, e.g. ${API_BASE_URL_ENV}=http://localhost:3000`,
    );
  }
  return value;
}

interface EntityConfig {
  type: Exclude<BuildEntityType, 'home'>;
  key: 'collections' | 'movies' | 'characters' | 'products';
}

const ENTITIES: readonly EntityConfig[] = [
  { type: 'collection', key: 'collections' },
  { type: 'movie', key: 'movies' },
  { type: 'character', key: 'characters' },
  { type: 'product', key: 'products' },
];

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isBuildSlugEntry(value: unknown): value is BuildSlugEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as BuildSlugEntry).slug === 'string' &&
    (value as BuildSlugEntry).slug.length > 0
  );
}

async function fetchBuildList(
  doFetch: typeof fetch,
  base: string,
  key: EntityConfig['key'],
): Promise<BuildSlugEntry[]> {
  const url = `${base}/build/${key}`;
  let response: Response;
  try {
    response = await doFetch(url, { headers: { Accept: 'application/json' } });
  } catch (error) {
    throw new BuildDataError(`Build list request failed for ${url}: ${describeError(error)}`, { cause: error });
  }
  if (!response.ok) {
    throw new BuildDataError(`Build list request failed for ${url}: HTTP ${response.status}`);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new BuildDataError(`Build list response for ${url} is not valid JSON`, { cause: error });
  }
  if (!Array.isArray(body) || !body.every(isBuildSlugEntry)) {
    throw new BuildDataError(`Build list response for ${url} is not an array of { slug, updatedAt }`);
  }
  return body;
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Why `body` is not a usable HomeResponse, or null if it is. Only what rendering and linking rely on is checked. */
function homeShapeProblem(body: unknown): string | null {
  if (!isRecord(body)) return 'it is not an object';
  const summary = (value: unknown, nameKey: 'title' | 'name'): boolean =>
    isRecord(value) && isNonEmptyString(value.slug) && isNonEmptyString(value[nameKey]);
  for (const key of ['featuredCollections', 'seasonalCollections'] as const) {
    const list = body[key];
    if (!Array.isArray(list)) return `${key} is not an array`;
    if (!list.every((c) => summary(c, 'title'))) return `${key} has an entry without a string slug and title`;
  }
  const optional: Array<[string, 'title' | 'name']> = [
    ['featuredMovie', 'title'], ['featuredCharacter', 'name'], ['giftCollection', 'title'],
  ];
  for (const [key, nameKey] of optional) {
    const value = body[key];
    if (value !== null && !summary(value, nameKey)) return `${key} is neither null nor an object with a string slug and ${nameKey}`;
  }
  return null;
}

async function fetchHome(doFetch: typeof fetch, base: string): Promise<HomeResponse> {
  const url = `${base}/home`;
  let response: Response;
  try {
    response = await doFetch(url, { headers: { Accept: 'application/json' } });
  } catch (error) {
    throw new BuildDataError(`Home request failed for ${url}: ${describeError(error)}`, { cause: error });
  }
  if (!response.ok) {
    throw new BuildDataError(`Home request failed for ${url}: HTTP ${response.status}`);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new BuildDataError(`Home response for ${url} is not valid JSON`, { cause: error });
  }
  const problem = homeShapeProblem(body);
  if (problem) throw new BuildDataError(`Home response for ${url} is not a valid homepage projection: ${problem}`);
  // Only the keys of the contract are kept; anything else the API adds is not published.
  const b = body as Record<string, unknown>;
  return {
    featuredCollections: b.featuredCollections as CollectionSummary[],
    seasonalCollections: b.seasonalCollections as CollectionSummary[],
    featuredMovie: b.featuredMovie as MovieSummary | null,
    featuredCharacter: b.featuredCharacter as CharacterSummary | null,
    giftCollection: b.giftCollection as CollectionSummary | null,
  };
}

/**
 * Runs `worker` over `items` with at most `limit` in flight. Results keep the
 * input order. After the first failure no new items are started, and the first
 * error is rethrown once the in-flight ones settle.
 */
async function mapBounded<T, R>(items: readonly T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  let failure: { error: unknown } | null = null;

  const run = async (): Promise<void> => {
    while (!failure && next < items.length) {
      const index = next++;
      try {
        results[index] = await worker(items[index]);
      } catch (error) {
        failure ??= { error };
        return;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  if (failure) throw (failure as { error: unknown }).error;
  return results;
}

export async function fetchBuildData(options: FetchBuildDataOptions): Promise<BuildData> {
  const doFetch = options.fetch ?? globalThis.fetch;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new BuildDataError(`concurrency must be a positive integer, got ${concurrency}`);
  }
  const base = options.apiBaseUrl.trim().replace(/\/+$/, '');
  if (!base) throw new BuildDataError(`${API_BASE_URL_ENV} is empty`);

  // Discovery: all four lists and /home must succeed before any page model is requested.
  const [home, lists] = await Promise.all([
    fetchHome(doFetch, base),
    Promise.all(ENTITIES.map((e) => fetchBuildList(doFetch, base, e.key))),
  ]);

  const jobs = ENTITIES.flatMap((entity, i) =>
    lists[i].map((entry) => ({ entity, slug: entry.slug, updatedAt: entry.updatedAt as unknown })),
  );

  const warnings: BuildWarning[] = [];
  const models = await mapBounded(jobs, concurrency, async ({ entity, slug }) => {
    const url = `${base}/${entity.key}/${encodeURIComponent(slug)}`;
    let response: Response;
    try {
      response = await doFetch(url, { headers: { Accept: 'application/json' } });
    } catch (error) {
      throw new BuildDataError(`Page model request failed for ${entity.type} "${slug}" (${url}): ${describeError(error)}`, {
        cause: error,
      });
    }
    if (response.status === 404) {
      warnings.push({
        entityType: entity.type,
        slug,
        message: `${entity.type} "${slug}" is listed by /build/${entity.key} but ${url} returned 404; skipped`,
      });
      return null;
    }
    if (!response.ok) {
      throw new BuildDataError(
        `Page model request failed for ${entity.type} "${slug}" (${url}): HTTP ${response.status}`,
      );
    }
    try {
      return (await response.json()) as unknown;
    } catch (error) {
      throw new BuildDataError(`Page model response for ${entity.type} "${slug}" (${url}) is not valid JSON`, {
        cause: error,
      });
    }
  });

  const result: BuildData = {
    collections: [], movies: [], characters: [], products: [], home,
    updatedAt: { collections: new Map(), movies: new Map(), characters: new Map(), products: new Map() },
    warnings,
  };
  jobs.forEach((job, i) => {
    const model = models[i];
    if (model === null) return;
    (result[job.entity.key] as unknown[]).push(model);
    if (typeof job.updatedAt === 'string') result.updatedAt[job.entity.key].set(job.slug, job.updatedAt);
  });
  // Warnings arrive in completion order; sort so output is deterministic.
  warnings.sort((a, b) => (a.entityType + a.slug < b.entityType + b.slug ? -1 : 1));
  return result;
}
