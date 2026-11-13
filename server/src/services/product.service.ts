/**
 * Product Service
 * 
 * Implements all product-related routes and business logic:
 * - GET /products (list)
 * - GET /products/:slug (detail)
 * 
 * All operations return published content only.
 * Includes affiliate links and decimal-safe price handling.
 */

import { PrismaClient } from '@prisma/client';
import {
  ProductSummary,
  Product,
  ProductDetail,
} from '../types/api-contracts.js';
import { ProductRepository } from '../repositories/product.repository.js';

export class ProductService {
  private repository: ProductRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new ProductRepository(prisma);
  }

  /**
   * GET /products
   * List all published products
   */
  async listProducts(): Promise<ProductSummary[]> {
    return this.repository.list();
  }

  /**
   * GET /products/:slug
   * Get product detail by slug
   * Returns null if not found or not published
   */
  async getProduct(slug: string): Promise<Product | null> {
    return this.repository.findBySlug(slug);
  }

  /**
   * Get complete product detail with all relationships
   * Useful for detail pages that need everything in one call
   */
  async getProductDetail(slug: string): Promise<ProductDetail | null> {
    return this.repository.getDetail(slug);
  }
}
