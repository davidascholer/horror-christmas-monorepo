/**
 * Collection Service Tests (Task 4.3)
 *
 * Covers GET /collections (+ filters), /collections/:slug, /movies, /characters,
 * /products, /related and the full collection detail projection.
 * Uses a self-contained fixture; does not depend on seed data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CollectionService } from './collection.service.js';
import { createCatalogFixture, CatalogFixture, ISO_8601 } from './test-fixtures.js';

const prisma = new PrismaClient();
const service = new CollectionService(prisma);
let fx: CatalogFixture;

beforeAll(async () => {
  fx = await createCatalogFixture(prisma, 'col');
});

afterAll(async () => {
  await fx.cleanup();
  await prisma.$disconnect();
});

const ownSlugs = (items: { slug: string }[]) =>
  items.map((i) => i.slug).filter((slug) => slug.startsWith(fx.prefix));

describe('CollectionService.listCollections', () => {
  it('returns published collections only', async () => {
    const slugs = ownSlugs(await service.listCollections());
    expect(slugs).toContain(fx.slugs.collection);
    expect(slugs).toContain(fx.slugs.collectionEmpty);
    expect(slugs).not.toContain(fx.slugs.collectionDraft);
  });

  it('filters by featured, seasonal and type', async () => {
    expect(ownSlugs(await service.listCollections({ featured: true }))).toEqual([fx.slugs.collection]);
    expect(ownSlugs(await service.listCollections({ seasonal: true }))).toEqual([fx.slugs.collectionGift]);
    expect(ownSlugs(await service.listCollections({ type: 'CHARACTER' }))).toEqual([
      fx.slugs.collectionCharacter,
    ]);
    const all = await service.listCollections({ featured: false, type: 'GIFT' });
    expect(all.every((c) => !c.featured && c.type === 'GIFT')).toBe(true);
  });

  it('returns CollectionSummary shape with null for missing optional data', async () => {
    const empty = (await service.listCollections()).find((c) => c.slug === fx.slugs.collectionEmpty)!;
    expect(Object.keys(empty).sort()).toEqual(
      ['featured', 'heroImageUrl', 'id', 'seasonal', 'slug', 'summary', 'title', 'type'].sort(),
    );
    expect(empty.summary).toBeNull();
    expect(empty.heroImageUrl).toBeNull();
  });
});

describe('CollectionService.getCollection', () => {
  it('returns core collection fields with ISO-8601 timestamps', async () => {
    const c = await service.getCollection(fx.slugs.collection);
    expect(c).not.toBeNull();
    expect(c!.slug).toBe(fx.slugs.collection);
    expect(c!.heroImageUrl).toBe('https://example.com/hero.jpg');
    expect(c!.heroImageAlt).toBe('Hero alt');
    expect(c!.publishedAt).toBe('2026-11-01T12:00:00.000Z');
    expect(c!.createdAt).toMatch(ISO_8601);
    expect(c!.updatedAt).toMatch(ISO_8601);
    expect(c!.seoTitle).toBeNull();
  });

  it('returns null for missing, draft collections', async () => {
    expect(await service.getCollection(`${fx.prefix}nope`)).toBeNull();
    expect(await service.getCollection(fx.slugs.collectionDraft)).toBeNull();
  });
});

describe('CollectionService sub-routes', () => {
  it('movies are ordered by sortOrder, published only, with curator notes', async () => {
    const movies = (await service.getCollectionMovies(fx.slugs.collection))!;
    expect(movies.map((m) => m.movie.slug)).toEqual([fx.slugs.movieSpecial, fx.slugs.movieOld]);
    expect(movies.map((m) => m.sortOrder)).toEqual([10, 20]);
    expect(movies[0].curatorNote).toBe('Watch first');
    expect(movies[1].curatorNote).toBeNull();
    expect(movies[0].movie.mediaType).toBe('TV_SPECIAL');
  });

  it('characters are ordered by sortOrder, published only', async () => {
    const chars = (await service.getCollectionCharacters(fx.slugs.collection))!;
    expect(chars.map((c) => c.character.slug)).toEqual([fx.slugs.characterB, fx.slugs.characterA]);
    expect(chars[0].curatorNote).toBe('Iconic');
  });

  it('products are ordered by sortOrder with decimal-string prices', async () => {
    const products = (await service.getCollectionProducts(fx.slugs.collection))!;
    expect(products.map((p) => p.product.slug)).toEqual([fx.slugs.productUnpriced, fx.slugs.productPriced]);
    expect(products[0].product.price).toBeNull();
    expect(products[0].product.currency).toBeNull();
    expect(products[1].product.price).toBe('12.50');
    expect(products[1].product.currency).toBe('USD');
  });

  it('related collections are ordered and exclude unpublished targets', async () => {
    const related = (await service.getRelatedCollections(fx.slugs.collection))!;
    expect(related.map((r) => r.collection.slug)).toEqual([
      fx.slugs.collectionCharacter,
      fx.slugs.collectionGift,
    ]);
    expect(related.map((r) => r.sortOrder)).toEqual([1, 2]);
  });

  it('return empty arrays for an existing collection with no relations', async () => {
    expect(await service.getCollectionMovies(fx.slugs.collectionEmpty)).toEqual([]);
    expect(await service.getCollectionCharacters(fx.slugs.collectionEmpty)).toEqual([]);
    expect(await service.getCollectionProducts(fx.slugs.collectionEmpty)).toEqual([]);
    expect(await service.getRelatedCollections(fx.slugs.collectionEmpty)).toEqual([]);
  });

  it('return null for missing or unpublished collections (404)', async () => {
    for (const slug of [`${fx.prefix}nope`, fx.slugs.collectionDraft]) {
      expect(await service.getCollectionMovies(slug)).toBeNull();
      expect(await service.getCollectionCharacters(slug)).toBeNull();
      expect(await service.getCollectionProducts(slug)).toBeNull();
      expect(await service.getRelatedCollections(slug)).toBeNull();
    }
  });
});

describe('CollectionService.getCollectionDetail', () => {
  it('includes ordered movies, characters, products, franchises, tags and related collections', async () => {
    const d = (await service.getCollectionDetail(fx.slugs.collection))!;
    expect(d.slug).toBe(fx.slugs.collection);
    expect(d.movies.map((m) => m.movie.slug)).toEqual([fx.slugs.movieSpecial, fx.slugs.movieOld]);
    expect(d.characters.map((c) => c.character.slug)).toEqual([fx.slugs.characterB, fx.slugs.characterA]);
    expect(d.products.map((p) => p.product.slug)).toEqual([fx.slugs.productUnpriced, fx.slugs.productPriced]);
    expect(d.franchises).toEqual([
      { franchise: expect.objectContaining({ slug: fx.slugs.franchise }), sortOrder: 1 },
    ]);
    expect(d.tags.map((t) => t.slug)).toEqual([fx.slugs.tagAlpha, fx.slugs.tagBeta]);
    expect(d.relatedCollections.map((r) => r.collection.slug)).toEqual([
      fx.slugs.collectionCharacter,
      fx.slugs.collectionGift,
    ]);
  });

  it('returns null for missing or draft collections', async () => {
    expect(await service.getCollectionDetail(`${fx.prefix}nope`)).toBeNull();
    expect(await service.getCollectionDetail(fx.slugs.collectionDraft)).toBeNull();
  });
});
