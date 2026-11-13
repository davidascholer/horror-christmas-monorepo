/**
 * Seed Data Verification Tests
 * 
 * Verifies that Task 3.3 seed data meets all requirements from Requirement 6.3-6.7.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Task 3.3: Seed Content Verification', () => {
  describe('Requirement 6.1-6.2: Launch Collections', () => {
    it('should have at least 10 collections', async () => {
      const count = await prisma.collection.count();
      expect(count).toBeGreaterThanOrEqual(10);
    });

    it('should have all 10 named launch collections', async () => {
      const requiredSlugs = [
        'essential-krampus',
        'winter-monsters',
        'christmas-slashers',
        'new-to-christmas-horror',
        '25-days-of-christmas-horror',
        'best-gifts-for-krampus-fans',
        'christmas-horror-comedies',
        'black-christmas-collection',
        'christmas-horror-deep-cuts',
        'holiday-horror-marathon',
      ];

      const collections = await prisma.collection.findMany({
        where: { slug: { in: requiredSlugs } },
      });

      expect(collections).toHaveLength(10);
      
      const foundSlugs = new Set(collections.map(c => c.slug));
      for (const slug of requiredSlugs) {
        expect(foundSlugs.has(slug)).toBe(true);
      }
    });

    it('should have related collection relationships', async () => {
      const count = await prisma.collectionRelated.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Requirement 6.3: Minimum Entity Counts', () => {
    it('should have at least 50 movies', async () => {
      const count = await prisma.movie.count();
      expect(count).toBeGreaterThanOrEqual(50);
    });

    it('should have at least 20 characters', async () => {
      const count = await prisma.character.count();
      expect(count).toBeGreaterThanOrEqual(20);
    });

    it('should have at least 50 products', async () => {
      const count = await prisma.product.count();
      expect(count).toBeGreaterThanOrEqual(50);
    });

    it('should have at least 5 franchises', async () => {
      const count = await prisma.franchise.count();
      expect(count).toBeGreaterThanOrEqual(5);
    });

    it('should have at least 20 tags', async () => {
      const count = await prisma.tag.count();
      expect(count).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Requirement 6.4: Named Franchises', () => {
    it('should include all required franchise names', async () => {
      const requiredSlugs = ['gremlins', 'black-christmas', 'silent-night-deadly-night', 'krampus'];

      const franchises = await prisma.franchise.findMany({
        where: { slug: { in: requiredSlugs } },
      });

      expect(franchises).toHaveLength(4);

      const foundSlugs = new Set(franchises.map(f => f.slug));
      expect(foundSlugs.has('gremlins')).toBe(true);
      expect(foundSlugs.has('black-christmas')).toBe(true);
      expect(foundSlugs.has('silent-night-deadly-night')).toBe(true);
      expect(foundSlugs.has('krampus')).toBe(true);
    });
  });

  describe('Requirement 6.5: Named Characters and Product Categories', () => {
    it('should include all required character names', async () => {
      const requiredSlugs = ['krampus', 'billy-chapman', 'stripe', 'gizmo', 'yule-cat', 'frau-perchta'];

      const characters = await prisma.character.findMany({
        where: { slug: { in: requiredSlugs } },
      });

      expect(characters).toHaveLength(6);

      const foundSlugs = new Set(characters.map(c => c.slug));
      expect(foundSlugs.has('krampus')).toBe(true);
      expect(foundSlugs.has('billy-chapman')).toBe(true);
      expect(foundSlugs.has('stripe')).toBe(true);
      expect(foundSlugs.has('gizmo')).toBe(true);
      expect(foundSlugs.has('yule-cat')).toBe(true);
      expect(foundSlugs.has('frau-perchta')).toBe(true);
    });

    it('should have products in all required categories', async () => {
      const requiredCategories = ['figures', 'ornaments', 'posters', 'blu-rays', 'apparel'];

      for (const category of requiredCategories) {
        const count = await prisma.product.count({
          where: { category },
        });
        expect(count).toBeGreaterThan(0);
      }
    });

    it('should have at least 10 figures', async () => {
      const count = await prisma.product.count({ where: { category: 'figures' } });
      expect(count).toBeGreaterThanOrEqual(10);
    });

    it('should have at least 10 ornaments', async () => {
      const count = await prisma.product.count({ where: { category: 'ornaments' } });
      expect(count).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Requirement 6.6-6.7: Collection Content and Relationships', () => {
    it('should have every collection with at least one movie', async () => {
      const collectionsWithoutMovies = await prisma.collection.findMany({
        where: {
          movies: {
            none: {},
          },
        },
      });

      expect(collectionsWithoutMovies).toHaveLength(0);
    });

    it('should have every collection with at least one related collection', async () => {
      const collections = await prisma.collection.findMany();

      for (const collection of collections) {
        const relatedCount = await prisma.collectionRelated.count({
          where: {
            sourceCollectionId: collection.id,
          },
        });

        expect(relatedCount).toBeGreaterThan(0);
      }
    });

    it('should have collection items ordered correctly', async () => {
      const collectionMovies = await prisma.collectionMovie.findMany({
        where: {
          collection: {
            slug: 'essential-krampus',
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      // Verify sort orders are sequential
      for (let i = 0; i < collectionMovies.length; i++) {
        expect(collectionMovies[i].sortOrder).toBe(i);
      }
    });

    it('should have curator notes on featured collections', async () => {
      const featuredCollection = await prisma.collection.findUnique({
        where: { slug: 'essential-krampus' },
      });

      expect(featuredCollection).toBeDefined();
      expect(featuredCollection!.introduction).toBeTruthy();
      expect(featuredCollection!.curatorNotes).toBeTruthy();
      expect(featuredCollection!.seoTitle).toBeTruthy();
      expect(featuredCollection!.seoDescription).toBeTruthy();
    });
  });

  describe('Entity Relationships', () => {
    it('should have movie-character relationships', async () => {
      const count = await prisma.movieCharacter.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should have product-character relationships', async () => {
      const count = await prisma.productCharacter.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should have collection-movie relationships', async () => {
      const count = await prisma.collectionMovie.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should have collection-character relationships', async () => {
      const count = await prisma.collectionCharacter.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should have collection-product relationships', async () => {
      const count = await prisma.collectionProduct.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should have collection-franchise relationships', async () => {
      const count = await prisma.collectionFranchise.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should have collection-tag relationships', async () => {
      const count = await prisma.collectionTag.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Data Quality', () => {
    it('should have all movies with required fields', async () => {
      const movies = await prisma.movie.findMany();

      for (const movie of movies) {
        expect(movie.slug).toBeTruthy();
        expect(movie.title).toBeTruthy();
        expect(movie.synopsis).toBeTruthy();
        expect(movie.releaseYear).toBeGreaterThan(1970);
        expect(movie.seoTitle).toBeTruthy();
        expect(movie.seoDescription).toBeTruthy();
      }
    });

    it('should have all characters with required fields', async () => {
      const characters = await prisma.character.findMany();

      for (const character of characters) {
        expect(character.slug).toBeTruthy();
        expect(character.name).toBeTruthy();
        expect(character.summary).toBeTruthy();
        expect(character.biography).toBeTruthy();
        expect(character.seoTitle).toBeTruthy();
        expect(character.seoDescription).toBeTruthy();
      }
    });

    it('should have all products with required fields', async () => {
      const products = await prisma.product.findMany();

      for (const product of products) {
        expect(product.slug).toBeTruthy();
        expect(product.name).toBeTruthy();
        expect(product.description).toBeTruthy();
        expect(product.category).toBeTruthy();
        expect(product.seoTitle).toBeTruthy();
        expect(product.seoDescription).toBeTruthy();
      }
    });

    it('should have products with affiliate links', async () => {
      const affiliateLinksCount = await prisma.affiliateLink.count();
      expect(affiliateLinksCount).toBeGreaterThan(0);
    });

    it('should have movies with franchise relationships', async () => {
      const moviesWithFranchise = await prisma.movie.count({
        where: {
          franchiseId: { not: null },
        },
      });

      expect(moviesWithFranchise).toBeGreaterThan(0);
    });

    it('should have characters with franchise relationships', async () => {
      const charactersWithFranchise = await prisma.character.count({
        where: {
          franchiseId: { not: null },
        },
      });

      expect(charactersWithFranchise).toBeGreaterThan(0);
    });

    it('should have products with valid prices', async () => {
      const products = await prisma.product.findMany({
        where: {
          price: { not: null },
        },
      });

      for (const product of products) {
        expect(product.price).not.toBeNull();
        expect(product.currency).toBeTruthy();
        expect(product.currency).toHaveLength(3); // ISO 4217 currency code
      }
    });
  });

  describe('Featured Content', () => {
    it('should have featured movies', async () => {
      const count = await prisma.movie.count({
        where: { featured: true },
      });

      expect(count).toBeGreaterThan(0);
    });

    it('should have featured characters', async () => {
      const count = await prisma.character.count({
        where: { featured: true },
      });

      expect(count).toBeGreaterThan(0);
    });

    it('should have featured products', async () => {
      const count = await prisma.product.count({
        where: { featured: true },
      });

      expect(count).toBeGreaterThan(0);
    });

    it('should have featured collections', async () => {
      const count = await prisma.collection.count({
        where: { featured: true },
      });

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Specific Content Verification', () => {
    it('should have Gremlins franchise with correct movies', async () => {
      const gremlins = await prisma.franchise.findUnique({
        where: { slug: 'gremlins' },
        include: { movies: true },
      });

      expect(gremlins).toBeDefined();
      expect(gremlins!.movies.length).toBeGreaterThanOrEqual(2);
    });

    it('should have Krampus character associated with movies', async () => {
      const krampus = await prisma.character.findUnique({
        where: { slug: 'krampus' },
        include: { movies: true },
      });

      expect(krampus).toBeDefined();
      expect(krampus!.movies.length).toBeGreaterThan(0);
    });

    it('should have Gizmo character with products', async () => {
      const gizmo = await prisma.character.findUnique({
        where: { slug: 'gizmo' },
        include: { products: true },
      });

      expect(gizmo).toBeDefined();
      expect(gizmo!.products.length).toBeGreaterThan(0);
    });

    it('should have Essential Krampus collection fully populated', async () => {
      const collection = await prisma.collection.findUnique({
        where: { slug: 'essential-krampus' },
        include: {
          movies: true,
          characters: true,
          products: true,
          franchises: true,
          tags: true,
          relatedCollections: true,
        },
      });

      expect(collection).toBeDefined();
      expect(collection!.movies.length).toBeGreaterThan(0);
      expect(collection!.characters.length).toBeGreaterThan(0);
      expect(collection!.products.length).toBeGreaterThan(0);
      expect(collection!.relatedCollections.length).toBeGreaterThan(0);
    });
  });
});
