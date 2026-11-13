/**
 * Search Service Tests (Task 5.1)
 *
 * Uses the shared catalog fixture (unique slug prefix, scoped cleanup).
 * Mixed-category ordering proofs are Task 5.2; this file only checks that
 * results arrive in the documented category-priority order.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  SearchService,
  SEARCH_CATEGORY_ORDER,
  MAX_SEARCH_QUERY_LENGTH,
  normalizeSearchQuery,
} from './search.service.js';
import { createCatalogFixture, CatalogFixture } from './test-fixtures.js';

const prisma = new PrismaClient();
const service = new SearchService(prisma);
let fx: CatalogFixture;
let word: string; // unique, alphabetic-safe token for fallback records

const own = (rs: { slug: string }[]) => rs.filter((r) => r.slug.startsWith(fx.prefix));

beforeAll(async () => {
  fx = await createCatalogFixture(prisma, 'srch');
  word = fx.token;
  const s = (n: string) => `${fx.prefix}${n}`;
  // Records for summary fallback tests (removed by prefix-scoped cleanup)
  await prisma.collection.create({
    data: { slug: s('fb-col-intro'), title: `${word} fbcol`, type: 'THEME', status: 'PUBLISHED', introduction: 'Intro fallback text', curatorNotes: 'n', summary: '   ' },
  });
  await prisma.movie.create({
    data: { slug: s('fb-movie-syn'), title: `${word} fbmovie`, status: 'PUBLISHED', synopsis: 'x'.repeat(500) },
  });
  await prisma.character.create({
    data: { slug: s('fb-char-bio'), name: `${word} fbchar`, status: 'PUBLISHED', biography: 'Bio fallback text' },
  });
  await prisma.product.create({
    data: { slug: s('fb-prod-desc'), name: `${word} fbprod`, status: 'PUBLISHED', description: 'Desc text' },
  });
  await prisma.movie.create({ data: { slug: s('movie-arch-2'), title: `${word} archivedmatch`, status: 'ARCHIVED' } });
});

afterAll(async () => {
  await fx.cleanup();
  await prisma.$disconnect();
});

describe('SearchService.search: empty input', () => {
  it('returns [] for undefined, null, empty and whitespace-only queries', async () => {
    for (const q of [undefined, null, '', '   ', '\t\n ', '\0']) {
      expect(await service.search(q)).toEqual([]);
    }
  });

  it('normalizeSearchQuery trims, strips NUL and caps length', () => {
    expect(normalizeSearchQuery('  hi \0 ')).toBe('hi');
    expect(normalizeSearchQuery('a'.repeat(MAX_SEARCH_QUERY_LENGTH + 50))).toHaveLength(MAX_SEARCH_QUERY_LENGTH);
  });
});

describe('SearchService.search: results', () => {
  it('returns exactly the SearchResult fields as strings', async () => {
    const results = own(await service.search(fx.token));
    expect(results.length).toBeGreaterThan(0);
    for (const r of results as any[]) {
      expect(Object.keys(r).sort()).toEqual(['id', 'slug', 'summary', 'title', 'type']);
      for (const k of ['id', 'slug', 'summary', 'title', 'type']) expect(typeof r[k]).toBe('string');
      expect(SEARCH_CATEGORY_ORDER).toContain(r.type);
    }
  });

  it('serializes ids, slugs and titles from the matching records', async () => {
    const results = await service.search(fx.token);
    const char = results.find((r) => r.slug === fx.slugs.characterA)!;
    const dbChar = await prisma.character.findUnique({ where: { slug: fx.slugs.characterA } });
    expect(char).toEqual({
      type: 'character',
      id: dbChar!.id,
      slug: fx.slugs.characterA,
      title: `${fx.token} Alpha Character`, // characters use name as title
      summary: 'A summary',
    });
    const product = results.find((r) => r.slug === fx.slugs.productPriced)!;
    expect(product.type).toBe('product');
    expect(product.title).toBe(`${fx.token} Priced Product`); // products use name
    const movie = results.find((r) => r.slug === fx.slugs.movieOld)!;
    expect(movie.type).toBe('movie');
    expect(movie.title).toBe(`${fx.token} Old Movie`);
    const col = results.find((r) => r.slug === fx.slugs.collection)!;
    expect(col.type).toBe('collection');
    expect(col.summary).toBe('Main summary');
  });

  it('covers all four entity types', async () => {
    const types = new Set(own(await service.search(fx.token)).map((r) => r.type));
    expect([...types].sort()).toEqual([...SEARCH_CATEGORY_ORDER].sort());
  });

  it('lists categories in priority order: collections, movies, characters, products', async () => {
    const types = own(await service.search(fx.token)).map((r) => r.type);
    const priorities = types.map((t) => SEARCH_CATEGORY_ORDER.indexOf(t));
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
  });

  it('is case-insensitive', async () => {
    const lower = own(await service.search(fx.token.toLowerCase())).map((r) => r.slug);
    const upper = own(await service.search(fx.token.toUpperCase())).map((r) => r.slug);
    expect(upper).toEqual(lower);
    expect(lower.length).toBeGreaterThan(0);
  });
});

describe('SearchService.search: published only', () => {
  it('never returns draft or archived records', async () => {
    const slugs = (await service.search(fx.token)).map((r) => r.slug);
    for (const hidden of [
      fx.slugs.collectionDraft,
      fx.slugs.movieDraft,
      fx.slugs.movieArchived,
      fx.slugs.characterDraft,
      fx.slugs.productDraft,
      `${fx.prefix}movie-arch-2`,
    ]) {
      expect(slugs).not.toContain(hidden);
    }
  });

  it('returns [] when only a draft or archived record matches', async () => {
    expect(await service.search(`${word} archivedmatch`)).toEqual([]);
    expect(own(await service.search(`${fx.token} Draft Product`)).map((r) => r.slug)).not.toContain(
      fx.slugs.productDraft,
    );
  });
});

describe('SearchService.search: summary fallback', () => {
  const find = async (slug: string) => (await service.search(fx.token)).find((r) => r.slug === `${fx.prefix}${slug}`)!;

  it('collection: blank summary falls back to introduction', async () => {
    expect((await find('fb-col-intro')).summary).toBe('Intro fallback text');
  });
  it('movie: synopsis is excerpted to 200 characters', async () => {
    expect((await find('fb-movie-syn')).summary).toBe('x'.repeat(200));
  });
  it('character: missing summary falls back to biography', async () => {
    expect((await find('fb-char-bio')).summary).toBe('Bio fallback text');
  });
  it('product: description used as summary', async () => {
    expect((await find('fb-prod-desc')).summary).toBe('Desc text');
  });
  it('falls back to an empty string, never null', async () => {
    expect((await service.search(fx.token)).find((r) => r.slug === fx.slugs.movieOld)!.summary).toBe('');
    expect((await service.search(fx.token)).find((r) => r.slug === fx.slugs.productUnpriced)!.summary).toBe('');
  });
});

describe('SearchService.search: hostile input', () => {
  const inputs = [
    "'",
    '"',
    '"unterminated phrase',
    "x'; DROP TABLE \"Movie\"; --",
    `${'fx'}' OR '1'='1`,
    'a & b | c ! d',
    '!!!',
    '& | ! <-> :*',
    '((()))',
    'foo:*bar',
    '\\',
    '-',
    '%_',
    '<script>alert(1)</script>',
    'ü☃',
    'a'.repeat(5000),
  ];

  it('never throws and always returns an array', async () => {
    for (const q of inputs) {
      const res = await service.search(q);
      expect(Array.isArray(res)).toBe(true);
    }
  });

  it('does not alter data (injection attempt leaves tables intact)', async () => {
    await service.search(`x'; DELETE FROM "Movie"; --`);
    expect(await prisma.movie.count({ where: { slug: fx.slugs.movieOld } })).toBe(1);
  });

  it('tsquery operators are treated as text, not syntax', async () => {
    // "token & !token" must not behave as a boolean AND-NOT that excludes everything
    const plain = own(await service.search(fx.token)).length;
    const withOps = own(await service.search(`${fx.token} & | ( ) <->`)).length;
    expect(withOps).toBe(plain);
  });

  it('websearch exclusion with "-" works as documented without erroring', async () => {
    const res = own(await service.search(`${fx.token} -draft`));
    expect(Array.isArray(res)).toBe(true);
  });
});
