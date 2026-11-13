/**
 * Character Repository
 * 
 * Handles published-only character queries with:
 * - Slug-based lookups
 * - Related movies, products, collections, and tags
 * - ISO-8601 timestamp serialization
 */

import { PrismaClient } from '@prisma/client';
import {
  CharacterSummary,
  Character,
  CharacterDetail,
  MovieSummary,
  ProductSummary,
  CollectionSummary,
  TagSummary,
} from '../types/api-contracts.js';
import {
  PUBLISHED_ONLY_FILTER,
  TAG_ORDER,
  serializeDecimal,
  serializeMediaType,
  serializeTimestamp,
} from './base.repository.js';

export class CharacterRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * List all published characters
   * Ordered by name (asc)
   */
  async list(): Promise<CharacterSummary[]> {
    const characters = await this.prisma.character.findMany({
      where: PUBLISHED_ONLY_FILTER,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        slug: true,
        name: true,
        summary: true,
        image: true,
      },
    });

    return characters.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      summary: c.summary,
      imageUrl: c.image,
    }));
  }

  /**
   * Get published character by slug
   * Returns null if not found or not published
   */
  async findBySlug(slug: string): Promise<Character | null> {
    const character = await this.prisma.character.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        summary: true,
        biography: true,
        image: true,
        seoTitle: true,
        seoDescription: true,
        featured: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        franchise: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    if (!character) {
      return null;
    }

    return {
      id: character.id,
      slug: character.slug,
      name: character.name,
      summary: character.summary,
      biography: character.biography,
      imageUrl: character.image,
      seoTitle: character.seoTitle,
      seoDescription: character.seoDescription,
      featured: character.featured,
      franchise: character.franchise
        ? {
            id: character.franchise.id,
            slug: character.franchise.slug,
            name: character.franchise.name,
          }
        : null,
      publishedAt: serializeTimestamp(character.publishedAt),
      createdAt: serializeTimestamp(character.createdAt)!,
      updatedAt: serializeTimestamp(character.updatedAt)!,
    };
  }

  /**
   * Get movies featuring this published character
   * Returns empty array if character not found or not published
   */
  async getMovies(slug: string): Promise<MovieSummary[]> {
    const character = await this.prisma.character.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        movies: {
          where: {
            movie: PUBLISHED_ONLY_FILTER,
          },
          orderBy: [
            { movie: { releaseYear: 'desc' } },
            { movie: { title: 'asc' } },
          ],
          select: {
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

    if (!character) {
      return [];
    }

    return character.movies.map((mc) => ({
      id: mc.movie.id,
      slug: mc.movie.slug,
      title: mc.movie.title,
      releaseYear: mc.movie.releaseYear,
      mediaType: serializeMediaType(mc.movie.mediaType),
      posterUrl: mc.movie.poster,
      synopsis: mc.movie.synopsis,
    }));
  }

  /**
   * Get products related to this published character
   * Returns empty array if character not found or not published
   */
  async getProducts(slug: string): Promise<ProductSummary[]> {
    const character = await this.prisma.character.findFirst({
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

    if (!character) {
      return [];
    }

    return character.products.map((pc) => ({
      id: pc.product.id,
      slug: pc.product.slug,
      name: pc.product.name,
      description: pc.product.description,
      imageUrl: pc.product.image,
      price: serializeDecimal(pc.product.price),
      currency: pc.product.currency,
      category: pc.product.category,
    }));
  }

  /**
   * Get collections that include this published character
   * Returns empty array if character not found or not published
   */
  async getCollections(slug: string): Promise<CollectionSummary[]> {
    const character = await this.prisma.character.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        collections: {
          where: {
            collection: PUBLISHED_ONLY_FILTER,
          },
          orderBy: {
            collection: {
              title: 'asc',
            },
          },
          select: {
            collection: {
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

    if (!character) {
      return [];
    }

    return character.collections.map((cc) => ({
      id: cc.collection.id,
      slug: cc.collection.slug,
      title: cc.collection.title,
      summary: cc.collection.summary,
      type: cc.collection.type,
      heroImageUrl: cc.collection.heroImage,
      featured: cc.collection.featured,
      seasonal: cc.collection.seasonal,
    }));
  }

  /**
   * Get tags for this published character
   * Returns empty array if character not found or not published
   */
  async getTags(slug: string): Promise<TagSummary[]> {
    const character = await this.prisma.character.findFirst({
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

    if (!character) {
      return [];
    }

    return character.tags.map((ct) => ({
      id: ct.tag.id,
      slug: ct.tag.slug,
      name: ct.tag.name,
    }));
  }

  /**
   * Get complete character detail with all relationships
   * Returns null if character not found or not published
   */
  async getDetail(slug: string): Promise<CharacterDetail | null> {
    const character = await this.findBySlug(slug);
    if (!character) {
      return null;
    }

    const [movies, products, collections, tags] = await Promise.all([
      this.getMovies(slug),
      this.getProducts(slug),
      this.getCollections(slug),
      this.getTags(slug),
    ]);

    return {
      ...character,
      movies,
      products,
      collections,
      tags,
    };
  }
}
