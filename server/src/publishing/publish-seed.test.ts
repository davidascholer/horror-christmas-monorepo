/**
 * Tests for the seed publish step (Task 3.5).
 *
 * Every database row created here uses a unique slug prefix ("pub35<random>-")
 * and cleanup removes only rows with that prefix, so seed data (draft or
 * published) is never read as a precondition and never modified. The publish
 * function is given the fixture slugs as its "seed set", which is exactly how
 * the real CLI restricts itself to the seed catalog.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  FIXTURE_SLUG_PREFIXES,
  assertLocalDatabaseUrl,
  isFixtureSlug,
  publishSeedCatalog,
  type SeedSlugSets,
} from './publish-seed.js';
import { launchCollections } from '../../prisma/seed-collections';
import { movies as seedMovies } from '../../prisma/seed-movies';
import { characters as seedCharacters } from '../../prisma/seed-characters';
import { products as seedProducts } from '../../prisma/seed-products';

const prisma = new PrismaClient();
const LOCAL_URL = 'postgresql://postgres:x@localhost:5433/horror_christmas_dev?schema=public';
const NOW = new Date('2030-01-02T03:04:05.000Z');

let prefix: string;
let s: (name: string) => string;
let sets: SeedSlugSets;

const seo = { seoTitle: 'A title', seoDescription: 'A description' };

async function makeCollection(name: string, extra: Record<string, unknown> = {}) {
  return prisma.collection.create({
    data: {
      slug: s(name),
      title: name,
      type: 'THEME',
      introduction: 'Intro',
      curatorNotes: 'Notes',
      heroImage: '/images/x.jpg',
      heroImageAlt: 'Alt',
      ...seo,
      ...extra,
    },
  });
}

async function build() {
  const mOk = await prisma.movie.create({ data: { slug: s('m-ok'), title: 'Ok', ...seo } });
  const mBad = await prisma.movie.create({ data: { slug: s('m-bad'), title: 'Bad', seoTitle: 'Only title' } });
  await prisma.character.create({ data: { slug: s('c-ok'), name: 'Ok', ...seo } });
  await prisma.character.create({ data: { slug: s('c-bad'), name: 'Bad', seoDescription: 'Only description' } });
  await prisma.product.create({ data: { slug: s('p-ok'), name: 'Ok', ...seo } });
  await prisma.product.create({ data: { slug: s('p-bad'), name: 'Bad' } });

  const a = await makeCollection('col-a');
  const b = await makeCollection('col-b');
  const c = await makeCollection('col-c'); // relates to a collection that fails validation
  const d = await makeCollection('col-d', { heroImageAlt: '' }); // fails validators
  const e = await makeCollection('col-e'); // only member movie is not publishable
  const f = await makeCollection('col-f', { seoTitle: null }); // fails validators: no related either

  await prisma.collectionMovie.createMany({
    data: [a, b, c, d].map((col) => ({ collectionId: col.id, movieId: mOk.id, sortOrder: 1 })),
  });
  await prisma.collectionMovie.create({ data: { collectionId: e.id, movieId: mBad.id, sortOrder: 1 } });
  await prisma.collectionMovie.create({ data: { collectionId: f.id, movieId: mOk.id, sortOrder: 1 } });
  await prisma.collectionRelated.createMany({
    data: [
      { sourceCollectionId: a.id, targetCollectionId: b.id, sortOrder: 1 },
      { sourceCollectionId: b.id, targetCollectionId: a.id, sortOrder: 1 },
      { sourceCollectionId: c.id, targetCollectionId: d.id, sortOrder: 1 },
      { sourceCollectionId: d.id, targetCollectionId: c.id, sortOrder: 1 },
      { sourceCollectionId: e.id, targetCollectionId: a.id, sortOrder: 1 },
    ],
  });

  sets = {
    collections: ['col-a', 'col-b', 'col-c', 'col-d', 'col-e', 'col-f'].map(s),
    movies: ['m-ok', 'm-bad'].map(s),
    characters: ['c-ok', 'c-bad'].map(s),
    products: ['p-ok', 'p-bad'].map(s),
  };
}

const status = async (type: 'collection' | 'movie' | 'character' | 'product', name: string) => {
  const where = { slug: s(name) };
  const row =
    type === 'collection'
      ? await prisma.collection.findUnique({ where })
      : type === 'movie'
        ? await prisma.movie.findUnique({ where })
        : type === 'character'
          ? await prisma.character.findUnique({ where })
          : await prisma.product.findUnique({ where });
  return row!;
};

const run = (dryRun = false) =>
  publishSeedCatalog(prisma, sets, { databaseUrl: LOCAL_URL, dryRun, now: NOW });

beforeEach(async () => {
  prefix = `pub35${Math.random().toString(36).slice(2, 8)}-`;
  s = (name) => `${prefix}${name}`;
  await build();
});

afterEach(async () => {
  const where = { slug: { startsWith: prefix } };
  await prisma.collection.deleteMany({ where });
  await prisma.movie.deleteMany({ where });
  await prisma.character.deleteMany({ where });
  await prisma.product.deleteMany({ where });
  await prisma.collection.deleteMany({ where: { slug: { startsWith: `zz-${prefix}` } } });
});

describe('publishSeedCatalog', () => {
  it('publishes passing records with publishedAt set to now', async () => {
    const report = await run();
    for (const [type, name] of [
      ['movie', 'm-ok'],
      ['character', 'c-ok'],
      ['product', 'p-ok'],
      ['collection', 'col-a'],
      ['collection', 'col-b'],
    ] as const) {
      const row = await status(type, name);
      expect(row.status, name).toBe('PUBLISHED');
      expect(row.publishedAt, name).toEqual(NOW);
    }
    expect(report.published.map((p) => p.slug).sort()).toEqual(
      ['col-a', 'col-b', 'm-ok', 'c-ok', 'p-ok'].map(s).sort(),
    );
  });

  it('leaves failing records DRAFT and reports the exact validator reasons', async () => {
    const report = await run();
    const reasons = (name: string) => report.leftDraft.find((r) => r.slug === s(name))?.reasons ?? [];

    expect((await status('movie', 'm-bad')).status).toBe('DRAFT');
    expect((await status('movie', 'm-bad')).publishedAt).toBeNull();
    expect(reasons('m-bad')).toEqual(['seoDescription: SEO description is required for publication']);
    expect(reasons('c-bad')).toEqual(['seoTitle: SEO title is required for publication']);
    expect(reasons('p-bad')).toEqual([
      'seoTitle: SEO title is required for publication',
      'seoDescription: SEO description is required for publication',
    ]);
    expect(reasons('col-d')).toEqual(['heroImageAlt: Hero image alt text is required for publication']);
    expect(reasons('col-f')).toEqual([
      'seoTitle: SEO title is required for publication',
      'relatedCollections: At least one related collection is required for publication',
    ]);
    for (const name of ['c-bad', 'p-bad', 'col-d', 'col-f']) {
      const type = name.startsWith('c-') ? 'character' : name.startsWith('p-') ? 'product' : 'collection';
      expect((await status(type, name)).status, name).toBe('DRAFT');
    }
  });

  it('keeps a collection DRAFT when no member movie or a related collection will not be published', async () => {
    const report = await run();
    const reasons = (name: string) => report.leftDraft.find((r) => r.slug === s(name))?.reasons ?? [];

    // col-e: its only movie fails validation
    expect((await status('collection', 'col-e')).status).toBe('DRAFT');
    expect(reasons('col-e')[0]).toMatch(/^movies: none of its member movies will be published/);

    // col-c: passes the validators but relates to col-d, which stays DRAFT
    expect((await status('collection', 'col-c')).status).toBe('DRAFT');
    expect(reasons('col-c')).toEqual([
      `relatedCollections: related collection "${s('col-d')}" will not be published, so the page would have an unresolved reference`,
    ]);
  });

  it('is idempotent: a second run changes nothing', async () => {
    await run();
    const snapshot = async () =>
      JSON.stringify(
        await Promise.all([
          prisma.collection.findMany({ where: { slug: { startsWith: prefix } }, orderBy: { slug: 'asc' } }),
          prisma.movie.findMany({ where: { slug: { startsWith: prefix } }, orderBy: { slug: 'asc' } }),
          prisma.character.findMany({ where: { slug: { startsWith: prefix } }, orderBy: { slug: 'asc' } }),
          prisma.product.findMany({ where: { slug: { startsWith: prefix } }, orderBy: { slug: 'asc' } }),
        ]),
      );
    const before = await snapshot();
    const second = await publishSeedCatalog(prisma, sets, {
      databaseUrl: LOCAL_URL,
      now: new Date('2031-01-01T00:00:00.000Z'),
    });
    expect(second.published).toEqual([]);
    expect(second.alreadyPublished).toBe(5);
    expect(await snapshot()).toBe(before); // includes updatedAt and publishedAt
  });

  it('does not overwrite an existing publishedAt', async () => {
    const earlier = new Date('2020-05-05T05:05:05.000Z');
    // DRAFT row that already carries a publishedAt (for example a previously unpublished record)
    await prisma.movie.update({ where: { slug: s('m-ok') }, data: { publishedAt: earlier } });
    // Row that is already PUBLISHED with its own timestamp
    await prisma.character.update({
      where: { slug: s('c-ok') },
      data: { status: 'PUBLISHED', publishedAt: earlier },
    });

    const report = await run();

    const movie = await status('movie', 'm-ok');
    expect(movie.status).toBe('PUBLISHED');
    expect(movie.publishedAt).toEqual(earlier);
    expect(report.published.find((p) => p.slug === s('m-ok'))?.publishedAtSet).toBe(false);
    expect((await status('character', 'c-ok')).publishedAt).toEqual(earlier);
  });

  it('never revives ARCHIVED rows', async () => {
    await prisma.movie.update({ where: { slug: s('m-ok') }, data: { status: 'ARCHIVED' } });
    const report = await run();
    expect((await status('movie', 'm-ok')).status).toBe('ARCHIVED');
    expect(report.notDraft).toContainEqual({ entityType: 'movie', slug: s('m-ok'), status: 'ARCHIVED' });
  });

  it('dry run reports the plan and writes nothing', async () => {
    const report = await run(true);
    expect(report.dryRun).toBe(true);
    expect(report.published.length).toBe(5);
    expect((await status('movie', 'm-ok')).status).toBe('DRAFT');
    expect((await status('collection', 'col-a')).status).toBe('DRAFT');
  });

  it('only touches the given seed slugs and refuses fixture-prefixed slugs', async () => {
    // A valid DRAFT row outside the seed set must stay DRAFT.
    await prisma.movie.create({ data: { slug: s('not-in-seed'), title: 'Other', ...seo } });
    // A valid DRAFT row inside the set, but with a fixture prefix, must also stay DRAFT.
    const zz = `zz-${prefix}collection`;
    await prisma.collection.create({
      data: { slug: zz, title: 'zz', type: 'THEME', introduction: 'i', curatorNotes: 'n', heroImage: '/x.jpg', heroImageAlt: 'a', ...seo },
    });
    sets = { ...sets, collections: [...sets.collections, zz] };

    const report = await run();

    expect((await status('movie', 'not-in-seed')).status).toBe('DRAFT');
    expect((await prisma.collection.findUnique({ where: { slug: zz } }))!.status).toBe('DRAFT');
    expect(report.refusedFixtureSlugs).toEqual([{ entityType: 'collection', slug: zz }]);
    expect(report.published.some((p) => p.slug === zz || p.slug === s('not-in-seed'))).toBe(false);
  });

  it('reports seed slugs that are missing from the database', async () => {
    sets = { ...sets, movies: [...sets.movies, s('does-not-exist')] };
    const report = await run();
    expect(report.missing).toEqual([{ entityType: 'movie', slug: s('does-not-exist') }]);
  });
});

describe('local database guard', () => {
  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['not a URL', 'not a url'],
    ['remote host', 'postgresql://u:p@db.example.com:5432/x'],
    ['remote host with local-looking user', 'postgresql://localhost@db.example.com/x'],
    ['private IP', 'postgresql://u:p@10.0.0.5:5432/x'],
    ['host override parameter', 'postgresql://u:p@localhost:5432/x?host=db.example.com'],
    ['non-postgres protocol', 'mysql://u:p@localhost:3306/x'],
  ])('refuses %s', (_label, url) => {
    expect(() => assertLocalDatabaseUrl(url)).toThrow(/Refusing to publish/);
  });

  it.each([
    'postgresql://u:p@localhost:5433/db?schema=public',
    'postgresql://u:p@127.0.0.1:5432/db',
    'postgres://u:p@[::1]:5432/db',
  ])('accepts %s', (url) => {
    expect(() => assertLocalDatabaseUrl(url)).not.toThrow();
  });

  it('refuses before touching any row when the URL is not local', async () => {
    await expect(
      publishSeedCatalog(prisma, sets, { databaseUrl: 'postgresql://u:p@db.example.com:5432/x', now: NOW }),
    ).rejects.toThrow(/Refusing to publish/);
    expect((await status('movie', 'm-ok')).status).toBe('DRAFT');
    expect((await status('collection', 'col-a')).status).toBe('DRAFT');
  });
});

describe('seed catalog completeness (no database)', () => {
  const usable = (url: string) => /^https?:\/\//.test(url) || (url.startsWith('/') && !url.startsWith('//'));
  const filled = (v: string | undefined | null) => typeof v === 'string' && v.trim() !== '';

  it('has no seed slug with a test-fixture prefix', () => {
    const all = [...launchCollections, ...seedMovies, ...seedCharacters, ...seedProducts].map((r) => r.slug);
    expect(all.filter(isFixtureSlug)).toEqual([]);
    expect(FIXTURE_SLUG_PREFIXES.length).toBeGreaterThan(0);
  });

  it('gives every seeded record the SEO fields the validators require', () => {
    for (const r of [...launchCollections, ...seedMovies, ...seedCharacters, ...seedProducts]) {
      expect(filled(r.seoTitle), `${r.slug} seoTitle`).toBe(true);
      expect(filled(r.seoDescription), `${r.slug} seoDescription`).toBe(true);
    }
  });

  it('gives every collection introduction, curator notes, hero image + alt and related collections', async () => {
    const { collectionRelationships } = await import('../../prisma/seed-collections');
    const slugs = new Set(launchCollections.map((c) => c.slug));
    for (const c of launchCollections) {
      expect(filled(c.introduction), `${c.slug} introduction`).toBe(true);
      expect(filled(c.curatorNotes), `${c.slug} curatorNotes`).toBe(true);
      expect(usable(c.heroImage), `${c.slug} heroImage`).toBe(true);
      expect(filled(c.heroImageAlt), `${c.slug} heroImageAlt`).toBe(true);
      const related = (collectionRelationships as Record<string, string[]>)[c.slug] ?? [];
      expect(related.length, `${c.slug} related`).toBeGreaterThan(0);
      for (const t of related) expect(slugs.has(t), `${c.slug} -> ${t}`).toBe(true);
    }
  });

  it('uses only http(s) or root-relative image URLs', () => {
    for (const m of seedMovies) {
      expect(usable(m.poster), `${m.slug} poster`).toBe(true);
      expect(usable(m.hero), `${m.slug} hero`).toBe(true);
    }
    for (const c of seedCharacters) expect(usable(c.image), `${c.slug} image`).toBe(true);
    for (const p of seedProducts) expect(usable(p.image), `${p.slug} image`).toBe(true);
  });

  it('has only well-formed http(s) trailer URLs (a corrupted Gremlins URL was removed in Task 3.5)', () => {
    for (const m of seedMovies) {
      if (m.trailerUrl === undefined) continue;
      expect(m.trailerUrl, `${m.slug} trailerUrl`).toMatch(/^https:\/\/[\x21-\x7e]+$/);
    }
  });

  it('flags the homepage content: featured movie/character/collection, seasonal collection and the gift collection', () => {
    expect(seedMovies.some((m) => m.featured)).toBe(true);
    expect(seedCharacters.some((c) => c.featured)).toBe(true);
    expect(launchCollections.some((c) => c.featured)).toBe(true);
    expect(launchCollections.some((c) => c.seasonal)).toBe(true);
    const gift = launchCollections.find((c) => c.slug === 'best-gifts-for-krampus-fans');
    expect(gift?.type).toBe('GIFT');
  });
});
