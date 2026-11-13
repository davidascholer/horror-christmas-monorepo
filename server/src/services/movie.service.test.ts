/**
 * Movie Service Tests (Task 4.3)
 *
 * Covers GET /movies (q, year, genre, page/pageSize), /movies/:slug,
 * /movies/:slug/collections and the full movie detail projection.
 * Uses a self-contained fixture; does not depend on seed data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MovieService, DEFAULT_MOVIE_PAGE_SIZE, MAX_MOVIE_PAGE_SIZE } from './movie.service.js';
import { createCatalogFixture, CatalogFixture, ISO_8601 } from './test-fixtures.js';

const prisma = new PrismaClient();
const service = new MovieService(prisma);
let fx: CatalogFixture;

beforeAll(async () => {
  fx = await createCatalogFixture(prisma, 'mov');
});

afterAll(async () => {
  await fx.cleanup();
  await prisma.$disconnect();
});

describe('MovieService.listMovies', () => {
  it('returns published movies only, ordered by release year desc', async () => {
    const movies = await service.listMovies({ q: fx.token });
    expect(movies.map((m) => m.slug)).toEqual([fx.slugs.movieSpecial, fx.slugs.movieOld]);
  });

  it('maps media types to contract values', async () => {
    const movies = await service.listMovies({ q: fx.token });
    expect(movies.map((m) => m.mediaType)).toEqual(['TV_SPECIAL', 'FILM']);
  });

  it('q matches title or original title case-insensitively', async () => {
    const byTitle = await service.listMovies({ q: `${fx.token} SPECIAL`.toUpperCase() });
    expect(byTitle.map((m) => m.slug)).toEqual([fx.slugs.movieSpecial]);
    const byOriginal = await service.listMovies({ q: `${fx.token} original` });
    expect(byOriginal.map((m) => m.slug)).toEqual([fx.slugs.movieOld]);
    expect(await service.listMovies({ q: `${fx.token} no-such-title` })).toEqual([]);
  });

  it('filters by year (excluding draft movies of the same year)', async () => {
    const movies = await service.listMovies({ q: fx.token, year: 1984 });
    expect(movies.map((m) => m.slug)).toEqual([fx.slugs.movieOld]);
  });

  it('filters by genre via tag slug', async () => {
    const movies = await service.listMovies({ genre: fx.slugs.tagAlpha });
    expect(movies.map((m) => m.slug)).toEqual([fx.slugs.movieOld]);
    expect(await service.listMovies({ genre: `${fx.prefix}nope` })).toEqual([]);
  });

  it('paginates with page/pageSize without overlap', async () => {
    const p1 = await service.listMovies({ q: fx.token, page: 1, pageSize: 1 });
    const p2 = await service.listMovies({ q: fx.token, page: 2, pageSize: 1 });
    const p3 = await service.listMovies({ q: fx.token, page: 3, pageSize: 1 });
    expect(p1.map((m) => m.slug)).toEqual([fx.slugs.movieSpecial]);
    expect(p2.map((m) => m.slug)).toEqual([fx.slugs.movieOld]);
    expect(p3).toEqual([]);
    // page defaults to 1 when only pageSize is provided
    expect(await service.listMovies({ q: fx.token, pageSize: 1 })).toEqual(p1);
  });

  it('applies the default page size of 50 and pages past it', async () => {
    expect(DEFAULT_MOVIE_PAGE_SIZE).toBe(50);
    const bulkToken = `${fx.token}bulk`;
    await prisma.movie.createMany({
      data: Array.from({ length: 52 }, (_, i) => ({
        slug: `${fx.prefix}bulk-${String(i).padStart(2, '0')}`,
        title: `${bulkToken} ${String(i).padStart(2, '0')}`,
        status: 'PUBLISHED' as const,
        releaseYear: 1990,
      })),
    });
    // cleanup() removes these too: they share the fixture slug prefix
    const first = await service.listMovies({ q: bulkToken });
    expect(first).toHaveLength(50);
    const second = await service.listMovies({ q: bulkToken, page: 2 });
    expect(second).toHaveLength(2);
    expect(new Set([...first, ...second].map((m) => m.slug)).size).toBe(52);
  });

  it('accepts pageSize of exactly 200 and rejects anything above (no clamping)', async () => {
    expect(MAX_MOVIE_PAGE_SIZE).toBe(200);
    await expect(service.listMovies({ q: `${fx.token} special`, pageSize: 200 })).resolves.toHaveLength(1);
    await expect(service.listMovies({ pageSize: 201 })).rejects.toThrow(RangeError);
    await expect(service.listMovies({ page: 1, pageSize: 100000 })).rejects.toThrow(RangeError);
  });

  it('rejects invalid pagination and year values', async () => {
    await expect(service.listMovies({ page: 0, pageSize: 1 })).rejects.toThrow(RangeError);
    await expect(service.listMovies({ page: 1.5 })).rejects.toThrow(RangeError);
    await expect(service.listMovies({ pageSize: 0 })).rejects.toThrow(RangeError);
    await expect(service.listMovies({ pageSize: 1.5 })).rejects.toThrow(RangeError);
    await expect(service.listMovies({ year: 1984.5 })).rejects.toThrow(RangeError);
  });
});

describe('MovieService.getMovie', () => {
  it('returns movie fields with franchise, ISO-8601 timestamps and dates', async () => {
    const m = (await service.getMovie(fx.slugs.movieOld))!;
    expect(m.slug).toBe(fx.slugs.movieOld);
    expect(m.mediaType).toBe('FILM');
    expect(m.runtime).toBe(106);
    expect(m.releaseDate).toBe('1984-12-07T00:00:00.000Z');
    expect(m.publishedAt).toBe('2026-11-01T12:00:00.000Z');
    expect(m.createdAt).toMatch(ISO_8601);
    expect(m.franchise).toEqual(expect.objectContaining({ slug: fx.slugs.franchise }));
  });

  it('uses null for missing optional data', async () => {
    const m = (await service.getMovie(fx.slugs.movieSpecial))!;
    expect(m.originalTitle).toBeNull();
    expect(m.releaseDate).toBeNull();
    expect(m.runtime).toBeNull();
    expect(m.posterUrl).toBeNull();
    expect(m.franchise).toBeNull();
    expect(m.publishedAt).toBeNull();
  });

  it('returns null for missing, draft and archived movies', async () => {
    expect(await service.getMovie(`${fx.prefix}nope`)).toBeNull();
    expect(await service.getMovie(fx.slugs.movieDraft)).toBeNull();
    expect(await service.getMovie(fx.slugs.movieArchived)).toBeNull();
  });
});

describe('MovieService.getMovieCollections', () => {
  it('returns published collections containing the movie', async () => {
    const cols = (await service.getMovieCollections(fx.slugs.movieOld))!;
    expect(cols.map((c) => c.slug)).toEqual([fx.slugs.collection, fx.slugs.collectionGift]);
  });

  it('returns null for missing or unpublished movies', async () => {
    expect(await service.getMovieCollections(`${fx.prefix}nope`)).toBeNull();
    expect(await service.getMovieCollections(fx.slugs.movieDraft)).toBeNull();
  });
});

describe('MovieService.getMovieDetail', () => {
  it('includes ordered characters with role, collections, tags and related products', async () => {
    const d = (await service.getMovieDetail(fx.slugs.movieOld))!;
    expect(d.characters.map((c) => c.character.slug)).toEqual([fx.slugs.characterB, fx.slugs.characterA]);
    expect(d.characters.map((c) => c.role)).toEqual(['Villain', null]);
    expect(d.collections.map((c) => c.slug)).toEqual([fx.slugs.collection, fx.slugs.collectionGift]);
    expect(d.tags.map((t) => t.slug)).toEqual([fx.slugs.tagAlpha, fx.slugs.tagBeta]);
    // Related products via characters, deduplicated, published only, deterministic order
    expect(d.relatedProducts.map((p) => p.slug)).toEqual([fx.slugs.productPriced, fx.slugs.productUnpriced]);
    expect(d.relatedProducts[0].price).toBe('12.50');
  });

  it('returns empty relationship arrays when a movie has none', async () => {
    const d = (await service.getMovieDetail(fx.slugs.movieSpecial))!;
    expect(d.tags).toEqual([]);
    expect(d.collections.map((c) => c.slug)).toEqual([fx.slugs.collection]);
  });

  it('returns null for missing or draft movies', async () => {
    expect(await service.getMovieDetail(`${fx.prefix}nope`)).toBeNull();
    expect(await service.getMovieDetail(fx.slugs.movieDraft)).toBeNull();
  });
});
