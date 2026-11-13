/**
 * Repository Usage Examples
 * 
 * This file demonstrates how to use the repository layer.
 * These patterns will be used by API endpoints in Task 4.2+.
 */

import { PrismaClient } from '@prisma/client';
import {
  CollectionRepository,
  MovieRepository,
  CharacterRepository,
  ProductRepository,
} from './index.js';

const prisma = new PrismaClient();

// Initialize repositories
const collectionRepo = new CollectionRepository(prisma);
const movieRepo = new MovieRepository(prisma);
const characterRepo = new CharacterRepository(prisma);
const productRepo = new ProductRepository(prisma);

/**
 * Example: API endpoint GET /collections
 * List published collections with optional filters
 */
async function listCollections(query: {
  featured?: string;
  seasonal?: string;
  type?: string;
}) {
  const filters = {
    ...(query.featured === 'true' && { featured: true }),
    ...(query.seasonal === 'true' && { seasonal: true }),
    ...(query.type && { type: query.type as any }),
  };

  const collections = await collectionRepo.list(filters);
  return { status: 200, body: collections };
}

/**
 * Example: API endpoint GET /collections/:slug
 * Get collection detail by slug (returns 404 if not found)
 */
async function getCollection(slug: string) {
  const collection = await collectionRepo.findBySlug(slug);

  if (!collection) {
    return { status: 404, body: { error: 'Collection not found' } };
  }

  return { status: 200, body: collection };
}

/**
 * Example: API endpoint GET /collections/:slug (with all relationships)
 * Get complete collection detail with movies, characters, products, etc.
 */
async function getCollectionDetail(slug: string) {
  const detail = await collectionRepo.getDetail(slug);

  if (!detail) {
    return { status: 404, body: { error: 'Collection not found' } };
  }

  return { status: 200, body: detail };
}

/**
 * Example: API endpoint GET /collections/:slug/movies
 * Get ordered movies for a collection
 */
async function getCollectionMovies(slug: string) {
  const movies = await collectionRepo.getMovies(slug);
  return { status: 200, body: { movies } };
}

/**
 * Example: API endpoint GET /movies/:slug
 * Get movie detail by slug (returns 404 if not found)
 */
async function getMovie(slug: string) {
  const movie = await movieRepo.findBySlug(slug);

  if (!movie) {
    return { status: 404, body: { error: 'Movie not found' } };
  }

  return { status: 200, body: movie };
}

/**
 * Example: API endpoint GET /movies/:slug/collections
 * Get collections containing this movie
 */
async function getMovieCollections(slug: string) {
  const collections = await movieRepo.getCollections(slug);
  return { status: 200, body: { collections } };
}

/**
 * Example: API endpoint GET /characters/:slug
 * Get character detail by slug (returns 404 if not found)
 */
async function getCharacter(slug: string) {
  const character = await characterRepo.findBySlug(slug);

  if (!character) {
    return { status: 404, body: { error: 'Character not found' } };
  }

  return { status: 200, body: character };
}

/**
 * Example: API endpoint GET /products/:slug
 * Get product detail by slug (returns 404 if not found)
 */
async function getProduct(slug: string) {
  const product = await productRepo.findBySlug(slug);

  if (!product) {
    return { status: 404, body: { error: 'Product not found' } };
  }

  return { status: 200, body: product };
}

/**
 * Example: Homepage data aggregation
 * Demonstrates combining multiple repository queries
 */
async function getHomeData() {
  const [featuredCollections, seasonalCollections, featuredMovies, featuredCharacters, giftCollections] = await Promise.all([
    collectionRepo.list({ featured: true }),
    collectionRepo.list({ seasonal: true }),
    movieRepo.list(),
    characterRepo.list(),
    collectionRepo.list({ type: 'GIFT' as any }),
  ]);

  // Find featured entities (example logic)
  const featuredMovie = featuredMovies.find((m) => m.slug === 'some-featured-slug') || null;
  const featuredCharacter = featuredCharacters.find((c) => c.slug === 'some-featured-slug') || null;
  const giftCollection = giftCollections[0] || null;

  return {
    status: 200,
    body: {
      featuredCollections: featuredCollections.slice(0, 6),
      seasonalCollections: seasonalCollections.slice(0, 4),
      featuredMovie,
      featuredCharacter,
      giftCollection,
    },
  };
}

/**
 * Key Patterns:
 * 
 * 1. All queries return published content only
 * 2. Missing slugs return null → convert to 404 in API layer
 * 3. Relationships preserve sortOrder
 * 4. Timestamps are ISO-8601 strings
 * 5. Prices are decimal-safe strings
 * 6. Null values are explicit (never undefined)
 * 7. Filters are applied via query parameters
 */

// Export examples for reference
export {
  listCollections,
  getCollection,
  getCollectionDetail,
  getCollectionMovies,
  getMovie,
  getMovieCollections,
  getCharacter,
  getProduct,
  getHomeData,
};
