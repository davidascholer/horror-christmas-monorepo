/**
 * Tests for publication validation
 * 
 * Validates Requirements 3.5, 3.8, 12.1-12.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  validateCollectionForPublication,
  validateMovieForPublication,
  validateCharacterForPublication,
  validateProductForPublication,
  validateEntityForPublication,
} from './publication-validation.js';

const prisma = new PrismaClient();

// Every row this file creates uses this slug prefix, so cleanup never touches
// seed data. Join rows are removed through onDelete: Cascade.
const P = 'zz-pubval-';

describe('Publication Validation', () => {
  afterEach(async () => {
    const where = { slug: { startsWith: P } };
    await prisma.collection.deleteMany({ where });
    await prisma.movie.deleteMany({ where });
    await prisma.character.deleteMany({ where });
    await prisma.product.deleteMany({ where });
  });

  describe('validateCollectionForPublication', () => {
    it('should pass validation for a complete collection', async () => {
      // Create a movie for the collection
      const movie = await prisma.movie.create({
        data: {
          slug: P + 'test-movie',
          title: 'Test Movie',
          seoTitle: 'Test Movie SEO',
          seoDescription: 'Test movie description',
        },
      });

      // Create a related collection
      const relatedCollection = await prisma.collection.create({
        data: {
          slug: P + 'related-collection',
          title: 'Related Collection',
          type: 'THEME',
          introduction: 'Related introduction',
          curatorNotes: 'Related curator notes',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Hero image alt text',
          seoTitle: 'Related Collection',
          seoDescription: 'Related description',
        },
      });

      // Create the collection to validate
      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: 'This is a test collection introduction.',
          curatorNotes: 'These are the curator notes explaining the collection.',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Hero image description',
          seoTitle: 'Test Collection SEO Title',
          seoDescription: 'Test collection SEO description.',
          movies: {
            create: {
              movieId: movie.id,
              sortOrder: 1,
            },
          },
          relatedCollections: {
            create: {
              targetCollectionId: relatedCollection.id,
              sortOrder: 1,
            },
          },
        },
      });

      const result = await validateCollectionForPublication(collection.id, prisma);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when introduction is missing', async () => {
      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: '', // Empty introduction
          curatorNotes: 'Curator notes',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Alt text',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateCollectionForPublication(collection.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'introduction',
        message: 'Introduction is required for publication',
      });
    });

    it('should fail validation when curator notes are missing', async () => {
      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: '', // Empty curator notes
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Alt text',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateCollectionForPublication(collection.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'curatorNotes',
        message: 'Curator notes are required for publication',
      });
    });

    it('should fail validation when hero image is missing', async () => {
      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Curator notes',
          heroImage: '', // Empty hero image
          heroImageAlt: 'Alt text',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateCollectionForPublication(collection.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'heroImage',
        message: 'Hero image is required for publication',
      });
    });

    it('should fail validation when hero image alt text is missing', async () => {
      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Curator notes',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: '', // Empty alt text
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateCollectionForPublication(collection.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'heroImageAlt',
        message: 'Hero image alt text is required for publication',
      });
    });

    it('should fail validation when SEO title is missing', async () => {
      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Curator notes',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Alt text',
          seoTitle: '', // Empty SEO title
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateCollectionForPublication(collection.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'seoTitle',
        message: 'SEO title is required for publication',
      });
    });

    it('should fail validation when SEO description is missing', async () => {
      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Curator notes',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Alt text',
          seoTitle: 'SEO Title',
          seoDescription: '', // Empty SEO description
        },
      });

      const result = await validateCollectionForPublication(collection.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'seoDescription',
        message: 'SEO description is required for publication',
      });
    });

    it('should fail validation when no movies are associated', async () => {
      const relatedCollection = await prisma.collection.create({
        data: {
          slug: P + 'related-collection',
          title: 'Related Collection',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Curator notes',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Alt text',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
        },
      });

      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Curator notes',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Alt text',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
          relatedCollections: {
            create: {
              targetCollectionId: relatedCollection.id,
              sortOrder: 1,
            },
          },
        },
      });

      const result = await validateCollectionForPublication(collection.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'movies',
        message: 'At least one movie is required for publication',
      });
    });

    it('should fail validation when no related collections are associated', async () => {
      const movie = await prisma.movie.create({
        data: {
          slug: P + 'test-movie',
          title: 'Test Movie',
        },
      });

      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Curator notes',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Alt text',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
          movies: {
            create: {
              movieId: movie.id,
              sortOrder: 1,
            },
          },
        },
      });

      const result = await validateCollectionForPublication(collection.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'relatedCollections',
        message: 'At least one related collection is required for publication',
      });
    });

    it('should return multiple validation errors when multiple fields are missing', async () => {
      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: '', // Missing
          curatorNotes: '', // Missing
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: '', // Missing
          seoTitle: '', // Missing
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateCollectionForPublication(collection.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      expect(result.errors.some(e => e.field === 'introduction')).toBe(true);
      expect(result.errors.some(e => e.field === 'curatorNotes')).toBe(true);
      expect(result.errors.some(e => e.field === 'heroImageAlt')).toBe(true);
      expect(result.errors.some(e => e.field === 'seoTitle')).toBe(true);
    });

    it('should return error for non-existent collection', async () => {
      const result = await validateCollectionForPublication('non-existent-id', prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'collection',
        message: 'Collection not found',
      });
    });
  });

  describe('validateMovieForPublication', () => {
    it('should pass validation for a complete movie', async () => {
      const movie = await prisma.movie.create({
        data: {
          slug: P + 'test-movie',
          title: 'Test Movie',
          seoTitle: 'Test Movie SEO Title',
          seoDescription: 'Test movie SEO description.',
        },
      });

      const result = await validateMovieForPublication(movie.id, prisma);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when SEO title is missing', async () => {
      const movie = await prisma.movie.create({
        data: {
          slug: P + 'test-movie',
          title: 'Test Movie',
          seoTitle: '', // Empty
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateMovieForPublication(movie.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'seoTitle',
        message: 'SEO title is required for publication',
      });
    });

    it('should fail validation when SEO description is missing', async () => {
      const movie = await prisma.movie.create({
        data: {
          slug: P + 'test-movie',
          title: 'Test Movie',
          seoTitle: 'SEO Title',
          seoDescription: '', // Empty
        },
      });

      const result = await validateMovieForPublication(movie.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'seoDescription',
        message: 'SEO description is required for publication',
      });
    });

    it('should return error for non-existent movie', async () => {
      const result = await validateMovieForPublication('non-existent-id', prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'movie',
        message: 'Movie not found',
      });
    });
  });

  describe('validateCharacterForPublication', () => {
    it('should pass validation for a complete character', async () => {
      const character = await prisma.character.create({
        data: {
          slug: P + 'test-character',
          name: 'Test Character',
          seoTitle: 'Test Character SEO Title',
          seoDescription: 'Test character SEO description.',
        },
      });

      const result = await validateCharacterForPublication(character.id, prisma);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when SEO title is missing', async () => {
      const character = await prisma.character.create({
        data: {
          slug: P + 'test-character',
          name: 'Test Character',
          seoTitle: '', // Empty
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateCharacterForPublication(character.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'seoTitle',
        message: 'SEO title is required for publication',
      });
    });

    it('should fail validation when SEO description is missing', async () => {
      const character = await prisma.character.create({
        data: {
          slug: P + 'test-character',
          name: 'Test Character',
          seoTitle: 'SEO Title',
          seoDescription: '', // Empty
        },
      });

      const result = await validateCharacterForPublication(character.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'seoDescription',
        message: 'SEO description is required for publication',
      });
    });

    it('should return error for non-existent character', async () => {
      const result = await validateCharacterForPublication('non-existent-id', prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'character',
        message: 'Character not found',
      });
    });
  });

  describe('validateProductForPublication', () => {
    it('should pass validation for a complete product', async () => {
      const product = await prisma.product.create({
        data: {
          slug: P + 'test-product',
          name: 'Test Product',
          seoTitle: 'Test Product SEO Title',
          seoDescription: 'Test product SEO description.',
        },
      });

      const result = await validateProductForPublication(product.id, prisma);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when SEO title is missing', async () => {
      const product = await prisma.product.create({
        data: {
          slug: P + 'test-product',
          name: 'Test Product',
          seoTitle: '', // Empty
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateProductForPublication(product.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'seoTitle',
        message: 'SEO title is required for publication',
      });
    });

    it('should fail validation when SEO description is missing', async () => {
      const product = await prisma.product.create({
        data: {
          slug: P + 'test-product',
          name: 'Test Product',
          seoTitle: 'SEO Title',
          seoDescription: '', // Empty
        },
      });

      const result = await validateProductForPublication(product.id, prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'seoDescription',
        message: 'SEO description is required for publication',
      });
    });

    it('should return error for non-existent product', async () => {
      const result = await validateProductForPublication('non-existent-id', prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'product',
        message: 'Product not found',
      });
    });
  });

  describe('validateEntityForPublication', () => {
    it('should validate a collection using the generic function', async () => {
      const movie = await prisma.movie.create({
        data: {
          slug: P + 'test-movie',
          title: 'Test Movie',
        },
      });

      const relatedCollection = await prisma.collection.create({
        data: {
          slug: P + 'related-collection',
          title: 'Related Collection',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Curator notes',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Alt text',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
        },
      });

      const collection = await prisma.collection.create({
        data: {
          slug: P + 'test-collection',
          title: 'Test Collection',
          type: 'THEME',
          introduction: 'Introduction',
          curatorNotes: 'Curator notes',
          heroImage: 'https://example.com/hero.jpg',
          heroImageAlt: 'Alt text',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
          movies: {
            create: {
              movieId: movie.id,
              sortOrder: 1,
            },
          },
          relatedCollections: {
            create: {
              targetCollectionId: relatedCollection.id,
              sortOrder: 1,
            },
          },
        },
      });

      const result = await validateEntityForPublication(collection.id, 'collection', prisma);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a movie using the generic function', async () => {
      const movie = await prisma.movie.create({
        data: {
          slug: P + 'test-movie',
          title: 'Test Movie',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateEntityForPublication(movie.id, 'movie', prisma);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a character using the generic function', async () => {
      const character = await prisma.character.create({
        data: {
          slug: P + 'test-character',
          name: 'Test Character',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateEntityForPublication(character.id, 'character', prisma);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a product using the generic function', async () => {
      const product = await prisma.product.create({
        data: {
          slug: P + 'test-product',
          name: 'Test Product',
          seoTitle: 'SEO Title',
          seoDescription: 'SEO Description',
        },
      });

      const result = await validateEntityForPublication(product.id, 'product', prisma);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for invalid entity type', async () => {
      // @ts-expect-error Testing invalid entity type
      const result = await validateEntityForPublication('some-id', 'invalid', prisma);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'entityType',
        message: 'Invalid entity type',
      });
    });
  });
});
