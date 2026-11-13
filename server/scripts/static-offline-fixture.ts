/**
 * Fixture helper for web/scripts/verify-static-offline.ts (Task 6.6).
 *
 * Inserts, counts or removes a small PUBLISHED fixture set whose slugs all start
 * with a unique prefix, so the "static pages work with the API stopped" check
 * can run against the real stack without touching seed data.
 *
 *   npm run fixture:static-offline -- seed  zz-offline-check
 *   npm run fixture:static-offline -- count zz-offline-check
 *   npm run fixture:static-offline -- clean zz-offline-check
 *
 * The prefix must look like `zz-<something>` (at least 6 more characters), and
 * `clean` only ever deletes rows whose slug starts with it. Collections, movies,
 * characters and products are removed; join rows and affiliate links go with
 * them (ON DELETE CASCADE). `seed` removes an earlier run's rows first, so it can
 * be repeated. Prints one JSON line to stdout. Not used by the server or its tests.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PREFIX_RULE = /^zz-[a-z0-9-]{6,}$/;

async function count(prefix: string) {
  const where = { slug: { startsWith: prefix } };
  const [collections, movies, characters, products] = await Promise.all([
    prisma.collection.count({ where }),
    prisma.movie.count({ where }),
    prisma.character.count({ where }),
    prisma.product.count({ where }),
  ]);
  return { collections, movies, characters, products };
}

async function clean(prefix: string) {
  const where = { slug: { startsWith: prefix } };
  await prisma.collection.deleteMany({ where });
  await prisma.movie.deleteMany({ where });
  await prisma.character.deleteMany({ where });
  await prisma.product.deleteMany({ where });
}

async function seed(prefix: string) {
  await clean(prefix);
  const now = new Date();
  const seo = (name: string) => ({ seoTitle: `${name} | Offline check`, seoDescription: `${name} fixture for the offline check.` });
  const s = (name: string) => `${prefix}-${name}`;

  const movieA = await prisma.movie.create({
    data: {
      slug: s('movie-a'), title: 'Offline Movie A', status: 'PUBLISHED', publishedAt: now, mediaType: 'FILM',
      synopsis: 'A fixture movie.', releaseYear: 1984, runtime: 95, poster: 'https://img.example.test/a.jpg', ...seo('Offline Movie A'),
    },
  });
  const movieB = await prisma.movie.create({
    data: { slug: s('movie-b'), title: 'Offline Movie B', status: 'PUBLISHED', publishedAt: now, mediaType: 'FILM', ...seo('Offline Movie B') },
  });
  const character = await prisma.character.create({
    data: { slug: s('character'), name: 'Offline Character', status: 'PUBLISHED', publishedAt: now, summary: 'A fixture character.', ...seo('Offline Character') },
  });
  const product = await prisma.product.create({
    data: {
      slug: s('product'), name: 'Offline Product', status: 'PUBLISHED', publishedAt: now, description: 'A fixture product.',
      price: '24.90', currency: 'USD', image: 'https://img.example.test/p.jpg', imageAlt: 'Offline product',
      affiliateLinks: { create: [{ provider: 'ExampleShop', url: 'https://shop.example.test/offline-product' }] },
      ...seo('Offline Product'),
    },
  });
  await prisma.movieCharacter.create({ data: { movieId: movieA.id, characterId: character.id, sortOrder: 1, role: 'Lead' } });
  await prisma.productCharacter.create({ data: { productId: product.id, characterId: character.id, sortOrder: 1 } });

  const base = {
    type: 'THEME' as const, status: 'PUBLISHED' as const, publishedAt: now,
    introduction: 'Fixture introduction.', curatorNotes: 'Fixture curator notes.',
    heroImage: 'https://img.example.test/hero.jpg', heroImageAlt: 'Fixture hero',
  };
  const one = await prisma.collection.create({
    data: {
      ...base, slug: s('collection-one'), title: 'Offline Collection One', summary: 'First fixture collection.', ...seo('Offline Collection One'),
      movies: { create: [{ movieId: movieB.id, sortOrder: 1, curatorNote: 'Watch me first' }, { movieId: movieA.id, sortOrder: 2 }] },
      characters: { create: [{ characterId: character.id, sortOrder: 1 }] },
      products: { create: [{ productId: product.id, sortOrder: 1 }] },
    },
  });
  const two = await prisma.collection.create({
    data: {
      ...base, slug: s('collection-two'), title: 'Offline Collection Two', ...seo('Offline Collection Two'),
      movies: { create: [{ movieId: movieA.id, sortOrder: 1 }] },
    },
  });
  await prisma.collectionRelated.createMany({
    data: [
      { sourceCollectionId: one.id, targetCollectionId: two.id, sortOrder: 1 },
      { sourceCollectionId: two.id, targetCollectionId: one.id, sortOrder: 1 },
    ],
  });
}

async function main() {
  const [command, prefix] = process.argv.slice(2);
  if (!['seed', 'count', 'clean'].includes(command ?? '') || !prefix || !PREFIX_RULE.test(prefix)) {
    throw new Error('usage: static-offline-fixture <seed|count|clean> <prefix>   (prefix like zz-offline-check)');
  }
  if (command === 'seed') await seed(prefix);
  if (command === 'clean') await clean(prefix);
  console.log(JSON.stringify({ command, prefix, rows: await count(prefix) }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
