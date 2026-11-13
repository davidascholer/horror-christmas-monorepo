/**
 * Home Service Tests
 * 
 * Tests the GET /home endpoint logic:
 * - Featured collections ordered by sortOrder
 * - Seasonal collections ordered by sortOrder
 * - Single featured movie (pick one if multiple)
 * - Single featured character (pick one if multiple)
 * - Gift collection by slug or type
 * - All content must be PUBLISHED only
 * - Null/empty array for missing items
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { PrismaClient, Prisma } from '@prisma/client';
import { HomeService } from './home.service.js';

/**
 * Isolation strategy: HomeService reads the whole catalog (featured, seasonal,
 * gift) and these tests assert exact counts, so they cannot coexist with seed
 * data and a slug prefix cannot scope them. Instead every test runs inside a
 * database transaction that first hides the existing catalog and is ALWAYS
 * rolled back afterwards. Nothing the tests do (including the unscoped
 * deleteMany below) is ever committed, so seed data is never destroyed.
 */
const client = new PrismaClient();
const ROLLBACK = 'rollback-home-service-test';

let tx: Prisma.TransactionClient;
let rollback: () => void;
let txDone: Promise<unknown>;

// `prisma` and `homeService` always target the current test's transaction.
const prisma = new Proxy({} as Prisma.TransactionClient, {
  get: (_target, prop) => (tx as unknown as Record<string | symbol, unknown>)[prop],
});
const homeService = new HomeService(prisma as unknown as PrismaClient);

beforeEach(async () => {
  let ready!: () => void;
  let failed!: (e: unknown) => void;
  const started = new Promise<void>((res, rej) => {
    ready = res;
    failed = rej;
  });
  txDone = client
    .$transaction(
      async (t) => {
        tx = t;
        try {
          // Hide the seeded catalog inside this (rolled back) transaction
          await t.collection.deleteMany();
          await t.movie.deleteMany();
          await t.character.deleteMany();
        } catch (e) {
          failed(e);
          throw e;
        }
        ready();
        await new Promise<void>((_res, rej) => {
          rollback = () => rej(new Error(ROLLBACK));
        });
      },
      { timeout: 60_000, maxWait: 10_000 },
    )
    .catch((e) => {
      if (!(e instanceof Error) || e.message !== ROLLBACK) throw e;
    });
  await started;
});

afterEach(async () => {
  rollback();
  await txDone;
});

afterAll(async () => {
  await client.$disconnect();
});

describe('HomeService', () => {
  describe('getHome', () => {
    it('should return empty arrays and nulls when no content exists', async () => {
      const result = await homeService.getHome();

      expect(result).toEqual({
        featuredCollections: [],
        seasonalCollections: [],
        featuredMovie: null,
        featuredCharacter: null,
        giftCollection: null,
      });
    });

    it('should return only published content', async () => {
      // Create draft and published collections
      await prisma.collection.create({
        data: {
          slug: 'draft-collection',
          title: 'Draft Collection',
          type: 'THEME',
          status: 'DRAFT',
          featured: true,
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      await prisma.collection.create({
        data: {
          slug: 'published-collection',
          title: 'Published Collection',
          type: 'THEME',
          status: 'PUBLISHED',
          featured: true,
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      const result = await homeService.getHome();

      expect(result.featuredCollections).toHaveLength(1);
      expect(result.featuredCollections[0].slug).toBe('published-collection');
    });

    it('should exclude archived content', async () => {
      await prisma.collection.create({
        data: {
          slug: 'archived-collection',
          title: 'Archived Collection',
          type: 'THEME',
          status: 'ARCHIVED',
          featured: true,
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      const result = await homeService.getHome();

      expect(result.featuredCollections).toHaveLength(0);
    });
  });

  describe('featuredCollections', () => {
    it('should return collections where featured=true', async () => {
      // Create featured and non-featured collections
      await prisma.collection.create({
        data: {
          slug: 'featured-1',
          title: 'Featured Collection',
          type: 'THEME',
          status: 'PUBLISHED',
          featured: true,
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      await prisma.collection.create({
        data: {
          slug: 'not-featured',
          title: 'Not Featured',
          type: 'THEME',
          status: 'PUBLISHED',
          featured: false,
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      const result = await homeService.getHome();

      expect(result.featuredCollections).toHaveLength(1);
      expect(result.featuredCollections[0].slug).toBe('featured-1');
      expect(result.featuredCollections[0].featured).toBe(true);
    });

    it('should order featured collections by sortOrder (nulls last), then title', async () => {
      await prisma.collection.createMany({
        data: [
          {
            slug: 'collection-c',
            title: 'C Collection',
            type: 'THEME',
            status: 'PUBLISHED',
            featured: true,
            sortOrder: 3,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
          {
            slug: 'collection-a',
            title: 'A Collection',
            type: 'THEME',
            status: 'PUBLISHED',
            featured: true,
            sortOrder: 1,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
          {
            slug: 'collection-z',
            title: 'Z Collection',
            type: 'THEME',
            status: 'PUBLISHED',
            featured: true,
            sortOrder: null, // Should come last
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
          {
            slug: 'collection-b',
            title: 'B Collection',
            type: 'THEME',
            status: 'PUBLISHED',
            featured: true,
            sortOrder: 2,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
          {
            slug: 'collection-y',
            title: 'Y Collection',
            type: 'THEME',
            status: 'PUBLISHED',
            featured: true,
            sortOrder: null, // Should come second-to-last (Y before Z)
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
        ],
      });

      const result = await homeService.getHome();

      expect(result.featuredCollections).toHaveLength(5);
      expect(result.featuredCollections.map((c) => c.slug)).toEqual([
        'collection-a', // sortOrder 1
        'collection-b', // sortOrder 2
        'collection-c', // sortOrder 3
        'collection-y', // null sortOrder, alphabetically first
        'collection-z', // null sortOrder, alphabetically second
      ]);
    });

    it('should include all required CollectionSummary fields', async () => {
      await prisma.collection.create({
        data: {
          slug: 'test-collection',
          title: 'Test Collection',
          type: 'CHARACTER',
          status: 'PUBLISHED',
          featured: true,
          summary: 'Test summary',
          heroImage: 'https://example.com/image.jpg',
          seasonal: true,
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      const result = await homeService.getHome();

      const collection = result.featuredCollections[0];
      expect(collection).toMatchObject({
        id: expect.any(String),
        slug: 'test-collection',
        title: 'Test Collection',
        summary: 'Test summary',
        type: 'CHARACTER',
        heroImageUrl: 'https://example.com/image.jpg',
        featured: true,
        seasonal: true,
      });
    });
  });

  describe('seasonalCollections', () => {
    it('should return collections where seasonal=true', async () => {
      await prisma.collection.createMany({
        data: [
          {
            slug: 'seasonal-1',
            title: 'Seasonal Collection',
            type: 'SEASONAL_CHALLENGE',
            status: 'PUBLISHED',
            seasonal: true,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
          {
            slug: 'not-seasonal',
            title: 'Not Seasonal',
            type: 'THEME',
            status: 'PUBLISHED',
            seasonal: false,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
        ],
      });

      const result = await homeService.getHome();

      expect(result.seasonalCollections).toHaveLength(1);
      expect(result.seasonalCollections[0].slug).toBe('seasonal-1');
      expect(result.seasonalCollections[0].seasonal).toBe(true);
    });

    it('should order seasonal collections by sortOrder (nulls last), then title', async () => {
      await prisma.collection.createMany({
        data: [
          {
            slug: 'seasonal-3',
            title: 'C Seasonal',
            type: 'SEASONAL_CHALLENGE',
            status: 'PUBLISHED',
            seasonal: true,
            sortOrder: 30,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
          {
            slug: 'seasonal-1',
            title: 'A Seasonal',
            type: 'SEASONAL_CHALLENGE',
            status: 'PUBLISHED',
            seasonal: true,
            sortOrder: 10,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
          {
            slug: 'seasonal-no-order',
            title: 'Z No Order',
            type: 'SEASONAL_CHALLENGE',
            status: 'PUBLISHED',
            seasonal: true,
            sortOrder: null,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
        ],
      });

      const result = await homeService.getHome();

      expect(result.seasonalCollections).toHaveLength(3);
      expect(result.seasonalCollections.map((c) => c.slug)).toEqual([
        'seasonal-1', // sortOrder 10
        'seasonal-3', // sortOrder 30
        'seasonal-no-order', // null sortOrder
      ]);
    });
  });

  describe('featuredMovie', () => {
    it('should return null when no featured movies exist', async () => {
      await prisma.movie.create({
        data: {
          slug: 'not-featured-movie',
          title: 'Not Featured',
          mediaType: 'FILM',
          status: 'PUBLISHED',
          featured: false,
        },
      });

      const result = await homeService.getHome();

      expect(result.featuredMovie).toBeNull();
    });

    it('should return a single featured movie when one exists', async () => {
      await prisma.movie.create({
        data: {
          slug: 'featured-movie',
          title: 'Featured Movie',
          mediaType: 'FILM',
          status: 'PUBLISHED',
          featured: true,
          releaseYear: 2023,
          poster: 'https://example.com/poster.jpg',
          synopsis: 'A great movie',
        },
      });

      const result = await homeService.getHome();

      expect(result.featuredMovie).toMatchObject({
        id: expect.any(String),
        slug: 'featured-movie',
        title: 'Featured Movie',
        releaseYear: 2023,
        mediaType: 'FILM',
        posterUrl: 'https://example.com/poster.jpg',
        synopsis: 'A great movie',
      });
    });

    it('should pick one movie when multiple featured movies exist', async () => {
      await prisma.movie.createMany({
        data: [
          {
            slug: 'featured-1',
            title: 'Featured 1',
            mediaType: 'FILM',
            status: 'PUBLISHED',
            featured: true,
          },
          {
            slug: 'featured-2',
            title: 'Featured 2',
            mediaType: 'FILM',
            status: 'PUBLISHED',
            featured: true,
          },
        ],
      });

      const result = await homeService.getHome();

      expect(result.featuredMovie).not.toBeNull();
      expect(['featured-1', 'featured-2']).toContain(result.featuredMovie!.slug);
    });

    it('should not return draft or archived featured movies', async () => {
      await prisma.movie.createMany({
        data: [
          {
            slug: 'draft-movie',
            title: 'Draft Movie',
            mediaType: 'FILM',
            status: 'DRAFT',
            featured: true,
          },
          {
            slug: 'archived-movie',
            title: 'Archived Movie',
            mediaType: 'FILM',
            status: 'ARCHIVED',
            featured: true,
          },
        ],
      });

      const result = await homeService.getHome();

      expect(result.featuredMovie).toBeNull();
    });
  });

  describe('featuredCharacter', () => {
    it('should return null when no featured characters exist', async () => {
      await prisma.character.create({
        data: {
          slug: 'not-featured-char',
          name: 'Not Featured',
          status: 'PUBLISHED',
          featured: false,
        },
      });

      const result = await homeService.getHome();

      expect(result.featuredCharacter).toBeNull();
    });

    it('should return a single featured character when one exists', async () => {
      await prisma.character.create({
        data: {
          slug: 'featured-character',
          name: 'Featured Character',
          status: 'PUBLISHED',
          featured: true,
          summary: 'A great character',
          image: 'https://example.com/char.jpg',
        },
      });

      const result = await homeService.getHome();

      expect(result.featuredCharacter).toMatchObject({
        id: expect.any(String),
        slug: 'featured-character',
        name: 'Featured Character',
        summary: 'A great character',
        imageUrl: 'https://example.com/char.jpg',
      });
    });

    it('should pick one character when multiple featured characters exist', async () => {
      await prisma.character.createMany({
        data: [
          {
            slug: 'featured-char-1',
            name: 'Featured Char 1',
            status: 'PUBLISHED',
            featured: true,
          },
          {
            slug: 'featured-char-2',
            name: 'Featured Char 2',
            status: 'PUBLISHED',
            featured: true,
          },
        ],
      });

      const result = await homeService.getHome();

      expect(result.featuredCharacter).not.toBeNull();
      expect(['featured-char-1', 'featured-char-2']).toContain(
        result.featuredCharacter!.slug
      );
    });

    it('should not return draft or archived featured characters', async () => {
      await prisma.character.createMany({
        data: [
          {
            slug: 'draft-char',
            name: 'Draft Character',
            status: 'DRAFT',
            featured: true,
          },
          {
            slug: 'archived-char',
            name: 'Archived Character',
            status: 'ARCHIVED',
            featured: true,
          },
        ],
      });

      const result = await homeService.getHome();

      expect(result.featuredCharacter).toBeNull();
    });
  });

  describe('giftCollection', () => {
    it('should return null when no gift collection exists', async () => {
      await prisma.collection.create({
        data: {
          slug: 'other-collection',
          title: 'Other Collection',
          type: 'THEME',
          status: 'PUBLISHED',
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      const result = await homeService.getHome();

      expect(result.giftCollection).toBeNull();
    });

    it('should return collection with slug "best-gifts-for-krampus-fans"', async () => {
      await prisma.collection.create({
        data: {
          slug: 'best-gifts-for-krampus-fans',
          title: 'Best Gifts for Krampus Fans',
          type: 'GIFT',
          status: 'PUBLISHED',
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      const result = await homeService.getHome();

      expect(result.giftCollection).not.toBeNull();
      expect(result.giftCollection!.slug).toBe('best-gifts-for-krampus-fans');
      expect(result.giftCollection!.title).toBe('Best Gifts for Krampus Fans');
    });

    it('should fall back to any GIFT type collection if specific slug not found', async () => {
      await prisma.collection.create({
        data: {
          slug: 'gift-guide',
          title: 'Gift Guide',
          type: 'GIFT',
          status: 'PUBLISHED',
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      const result = await homeService.getHome();

      expect(result.giftCollection).not.toBeNull();
      expect(result.giftCollection!.slug).toBe('gift-guide');
      expect(result.giftCollection!.type).toBe('GIFT');
    });

    it('should prefer specific slug over any GIFT type collection', async () => {
      // Create a GIFT type collection with different slug
      await prisma.collection.create({
        data: {
          slug: 'other-gift',
          title: 'Other Gift Collection',
          type: 'GIFT',
          status: 'PUBLISHED',
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      // Create the specific collection
      await prisma.collection.create({
        data: {
          slug: 'best-gifts-for-krampus-fans',
          title: 'Best Gifts for Krampus Fans',
          type: 'THEME', // Note: different type
          status: 'PUBLISHED',
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      const result = await homeService.getHome();

      expect(result.giftCollection).not.toBeNull();
      expect(result.giftCollection!.slug).toBe('best-gifts-for-krampus-fans');
    });

    it('should not return draft or archived gift collections', async () => {
      await prisma.collection.createMany({
        data: [
          {
            slug: 'draft-gift',
            title: 'Draft Gift',
            type: 'GIFT',
            status: 'DRAFT',
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
          {
            slug: 'archived-gift',
            title: 'Archived Gift',
            type: 'GIFT',
            status: 'ARCHIVED',
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
        ],
      });

      const result = await homeService.getHome();

      expect(result.giftCollection).toBeNull();
    });
  });

  describe('complete homepage scenario', () => {
    it('should return all homepage sections with proper data', async () => {
      // Create featured collections
      await prisma.collection.createMany({
        data: [
          {
            slug: 'featured-1',
            title: 'Featured 1',
            type: 'THEME',
            status: 'PUBLISHED',
            featured: true,
            sortOrder: 1,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
          {
            slug: 'featured-2',
            title: 'Featured 2',
            type: 'BEGINNER',
            status: 'PUBLISHED',
            featured: true,
            sortOrder: 2,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
        ],
      });

      // Create seasonal collection
      await prisma.collection.create({
        data: {
          slug: 'seasonal-1',
          title: 'Seasonal 1',
          type: 'SEASONAL_CHALLENGE',
          status: 'PUBLISHED',
          seasonal: true,
          sortOrder: 10,
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      // Create featured movie
      await prisma.movie.create({
        data: {
          slug: 'featured-movie',
          title: 'Featured Movie',
          mediaType: 'FILM',
          status: 'PUBLISHED',
          featured: true,
        },
      });

      // Create featured character
      await prisma.character.create({
        data: {
          slug: 'featured-char',
          name: 'Featured Character',
          status: 'PUBLISHED',
          featured: true,
        },
      });

      // Create gift collection
      await prisma.collection.create({
        data: {
          slug: 'best-gifts-for-krampus-fans',
          title: 'Best Gifts',
          type: 'GIFT',
          status: 'PUBLISHED',
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      const result = await homeService.getHome();

      expect(result.featuredCollections).toHaveLength(2);
      expect(result.seasonalCollections).toHaveLength(1);
      expect(result.featuredMovie).not.toBeNull();
      expect(result.featuredCharacter).not.toBeNull();
      expect(result.giftCollection).not.toBeNull();

      // Verify ordering
      expect(result.featuredCollections[0].slug).toBe('featured-1');
      expect(result.featuredCollections[1].slug).toBe('featured-2');
    });
  });
});
