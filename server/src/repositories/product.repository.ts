/**
 * Product Repository
 * 
 * Handles published-only product queries with:
 * - Slug-based lookups
 * - Decimal-safe price serialization
 * - Affiliate links
 * - Related characters and collections
 * - ISO-8601 timestamp serialization
 */

import { PrismaClient } from '@prisma/client';
import {
  ProductSummary,
  Product,
  ProductDetail,
  ProductCharacter,
  CollectionSummary,
  TagSummary,
} from '../types/api-contracts.js';
import {
  PUBLISHED_ONLY_FILTER,
  TAG_ORDER,
  serializeDecimal,
  serializeTimestamp,
} from './base.repository.js';

export class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * List all published products
   * Ordered by name (asc)
   */
  async list(): Promise<ProductSummary[]> {
    const products = await this.prisma.product.findMany({
      where: PUBLISHED_ONLY_FILTER,
      orderBy: {
        name: 'asc',
      },
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
    });

    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      imageUrl: p.image,
      price: serializeDecimal(p.price),
      currency: p.currency,
      category: p.category,
    }));
  }

  /**
   * Get published product by slug
   * Returns null if not found or not published
   */
  async findBySlug(slug: string): Promise<Product | null> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        ...PUBLISHED_ONLY_FILTER,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        image: true,
        imageAlt: true,
        price: true,
        currency: true,
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
        affiliateLinks: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            provider: true,
            url: true,
            productId: true,
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      imageUrl: product.image,
      imageAlt: product.imageAlt,
      price: serializeDecimal(product.price),
      currency: product.currency,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      featured: product.featured,
      franchise: product.franchise
        ? {
            id: product.franchise.id,
            slug: product.franchise.slug,
            name: product.franchise.name,
          }
        : null,
      affiliateLinks: product.affiliateLinks.map((link) => ({
        id: link.id,
        provider: link.provider,
        url: link.url,
        productId: link.productId,
      })),
      publishedAt: serializeTimestamp(product.publishedAt),
      createdAt: serializeTimestamp(product.createdAt)!,
      updatedAt: serializeTimestamp(product.updatedAt)!,
    };
  }

  /**
   * Get ordered characters related to this published product
   * Returns empty array if product not found or not published
   */
  async getCharacters(slug: string): Promise<ProductCharacter[]> {
    const product = await this.prisma.product.findFirst({
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

    if (!product) {
      return [];
    }

    return product.characters.map((pc) => ({
      character: {
        id: pc.character.id,
        slug: pc.character.slug,
        name: pc.character.name,
        summary: pc.character.summary,
        imageUrl: pc.character.image,
      },
      sortOrder: pc.sortOrder,
    }));
  }

  /**
   * Get collections that include this published product
   * Returns empty array if product not found or not published
   */
  async getCollections(slug: string): Promise<CollectionSummary[]> {
    const product = await this.prisma.product.findFirst({
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

    if (!product) {
      return [];
    }

    return product.collections.map((cp) => ({
      id: cp.collection.id,
      slug: cp.collection.slug,
      title: cp.collection.title,
      summary: cp.collection.summary,
      type: cp.collection.type,
      heroImageUrl: cp.collection.heroImage,
      featured: cp.collection.featured,
      seasonal: cp.collection.seasonal,
    }));
  }

  /**
   * Get tags for this published product
   * Returns empty array if product not found or not published
   */
  async getTags(slug: string): Promise<TagSummary[]> {
    const product = await this.prisma.product.findFirst({
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

    if (!product) {
      return [];
    }

    return product.tags.map((pt) => ({
      id: pt.tag.id,
      slug: pt.tag.slug,
      name: pt.tag.name,
    }));
  }

  /**
   * Get complete product detail with all relationships
   * Returns null if product not found or not published
   */
  async getDetail(slug: string): Promise<ProductDetail | null> {
    const product = await this.findBySlug(slug);
    if (!product) {
      return null;
    }

    const [characters, collections, tags] = await Promise.all([
      this.getCharacters(slug),
      this.getCollections(slug),
      this.getTags(slug),
    ]);

    return {
      ...product,
      characters,
      collections,
      tags,
    };
  }
}
