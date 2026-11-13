/**
 * Build Service and /build route tests (Task 6.1)
 *
 * Uses the shared catalog fixture (unique slug prefix, prefix-scoped cleanup).
 * The real database may contain other rows, so assertions are scoped to the
 * fixture prefix, except the global checks (sorted, no ids, published only)
 * which are read-only.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { BuildService } from './build.service.js';
import { HomeService } from './home.service.js';
import { CollectionService } from './collection.service.js';
import { MovieService } from './movie.service.js';
import { CharacterService } from './character.service.js';
import { ProductService } from './product.service.js';
import { SearchService } from './search.service.js';
import { createCatalogFixture, CatalogFixture, ISO_8601 } from './test-fixtures.js';
import { routes, findRoute, dispatch, ApiServices } from '../api/routes.js';
import type { BuildSlugEntry } from '../types/api-contracts.js';

const prisma = new PrismaClient();
const build = new BuildService(prisma);
const services: ApiServices = {
  home: new HomeService(prisma),
  collections: new CollectionService(prisma),
  movies: new MovieService(prisma),
  characters: new CharacterService(prisma),
  products: new ProductService(prisma),
  search: new SearchService(prisma),
  build,
};

let fx: CatalogFixture;
const own = (rs: BuildSlugEntry[]) => rs.filter((r) => r.slug.startsWith(fx.prefix));
const slugs = (rs: BuildSlugEntry[]) => own(rs).map((r) => r.slug);

beforeAll(async () => {
  fx = await createCatalogFixture(prisma, 'bld');
  const s = (n: string) => `${fx.prefix}${n}`;
  // Archived rows (fixture only has archived movies) and hyphen-vs-letter slugs
  // to prove code-unit ordering independent of database collation.
  await prisma.collection.create({
    data: { slug: s('collection-archived'), title: `${fx.token} arch`, type: 'THEME', status: 'ARCHIVED', introduction: 'i', curatorNotes: 'n' },
  });
  await prisma.character.create({ data: { slug: s('character-archived'), name: `${fx.token} arch`, status: 'ARCHIVED' } });
  await prisma.product.create({ data: { slug: s('product-archived'), name: `${fx.token} arch`, status: 'ARCHIVED' } });
  await prisma.movie.createMany({
    data: [
      { slug: s('zz-ab'), title: `${fx.token} ab`, status: 'PUBLISHED' },
      { slug: s('zz-a-b'), title: `${fx.token} a-b`, status: 'PUBLISHED' },
    ],
  });
});

afterAll(async () => {
  await fx.cleanup();
  await prisma.$disconnect();
});

describe('BuildService', () => {
  it('lists exactly the published collections', async () => {
    expect(slugs(await build.listCollectionSlugs())).toEqual(
      [fx.slugs.collection, fx.slugs.collectionCharacter, fx.slugs.collectionEmpty, fx.slugs.collectionGift].sort(),
    );
  });

  it('lists exactly the published movies (DRAFT and ARCHIVED excluded)', async () => {
    const got = slugs(await build.listMovieSlugs());
    expect(got).toEqual(
      [fx.slugs.movieOld, fx.slugs.movieSpecial, `${fx.prefix}zz-a-b`, `${fx.prefix}zz-ab`].sort(),
    );
    expect(got).not.toContain(fx.slugs.movieDraft);
    expect(got).not.toContain(fx.slugs.movieArchived);
  });

  it('lists exactly the published characters', async () => {
    expect(slugs(await build.listCharacterSlugs())).toEqual([fx.slugs.characterA, fx.slugs.characterB].sort());
  });

  it('lists exactly the published products', async () => {
    expect(slugs(await build.listProductSlugs())).toEqual(
      [fx.slugs.productPriced, fx.slugs.productUnpriced].sort(),
    );
  });

  it('excludes drafts and archived rows for every entity type', async () => {
    const all = [
      ...(await build.listCollectionSlugs()),
      ...(await build.listMovieSlugs()),
      ...(await build.listCharacterSlugs()),
      ...(await build.listProductSlugs()),
    ].map((e) => e.slug);
    for (const bad of ['collectionDraft', 'movieDraft', 'movieArchived', 'characterDraft', 'productDraft'] as const) {
      expect(all).not.toContain(fx.slugs[bad]);
    }
    for (const n of ['collection-archived', 'character-archived', 'product-archived']) {
      expect(all).not.toContain(`${fx.prefix}${n}`);
    }
  });

  it('orders by slug ascending in code-unit order (hyphen before letter)', async () => {
    const movies = await build.listMovieSlugs();
    const mine = slugs(movies);
    expect(mine.indexOf(`${fx.prefix}zz-a-b`)).toBeLessThan(mine.indexOf(`${fx.prefix}zz-ab`));
    for (const list of [movies, await build.listCollectionSlugs(), await build.listCharacterSlugs(), await build.listProductSlugs()]) {
      const s = list.map((e) => e.slug);
      expect(s).toEqual([...s].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    }
  });

  it('returns only slug and an ISO-8601 updatedAt (no internal ids)', async () => {
    for (const list of [
      await build.listCollectionSlugs(),
      await build.listMovieSlugs(),
      await build.listCharacterSlugs(),
      await build.listProductSlugs(),
    ]) {
      for (const e of own(list)) {
        expect(Object.keys(e).sort()).toEqual(['slug', 'updatedAt']);
        expect(e.updatedAt).toMatch(ISO_8601);
      }
    }
  });
});

describe('/build routes', () => {
  const PATHS = ['/build/collections', '/build/movies', '/build/characters', '/build/products'];

  it('are in the route table as GET, no query params, status 200 only', () => {
    for (const p of PATHS) {
      const route = routes.find((r) => r.path === p);
      expect(route).toBeDefined();
      expect(route!.method).toBe('GET');
      expect([...route!.queryParams]).toEqual([]);
      expect([...route!.statuses]).toEqual([200]);
      expect(findRoute('GET', p)?.route).toBe(route);
    }
  });

  it('respond 200 with a JSON array of { slug, updatedAt } containing fixture slugs', async () => {
    const expectedFirst: Record<string, string> = {
      '/build/collections': fx.slugs.collection,
      '/build/movies': fx.slugs.movieOld,
      '/build/characters': fx.slugs.characterA,
      '/build/products': fx.slugs.productPriced,
    };
    for (const p of PATHS) {
      const r = await dispatch(services, 'GET', p);
      expect(r.status).toBe(200);
      const body = JSON.parse(JSON.stringify(r.body)) as BuildSlugEntry[];
      expect(Array.isArray(body)).toBe(true);
      expect(slugs(body)).toContain(expectedFirst[p]);
      for (const e of body) expect(Object.keys(e).sort()).toEqual(['slug', 'updatedAt']);
    }
  });

  it('every listed slug is retrievable from its public detail route', async () => {
    const pairs: [string, string][] = [
      ['/build/collections', '/collections'],
      ['/build/movies', '/movies'],
      ['/build/characters', '/characters'],
      ['/build/products', '/products'],
    ];
    for (const [list, detail] of pairs) {
      const r = await dispatch(services, 'GET', list);
      for (const e of own(r.body as BuildSlugEntry[])) {
        expect((await dispatch(services, 'GET', `${detail}/${e.slug}`)).status).toBe(200);
      }
    }
  });

  it('do not shadow or break the existing /collections/:slug routes', () => {
    expect(findRoute('GET', '/collections/build')?.route.path).toBe('/collections/:slug');
    expect(findRoute('GET', '/build')).toBeNull();
    expect(findRoute('POST', '/build/movies')).toBeNull();
  });
});
