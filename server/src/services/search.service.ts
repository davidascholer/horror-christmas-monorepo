/**
 * Search Service (Task 5.1)
 *
 * GET /search?q={query}: PostgreSQL full-text search across published
 * collections, movies, characters and products. No external search service
 * and no persisted search-vector columns: vectors are computed in the query.
 *
 * Matching
 *   websearch_to_tsquery('english', q). It never raises a syntax error, so
 *   quotes, operators (& | ! <->), parentheses, colons and stray punctuation in
 *   user input are treated as plain text or ignored. A query that reduces to
 *   nothing (for example "!!!") matches nothing and yields [].
 *   Weights: title/name = A, secondary title or summary = B, long text = C.
 *
 * Safety
 *   The query text is only ever bound as a parameter via Prisma's tagged
 *   $queryRaw. It is never concatenated into SQL. NUL characters (which
 *   PostgreSQL rejects in text) are stripped and the input is length-capped.
 *
 * Summary fallback order (always a string, never null)
 *   collection: summary, then first 200 chars of introduction, then ""
 *   movie:      synopsis (first 200 chars), then ""
 *   character:  summary, then first 200 chars of biography, then ""
 *   product:    description (first 200 chars), then ""
 *   A stored value that is empty or whitespace-only counts as missing.
 *
 * Ordering (single place: SEARCH_ORDER_BY below)
 *   1. category priority: collections, movies, characters, products
 *   2. ts_rank relevance, highest first, within a category
 *   3. title ascending, then id, for a stable order
 *
 * Index choice
 *   No GIN index is added. The catalogue is a few hundred editorial rows, the
 *   statement is a sequential scan of four small tables, and an expression
 *   index would have to repeat the exact weighted to_tsvector expression to be
 *   used. Revisit if row counts grow into the tens of thousands.
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { SearchResult } from '../types/api-contracts.js';

/** Category priority, first to last. Mirrors the CASE priorities in the SQL. */
export const SEARCH_CATEGORY_ORDER: readonly SearchResult['type'][] = [
  'collection',
  'movie',
  'character',
  'product',
];

/** Longest query text considered; the rest is dropped. */
export const MAX_SEARCH_QUERY_LENGTH = 200;

/** Upper bound on results returned for one query. */
export const MAX_SEARCH_RESULTS = 50;

/** Length of the excerpt used when a summary falls back to long text. */
const EXCERPT_LENGTH = 200;

/**
 * The one ordering clause for results. Columns come from the inner UNION:
 * priority (0..3), rank (ts_rank), title, id.
 */
const SEARCH_ORDER_BY = Prisma.sql`ORDER BY r.priority ASC, r.rank DESC, r.title ASC, r.id ASC`;

/** Trim, strip NUL, cap length. Returns '' when nothing searchable remains. */
export function normalizeSearchQuery(raw: string | undefined | null): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\0/g, '').trim().slice(0, MAX_SEARCH_QUERY_LENGTH).trim();
}

export class SearchService {
  constructor(private prisma: PrismaClient) {}

  /**
   * GET /search?q={query}
   * Returns [] for missing, empty or whitespace-only queries.
   */
  async search(query: string | undefined | null): Promise<SearchResult[]> {
    const q = normalizeSearchQuery(query);
    if (q === '') return [];

    const n = EXCERPT_LENGTH;

    return this.prisma.$queryRaw<SearchResult[]>`
      WITH q AS (SELECT websearch_to_tsquery('english', ${q}::text) AS query)
      SELECT r.type, r.id, r.slug, r.title, r.summary
      FROM (
        SELECT 'collection'::text AS type, 0 AS priority, c.id, c.slug, c.title,
               COALESCE(NULLIF(btrim(c.summary), ''), left(btrim(c.introduction), ${n}::int), '') AS summary,
               ts_rank(v.vec, q.query) AS rank
        FROM "Collection" c
        CROSS JOIN q
        CROSS JOIN LATERAL (SELECT
          setweight(to_tsvector('english', coalesce(c.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(c.summary, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(c.introduction, '')), 'C') AS vec) v
        WHERE c.status = 'PUBLISHED' AND v.vec @@ q.query

        UNION ALL

        SELECT 'movie'::text, 1, m.id, m.slug, m.title,
               COALESCE(left(NULLIF(btrim(m.synopsis), ''), ${n}::int), '') AS summary,
               ts_rank(v.vec, q.query)
        FROM "Movie" m
        CROSS JOIN q
        CROSS JOIN LATERAL (SELECT
          setweight(to_tsvector('english', coalesce(m.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(m."originalTitle", '')), 'B') ||
          setweight(to_tsvector('english', coalesce(m.synopsis, '')), 'C') AS vec) v
        WHERE m.status = 'PUBLISHED' AND v.vec @@ q.query

        UNION ALL

        SELECT 'character'::text, 2, ch.id, ch.slug, ch.name,
               COALESCE(NULLIF(btrim(ch.summary), ''), left(btrim(ch.biography), ${n}::int), '') AS summary,
               ts_rank(v.vec, q.query)
        FROM "Character" ch
        CROSS JOIN q
        CROSS JOIN LATERAL (SELECT
          setweight(to_tsvector('english', coalesce(ch.name, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(ch.summary, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(ch.biography, '')), 'C') AS vec) v
        WHERE ch.status = 'PUBLISHED' AND v.vec @@ q.query

        UNION ALL

        SELECT 'product'::text, 3, p.id, p.slug, p.name,
               COALESCE(left(NULLIF(btrim(p.description), ''), ${n}::int), '') AS summary,
               ts_rank(v.vec, q.query)
        FROM "Product" p
        CROSS JOIN q
        CROSS JOIN LATERAL (SELECT
          setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(p.description, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(p.category, '')), 'C') AS vec) v
        WHERE p.status = 'PUBLISHED' AND v.vec @@ q.query
      ) r
      ${SEARCH_ORDER_BY}
      LIMIT ${MAX_SEARCH_RESULTS}::int
    `;
  }
}
