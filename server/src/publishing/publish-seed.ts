/**
 * Publish step for the seeded launch catalog (Task 3.5).
 *
 * Seeding creates DRAFT content on purpose. This module is the separate,
 * deliberate step that moves seed records to PUBLISHED, and only those records
 * that pass the publication validators in ../validation/publication-validation.
 *
 * Safety rules (each one is enforced in code and covered by tests):
 *  1. Local only. The DATABASE_URL must point at localhost / 127.0.0.1 / ::1.
 *     Anything else (or nothing) is refused before any query runs.
 *  2. Seed records only. The caller passes the exact slug sets of the seed
 *     catalog (see prisma/publish-seed.ts); rows outside those sets are never
 *     read for publishing. Slugs with a test-fixture prefix (zz-, t52, t43,
 *     e2e, test-) are additionally refused even if they appear in a set.
 *  3. Only DRAFT rows are considered. PUBLISHED rows are left exactly as they
 *     are (an existing publishedAt is never overwritten) and ARCHIVED rows are
 *     never revived, which makes the step idempotent.
 *  4. Validators are not weakened. A record that fails stays DRAFT and the
 *     exact validator messages are returned. On top of the validators the
 *     collection pass applies the static-build rules (see below).
 *  5. All reads and writes happen in one transaction.
 *
 * Collections are decided last, after movies, characters and products, because
 * the static generator only links what it builds:
 *  - a collection needs at least one member movie that will be PUBLISHED, and
 *  - every related collection must itself be PUBLISHED (already, or in this
 *    run). A collection that fails either rule stays DRAFT, which can in turn
 *    keep collections that relate to it in DRAFT; this is resolved to a fixed
 *    point and every consequence is listed with its reason.
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import { validateEntityForPublication } from '../validation/publication-validation.js';

export type PublishableEntityType = 'collection' | 'movie' | 'character' | 'product';

export interface SeedSlugSets {
  collections: readonly string[];
  movies: readonly string[];
  characters: readonly string[];
  products: readonly string[];
}

/** Slug prefixes used by test fixtures; these rows are never published. */
export const FIXTURE_SLUG_PREFIXES = ['zz-', 't52', 't43', 'e2e', 'test-'] as const;

export const isFixtureSlug = (slug: string): boolean =>
  FIXTURE_SLUG_PREFIXES.some((prefix) => slug.startsWith(prefix));

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/**
 * Throws unless `databaseUrl` is a PostgreSQL URL whose host is the local
 * machine. A `host=` query parameter (which libpq-style drivers use to
 * override the host or select a socket) is refused as well.
 */
export function assertLocalDatabaseUrl(databaseUrl: string | undefined): void {
  const refuse = (why: string): never => {
    throw new Error(
      `Refusing to publish: ${why}. The publish step only runs against a local database ` +
        '(localhost, 127.0.0.1 or ::1) so it can never change a shared database.',
    );
  };
  if (!databaseUrl || databaseUrl.trim() === '') return refuse('DATABASE_URL is not set');
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    return refuse('DATABASE_URL is not a valid URL');
  }
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    return refuse(`DATABASE_URL protocol "${url.protocol}" is not postgresql`);
  }
  if (!LOCAL_HOSTS.has(url.hostname.toLowerCase())) {
    return refuse(`DATABASE_URL host "${url.hostname}" is not local`);
  }
  if (url.searchParams.has('host')) return refuse('DATABASE_URL has a "host" override parameter');
}

export interface PublishedRecord {
  entityType: PublishableEntityType;
  slug: string;
  /** True when publishedAt was set by this run (false: an existing value was kept). */
  publishedAtSet: boolean;
}

export interface LeftDraftRecord {
  entityType: PublishableEntityType;
  slug: string;
  /** Exact reasons, one per validator error or static-build rule. */
  reasons: string[];
}

export interface PublishReport {
  dryRun: boolean;
  published: PublishedRecord[];
  leftDraft: LeftDraftRecord[];
  /** Seed rows that were already PUBLISHED and therefore untouched. */
  alreadyPublished: number;
  /** Seed rows in another state (ARCHIVED) that were not touched. */
  notDraft: { entityType: PublishableEntityType; slug: string; status: string }[];
  /** Seed slugs that do not exist in the database. */
  missing: { entityType: PublishableEntityType; slug: string }[];
  /** Slugs refused because they carry a test-fixture prefix. */
  refusedFixtureSlugs: { entityType: PublishableEntityType; slug: string }[];
}

export interface PublishOptions {
  /** URL to check with assertLocalDatabaseUrl. Defaults to process.env.DATABASE_URL. */
  databaseUrl?: string;
  /** Compute the report without writing anything. */
  dryRun?: boolean;
  /** Timestamp for newly set publishedAt values. Defaults to now. */
  now?: Date;
}

interface Row {
  id: string;
  slug: string;
  status: string;
  publishedAt: Date | null;
}

type Tx = Prisma.TransactionClient;

const reasonsOf = (errors: { field: string; message: string }[]) =>
  errors.map((e) => `${e.field}: ${e.message}`);

export async function publishSeedCatalog(
  prisma: PrismaClient,
  seed: SeedSlugSets,
  options: PublishOptions = {},
): Promise<PublishReport> {
  // Guard first: nothing below runs against a non-local database.
  assertLocalDatabaseUrl(options.databaseUrl ?? process.env.DATABASE_URL);

  const dryRun = options.dryRun ?? false;
  const now = options.now ?? new Date();

  return prisma.$transaction(
    async (tx) => {
      const report: PublishReport = {
        dryRun,
        published: [],
        leftDraft: [],
        alreadyPublished: 0,
        notDraft: [],
        missing: [],
        refusedFixtureSlugs: [],
      };
      const asClient = tx as unknown as PrismaClient;

      const loadRows = async (
        entityType: PublishableEntityType,
        slugs: readonly string[],
      ): Promise<Row[]> => {
        const allowed: string[] = [];
        for (const slug of new Set(slugs)) {
          if (isFixtureSlug(slug)) report.refusedFixtureSlugs.push({ entityType, slug });
          else allowed.push(slug);
        }
        const where = { slug: { in: allowed } };
        const select = { id: true, slug: true, status: true, publishedAt: true };
        const rows: Row[] =
          entityType === 'movie'
            ? await tx.movie.findMany({ where, select })
            : entityType === 'character'
              ? await tx.character.findMany({ where, select })
              : entityType === 'product'
                ? await tx.product.findMany({ where, select })
                : await tx.collection.findMany({ where, select });
        const found = new Set(rows.map((r) => r.slug));
        for (const slug of allowed) if (!found.has(slug)) report.missing.push({ entityType, slug });
        return rows;
      };

      /** Splits rows into DRAFT candidates and bookkeeping for the rest. */
      const triage = (entityType: PublishableEntityType, rows: Row[]): Row[] => {
        const drafts: Row[] = [];
        for (const row of rows) {
          if (row.status === 'DRAFT') drafts.push(row);
          else if (row.status === 'PUBLISHED') report.alreadyPublished++;
          else report.notDraft.push({ entityType, slug: row.slug, status: row.status });
        }
        return drafts;
      };

      /** Validator pass shared by all four types; returns the rows that pass. */
      const validate = async (
        entityType: PublishableEntityType,
        drafts: Row[],
      ): Promise<Row[]> => {
        const passing: Row[] = [];
        for (const row of drafts) {
          const result = await validateEntityForPublication(row.id, entityType, asClient);
          if (result.valid) passing.push(row);
          else report.leftDraft.push({ entityType, slug: row.slug, reasons: reasonsOf(result.errors) });
        }
        return passing;
      };

      const toPublish: { entityType: PublishableEntityType; row: Row }[] = [];

      // 1. Movies, characters and products: SEO validators only.
      const movieRows = await loadRows('movie', seed.movies);
      const publishableMovies = await validate('movie', triage('movie', movieRows));
      for (const row of publishableMovies) toPublish.push({ entityType: 'movie', row });

      for (const [entityType, slugs] of [
        ['character', seed.characters],
        ['product', seed.products],
      ] as const) {
        const rows = await loadRows(entityType, slugs);
        for (const row of await validate(entityType, triage(entityType, rows))) {
          toPublish.push({ entityType, row });
        }
      }

      // 2. Collections last.
      const collectionRows = await loadRows('collection', seed.collections);
      const validCollections = await validate('collection', triage('collection', collectionRows));

      // Movie ids that are PUBLISHED once this run is applied.
      const publishedMovieIds = new Set<string>([
        ...movieRows.filter((r) => r.status === 'PUBLISHED').map((r) => r.id),
        ...publishableMovies.map((r) => r.id),
      ]);

      const candidates = new Map<string, Row>();
      for (const row of validCollections) {
        const members = await tx.collectionMovie.findMany({
          where: { collectionId: row.id },
          select: { movieId: true },
        });
        // Members outside the seed set (already PUBLISHED elsewhere) also count.
        const outside = members.filter((m) => !publishedMovieIds.has(m.movieId)).map((m) => m.movieId);
        const outsidePublished = outside.length
          ? await tx.movie.count({ where: { id: { in: outside }, status: 'PUBLISHED' } })
          : 0;
        if (members.some((m) => publishedMovieIds.has(m.movieId)) || outsidePublished > 0) {
          candidates.set(row.id, row);
        } else {
          report.leftDraft.push({
            entityType: 'collection',
            slug: row.slug,
            reasons: ['movies: none of its member movies will be published (the page would list no movies)'],
          });
        }
      }

      // Related collections must be published too; resolve to a fixed point.
      const related = candidates.size
        ? await tx.collectionRelated.findMany({
            where: { sourceCollectionId: { in: [...candidates.keys()] } },
            select: {
              sourceCollectionId: true,
              targetCollectionId: true,
              targetCollection: { select: { slug: true, status: true } },
            },
          })
        : [];
      let changed = true;
      while (changed) {
        changed = false;
        for (const rel of related) {
          const source = candidates.get(rel.sourceCollectionId);
          if (!source) continue;
          const targetOk =
            candidates.has(rel.targetCollectionId) || rel.targetCollection.status === 'PUBLISHED';
          if (!targetOk) {
            candidates.delete(source.id);
            report.leftDraft.push({
              entityType: 'collection',
              slug: source.slug,
              reasons: [
                `relatedCollections: related collection "${rel.targetCollection.slug}" will not be ` +
                  'published, so the page would have an unresolved reference',
              ],
            });
            changed = true;
          }
        }
      }
      for (const row of candidates.values()) toPublish.push({ entityType: 'collection', row });

      // 3. Apply. publishedAt is set only where it is empty.
      for (const entityType of ['movie', 'character', 'product', 'collection'] as const) {
        const group = toPublish.filter((p) => p.entityType === entityType);
        const empty = group.filter((p) => p.row.publishedAt === null).map((p) => p.row.id);
        const kept = group.filter((p) => p.row.publishedAt !== null).map((p) => p.row.id);
        if (!dryRun) {
          await applyStatus(tx, entityType, empty, { status: 'PUBLISHED', publishedAt: now });
          await applyStatus(tx, entityType, kept, { status: 'PUBLISHED' });
        }
        for (const p of group) {
          report.published.push({ entityType, slug: p.row.slug, publishedAtSet: p.row.publishedAt === null });
        }
      }
      return report;
    },
    { timeout: 120_000, maxWait: 10_000 },
  );
}

async function applyStatus(
  tx: Tx,
  entityType: PublishableEntityType,
  ids: string[],
  data: { status: 'PUBLISHED'; publishedAt?: Date },
): Promise<void> {
  if (ids.length === 0) return;
  // status: 'DRAFT' in the filter keeps a concurrent change from being overwritten.
  const where = { id: { in: ids }, status: 'DRAFT' as const };
  switch (entityType) {
    case 'movie':
      await tx.movie.updateMany({ where, data });
      break;
    case 'character':
      await tx.character.updateMany({ where, data });
      break;
    case 'product':
      await tx.product.updateMany({ where, data });
      break;
    case 'collection':
      await tx.collection.updateMany({ where, data });
      break;
  }
}

/** Human-readable report for the CLI. */
export function formatPublishReport(report: PublishReport): string {
  const lines: string[] = [];
  const count = (type: PublishableEntityType) => report.published.filter((p) => p.entityType === type).length;
  lines.push(report.dryRun ? 'DRY RUN: nothing was written.' : 'Publish step complete.');
  lines.push(
    `Newly published: ${report.published.length} ` +
      `(collections ${count('collection')}, movies ${count('movie')}, ` +
      `characters ${count('character')}, products ${count('product')})`,
  );
  lines.push(`Already published (untouched): ${report.alreadyPublished}`);
  if (report.notDraft.length) {
    lines.push(`Not DRAFT or PUBLISHED (untouched): ${report.notDraft.map((n) => `${n.entityType} ${n.slug} [${n.status}]`).join(', ')}`);
  }
  if (report.missing.length) {
    lines.push(`Seed slugs missing from the database: ${report.missing.map((m) => `${m.entityType} ${m.slug}`).join(', ')}`);
  }
  if (report.refusedFixtureSlugs.length) {
    lines.push(`Refused (test-fixture prefix): ${report.refusedFixtureSlugs.map((m) => `${m.entityType} ${m.slug}`).join(', ')}`);
  }
  if (report.leftDraft.length === 0) {
    lines.push('Left DRAFT: none');
  } else {
    lines.push(`Left DRAFT: ${report.leftDraft.length}`);
    for (const r of report.leftDraft) lines.push(`  - ${r.entityType} "${r.slug}": ${r.reasons.join('; ')}`);
  }
  return lines.join('\n');
}
