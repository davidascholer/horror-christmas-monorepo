/**
 * Character Service Tests (Task 4.3)
 *
 * Covers GET /characters, /characters/:slug and the full character detail
 * projection (movies, products, collections, franchise, tags).
 * Uses a self-contained fixture; does not depend on seed data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CharacterService } from './character.service.js';
import { createCatalogFixture, CatalogFixture, ISO_8601 } from './test-fixtures.js';

const prisma = new PrismaClient();
const service = new CharacterService(prisma);
let fx: CatalogFixture;

beforeAll(async () => {
  fx = await createCatalogFixture(prisma, 'chr');
});

afterAll(async () => {
  await fx.cleanup();
  await prisma.$disconnect();
});

describe('CharacterService.listCharacters', () => {
  it('returns published characters only, ordered by name', async () => {
    const slugs = (await service.listCharacters())
      .map((c) => c.slug)
      .filter((s) => s.startsWith(fx.prefix));
    expect(slugs).toEqual([fx.slugs.characterA, fx.slugs.characterB]);
  });

  it('returns CharacterSummary shape with null for missing optional data', async () => {
    const b = (await service.listCharacters()).find((c) => c.slug === fx.slugs.characterB)!;
    expect(Object.keys(b).sort()).toEqual(['id', 'imageUrl', 'name', 'slug', 'summary']);
    expect(b.summary).toBeNull();
    expect(b.imageUrl).toBeNull();
  });
});

describe('CharacterService.getCharacter', () => {
  it('returns character fields with franchise and ISO-8601 timestamps', async () => {
    const c = (await service.getCharacter(fx.slugs.characterA))!;
    expect(c.slug).toBe(fx.slugs.characterA);
    expect(c.biography).toBe('Bio');
    expect(c.franchise).toEqual(expect.objectContaining({ slug: fx.slugs.franchise }));
    expect(c.publishedAt).toBe('2026-11-01T12:00:00.000Z');
    expect(c.createdAt).toMatch(ISO_8601);
    expect(c.updatedAt).toMatch(ISO_8601);
  });

  it('returns null for missing or draft characters', async () => {
    expect(await service.getCharacter(`${fx.prefix}nope`)).toBeNull();
    expect(await service.getCharacter(fx.slugs.characterDraft)).toBeNull();
  });
});

describe('CharacterService.getCharacterDetail', () => {
  it('includes published movies, products, collections, franchise and tags in stable order', async () => {
    const d = (await service.getCharacterDetail(fx.slugs.characterA))!;
    expect(d.movies.map((m) => m.slug)).toEqual([fx.slugs.movieSpecial, fx.slugs.movieOld]);
    expect(d.movies[0].mediaType).toBe('TV_SPECIAL');
    expect(d.products.map((p) => p.slug)).toEqual([fx.slugs.productUnpriced, fx.slugs.productPriced]);
    expect(d.products[1].price).toBe('12.50');
    expect(d.collections.map((c) => c.slug)).toEqual([fx.slugs.collection, fx.slugs.collectionCharacter]);
    expect(d.franchise?.slug).toBe(fx.slugs.franchise);
    expect(d.tags.map((t) => t.slug)).toEqual([fx.slugs.tagBeta]);
  });

  it('uses null franchise and empty arrays when relations are absent', async () => {
    const d = (await service.getCharacterDetail(fx.slugs.characterB))!;
    expect(d.franchise).toBeNull();
    expect(d.tags).toEqual([]);
    expect(d.movies.map((m) => m.slug)).toEqual([fx.slugs.movieOld]);
    expect(d.products.map((p) => p.slug)).toEqual([fx.slugs.productPriced]);
  });

  it('returns null for missing or draft characters', async () => {
    expect(await service.getCharacterDetail(`${fx.prefix}nope`)).toBeNull();
    expect(await service.getCharacterDetail(fx.slugs.characterDraft)).toBeNull();
  });
});
