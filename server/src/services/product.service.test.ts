/**
 * Product Service Tests (Task 4.3)
 *
 * Covers GET /products, /products/:slug and the full product detail
 * projection (affiliate links, related characters, collections, tags).
 * Uses a self-contained fixture; does not depend on seed data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ProductService } from './product.service.js';
import { createCatalogFixture, CatalogFixture, ISO_8601 } from './test-fixtures.js';

const prisma = new PrismaClient();
const service = new ProductService(prisma);
let fx: CatalogFixture;

beforeAll(async () => {
  fx = await createCatalogFixture(prisma, 'prd');
});

afterAll(async () => {
  await fx.cleanup();
  await prisma.$disconnect();
});

describe('ProductService.listProducts', () => {
  it('returns published products only, ordered by name', async () => {
    const slugs = (await service.listProducts())
      .map((p) => p.slug)
      .filter((s) => s.startsWith(fx.prefix));
    expect(slugs).toEqual([fx.slugs.productPriced, fx.slugs.productUnpriced]);
  });

  it('serializes price as a fixed two-decimal string with currency, or null', async () => {
    const products = await service.listProducts();
    const priced = products.find((p) => p.slug === fx.slugs.productPriced)!;
    const unpriced = products.find((p) => p.slug === fx.slugs.productUnpriced)!;
    expect(priced.price).toBe('12.50');
    expect(priced.currency).toBe('USD');
    expect(unpriced.price).toBeNull();
    expect(unpriced.currency).toBeNull();
    expect(unpriced.category).toBeNull();
  });
});

describe('ProductService.getProduct', () => {
  it('returns product fields with ordered affiliate links and franchise', async () => {
    const p = (await service.getProduct(fx.slugs.productPriced))!;
    expect(p.price).toBe('12.50');
    expect(p.currency).toBe('USD');
    expect(p.category).toBe('Figure');
    expect(p.franchise?.slug).toBe(fx.slugs.franchise);
    expect(p.affiliateLinks.map((l) => [l.provider, l.url])).toEqual([
      ['ShopOne', 'https://example.com/one'],
      ['ShopTwo', 'https://example.com/two'],
    ]);
    expect(p.affiliateLinks.every((l) => l.productId === p.id)).toBe(true);
    expect(p.publishedAt).toBe('2026-11-01T12:00:00.000Z');
    expect(p.createdAt).toMatch(ISO_8601);
  });

  it('returns empty affiliate links and null optionals when absent', async () => {
    const p = (await service.getProduct(fx.slugs.productUnpriced))!;
    expect(p.affiliateLinks).toEqual([]);
    expect(p.franchise).toBeNull();
    expect(p.imageUrl).toBeNull();
    expect(p.publishedAt).toBeNull();
  });

  it('returns null for missing or draft products', async () => {
    expect(await service.getProduct(`${fx.prefix}nope`)).toBeNull();
    expect(await service.getProduct(fx.slugs.productDraft)).toBeNull();
  });
});

describe('ProductService.getProductDetail', () => {
  it('includes affiliate links, ordered published characters, collections and tags', async () => {
    const d = (await service.getProductDetail(fx.slugs.productPriced))!;
    expect(d.affiliateLinks).toHaveLength(2);
    expect(d.characters.map((c) => c.character.slug)).toEqual([fx.slugs.characterB, fx.slugs.characterA]);
    expect(d.characters.map((c) => c.sortOrder)).toEqual([1, 2]);
    expect(d.collections.map((c) => c.slug)).toEqual([fx.slugs.collection, fx.slugs.collectionGift]);
    expect(d.tags.map((t) => t.slug)).toEqual([fx.slugs.tagAlpha]);
  });

  it('returns null for missing or draft products', async () => {
    expect(await service.getProductDetail(`${fx.prefix}nope`)).toBeNull();
    expect(await service.getProductDetail(fx.slugs.productDraft)).toBeNull();
  });
});
