/**
 * Publication validation for editorial content quality
 * 
 * Validates that content meets publication requirements before it can be marked as PUBLISHED.
 * Based on Requirements 3.5, 3.8, 12.1-12.3
 */

import { PrismaClient } from '@prisma/client';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates that a collection meets all publication requirements:
 * - Required fields: introduction, curatorNotes
 * - Required: hero image URL with alt text
 * - Required: seoTitle, seoDescription
 * - Required: at least one movie relationship
 * - Required: at least one related collection
 * 
 * Requirement 3.5: WHEN a collection is published THE SYSTEM SHALL require 
 * at least one movie and at least one related collection, together with 
 * the required introduction and curator notes.
 * 
 * Requirement 12.1: WHEN a collection is prepared for publication THE SYSTEM 
 * SHALL require its introduction and curator notes and verify required SEO 
 * fields and a hero image with alt text.
 */
export async function validateCollectionForPublication(
  collectionId: string,
  prisma: PrismaClient
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // Fetch the collection with its relationships
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      movies: true,
      relatedCollections: true,
    },
  });

  if (!collection) {
    return {
      valid: false,
      errors: [{ field: 'collection', message: 'Collection not found' }],
    };
  }

  // Validate required editorial content
  if (!collection.introduction || collection.introduction.trim() === '') {
    errors.push({
      field: 'introduction',
      message: 'Introduction is required for publication',
    });
  }

  if (!collection.curatorNotes || collection.curatorNotes.trim() === '') {
    errors.push({
      field: 'curatorNotes',
      message: 'Curator notes are required for publication',
    });
  }

  // Validate hero image and alt text
  if (!collection.heroImage || collection.heroImage.trim() === '') {
    errors.push({
      field: 'heroImage',
      message: 'Hero image is required for publication',
    });
  }

  if (!collection.heroImageAlt || collection.heroImageAlt.trim() === '') {
    errors.push({
      field: 'heroImageAlt',
      message: 'Hero image alt text is required for publication',
    });
  }

  // Validate SEO metadata
  if (!collection.seoTitle || collection.seoTitle.trim() === '') {
    errors.push({
      field: 'seoTitle',
      message: 'SEO title is required for publication',
    });
  }

  if (!collection.seoDescription || collection.seoDescription.trim() === '') {
    errors.push({
      field: 'seoDescription',
      message: 'SEO description is required for publication',
    });
  }

  // Validate at least one movie
  if (collection.movies.length === 0) {
    errors.push({
      field: 'movies',
      message: 'At least one movie is required for publication',
    });
  }

  // Validate at least one related collection
  if (collection.relatedCollections.length === 0) {
    errors.push({
      field: 'relatedCollections',
      message: 'At least one related collection is required for publication',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that a movie meets all publication requirements:
 * - Required: seoTitle, seoDescription
 * 
 * Requirement 12.2: WHEN any public content entity is prepared for launch 
 * THE SYSTEM SHALL verify its SEO title and SEO description
 */
export async function validateMovieForPublication(
  movieId: string,
  prisma: PrismaClient
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    return {
      valid: false,
      errors: [{ field: 'movie', message: 'Movie not found' }],
    };
  }

  // Validate SEO metadata
  if (!movie.seoTitle || movie.seoTitle.trim() === '') {
    errors.push({
      field: 'seoTitle',
      message: 'SEO title is required for publication',
    });
  }

  if (!movie.seoDescription || movie.seoDescription.trim() === '') {
    errors.push({
      field: 'seoDescription',
      message: 'SEO description is required for publication',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that a character meets all publication requirements:
 * - Required: seoTitle, seoDescription
 * 
 * Requirement 12.2: WHEN any public content entity is prepared for launch 
 * THE SYSTEM SHALL verify its SEO title and SEO description
 */
export async function validateCharacterForPublication(
  characterId: string,
  prisma: PrismaClient
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  const character = await prisma.character.findUnique({
    where: { id: characterId },
  });

  if (!character) {
    return {
      valid: false,
      errors: [{ field: 'character', message: 'Character not found' }],
    };
  }

  // Validate SEO metadata
  if (!character.seoTitle || character.seoTitle.trim() === '') {
    errors.push({
      field: 'seoTitle',
      message: 'SEO title is required for publication',
    });
  }

  if (!character.seoDescription || character.seoDescription.trim() === '') {
    errors.push({
      field: 'seoDescription',
      message: 'SEO description is required for publication',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that a product meets all publication requirements:
 * - Required: seoTitle, seoDescription
 * 
 * Requirement 12.2: WHEN any public content entity is prepared for launch 
 * THE SYSTEM SHALL verify its SEO title and SEO description
 */
export async function validateProductForPublication(
  productId: string,
  prisma: PrismaClient
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return {
      valid: false,
      errors: [{ field: 'product', message: 'Product not found' }],
    };
  }

  // Validate SEO metadata
  if (!product.seoTitle || product.seoTitle.trim() === '') {
    errors.push({
      field: 'seoTitle',
      message: 'SEO title is required for publication',
    });
  }

  if (!product.seoDescription || product.seoDescription.trim() === '') {
    errors.push({
      field: 'seoDescription',
      message: 'SEO description is required for publication',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates any entity type for publication based on its type.
 * Returns the appropriate validation result for the entity type.
 */
export async function validateEntityForPublication(
  entityId: string,
  entityType: 'collection' | 'movie' | 'character' | 'product',
  prisma: PrismaClient
): Promise<ValidationResult> {
  switch (entityType) {
    case 'collection':
      return validateCollectionForPublication(entityId, prisma);
    case 'movie':
      return validateMovieForPublication(entityId, prisma);
    case 'character':
      return validateCharacterForPublication(entityId, prisma);
    case 'product':
      return validateProductForPublication(entityId, prisma);
    default:
      return {
        valid: false,
        errors: [{ field: 'entityType', message: 'Invalid entity type' }],
      };
  }
}
