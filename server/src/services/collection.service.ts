/**
 * Collection Service
 *
 * Implements all collection-related routes and business logic (Design 4.3):
 * - GET /collections (filters: featured, seasonal, type)
 * - GET /collections/:slug
 * - GET /collections/:slug/movies
 * - GET /collections/:slug/characters
 * - GET /collections/:slug/products
 * - GET /collections/:slug/related
 *
 * All operations return published content only and address resources by slug.
 * Slug-addressed operations return null when the collection does not exist or
 * is not published, so the API layer can produce a 404. An existing collection
 * with no related items returns an empty array.
 */

import { PrismaClient } from '@prisma/client';
import {
  CollectionSummary,
  Collection,
  CollectionMovie,
  CollectionCharacter,
  CollectionProduct,
  RelatedCollection,
  CollectionDetail,
  CollectionListQuery,
} from '../types/api-contracts.js';
import { CollectionRepository } from '../repositories/collection.repository.js';

export class CollectionService {
  private repository: CollectionRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new CollectionRepository(prisma);
  }

  /** GET /collections */
  async listCollections(query?: CollectionListQuery): Promise<CollectionSummary[]> {
    return this.repository.list({
      featured: query?.featured,
      seasonal: query?.seasonal,
      type: query?.type,
    });
  }

  /** GET /collections/:slug (core fields only) */
  async getCollection(slug: string): Promise<Collection | null> {
    return this.repository.findBySlug(slug);
  }

  /** GET /collections/:slug/movies (ordered by sortOrder) */
  async getCollectionMovies(slug: string): Promise<CollectionMovie[] | null> {
    if (!(await this.repository.findBySlug(slug))) return null;
    return this.repository.getMovies(slug);
  }

  /** GET /collections/:slug/characters (ordered by sortOrder) */
  async getCollectionCharacters(slug: string): Promise<CollectionCharacter[] | null> {
    if (!(await this.repository.findBySlug(slug))) return null;
    return this.repository.getCharacters(slug);
  }

  /** GET /collections/:slug/products (ordered by sortOrder) */
  async getCollectionProducts(slug: string): Promise<CollectionProduct[] | null> {
    if (!(await this.repository.findBySlug(slug))) return null;
    return this.repository.getProducts(slug);
  }

  /** GET /collections/:slug/related (ordered by sortOrder, published targets only) */
  async getRelatedCollections(slug: string): Promise<RelatedCollection[] | null> {
    if (!(await this.repository.findBySlug(slug))) return null;
    return this.repository.getRelatedCollections(slug);
  }

  /**
   * Source-defined collection detail projection: ordered movies, characters,
   * products, franchises, tags and related collections.
   */
  async getCollectionDetail(slug: string): Promise<CollectionDetail | null> {
    return this.repository.getDetail(slug);
  }
}
