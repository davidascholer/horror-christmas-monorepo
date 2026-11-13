/**
 * Collection Repository
 * 
 * Handles published-only collection queries with:
 * - Slug-based lookups
 * - Featured/seasonal/type filters
 * - Ordered relationships
 * - ISO-8601 timestamp serialization
 */

import { PrismaClient, CollectionType } from '@prisma/client';
import {
  CollectionSummary,
  Collection,
  CollectionMovie,
  CollectionCharacter,
  CollectionProduct,
  CollectionFranchise,
  TagSummary,
  RelatedCollection,
  CollectionDetail,
} from '../types/api-contracts.js';
import {
  PUBLISHED_ONLY_FILTER,
  TAG_ORDER,
  serializeDecimal,
  serializeMediaType,
  serializeTimestamp,
} from './base.repository.js';

export interface CollectionFilters {
  featured?: boolean;
  seasonal?: boolean;
  type?: CollectionType;
}

export class CollectionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * List published collections with optional filters
   * Returns collections ordered by sortOrder (if present) then title
   */
  async list(filters: CollectionFilters = {}): Promise<CollectionSummary[]> {
    const where = {
      ...PUBLISHED_ONLY_FILTER,
      ...(filters.featured !== undefined && { featured: filters.featured }),
      ...(filters.seasonal !== undefined && { seasonal: filters.seasonal }),
      ...(filters.type && { type: filters.type }),
    };

    const collections = await this.prisma.collection.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { title: 'asc' },
      ],
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        type: true,
        heroImage: true,
        featured: true,
        seasonal: true,
      },
    });

    return collections.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      type: c.type,
      heroImageUrl: c.heroImage,
      featured: c.featured,
      seasonal: c.seasonal,
    }));
  }

  /**
   * Get published collection by slug
   * Returns null if not found or not published
   */
  async findBySlug(slug: string): Promise<Collection | null> {
    const collection = await this.prisma.collection.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        introduction: true,
        curatorNotes: true,
        summary: true,
        heroImage: true,
        heroImageAlt: true,
        seoTitle: true,
        seoDescription: true,
        featured: true,
        seasonal: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!collection) {
      return null;
    }

    return {
      id: collection.id,
      slug: collection.slug,
      title: collection.title,
      type: collection.type,
      introduction: collection.introduction,
      curatorNotes: collection.curatorNotes,
      summary: collection.summary,
      heroImageUrl: collection.heroImage,
      heroImageAlt: collection.heroImageAlt,
      seoTitle: collection.seoTitle,
      seoDescription: collection.seoDescription,
      featured: collection.featured,
      seasonal: collection.seasonal,
      publishedAt: serializeTimestamp(collection.publishedAt),
      createdAt: serializeTimestamp(collection.createdAt)!,
      updatedAt: serializeTimestamp(collection.updatedAt)!,
    };
  }

  /**
   * Get ordered movies for a published collection
   * Returns empty array if collection not found or not published
   */
  async getMovies(slug: string): Promise<CollectionMovie[]> {
    const collection = await this.prisma.collection.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        movies: {
          where: {
            movie: PUBLISHED_ONLY_FILTER,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            sortOrder: true,
            curatorNote: true,
            movie: {
              select: {
                id: true,
                slug: true,
                title: true,
                releaseYear: true,
                mediaType: true,
                poster: true,
                synopsis: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return [];
    }

    return collection.movies.map((cm) => ({
      movie: {
        id: cm.movie.id,
        slug: cm.movie.slug,
        title: cm.movie.title,
        releaseYear: cm.movie.releaseYear,
        mediaType: serializeMediaType(cm.movie.mediaType),
        posterUrl: cm.movie.poster,
        synopsis: cm.movie.synopsis,
      },
      sortOrder: cm.sortOrder,
      curatorNote: cm.curatorNote,
    }));
  }

  /**
   * Get ordered characters for a published collection
   * Returns empty array if collection not found or not published
   */
  async getCharacters(slug: string): Promise<CollectionCharacter[]> {
    const collection = await this.prisma.collection.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        characters: {
          where: {
            character: PUBLISHED_ONLY_FILTER,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            sortOrder: true,
            curatorNote: true,
            character: {
              select: {
                id: true,
                slug: true,
                name: true,
                summary: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return [];
    }

    return collection.characters.map((cc) => ({
      character: {
        id: cc.character.id,
        slug: cc.character.slug,
        name: cc.character.name,
        summary: cc.character.summary,
        imageUrl: cc.character.image,
      },
      sortOrder: cc.sortOrder,
      curatorNote: cc.curatorNote,
    }));
  }

  /**
   * Get ordered products for a published collection
   * Returns empty array if collection not found or not published
   */
  async getProducts(slug: string): Promise<CollectionProduct[]> {
    const collection = await this.prisma.collection.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        products: {
          where: {
            product: PUBLISHED_ONLY_FILTER,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            sortOrder: true,
            curatorNote: true,
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                image: true,
                price: true,
                currency: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return [];
    }

    return collection.products.map((cp) => ({
      product: {
        id: cp.product.id,
        slug: cp.product.slug,
        name: cp.product.name,
        description: cp.product.description,
        imageUrl: cp.product.image,
        price: serializeDecimal(cp.product.price),
        currency: cp.product.currency,
        category: cp.product.category,
      },
      sortOrder: cp.sortOrder,
      curatorNote: cp.curatorNote,
    }));
  }

  /**
   * Get ordered franchises for a published collection
   * Returns empty array if collection not found or not published
   */
  async getFranchises(slug: string): Promise<CollectionFranchise[]> {
    const collection = await this.prisma.collection.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        franchises: {
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            sortOrder: true,
            franchise: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return [];
    }

    return collection.franchises.map((cf) => ({
      franchise: {
        id: cf.franchise.id,
        slug: cf.franchise.slug,
        name: cf.franchise.name,
      },
      sortOrder: cf.sortOrder,
    }));
  }

  /**
   * Get tags for a published collection
   * Returns empty array if collection not found or not published
   */
  async getTags(slug: string): Promise<TagSummary[]> {
    const collection = await this.prisma.collection.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        tags: {
          orderBy: TAG_ORDER,
          select: {
            tag: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return [];
    }

    return collection.tags.map((ct) => ({
      id: ct.tag.id,
      slug: ct.tag.slug,
      name: ct.tag.name,
    }));
  }

  /**
   * Get ordered related collections for a published collection
   * Only includes published related collections
   * Returns empty array if collection not found or not published
   */
  async getRelatedCollections(slug: string): Promise<RelatedCollection[]> {
    const collection = await this.prisma.collection.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        relatedCollections: {
          where: {
            targetCollection: PUBLISHED_ONLY_FILTER,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            sortOrder: true,
            targetCollection: {
              select: {
                id: true,
                slug: true,
                title: true,
                summary: true,
                type: true,
                heroImage: true,
                featured: true,
                seasonal: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return [];
    }

    return collection.relatedCollections.map((rc) => ({
      collection: {
        id: rc.targetCollection.id,
        slug: rc.targetCollection.slug,
        title: rc.targetCollection.title,
        summary: rc.targetCollection.summary,
        type: rc.targetCollection.type,
        heroImageUrl: rc.targetCollection.heroImage,
        featured: rc.targetCollection.featured,
        seasonal: rc.targetCollection.seasonal,
      },
      sortOrder: rc.sortOrder,
    }));
  }

  /**
   * Get complete collection detail with all relationships
   * Returns null if collection not found or not published
   */
  async getDetail(slug: string): Promise<CollectionDetail | null> {
    const collection = await this.findBySlug(slug);
    if (!collection) {
      return null;
    }

    const [movies, characters, products, franchises, tags, relatedCollections] = await Promise.all([
      this.getMovies(slug),
      this.getCharacters(slug),
      this.getProducts(slug),
      this.getFranchises(slug),
      this.getTags(slug),
      this.getRelatedCollections(slug),
    ]);

    return {
      ...collection,
      movies,
      characters,
      products,
      franchises,
      tags,
      relatedCollections,
    };
  }
}
