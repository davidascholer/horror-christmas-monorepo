/**
 * Publish the seed catalog (Task 3.5).   npm run seed:publish [-- --dry-run]
 *
 * Seeding stays DRAFT-only. This is the separate step that publishes the seed
 * records which pass the publication validators, in the LOCAL development
 * database only. The records it may touch are exactly the slugs in the seed
 * files (collections, movies, characters, products); no other DRAFT row in the
 * database is ever published, and test-fixture slugs are refused outright.
 *
 * It refuses to run unless DATABASE_URL points at localhost / 127.0.0.1 / ::1.
 * Running it twice changes nothing the second time. Records that fail the
 * validators stay DRAFT and are listed with the exact reasons.
 */
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { launchCollections } from './seed-collections';
import { movies } from './seed-movies';
import { characters } from './seed-characters';
import { products } from './seed-products';
import {
  assertLocalDatabaseUrl,
  formatPublishReport,
  publishSeedCatalog,
  type SeedSlugSets,
} from '../src/publishing/publish-seed';

/** The deliberate allow-list: every slug the seed scripts create. */
export const seedSlugSets: SeedSlugSets = {
  collections: launchCollections.map((c) => c.slug),
  movies: movies.map((m) => m.slug),
  characters: characters.map((c) => c.slug),
  products: products.map((p) => p.slug),
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  // tsx does not load .env; Node's loader never overrides variables already set.
  if (!process.env.DATABASE_URL && existsSync('.env')) process.loadEnvFile('.env');
  const databaseUrl = process.env.DATABASE_URL;
  assertLocalDatabaseUrl(databaseUrl); // before a client is even created

  // The client is bound to the exact URL that was just checked.
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const report = await publishSeedCatalog(prisma, seedSlugSets, { databaseUrl, dryRun });
    console.log(formatPublishReport(report));

    const by = async (model: { groupBy: Function }) =>
      Object.fromEntries(
        (await model.groupBy({ by: ['status'], _count: true })).map(
          (g: { status: string; _count: number }) => [g.status, g._count],
        ),
      );
    console.log('\nDatabase counts by status (all rows):');
    console.log('  collections', await by(prisma.collection));
    console.log('  movies     ', await by(prisma.movie));
    console.log('  characters ', await by(prisma.character));
    console.log('  products   ', await by(prisma.product));
    if (report.leftDraft.length > 0) process.exitCode = 2; // visible to scripts; data is consistent
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
