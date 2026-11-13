/**
 * Movie Service
 * 
 * Implements all movie-related routes and business logic:
 * - GET /movies (list)
 * - GET /movies/:slug (detail)
 * - GET /movies/:slug/collections
 * 
 * All operations return published content only.
 */

import { PrismaClient } from '@prisma/client';
import {
  MovieSummary,
  Movie,
  CollectionSummary,
  MovieDetail,
  MovieListQuery,
} from '../types/api-contracts.js';
import { MovieRepository } from '../repositories/movie.repository.js';

/** Default page size for GET /movies when pageSize is omitted (owner decision). */
export const DEFAULT_MOVIE_PAGE_SIZE = 50;
/** Maximum accepted pageSize for GET /movies; larger values are rejected. */
export const MAX_MOVIE_PAGE_SIZE = 200;

export class MovieService {
  private repository: MovieRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new MovieRepository(prisma);
  }

  /**
   * GET /movies
   * List published movies with optional q, year, genre filters and pagination.
   *
   * Pagination (decided, see OPEN-DECISIONS.md "API Query Behavior"): indexed
   * page/pageSize. page defaults to 1 and pageSize defaults to
   * DEFAULT_MOVIE_PAGE_SIZE (50) when omitted, so the list is always bounded.
   * pageSize above MAX_MOVIE_PAGE_SIZE (200) is rejected, never clamped.
   * Invalid values throw RangeError (the API layer maps it to 400).
   */
  async listMovies(query?: MovieListQuery): Promise<MovieSummary[]> {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? DEFAULT_MOVIE_PAGE_SIZE;
    if (!Number.isInteger(page) || page < 1) {
      throw new RangeError('page must be a positive integer');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1) {
      throw new RangeError('pageSize must be a positive integer');
    }
    if (pageSize > MAX_MOVIE_PAGE_SIZE) {
      throw new RangeError(`pageSize must not exceed ${MAX_MOVIE_PAGE_SIZE}`);
    }
    if (query?.year !== undefined && !Number.isInteger(query.year)) {
      throw new RangeError('year must be an integer');
    }

    return this.repository.list({
      q: query?.q,
      year: query?.year,
      genre: query?.genre,
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  /**
   * GET /movies/:slug
   * Get movie detail by slug
   * Returns null if not found or not published
   */
  async getMovie(slug: string): Promise<Movie | null> {
    return this.repository.findBySlug(slug);
  }

  /**
   * GET /movies/:slug/collections
   * Get collections that include this movie
   */
  async getMovieCollections(slug: string): Promise<CollectionSummary[] | null> {
    // null (not []) when the movie is missing/unpublished so the API can 404
    if (!(await this.repository.findBySlug(slug))) return null;
    return this.repository.getCollections(slug);
  }

  /**
   * Get complete movie detail with all relationships
   * Useful for detail pages that need everything in one call
   */
  async getMovieDetail(slug: string): Promise<MovieDetail | null> {
    return this.repository.getDetail(slug);
  }
}
