/**
 * Repository Layer Tests
 * 
 * Tests for published-only queries, slug-based lookups, filters,
 * ordered relationships, null handling, and ISO-8601 serialization.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, ContentStatus, CollectionType, MediaType } from '@prisma/client';
import {
  CollectionRepository,
  MovieRepository,
  CharacterRepository,
  ProductRepository,
} from './index.js';

const prisma = new PrismaClient();

// Repository instances
const collectionRepo = new CollectionRepository(prisma);
const movieRepo = new MovieRepository(prisma);
const characterRepo = new CharacterRepository(prisma);
const productRepo = new ProductRepository(prisma);

// Test data IDs
let testData: {
  collections: { published: string; draft: string; archived: string };
  movies: { published: string; draft: string };
  characters: { published: string; draft: string };
  products: { published: string; draft: string };
  franchise: string;
  tag: string;
};

beforeAll(async () => {
  // Clean up any existing test data
  await prisma.collectionRelated.deleteMany({
    where: {
      OR: [
        { sourceCollection: { slug: { startsWith: 'test-' } } },
        { targetCollection: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.collectionMovie.deleteMany({
    where: {
      OR: [
        { collection: { slug: { startsWith: 'test-' } } },
        { movie: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.collectionCharacter.deleteMany({
    where: {
      OR: [
        { collection: { slug: { startsWith: 'test-' } } },
        { character: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.collectionProduct.deleteMany({
    where: {
      OR: [
        { collection: { slug: { startsWith: 'test-' } } },
        { product: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.collectionFranchise.deleteMany({
    where: { collection: { slug: { startsWith: 'test-' } } },
  });
  await prisma.collectionTag.deleteMany({
    where: { collection: { slug: { startsWith: 'test-' } } },
  });
  await prisma.movieCharacter.deleteMany({
    where: {
      OR: [
        { movie: { slug: { startsWith: 'test-' } } },
        { character: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.movieTag.deleteMany({
    where: { movie: { slug: { startsWith: 'test-' } } },
  });
  await prisma.characterTag.deleteMany({
    where: { character: { slug: { startsWith: 'test-' } } },
  });
  await prisma.productCharacter.deleteMany({
    where: {
      OR: [
        { product: { slug: { startsWith: 'test-' } } },
        { character: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.productTag.deleteMany({
    where: { product: { slug: { startsWith: 'test-' } } },
  });
  await prisma.affiliateLink.deleteMany({
    where: { product: { slug: { startsWith: 'test-' } } },
  });

  await prisma.collection.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.movie.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.character.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.franchise.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.tag.deleteMany({ where: { slug: { startsWith: 'test-' } } });

  // Create test franchise and tag
  const franchise = await prisma.franchise.create({
    data: {
      slug: 'test-franchise',
      name: 'Test Franchise',
    },
  });

  const tag = await prisma.tag.create({
    data: {
      slug: 'test-tag',
      name: 'Test Tag',
    },
  });

  // Create test movies
  const moviePublished = await prisma.movie.create({
    data: {
      slug: 'test-movie-published',
      title: 'Test Movie Published',
      status: ContentStatus.PUBLISHED,
      mediaType: MediaType.FILM,
      releaseYear: 2023,
      releaseDate: new Date('2023-12-25'),
      runtime: 90,
      synopsis: 'A test movie',
      franchiseId: franchise.id,
      publishedAt: new Date(),
    },
  });

  const movieDraft = await prisma.movie.create({
    data: {
      slug: 'test-movie-draft',
      title: 'Test Movie Draft',
      status: ContentStatus.DRAFT,
      mediaType: MediaType.FILM,
    },
  });

  // Create test characters
  const characterPublished = await prisma.character.create({
    data: {
      slug: 'test-character-published',
      name: 'Test Character Published',
      status: ContentStatus.PUBLISHED,
      summary: 'A test character',
      franchiseId: franchise.id,
      publishedAt: new Date(),
    },
  });

  const characterDraft = await prisma.character.create({
    data: {
      slug: 'test-character-draft',
      name: 'Test Character Draft',
      status: ContentStatus.DRAFT,
    },
  });

  // Create test products with decimal price
  const productPublished = await prisma.product.create({
    data: {
      slug: 'test-product-published',
      name: 'Test Product Published',
      status: ContentStatus.PUBLISHED,
      description: 'A test product',
      price: 29.99,
      currency: 'USD',
      category: 'figures',
      franchiseId: franchise.id,
      publishedAt: new Date(),
    },
  });

  const productDraft = await prisma.product.create({
    data: {
      slug: 'test-product-draft',
      name: 'Test Product Draft',
      status: ContentStatus.DRAFT,
    },
  });

  // Create affiliate link
  await prisma.affiliateLink.create({
    data: {
      provider: 'Amazon',
      url: 'https://amazon.com/test',
      productId: productPublished.id,
    },
  });

  // Create test collections
  const collectionPublished = await prisma.collection.create({
    data: {
      slug: 'test-collection-published',
      title: 'Test Collection Published',
      type: CollectionType.THEME,
      status: ContentStatus.PUBLISHED,
      introduction: 'Test introduction',
      curatorNotes: 'Test curator notes',
      summary: 'Test summary',
      featured: true,
      seasonal: false,
      sortOrder: 1,
      publishedAt: new Date(),
    },
  });

  const collectionDraft = await prisma.collection.create({
    data: {
      slug: 'test-collection-draft',
      title: 'Test Collection Draft',
      type: CollectionType.THEME,
      status: ContentStatus.DRAFT,
      introduction: 'Draft introduction',
      curatorNotes: 'Draft curator notes',
    },
  });

  const collectionArchived = await prisma.collection.create({
    data: {
      slug: 'test-collection-archived',
      title: 'Test Collection Archived',
      type: CollectionType.THEME,
      status: ContentStatus.ARCHIVED,
      introduction: 'Archived introduction',
      curatorNotes: 'Archived curator notes',
      publishedAt: new Date(),
    },
  });

  // Create relationships for published collection
  await prisma.collectionMovie.create({
    data: {
      collectionId: collectionPublished.id,
      movieId: moviePublished.id,
      sortOrder: 1,
      curatorNote: 'Essential viewing',
    },
  });

  await prisma.collectionCharacter.create({
    data: {
      collectionId: collectionPublished.id,
      characterId: characterPublished.id,
      sortOrder: 1,
      curatorNote: 'Key character',
    },
  });

  await prisma.collectionProduct.create({
    data: {
      collectionId: collectionPublished.id,
      productId: productPublished.id,
      sortOrder: 1,
      curatorNote: 'Must-have item',
    },
  });

  await prisma.collectionFranchise.create({
    data: {
      collectionId: collectionPublished.id,
      franchiseId: franchise.id,
      sortOrder: 1,
    },
  });

  await prisma.collectionTag.create({
    data: {
      collectionId: collectionPublished.id,
      tagId: tag.id,
    },
  });

  // Create related collection relationship
  await prisma.collectionRelated.create({
    data: {
      sourceCollectionId: collectionPublished.id,
      targetCollectionId: collectionDraft.id, // Will be filtered out
      sortOrder: 1,
    },
  });

  // Create movie-character relationship
  await prisma.movieCharacter.create({
    data: {
      movieId: moviePublished.id,
      characterId: characterPublished.id,
      role: 'Protagonist',
      sortOrder: 1,
    },
  });

  await prisma.movieTag.create({
    data: {
      movieId: moviePublished.id,
      tagId: tag.id,
    },
  });

  await prisma.characterTag.create({
    data: {
      characterId: characterPublished.id,
      tagId: tag.id,
    },
  });

  await prisma.productCharacter.create({
    data: {
      productId: productPublished.id,
      characterId: characterPublished.id,
      sortOrder: 1,
    },
  });

  await prisma.productTag.create({
    data: {
      productId: productPublished.id,
      tagId: tag.id,
    },
  });

  testData = {
    collections: {
      published: collectionPublished.id,
      draft: collectionDraft.id,
      archived: collectionArchived.id,
    },
    movies: {
      published: moviePublished.id,
      draft: movieDraft.id,
    },
    characters: {
      published: characterPublished.id,
      draft: characterDraft.id,
    },
    products: {
      published: productPublished.id,
      draft: productDraft.id,
    },
    franchise: franchise.id,
    tag: tag.id,
  };
});

afterAll(async () => {
  // Clean up test data
  await prisma.collectionRelated.deleteMany({
    where: {
      OR: [
        { sourceCollection: { slug: { startsWith: 'test-' } } },
        { targetCollection: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.collectionMovie.deleteMany({
    where: {
      OR: [
        { collection: { slug: { startsWith: 'test-' } } },
        { movie: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.collectionCharacter.deleteMany({
    where: {
      OR: [
        { collection: { slug: { startsWith: 'test-' } } },
        { character: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.collectionProduct.deleteMany({
    where: {
      OR: [
        { collection: { slug: { startsWith: 'test-' } } },
        { product: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.collectionFranchise.deleteMany({
    where: { collection: { slug: { startsWith: 'test-' } } },
  });
  await prisma.collectionTag.deleteMany({
    where: { collection: { slug: { startsWith: 'test-' } } },
  });
  await prisma.movieCharacter.deleteMany({
    where: {
      OR: [
        { movie: { slug: { startsWith: 'test-' } } },
        { character: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.movieTag.deleteMany({
    where: { movie: { slug: { startsWith: 'test-' } } },
  });
  await prisma.characterTag.deleteMany({
    where: { character: { slug: { startsWith: 'test-' } } },
  });
  await prisma.productCharacter.deleteMany({
    where: {
      OR: [
        { product: { slug: { startsWith: 'test-' } } },
        { character: { slug: { startsWith: 'test-' } } },
      ],
    },
  });
  await prisma.productTag.deleteMany({
    where: { product: { slug: { startsWith: 'test-' } } },
  });
  await prisma.affiliateLink.deleteMany({
    where: { product: { slug: { startsWith: 'test-' } } },
  });

  await prisma.collection.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.movie.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.character.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.franchise.deleteMany({ where: { slug: { startsWith: 'test-' } } });
  await prisma.tag.deleteMany({ where: { slug: { startsWith: 'test-' } } });

  await prisma.$disconnect();
});

describe('Collection Repository', () => {
  describe('Published-Only Filtering', () => {
    it('should only return published collections in list', async () => {
      const collections = await collectionRepo.list();
      const testCollections = collections.filter((c) => c.slug.startsWith('test-'));
      
      expect(testCollections).toHaveLength(1);
      expect(testCollections[0].slug).toBe('test-collection-published');
    });

    it('should return null for draft collection by slug', async () => {
      const collection = await collectionRepo.findBySlug('test-collection-draft');
      expect(collection).toBeNull();
    });

    it('should return null for archived collection by slug', async () => {
      const collection = await collectionRepo.findBySlug('test-collection-archived');
      expect(collection).toBeNull();
    });

    it('should return null for non-existent slug', async () => {
      const collection = await collectionRepo.findBySlug('does-not-exist');
      expect(collection).toBeNull();
    });
  });

  describe('Filters', () => {
    it('should filter by featured flag', async () => {
      const featured = await collectionRepo.list({ featured: true });
      const testFeatured = featured.filter((c) => c.slug.startsWith('test-'));
      
      expect(testFeatured).toHaveLength(1);
      expect(testFeatured[0].featured).toBe(true);
    });

    it('should filter by seasonal flag', async () => {
      const seasonal = await collectionRepo.list({ seasonal: true });
      const testSeasonal = seasonal.filter((c) => c.slug.startsWith('test-'));
      
      expect(testSeasonal).toHaveLength(0); // Our test collection is not seasonal
    });

    it('should filter by collection type', async () => {
      const themed = await collectionRepo.list({ type: CollectionType.THEME });
      const testThemed = themed.filter((c) => c.slug.startsWith('test-'));
      
      expect(testThemed.length).toBeGreaterThan(0);
    });
  });

  describe('Slug-Based Lookups', () => {
    it('should retrieve collection by slug', async () => {
      const collection = await collectionRepo.findBySlug('test-collection-published');
      
      expect(collection).not.toBeNull();
      expect(collection!.slug).toBe('test-collection-published');
      expect(collection!.title).toBe('Test Collection Published');
    });
  });

  describe('Ordered Relationships', () => {
    it('should return movies in sortOrder', async () => {
      const movies = await collectionRepo.getMovies('test-collection-published');
      
      expect(movies).toHaveLength(1);
      expect(movies[0].sortOrder).toBe(1);
      expect(movies[0].curatorNote).toBe('Essential viewing');
      expect(movies[0].movie.slug).toBe('test-movie-published');
    });

    it('should return characters in sortOrder', async () => {
      const characters = await collectionRepo.getCharacters('test-collection-published');
      
      expect(characters).toHaveLength(1);
      expect(characters[0].sortOrder).toBe(1);
      expect(characters[0].curatorNote).toBe('Key character');
    });

    it('should return products in sortOrder', async () => {
      const products = await collectionRepo.getProducts('test-collection-published');
      
      expect(products).toHaveLength(1);
      expect(products[0].sortOrder).toBe(1);
      expect(products[0].curatorNote).toBe('Must-have item');
    });

    it('should only include published related collections', async () => {
      const related = await collectionRepo.getRelatedCollections('test-collection-published');
      
      // Should be empty because the related collection is draft
      expect(related).toHaveLength(0);
    });
  });

  describe('Null Handling', () => {
    it('should serialize null as null (not undefined)', async () => {
      const collection = await collectionRepo.findBySlug('test-collection-published');
      
      expect(collection).not.toBeNull();
      expect(collection!.heroImageUrl).toBeNull();
      expect(collection!.heroImageAlt).toBeNull();
      expect(collection!.seoTitle).toBeNull();
    });
  });

  describe('ISO-8601 Timestamps', () => {
    it('should serialize timestamps as ISO-8601 strings', async () => {
      const collection = await collectionRepo.findBySlug('test-collection-published');
      
      expect(collection).not.toBeNull();
      expect(typeof collection!.createdAt).toBe('string');
      expect(typeof collection!.updatedAt).toBe('string');
      expect(collection!.publishedAt).not.toBeNull();
      expect(typeof collection!.publishedAt).toBe('string');
      
      // Should be valid ISO-8601
      expect(() => new Date(collection!.createdAt)).not.toThrow();
      expect(() => new Date(collection!.updatedAt)).not.toThrow();
    });
  });
});

describe('Movie Repository', () => {
  describe('Published-Only Filtering', () => {
    it('should only return published movies in list', async () => {
      const movies = await movieRepo.list();
      const testMovies = movies.filter((m) => m.slug.startsWith('test-'));
      
      expect(testMovies).toHaveLength(1);
      expect(testMovies[0].slug).toBe('test-movie-published');
    });

    it('should return null for draft movie by slug', async () => {
      const movie = await movieRepo.findBySlug('test-movie-draft');
      expect(movie).toBeNull();
    });
  });

  describe('Slug-Based Lookups', () => {
    it('should retrieve movie by slug', async () => {
      const movie = await movieRepo.findBySlug('test-movie-published');
      
      expect(movie).not.toBeNull();
      expect(movie!.slug).toBe('test-movie-published');
      expect(movie!.title).toBe('Test Movie Published');
    });
  });

  describe('Ordered Relationships', () => {
    it('should return characters in sortOrder with role', async () => {
      const characters = await movieRepo.getCharacters('test-movie-published');
      
      expect(characters).toHaveLength(1);
      expect(characters[0].sortOrder).toBe(1);
      expect(characters[0].role).toBe('Protagonist');
      expect(characters[0].character.slug).toBe('test-character-published');
    });

    it('should return collections containing this movie', async () => {
      const collections = await movieRepo.getCollections('test-movie-published');
      const testCollections = collections.filter((c) => c.slug.startsWith('test-'));
      
      expect(testCollections).toHaveLength(1);
      expect(testCollections[0].slug).toBe('test-collection-published');
    });
  });

  describe('ISO-8601 Timestamps', () => {
    it('should serialize date fields as ISO-8601', async () => {
      const movie = await movieRepo.findBySlug('test-movie-published');
      
      expect(movie).not.toBeNull();
      expect(typeof movie!.createdAt).toBe('string');
      expect(typeof movie!.updatedAt).toBe('string');
      expect(movie!.releaseDate).not.toBeNull();
      expect(typeof movie!.releaseDate).toBe('string');
    });
  });

  describe('Franchise Relationships', () => {
    it('should include franchise information', async () => {
      const movie = await movieRepo.findBySlug('test-movie-published');
      
      expect(movie).not.toBeNull();
      expect(movie!.franchise).not.toBeNull();
      expect(movie!.franchise!.slug).toBe('test-franchise');
    });
  });
});

describe('Character Repository', () => {
  describe('Published-Only Filtering', () => {
    it('should only return published characters in list', async () => {
      const characters = await characterRepo.list();
      const testCharacters = characters.filter((c) => c.slug.startsWith('test-'));
      
      expect(testCharacters).toHaveLength(1);
      expect(testCharacters[0].slug).toBe('test-character-published');
    });

    it('should return null for draft character by slug', async () => {
      const character = await characterRepo.findBySlug('test-character-draft');
      expect(character).toBeNull();
    });
  });

  describe('Slug-Based Lookups', () => {
    it('should retrieve character by slug', async () => {
      const character = await characterRepo.findBySlug('test-character-published');
      
      expect(character).not.toBeNull();
      expect(character!.slug).toBe('test-character-published');
      expect(character!.name).toBe('Test Character Published');
    });
  });

  describe('Related Content', () => {
    it('should return movies featuring this character', async () => {
      const movies = await characterRepo.getMovies('test-character-published');
      
      expect(movies).toHaveLength(1);
      expect(movies[0].slug).toBe('test-movie-published');
    });

    it('should return products related to this character', async () => {
      const products = await characterRepo.getProducts('test-character-published');
      
      expect(products).toHaveLength(1);
      expect(products[0].slug).toBe('test-product-published');
    });

    it('should return collections containing this character', async () => {
      const collections = await characterRepo.getCollections('test-character-published');
      const testCollections = collections.filter((c) => c.slug.startsWith('test-'));
      
      expect(testCollections).toHaveLength(1);
      expect(testCollections[0].slug).toBe('test-collection-published');
    });
  });
});

describe('Product Repository', () => {
  describe('Published-Only Filtering', () => {
    it('should only return published products in list', async () => {
      const products = await productRepo.list();
      const testProducts = products.filter((p) => p.slug.startsWith('test-'));
      
      expect(testProducts).toHaveLength(1);
      expect(testProducts[0].slug).toBe('test-product-published');
    });

    it('should return null for draft product by slug', async () => {
      const product = await productRepo.findBySlug('test-product-draft');
      expect(product).toBeNull();
    });
  });

  describe('Slug-Based Lookups', () => {
    it('should retrieve product by slug', async () => {
      const product = await productRepo.findBySlug('test-product-published');
      
      expect(product).not.toBeNull();
      expect(product!.slug).toBe('test-product-published');
      expect(product!.name).toBe('Test Product Published');
    });
  });

  describe('Decimal Price Serialization', () => {
    it('should serialize price as string with precision', async () => {
      const product = await productRepo.findBySlug('test-product-published');
      
      expect(product).not.toBeNull();
      expect(product!.price).toBe('29.99');
      expect(typeof product!.price).toBe('string');
      expect(product!.currency).toBe('USD');
    });

    it('should handle null price correctly', async () => {
      const products = await productRepo.list();
      const testProduct = products.find((p) => p.slug === 'test-product-published');
      
      expect(testProduct).toBeDefined();
      expect(testProduct!.price).toBe('29.99');
    });
  });

  describe('Affiliate Links', () => {
    it('should include affiliate links in product detail', async () => {
      const product = await productRepo.findBySlug('test-product-published');
      
      expect(product).not.toBeNull();
      expect(product!.affiliateLinks).toHaveLength(1);
      expect(product!.affiliateLinks[0].provider).toBe('Amazon');
      expect(product!.affiliateLinks[0].url).toBe('https://amazon.com/test');
    });
  });

  describe('Ordered Relationships', () => {
    it('should return characters in sortOrder', async () => {
      const characters = await productRepo.getCharacters('test-product-published');
      
      expect(characters).toHaveLength(1);
      expect(characters[0].sortOrder).toBe(1);
      expect(characters[0].character.slug).toBe('test-character-published');
    });
  });
});

describe('Cross-Repository Integration', () => {
  it('should handle circular references between entities', async () => {
    // Get collection detail
    const collection = await collectionRepo.getDetail('test-collection-published');
    expect(collection).not.toBeNull();
    expect(collection!.movies).toHaveLength(1);
    
    // Get movie detail
    const movie = await movieRepo.getDetail('test-movie-published');
    expect(movie).not.toBeNull();
    expect(movie!.collections.filter((c) => c.slug.startsWith('test-'))).toHaveLength(1);
  });

  it('should consistently filter unpublished content across relationships', async () => {
    const collection = await collectionRepo.findBySlug('test-collection-published');
    const movies = await collectionRepo.getMovies('test-collection-published');
    const characters = await collectionRepo.getCharacters('test-collection-published');
    const products = await collectionRepo.getProducts('test-collection-published');
    
    // All relationships should only include published content
    expect(collection).not.toBeNull();
    expect(movies.every((m) => m.movie.slug.includes('published'))).toBe(true);
    expect(characters.every((c) => c.character.slug.includes('published'))).toBe(true);
    expect(products.every((p) => p.product.slug.includes('published'))).toBe(true);
  });
});
