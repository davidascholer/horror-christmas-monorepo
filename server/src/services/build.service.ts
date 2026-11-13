/**
 * Build Service (Task 6.1)
 *
 * Slug discovery for the static generator (Design 6.2, Requirement 9.3):
 * - GET /build/collections
 * - GET /build/movies
 * - GET /build/characters
 * - GET /build/products
 *
 * Element shape: `{ slug, updatedAt }` rather than bare strings, so the
 * sitemap task can emit `lastmod` without one extra request per page. Only the
 * slug is an identifier; internal IDs are never selected.
 *
 * Published only (DRAFT and ARCHIVED excluded). Ordered by slug ascending in
 * code-unit order. The database orderBy is a hint; the final sort is done here
 * so the order does not depend on the database collation (a locale collation
 * would otherwise sort "a-b" and "ab" differently across environments).
 */
import { PrismaClient } from '@prisma/client';
import type { BuildSlugEntry } from '../types/api-contracts.js';
import { PUBLISHED_ONLY_FILTER, serializeTimestamp } from '../repositories/base.repository.js';

const SELECT = { slug: true, updatedAt: true } as const;
const ARGS = { where: PUBLISHED_ONLY_FILTER, select: SELECT, orderBy: { slug: 'asc' } } as const;

type Row = { slug: string; updatedAt: Date };

function toEntries(rows: Row[]): BuildSlugEntry[] {
  return rows
    .map((r) => ({ slug: r.slug, updatedAt: serializeTimestamp(r.updatedAt)! }))
    .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

export class BuildService {
  constructor(private prisma: PrismaClient) {}

  async listCollectionSlugs(): Promise<BuildSlugEntry[]> {
    return toEntries(await this.prisma.collection.findMany(ARGS));
  }

  async listMovieSlugs(): Promise<BuildSlugEntry[]> {
    return toEntries(await this.prisma.movie.findMany(ARGS));
  }

  async listCharacterSlugs(): Promise<BuildSlugEntry[]> {
    return toEntries(await this.prisma.character.findMany(ARGS));
  }

  async listProductSlugs(): Promise<BuildSlugEntry[]> {
    return toEntries(await this.prisma.product.findMany(ARGS));
  }
}
