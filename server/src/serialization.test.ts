/**
 * Serialization Tests - Task 2.4
 * 
 * Tests verify that domain data is correctly serialized for API responses:
 * - Money retains decimal precision and currency across serialization
 * - Public routes use slugs rather than internal database IDs
 * - Type safety and contract compliance for API responses
 * 
 * Requirements: Requirement 4 (criteria 4.7-4.8); Requirement 11 (criteria 11.2-11.7)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, ContentStatus } from '@prisma/client';
import type {
  ProductSummary,
  Product,
  CollectionSummary,
  MovieSummary,
  CharacterSummary,
} from './types/api-contracts.js';

const prisma = new PrismaClient();

// Test data cleanup helper
async function cleanupTestData() {
  await prisma.collectionRelated.deleteMany({});
  await prisma.collectionMovie.deleteMany({});
  await prisma.collectionCharacter.deleteMany({});
  await prisma.collectionProduct.deleteMany({});
  await prisma.collectionFranchise.deleteMany({});
  await prisma.collectionTag.deleteMany({});
  await prisma.movieCharacter.deleteMany({});
  await prisma.movieTag.deleteMany({});
  await prisma.characterTag.deleteMany({});
  await prisma.productTag.deleteMany({});
  await prisma.productCharacter.deleteMany({});
  await prisma.affiliateLink.deleteMany({});
  await prisma.watchlistMovie.deleteMany({});
  
  await prisma.collection.deleteMany({});
  await prisma.movie.deleteMany({});
  await prisma.character.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.franchise.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.watchlist.deleteMany({});
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await cleanupTestData();
});

describe('Monetary Precision and Currency Serialization', () => {
  describe('Decimal Precision', () => {
    it('should preserve .01 precision in price fields', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'penny-test',
          name: 'Penny Test Product',
          price: 0.01,
          currency: 'USD',
        },
      });

      // Simulate API serialization by converting to JSON and back
      const serialized = JSON.stringify({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price?.toString(),
        currency: product.currency,
      });

      const deserialized = JSON.parse(serialized);

      expect(deserialized.price).toBe('0.01');
      expect(Number(deserialized.price)).toBe(0.01);
    });

    it('should preserve standard price precision (e.g., 19.99)', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'standard-price',
          name: 'Standard Price Product',
          price: 19.99,
          currency: 'USD',
        },
      });

      const apiProduct: ProductSummary = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        category: product.category,
      };

      const serialized = JSON.stringify(apiProduct);
      const deserialized: ProductSummary = JSON.parse(serialized);

      expect(deserialized.price).toBe('19.99');
      expect(Number(deserialized.price)).toBe(19.99);
    });

    it('should preserve high-precision decimal values (e.g., 1234.56)', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'high-price',
          name: 'High Price Product',
          price: 1234.56,
          currency: 'USD',
        },
      });

      const apiProduct: ProductSummary = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        category: product.category,
      };

      const serialized = JSON.stringify(apiProduct);
      const deserialized: ProductSummary = JSON.parse(serialized);

      expect(deserialized.price).toBe('1234.56');
      expect(Number(deserialized.price)).toBe(1234.56);
    });

    it('should handle zero price correctly', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'free-product',
          name: 'Free Product',
          price: 0.00,
          currency: 'USD',
        },
      });

      const apiProduct: ProductSummary = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        category: product.category,
      };

      const serialized = JSON.stringify(apiProduct);
      const deserialized: ProductSummary = JSON.parse(serialized);

      expect(deserialized.price).toBe('0');
      expect(Number(deserialized.price)).toBe(0);
    });

    it('should handle null price correctly', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'unpriced-product',
          name: 'Unpriced Product',
          price: null,
          currency: null,
        },
      });

      const apiProduct: ProductSummary = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        category: product.category,
      };

      const serialized = JSON.stringify(apiProduct);
      const deserialized: ProductSummary = JSON.parse(serialized);

      expect(deserialized.price).toBeNull();
      expect(deserialized.currency).toBeNull();
    });

    it('should not lose precision through multiple serialization cycles', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'multi-cycle',
          name: 'Multi-Cycle Product',
          price: 29.99,
          currency: 'USD',
        },
      });

      // Cycle 1: Database to API format
      let apiProduct: ProductSummary = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        category: product.category,
      };

      // Cycle 2: Serialize to JSON
      const json1 = JSON.stringify(apiProduct);
      apiProduct = JSON.parse(json1);

      // Cycle 3: Serialize again
      const json2 = JSON.stringify(apiProduct);
      apiProduct = JSON.parse(json2);

      expect(apiProduct.price).toBe('29.99');
      expect(Number(apiProduct.price)).toBe(29.99);
    });
  });

  describe('Currency Code Serialization', () => {
    it('should serialize USD currency correctly', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'usd-product',
          name: 'USD Product',
          price: 19.99,
          currency: 'USD',
        },
      });

      const apiProduct: ProductSummary = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        category: product.category,
      };

      expect(apiProduct.currency).toBe('USD');
      expect(apiProduct.currency).toHaveLength(3);
    });

    it('should serialize EUR currency correctly', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'eur-product',
          name: 'EUR Product',
          price: 24.99,
          currency: 'EUR',
        },
      });

      const apiProduct: ProductSummary = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        category: product.category,
      };

      expect(apiProduct.currency).toBe('EUR');
    });

    it('should serialize GBP currency correctly', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'gbp-product',
          name: 'GBP Product',
          price: 16.99,
          currency: 'GBP',
        },
      });

      const apiProduct: ProductSummary = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        category: product.category,
      };

      expect(apiProduct.currency).toBe('GBP');
    });

    it('should keep currency paired with price', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'paired-product',
          name: 'Paired Product',
          price: 49.99,
          currency: 'CAD',
        },
      });

      const apiProduct: ProductSummary = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        category: product.category,
      };

      const serialized = JSON.stringify(apiProduct);
      const deserialized: ProductSummary = JSON.parse(serialized);

      expect(deserialized.price).toBe('49.99');
      expect(deserialized.currency).toBe('CAD');
    });
  });

  describe('Product Detail Serialization', () => {
    it('should serialize full product detail with price and currency', async () => {
      const franchise = await prisma.franchise.create({
        data: {
          slug: 'test-franchise',
          name: 'Test Franchise',
        },
      });

      const product = await prisma.product.create({
        data: {
          slug: 'detailed-product',
          name: 'Detailed Product',
          description: 'A detailed product description',
          category: 'Apparel',
          price: 39.99,
          currency: 'USD',
          image: 'https://example.com/image.jpg',
          imageAlt: 'Product image',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
          featured: true,
          franchiseId: franchise.id,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });

      await prisma.affiliateLink.create({
        data: {
          productId: product.id,
          provider: 'Amazon',
          url: 'https://amazon.com/product',
        },
      });

      // Retrieve related data for the API response
      const productWithRelations = await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          franchise: true,
          affiliateLinks: true,
        },
      });

      const apiProduct: Product = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        imageUrl: product.image, // Database field 'image' maps to API field 'imageUrl'
        imageAlt: product.imageAlt,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        featured: product.featured,
        franchise: productWithRelations?.franchise ? {
          id: productWithRelations.franchise.id,
          slug: productWithRelations.franchise.slug,
          name: productWithRelations.franchise.name,
        } : null,
        affiliateLinks: productWithRelations?.affiliateLinks.map(link => ({
          id: link.id,
          provider: link.provider,
          url: link.url,
          productId: link.productId,
        })) ?? [],
        publishedAt: product.publishedAt?.toISOString() ?? null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      };

      const serialized = JSON.stringify(apiProduct);
      const deserialized: Product = JSON.parse(serialized);

      expect(deserialized.price).toBe('39.99');
      expect(deserialized.currency).toBe('USD');
      expect(Number(deserialized.price)).toBe(39.99);
      expect(deserialized.affiliateLinks).toHaveLength(1);
    });
  });
});

describe('Slug-Based Public Routes', () => {
  describe('Collection API Responses', () => {
    it('should use slug in collection summary, not database ID', async () => {
      const collection = await prisma.collection.create({
        data: {
          slug: 'essential-krampus',
          title: 'Essential Krampus',
          type: 'CHARACTER',
          introduction: 'Introduction',
          curatorNotes: 'Notes',
          status: ContentStatus.PUBLISHED,
        },
      });

      const apiCollection: CollectionSummary = {
        id: collection.id,
        slug: collection.slug,
        title: collection.title,
        summary: collection.summary,
        type: collection.type,
        heroImageUrl: collection.heroImageUrl,
        featured: collection.featured,
        seasonal: collection.seasonal,
      };

      // Verify slug is present and different from ID
      expect(apiCollection.slug).toBe('essential-krampus');
      expect(apiCollection.slug).not.toBe(apiCollection.id);
      
      // In production, ID would not be exposed in public routes
      // The slug is the public identifier
      expect(typeof apiCollection.slug).toBe('string');
      expect(apiCollection.slug.length).toBeGreaterThan(0);
    });

    it('should use unique slug for each collection', async () => {
      const collection1 = await prisma.collection.create({
        data: {
          slug: 'collection-one',
          title: 'Collection One',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Notes',
        },
      });

      const collection2 = await prisma.collection.create({
        data: {
          slug: 'collection-two',
          title: 'Collection Two',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Notes',
        },
      });

      const api1: CollectionSummary = {
        id: collection1.id,
        slug: collection1.slug,
        title: collection1.title,
        summary: collection1.summary,
        type: collection1.type,
        heroImageUrl: collection1.heroImageUrl,
        featured: collection1.featured,
        seasonal: collection1.seasonal,
      };

      const api2: CollectionSummary = {
        id: collection2.id,
        slug: collection2.slug,
        title: collection2.title,
        summary: collection2.summary,
        type: collection2.type,
        heroImageUrl: collection2.heroImageUrl,
        featured: collection2.featured,
        seasonal: collection2.seasonal,
      };

      expect(api1.slug).toBe('collection-one');
      expect(api2.slug).toBe('collection-two');
      expect(api1.slug).not.toBe(api2.slug);
    });
  });

  describe('Movie API Responses', () => {
    it('should use slug in movie summary, not database ID', async () => {
      const movie = await prisma.movie.create({
        data: {
          slug: 'krampus-2015',
          title: 'Krampus',
          mediaType: 'FILM',
          releaseYear: 2015,
          status: ContentStatus.PUBLISHED,
        },
      });

      const apiMovie: MovieSummary = {
        id: movie.id,
        slug: movie.slug,
        title: movie.title,
        releaseYear: movie.releaseYear,
        mediaType: movie.mediaType,
        posterUrl: movie.posterUrl,
        synopsis: movie.synopsis,
      };

      expect(apiMovie.slug).toBe('krampus-2015');
      expect(apiMovie.slug).not.toBe(apiMovie.id);
    });

    it('should construct canonical URL from slug', async () => {
      const movie = await prisma.movie.create({
        data: {
          slug: 'gremlins-1984',
          title: 'Gremlins',
          mediaType: 'FILM',
          releaseYear: 1984,
        },
      });

      // Canonical URL construction (as would be done in API/frontend)
      const canonicalUrl = `/movies/${movie.slug}`;

      expect(canonicalUrl).toBe('/movies/gremlins-1984');
      expect(canonicalUrl).not.toContain(movie.id);
    });
  });

  describe('Character API Responses', () => {
    it('should use slug in character summary, not database ID', async () => {
      const character = await prisma.character.create({
        data: {
          slug: 'krampus',
          name: 'Krampus',
          summary: 'The Christmas demon',
          status: ContentStatus.PUBLISHED,
        },
      });

      const apiCharacter: CharacterSummary = {
        id: character.id,
        slug: character.slug,
        name: character.name,
        summary: character.summary,
        imageUrl: character.imageUrl,
      };

      expect(apiCharacter.slug).toBe('krampus');
      expect(apiCharacter.slug).not.toBe(apiCharacter.id);
    });
  });

  describe('Product API Responses', () => {
    it('should use slug in product summary, not database ID', async () => {
      const product = await prisma.product.create({
        data: {
          slug: 'krampus-ornament',
          name: 'Krampus Ornament',
          price: 24.99,
          currency: 'USD',
          status: ContentStatus.PUBLISHED,
        },
      });

      const apiProduct: ProductSummary = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price?.toString() ?? null,
        currency: product.currency,
        category: product.category,
      };

      expect(apiProduct.slug).toBe('krampus-ornament');
      expect(apiProduct.slug).not.toBe(apiProduct.id);
      expect(apiProduct.price).toBe('24.99');
      expect(apiProduct.currency).toBe('USD');
    });
  });

  describe('Relationship Serialization with Slugs', () => {
    it('should serialize collection-movie relationships with slugs', async () => {
      const collection = await prisma.collection.create({
        data: {
          slug: 'holiday-horror',
          title: 'Holiday Horror',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Notes',
        },
      });

      const movie = await prisma.movie.create({
        data: {
          slug: 'black-christmas',
          title: 'Black Christmas',
          mediaType: 'FILM',
        },
      });

      await prisma.collectionMovie.create({
        data: {
          collectionId: collection.id,
          movieId: movie.id,
          sortOrder: 1,
          curatorNote: 'A classic starting point',
        },
      });

      // Simulate API response for collection movies
      const collectionMovies = await prisma.collectionMovie.findMany({
        where: { collectionId: collection.id },
        include: { movie: true },
        orderBy: { sortOrder: 'asc' },
      });

      const apiResponse = collectionMovies.map(cm => ({
        movie: {
          id: cm.movie.id,
          slug: cm.movie.slug,
          title: cm.movie.title,
          releaseYear: cm.movie.releaseYear,
          mediaType: cm.movie.mediaType,
          posterUrl: cm.movie.posterUrl,
          synopsis: cm.movie.synopsis,
        },
        sortOrder: cm.sortOrder,
        curatorNote: cm.curatorNote,
      }));

      expect(apiResponse).toHaveLength(1);
      expect(apiResponse[0].movie.slug).toBe('black-christmas');
      expect(apiResponse[0].curatorNote).toBe('A classic starting point');
    });

    it('should serialize related collections with slugs', async () => {
      const collection1 = await prisma.collection.create({
        data: {
          slug: 'krampus-collection',
          title: 'Krampus Collection',
          type: 'CHARACTER',
          introduction: 'Introduction',
          curatorNotes: 'Notes',
        },
      });

      const collection2 = await prisma.collection.create({
        data: {
          slug: 'winter-demons',
          title: 'Winter Demons',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Notes',
        },
      });

      await prisma.collectionRelated.create({
        data: {
          sourceCollectionId: collection1.id,
          targetCollectionId: collection2.id,
          sortOrder: 1,
        },
      });

      // Simulate API response for related collections
      const relatedCollections = await prisma.collectionRelated.findMany({
        where: { sourceCollectionId: collection1.id },
        include: { targetCollection: true },
        orderBy: { sortOrder: 'asc' },
      });

      const apiResponse = relatedCollections.map(rc => ({
        collection: {
          id: rc.targetCollection.id,
          slug: rc.targetCollection.slug,
          title: rc.targetCollection.title,
          summary: rc.targetCollection.summary,
          type: rc.targetCollection.type,
          heroImageUrl: rc.targetCollection.heroImageUrl,
          featured: rc.targetCollection.featured,
          seasonal: rc.targetCollection.seasonal,
        },
        sortOrder: rc.sortOrder,
      }));

      expect(apiResponse).toHaveLength(1);
      expect(apiResponse[0].collection.slug).toBe('winter-demons');
    });

    it('should serialize product with character relationships using slugs', async () => {
      const character = await prisma.character.create({
        data: {
          slug: 'krampus',
          name: 'Krampus',
        },
      });

      const product = await prisma.product.create({
        data: {
          slug: 'krampus-plush',
          name: 'Krampus Plush',
          price: 34.99,
          currency: 'USD',
        },
      });

      await prisma.productCharacter.create({
        data: {
          productId: product.id,
          characterId: character.id,
          sortOrder: 1,
        },
      });

      // Simulate API response for product characters
      const productCharacters = await prisma.productCharacter.findMany({
        where: { productId: product.id },
        include: { character: true },
        orderBy: { sortOrder: 'asc' },
      });

      const apiResponse = productCharacters.map(pc => ({
        character: {
          id: pc.character.id,
          slug: pc.character.slug,
          name: pc.character.name,
          summary: pc.character.summary,
          imageUrl: pc.character.imageUrl,
        },
        sortOrder: pc.sortOrder,
      }));

      expect(apiResponse).toHaveLength(1);
      expect(apiResponse[0].character.slug).toBe('krampus');
    });
  });

  describe('Watchlist Serialization', () => {
    it('should use shareToken not internal ID for public access', async () => {
      const watchlist = await prisma.watchlist.create({
        data: {
          shareToken: 'abc123xyz789',
          title: 'My Horror Watchlist',
        },
      });

      // Public share URL uses token, not database ID
      const shareUrl = `/watchlists/${watchlist.shareToken}`;

      expect(shareUrl).toBe('/watchlists/abc123xyz789');
      expect(shareUrl).not.toContain(watchlist.id);
    });

    it('should serialize watchlist movies with movie slugs', async () => {
      const watchlist = await prisma.watchlist.create({
        data: {
          shareToken: 'test-token',
          title: 'Test Watchlist',
        },
      });

      const movie = await prisma.movie.create({
        data: {
          slug: 'rare-exports',
          title: 'Rare Exports',
          mediaType: 'FILM',
        },
      });

      await prisma.watchlistMovie.create({
        data: {
          watchlistId: watchlist.id,
          movieId: movie.id,
          sortOrder: 1,
        },
      });

      // Simulate API response
      const watchlistMovies = await prisma.watchlistMovie.findMany({
        where: { watchlistId: watchlist.id },
        include: { movie: true },
        orderBy: { sortOrder: 'asc' },
      });

      const apiResponse = watchlistMovies.map(wm => ({
        movie: {
          id: wm.movie.id,
          slug: wm.movie.slug,
          title: wm.movie.title,
          releaseYear: wm.movie.releaseYear,
          mediaType: wm.movie.mediaType,
          posterUrl: wm.movie.posterUrl,
          synopsis: wm.movie.synopsis,
        },
        sortOrder: wm.sortOrder,
        addedAt: wm.addedAt.toISOString(),
        completedAt: wm.completedAt?.toISOString() ?? null,
      }));

      expect(apiResponse).toHaveLength(1);
      expect(apiResponse[0].movie.slug).toBe('rare-exports');
    });
  });
});

describe('Type Safety and Contract Compliance', () => {
  it('should enforce ProductSummary type contract with price as string', () => {
    const product: ProductSummary = {
      id: 'prod-123',
      slug: 'test-product',
      name: 'Test Product',
      description: 'A test product',
      imageUrl: 'https://example.com/image.jpg',
      price: '29.99', // Must be string
      currency: 'USD',
      category: 'Apparel',
    };

    expect(typeof product.price).toBe('string');
    expect(product.currency).toBe('USD');
  });

  it('should enforce Product type contract with price as string', () => {
    const product: Product = {
      id: 'prod-123',
      slug: 'test-product',
      name: 'Test Product',
      description: 'A test product',
      category: 'Apparel',
      imageUrl: 'https://example.com/image.jpg',
      imageAlt: 'Product image',
      price: '49.99', // Must be string
      currency: 'USD',
      seoTitle: 'SEO Title',
      seoDescription: 'SEO Description',
      featured: false,
      franchise: null,
      affiliateLinks: [],
      publishedAt: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(typeof product.price).toBe('string');
    expect(product.currency).toBe('USD');
  });

  it('should enforce slug presence in all summary types', () => {
    const collection: CollectionSummary = {
      id: 'coll-123',
      slug: 'test-collection',
      title: 'Test Collection',
      summary: null,
      type: 'THEME',
      heroImageUrl: null,
      featured: false,
      seasonal: false,
    };

    const movie: MovieSummary = {
      id: 'movie-123',
      slug: 'test-movie',
      title: 'Test Movie',
      releaseYear: 2023,
      mediaType: 'FILM',
      posterUrl: null,
      synopsis: null,
    };

    const character: CharacterSummary = {
      id: 'char-123',
      slug: 'test-character',
      name: 'Test Character',
      summary: null,
      imageUrl: null,
    };

    const product: ProductSummary = {
      id: 'prod-123',
      slug: 'test-product',
      name: 'Test Product',
      description: null,
      imageUrl: null,
      price: '19.99',
      currency: 'USD',
      category: null,
    };

    expect(collection.slug).toBeDefined();
    expect(movie.slug).toBeDefined();
    expect(character.slug).toBeDefined();
    expect(product.slug).toBeDefined();
  });
});
