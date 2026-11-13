/**
 * Movie Repository
 * 
 * Handles published-only movie queries with:
 * - Slug-based lookups
 * - Ordered relationships (characters)
 * - ISO-8601 timestamp serialization
 */

import { PrismaClient } from '@prisma/client';
import {
  MovieSummary,
  Movie,
  MovieCharacter,
  MovieDetail,
  CollectionSummary,
  TagSummary,
  ProductSummary,
} from '../types/api-contracts.js';
import {
  PUBLISHED_ONLY_FILTER,
  TAG_ORDER,
  serializeDecimal,
  serializeMediaType,
  serializeTimestamp,
} from './base.repository.js';

export class MovieRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * List all published movies
   * Ordered by release year (desc), then title (asc)
   */
  async list(options?: {
    q?: string;
    year?: number;
    genre?: string;
    skip?: number;
    take?: number;
  }): Promise<MovieSummary[]> {
    const q = options?.q?.trim();
    const genre = options?.genre?.trim();
    const movies = await this.prisma.movie.findMany({
      where: {
        ...PUBLISHED_ONLY_FILTER,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' as const } },
                { originalTitle: { contains: q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
        ...(options?.year !== undefined ? { releaseYear: options.year } : {}),
        // No genre column exists; genre is matched against tag slugs (see OPEN-DECISIONS.md)
        ...(genre
          ? { tags: { some: { tag: { slug: { equals: genre, mode: 'insensitive' as const } } } } }
          : {}),
      },
      orderBy: [
        { releaseYear: 'desc' },
        { title: 'asc' },
        { slug: 'asc' },
      ],
      skip: options?.skip,
      take: options?.take,
      select: {
        id: true,
        slug: true,
        title: true,
        releaseYear: true,
        mediaType: true,
        poster: true,
        synopsis: true,
      },
    });

    return movies.map((m) => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      releaseYear: m.releaseYear,
      mediaType: serializeMediaType(m.mediaType),
      posterUrl: m.poster,
      synopsis: m.synopsis,
    }));
  }

  /**
   * Get published movie by slug
   * Returns null if not found or not published
   */
  async findBySlug(slug: string): Promise<Movie | null> {
    const movie = await this.prisma.movie.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        originalTitle: true,
        mediaType: true,
        releaseYear: true,
        releaseDate: true,
        runtime: true,
        synopsis: true,
        poster: true,
        hero: true,
        trailerUrl: true,
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

    if (!movie) {
      return null;
    }

    return {
      id: movie.id,
      slug: movie.slug,
      title: movie.title,
      originalTitle: movie.originalTitle,
      mediaType: serializeMediaType(movie.mediaType),
      releaseYear: movie.releaseYear,
      releaseDate: serializeTimestamp(movie.releaseDate),
      runtime: movie.runtime,
      synopsis: movie.synopsis,
      posterUrl: movie.poster,
      heroImageUrl: movie.hero,
      trailerUrl: movie.trailerUrl,
      seoTitle: movie.seoTitle,
      seoDescription: movie.seoDescription,
      featured: movie.featured,
      franchise: movie.franchise
        ? {
            id: movie.franchise.id,
            slug: movie.franchise.slug,
            name: movie.franchise.name,
          }
        : null,
      publishedAt: serializeTimestamp(movie.publishedAt),
      createdAt: serializeTimestamp(movie.createdAt)!,
      updatedAt: serializeTimestamp(movie.updatedAt)!,
    };
  }

  /**
   * Get ordered characters for a published movie
   * Returns empty array if movie not found or not published
   */
  async getCharacters(slug: string): Promise<MovieCharacter[]> {
    const movie = await this.prisma.movie.findFirst({
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
            role: true,
            sortOrder: true,
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

    if (!movie) {
      return [];
    }

    return movie.characters.map((mc) => ({
      character: {
        id: mc.character.id,
        slug: mc.character.slug,
        name: mc.character.name,
        summary: mc.character.summary,
        imageUrl: mc.character.image,
      },
      role: mc.role,
      sortOrder: mc.sortOrder,
    }));
  }

  /**
   * Get collections that include this published movie
   * Returns empty array if movie not found or not published
   */
  async getCollections(slug: string): Promise<CollectionSummary[]> {
    const movie = await this.prisma.movie.findFirst({
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

    if (!movie) {
      return [];
    }

    return movie.collections.map((cm) => ({
      id: cm.collection.id,
      slug: cm.collection.slug,
      title: cm.collection.title,
      summary: cm.collection.summary,
      type: cm.collection.type,
      heroImageUrl: cm.collection.heroImage,
      featured: cm.collection.featured,
      seasonal: cm.collection.seasonal,
    }));
  }

  /**
   * Get tags for a published movie
   * Returns empty array if movie not found or not published
   */
  async getTags(slug: string): Promise<TagSummary[]> {
    const movie = await this.prisma.movie.findFirst({
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

    if (!movie) {
      return [];
    }

    return movie.tags.map((mt) => ({
      id: mt.tag.id,
      slug: mt.tag.slug,
      name: mt.tag.name,
    }));
  }

  /**
   * Get related products for a published movie
   * Currently returns products that share characters with this movie
   * Returns empty array if movie not found or not published
   */
  async getRelatedProducts(slug: string): Promise<ProductSummary[]> {
    const movie = await this.prisma.movie.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        characters: {
          where: {
            character: PUBLISHED_ONLY_FILTER,
          },
          // Deterministic: movie's character order, then each character's product order
          orderBy: { sortOrder: 'asc' },
          select: {
            character: {
              select: {
                products: {
                  where: {
                    product: PUBLISHED_ONLY_FILTER,
                  },
                  orderBy: { sortOrder: 'asc' },
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
            },
          },
        },
      },
    });

    if (!movie) {
      return [];
    }

    // Flatten and deduplicate products
    const productMap = new Map<string, ProductSummary>();
    for (const mc of movie.characters) {
      for (const pc of mc.character.products) {
        if (!productMap.has(pc.product.id)) {
          productMap.set(pc.product.id, {
            id: pc.product.id,
            slug: pc.product.slug,
            name: pc.product.name,
            description: pc.product.description,
            imageUrl: pc.product.image,
            price: serializeDecimal(pc.product.price),
            currency: pc.product.currency,
            category: pc.product.category,
          });
        }
      }
    }

    return Array.from(productMap.values());
  }

  /**
   * Get complete movie detail with all relationships
   * Returns null if movie not found or not published
   */
  async getDetail(slug: string): Promise<MovieDetail | null> {
    const movie = await this.findBySlug(slug);
    if (!movie) {
      return null;
    }

    const [characters, collections, tags, relatedProducts] = await Promise.all([
      this.getCharacters(slug),
      this.getCollections(slug),
      this.getTags(slug),
      this.getRelatedProducts(slug),
    ]);

    return {
      ...movie,
      characters,
      collections,
      tags,
      relatedProducts,
    };
  }
}
