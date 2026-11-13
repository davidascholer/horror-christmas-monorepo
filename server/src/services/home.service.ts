/**
 * Home Service
 * 
 * Implements GET /home endpoint logic for homepage content projection.
 * 
 * Logic:
 * - featuredCollections: Collections where featured=true, ordered by sortOrder
 * - seasonalCollections: Collections where seasonal=true, ordered by sortOrder
 * - featuredMovie: Single movie where featured=true (pick one if multiple)
 * - featuredCharacter: Single character where featured=true (pick one if multiple)
 * - giftCollection: Find collection with slug "best-gifts-for-krampus-fans" (or type=GIFT)
 * 
 * All content must be PUBLISHED only.
 * Featured/seasonal items that don't exist return null or empty array.
 */

import { PrismaClient } from '@prisma/client';
import {
  HomeResponse,
  CollectionSummary,
  MovieSummary,
  CharacterSummary,
} from '../types/api-contracts.js';
import { PUBLISHED_ONLY_FILTER, serializeMediaType } from '../repositories/base.repository.js';

export class HomeService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get homepage content
   * Returns featured collections, seasonal collections, featured movie,
   * featured character, and gift collection.
   */
  async getHome(): Promise<HomeResponse> {
    const [
      featuredCollections,
      seasonalCollections,
      featuredMovie,
      featuredCharacter,
      giftCollection,
    ] = await Promise.all([
      this.getFeaturedCollections(),
      this.getSeasonalCollections(),
      this.getFeaturedMovie(),
      this.getFeaturedCharacter(),
      this.getGiftCollection(),
    ]);

    return {
      featuredCollections,
      seasonalCollections,
      featuredMovie,
      featuredCharacter,
      giftCollection,
    };
  }

  /**
   * Get featured collections (featured=true, published)
   * Ordered by sortOrder (nulls last), then title
   */
  private async getFeaturedCollections(): Promise<CollectionSummary[]> {
    const collections = await this.prisma.collection.findMany({
      where: {
        ...PUBLISHED_ONLY_FILTER,
        featured: true,
      },
      orderBy: [
        { sortOrder: { sort: 'asc', nulls: 'last' } },
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
   * Get seasonal collections (seasonal=true, published)
   * Ordered by sortOrder (nulls last), then title
   */
  private async getSeasonalCollections(): Promise<CollectionSummary[]> {
    const collections = await this.prisma.collection.findMany({
      where: {
        ...PUBLISHED_ONLY_FILTER,
        seasonal: true,
      },
      orderBy: [
        { sortOrder: { sort: 'asc', nulls: 'last' } },
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
   * Get a single featured movie (featured=true, published)
   * If multiple exist, pick the first one (by ID)
   * Returns null if none exist
   */
  private async getFeaturedMovie(): Promise<MovieSummary | null> {
    const movie = await this.prisma.movie.findFirst({
      where: {
        ...PUBLISHED_ONLY_FILTER,
        featured: true,
      },
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

    if (!movie) {
      return null;
    }

    return {
      id: movie.id,
      slug: movie.slug,
      title: movie.title,
      releaseYear: movie.releaseYear,
      mediaType: serializeMediaType(movie.mediaType),
      posterUrl: movie.poster,
      synopsis: movie.synopsis,
    };
  }

  /**
   * Get a single featured character (featured=true, published)
   * If multiple exist, pick the first one (by ID)
   * Returns null if none exist
   */
  private async getFeaturedCharacter(): Promise<CharacterSummary | null> {
    const character = await this.prisma.character.findFirst({
      where: {
        ...PUBLISHED_ONLY_FILTER,
        featured: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        summary: true,
        image: true,
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
      imageUrl: character.image,
    };
  }

  /**
   * Get gift collection
   * First tries to find collection with slug "best-gifts-for-krampus-fans"
   * If not found, finds first published collection with type=GIFT
   * Returns null if no gift collection exists
   */
  private async getGiftCollection(): Promise<CollectionSummary | null> {
    // Try specific slug first
    let collection = await this.prisma.collection.findFirst({
      where: {
        ...PUBLISHED_ONLY_FILTER,
        slug: 'best-gifts-for-krampus-fans',
      },
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

    // Fall back to any GIFT type collection
    if (!collection) {
      collection = await this.prisma.collection.findFirst({
        where: {
          ...PUBLISHED_ONLY_FILTER,
          type: 'GIFT',
        },
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
    }

    if (!collection) {
      return null;
    }

    return {
      id: collection.id,
      slug: collection.slug,
      title: collection.title,
      summary: collection.summary,
      type: collection.type,
      heroImageUrl: collection.heroImage,
      featured: collection.featured,
      seasonal: collection.seasonal,
    };
  }
}
