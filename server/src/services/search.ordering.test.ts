/**
 * Search ordering and serialization proofs (Task 5.2)
 *
 * Requirements 7.2, 7.4. Design 4.4, design section 9 property 5.
 *
 * Fixtures use a unique slug prefix and prefix-scoped cleanup (same pattern as
 * test-fixtures.ts). Seed data is never read or modified: every query uses a
 * token that exists only in these fixture rows.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SearchService, SEARCH_CATEGORY_ORDER, MAX_SEARCH_RESULTS } from './search.service.js';
import { HomeService } from './home.service.js';
import { CollectionService } from './collection.service.js';
import { MovieService } from './movie.service.js';
import { CharacterService } from './character.service.js';
import { ProductService } from './product.service.js';
import { dispatch, ApiServices } from '../api/routes.js';
import type { SearchResult } from '../types/api-contracts.js';

const prisma = new PrismaClient();
const service = new SearchService(prisma);
const services: ApiServices = {
  home: new HomeService(prisma),
  collections: new CollectionService(prisma),
  movies: new MovieService(prisma),
  characters: new CharacterService(prisma),
  products: new ProductService(prisma),
  search: service,
} as ApiServices;

// Compile-time check: fails to compile if SearchResult gains/loses a field.
const SEARCH_RESULT_KEYS = Object.keys({
  type: true,
  id: true,
  slug: true,
  title: true,
  summary: true,
} satisfies Record<keyof SearchResult, true>).sort();

const rand = () => Math.random().toString(36).slice(2, 8);
const cleanupPrefix = async (prefix: string) => {
  const where = { slug: { startsWith: prefix } };
  await prisma.collection.deleteMany({ where });
  await prisma.movie.deleteMany({ where });
  await prisma.character.deleteMany({ where });
  await prisma.product.deleteMany({ where });
};

// ---------------------------------------------------------------------------
// Mixed-category fixture
// ---------------------------------------------------------------------------
const word = `t52mix${rand()}`;
const prefix = `${word}-`;
const s = (n: string) => `${prefix}${n}`;
const W3 = `${word} ${word} ${word}`; // repeated term: much higher ts_rank
const ID_TIE_1 = `${prefix}id-a`;
const ID_TIE_2 = `${prefix}id-b`;

interface Expected {
  type: SearchResult['type'];
  slug: string;
  title: string;
  summary: string;
}

/** The full expected result list, in the exact documented order. */
const expected: Expected[] = [
  // Collections: rank A (title) ties ordered by title then id; intro-only (rank C) last.
  { type: 'collection', slug: s('col-alpha'), title: `${word} Alpha`, summary: 'Col summary' },
  { type: 'collection', slug: s('col-mid-1'), title: `${word} Mid`, summary: 'y'.repeat(200) },
  { type: 'collection', slug: s('col-mid-2'), title: `${word} Mid`, summary: '' },
  { type: 'collection', slug: s('col-zulu'), title: `${word} Zulu`, summary: 'Intro fallback' },
  { type: 'collection', slug: s('col-low'), title: 'Aaa low rank', summary: `intro ${word}` },
  // Movies
  { type: 'movie', slug: s('mov-alpha'), title: `${word} Alpha`, summary: 'x'.repeat(200) },
  { type: 'movie', slug: s('mov-bravo'), title: `${word} Bravo`, summary: '' },
  { type: 'movie', slug: s('mov-low'), title: 'Aaa low rank', summary: `Synopsis ${word}` },
  // Characters: repeated term first
  { type: 'character', slug: s('chr-hi'), title: W3, summary: 'Char summary' },
  { type: 'character', slug: s('chr-alpha'), title: `${word} Alpha`, summary: 'b'.repeat(200) },
  { type: 'character', slug: s('chr-bravo'), title: `${word} Bravo`, summary: '' },
  { type: 'character', slug: s('chr-low'), title: 'Aaa low rank', summary: word },
  // Products: repeated term (highest ts_rank of all) comes last by category
  { type: 'product', slug: s('prd-hi'), title: W3, summary: `Hi desc ${word}` },
  { type: 'product', slug: s('prd-alpha'), title: `${word} Alpha`, summary: 'Prod desc' },
  { type: 'product', slug: s('prd-bravo'), title: `${word} Bravo`, summary: 'z'.repeat(200) },
  { type: 'product', slug: s('prd-zulu'), title: `${word} Zulu`, summary: '' },
];

let ids: Map<string, string>;

beforeAll(async () => {
  const P = 'PUBLISHED' as const;
  const col = (slug: string, title: string, data: Record<string, unknown> = {}) =>
    prisma.collection.create({
      data: { slug, title, type: 'THEME', introduction: 'Intro', curatorNotes: 'n', status: P, ...data } as any,
    });

  // Insert out of expected order on purpose; id tie rows inserted b before a.
  await col(s('col-low'), 'Aaa low rank', { introduction: `intro ${word}` });
  await col(s('col-zulu'), `${word} Zulu`, { summary: '   ', introduction: 'Intro fallback' });
  await col(s('col-mid-2'), `${word} Mid`, { id: ID_TIE_2, introduction: '' });
  await col(s('col-mid-1'), `${word} Mid`, { id: ID_TIE_1, introduction: 'y'.repeat(300) });
  await col(s('col-alpha'), `${word} Alpha`, { summary: 'Col summary' });
  await col(s('col-draft'), `${word} Draft`, { status: 'DRAFT' });

  const mov = (slug: string, title: string, synopsis?: string, status: any = P) =>
    prisma.movie.create({ data: { slug, title, synopsis, status } });
  await mov(s('mov-low'), 'Aaa low rank', `Synopsis ${word}`);
  await mov(s('mov-bravo'), `${word} Bravo`);
  await mov(s('mov-alpha'), `${word} Alpha`, 'x'.repeat(300));
  await mov(s('mov-draft'), `${word} Draft`, undefined, 'DRAFT');

  const chr = (slug: string, name: string, data: Record<string, unknown> = {}) =>
    prisma.character.create({ data: { slug, name, status: P, ...data } as any });
  await chr(s('chr-low'), 'Aaa low rank', { biography: word });
  await chr(s('chr-bravo'), `${word} Bravo`);
  await chr(s('chr-alpha'), `${word} Alpha`, { summary: '  ', biography: 'b'.repeat(250) });
  await chr(s('chr-hi'), W3, { summary: 'Char summary' });

  const prd = (slug: string, name: string, description?: string) =>
    prisma.product.create({ data: { slug, name, description, status: P } });
  await prd(s('prd-zulu'), `${word} Zulu`);
  await prd(s('prd-bravo'), `${word} Bravo`, 'z'.repeat(250));
  await prd(s('prd-alpha'), `${word} Alpha`, 'Prod desc');
  await prd(s('prd-hi'), W3, `Hi desc ${word}`);

  ids = new Map();
  for (const r of await prisma.collection.findMany({ where: { slug: { startsWith: prefix } } })) ids.set(r.slug, r.id);
  for (const r of await prisma.movie.findMany({ where: { slug: { startsWith: prefix } } })) ids.set(r.slug, r.id);
  for (const r of await prisma.character.findMany({ where: { slug: { startsWith: prefix } } })) ids.set(r.slug, r.id);
  for (const r of await prisma.product.findMany({ where: { slug: { startsWith: prefix } } })) ids.set(r.slug, r.id);
});

afterAll(async () => {
  await cleanupPrefix(prefix);
  await prisma.$disconnect();
});

describe('search ordering: mixed categories', () => {
  it('fixture: product and character ranks beat the best collection rank', async () => {
    const rank = async (expr: string) => {
      const rows = await prisma.$queryRawUnsafe<{ r: number }[]>(
        `SELECT ts_rank(setweight(to_tsvector('english', $1), 'A'), websearch_to_tsquery('english', $2)) AS r`,
        expr,
        word,
      );
      return Number(rows[0].r);
    };
    const best = await rank(`${word} Alpha`);
    expect(await rank(W3)).toBeGreaterThan(best);
  });

  it('returns the exact full sequence: collections, movies, characters, products', async () => {
    const results = await service.search(word);
    expect(results.map((r) => `${r.type}:${r.slug}`)).toEqual(expected.map((e) => `${e.type}:${e.slug}`));
  });

  it('asserts the full ordered type sequence', async () => {
    const types = (await service.search(word)).map((r) => r.type);
    expect(types).toEqual([
      ...Array(5).fill('collection'),
      ...Array(3).fill('movie'),
      ...Array(4).fill('character'),
      ...Array(4).fill('product'),
    ]);
    expect([...new Set(types)]).toEqual([...SEARCH_CATEGORY_ORDER]);
  });

  it('keeps collections first even when a product has the highest relevance', async () => {
    const results = await service.search(word);
    const first = results[0];
    expect(first.type).toBe('collection');
    expect(results.findIndex((r) => r.slug === s('prd-hi'))).toBeGreaterThan(
      results.findIndex((r) => r.slug === s('col-low')),
    );
    expect(results.findIndex((r) => r.slug === s('chr-hi'))).toBeGreaterThan(
      results.findIndex((r) => r.slug === s('mov-low')),
    );
  });

  it('orders within a category by relevance desc, then title asc, then id', async () => {
    const results = await service.search(word);
    // relevance: repeated-term rows precede equal-title-sorting rows; low-rank row has the
    // alphabetically-first title yet is last (rank beats title).
    const chars = results.filter((r) => r.type === 'character').map((r) => r.slug);
    expect(chars).toEqual([s('chr-hi'), s('chr-alpha'), s('chr-bravo'), s('chr-low')]);
    // title asc for equal rank
    const movies = results.filter((r) => r.type === 'movie').map((r) => r.slug);
    expect(movies).toEqual([s('mov-alpha'), s('mov-bravo'), s('mov-low')]);
    // deterministic tie: identical title and rank resolve by id ascending, regardless of insert order
    const mids = results.filter((r) => r.title === `${word} Mid`);
    expect(mids.map((r) => r.id)).toEqual([ID_TIE_1, ID_TIE_2]);
  });

  it('is stable across repeated calls', async () => {
    const a = await service.search(word);
    const b = await service.search(word);
    expect(b).toEqual(a);
  });

  it('excludes unpublished records', async () => {
    const slugs = (await service.search(word)).map((r) => r.slug);
    for (const n of ['col-draft', 'mov-draft']) expect(slugs).not.toContain(s(n));
  });
});

describe('search serialization', () => {
  it('each result has exactly type, id, slug, title, summary with correct values', async () => {
    const results = await service.search(word);
    expect(results).toHaveLength(expected.length);
    results.forEach((r, i) => {
      const e = expected[i];
      expect(Object.keys(r).sort()).toEqual(SEARCH_RESULT_KEYS);
      expect(r.type).toBe(e.type);
      expect(r.id).toBe(ids.get(e.slug));
      expect(r.slug).toBe(e.slug);
      expect(r.title).toBe(e.title);
      expect(r.summary).toBe(e.summary);
      for (const k of SEARCH_RESULT_KEYS) {
        expect(typeof (r as any)[k]).toBe('string');
        expect((r as any)[k]).not.toBeUndefined();
      }
    });
  });

  it('summary fallback: explicit, excerpt-200, whitespace-blank, and empty-string cases', async () => {
    const by = new Map((await service.search(word)).map((r) => [r.slug, r.summary]));
    expect(by.get(s('col-alpha'))).toBe('Col summary'); // own summary
    expect(by.get(s('col-zulu'))).toBe('Intro fallback'); // blank summary -> introduction
    expect(by.get(s('col-mid-1'))).toHaveLength(200); // truncated introduction
    expect(by.get(s('col-mid-2'))).toBe(''); // nothing -> empty string
    expect(by.get(s('mov-alpha'))).toHaveLength(200);
    expect(by.get(s('mov-bravo'))).toBe('');
    expect(by.get(s('chr-hi'))).toBe('Char summary');
    expect(by.get(s('chr-alpha'))).toHaveLength(200); // blank summary -> truncated biography
    expect(by.get(s('chr-bravo'))).toBe('');
    expect(by.get(s('prd-bravo'))).toHaveLength(200);
    expect(by.get(s('prd-zulu'))).toBe('');
  });

  it('survives JSON stringify/parse unchanged', async () => {
    const results = await service.search(word);
    expect(JSON.parse(JSON.stringify(results))).toEqual(results);
    expect(JSON.stringify(results)).not.toContain('undefined');
  });

  it('GET /search via dispatch returns the same ordered, serialized list', async () => {
    const r = await dispatch(services, 'GET', '/search', { q: word });
    expect(r.status).toBe(200);
    const body = JSON.parse(JSON.stringify(r.body)) as SearchResult[];
    expect(body.map((x) => x.type)).toEqual(expected.map((e) => e.type));
    expect(body).toEqual(
      expected.map((e) => ({ type: e.type, id: ids.get(e.slug), slug: e.slug, title: e.title, summary: e.summary })),
    );
    for (const x of body) expect(Object.keys(x).sort()).toEqual(SEARCH_RESULT_KEYS);
  });
});

// ---------------------------------------------------------------------------
// 50-result cap interacting with category priority
// ---------------------------------------------------------------------------
describe('search cap vs category priority', () => {
  const capWord = `t52cap${rand()}`;
  const capPrefix = `${capWord}-`;
  const pad = (n: number) => String(n).padStart(3, '0');

  beforeAll(async () => {
    const P = 'PUBLISHED' as const;
    // 3 collections, 5 movies, 5 characters, 60 products => 73 matches, cap 50.
    // Products carry the repeated term (highest ts_rank) to prove priority beats relevance.
    await prisma.collection.createMany({
      data: [1, 2, 3].map((i) => ({
        slug: `${capPrefix}col-${pad(i)}`, title: `${capWord} col ${pad(i)}`, type: 'THEME' as const,
        introduction: 'i', curatorNotes: 'n', status: P,
      })),
    });
    await prisma.movie.createMany({
      data: [1, 2, 3, 4, 5].map((i) => ({ slug: `${capPrefix}mov-${pad(i)}`, title: `${capWord} mov ${pad(i)}`, status: P })),
    });
    await prisma.character.createMany({
      data: [1, 2, 3, 4, 5].map((i) => ({ slug: `${capPrefix}chr-${pad(i)}`, name: `${capWord} chr ${pad(i)}`, status: P })),
    });
    await prisma.product.createMany({
      data: Array.from({ length: 60 }, (_, k) => ({
        slug: `${capPrefix}prd-${pad(k + 1)}`, name: `${capWord} ${capWord} ${capWord} prd ${pad(k + 1)}`, status: P,
      })),
    });
  });

  afterAll(async () => {
    await cleanupPrefix(capPrefix);
  });

  it('drops lowest-priority results first: all higher categories kept, products truncated', async () => {
    const results = await service.search(capWord);
    expect(results).toHaveLength(MAX_SEARCH_RESULTS);
    const types = results.map((r) => r.type);
    expect(types).toEqual([
      ...Array(3).fill('collection'),
      ...Array(5).fill('movie'),
      ...Array(5).fill('character'),
      ...Array(MAX_SEARCH_RESULTS - 13).fill('product'),
    ]);
    // the products kept are the first ones in order (equal rank -> title asc)
    const prods = results.filter((r) => r.type === 'product').map((r) => r.slug);
    expect(prods).toEqual(
      Array.from({ length: MAX_SEARCH_RESULTS - 13 }, (_, k) => `${capPrefix}prd-${pad(k + 1)}`),
    );
  });

  it('collection-heavy match set returns collections first up to the cap', async () => {
    const heavy = `t52heavy${rand()}`;
    const hp = `${heavy}-`;
    try {
      await prisma.collection.createMany({
        data: Array.from({ length: 55 }, (_, k) => ({
          slug: `${hp}col-${pad(k + 1)}`, title: `${heavy} col ${pad(k + 1)}`, type: 'THEME' as const,
          introduction: 'i', curatorNotes: 'n', status: 'PUBLISHED' as const,
        })),
      });
      await prisma.product.createMany({
        data: [1, 2, 3].map((i) => ({
          slug: `${hp}prd-${pad(i)}`, name: `${heavy} ${heavy} ${heavy} prd`, status: 'PUBLISHED' as const,
        })),
      });
      const results = await service.search(heavy);
      expect(results).toHaveLength(MAX_SEARCH_RESULTS);
      expect(results.every((r) => r.type === 'collection')).toBe(true);
      expect(results.map((r) => r.slug)).toEqual(
        Array.from({ length: MAX_SEARCH_RESULTS }, (_, k) => `${hp}col-${pad(k + 1)}`),
      );
    } finally {
      await cleanupPrefix(hp);
    }
  });
});
