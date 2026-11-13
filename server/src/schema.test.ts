/**
 * Schema Validation Tests - Task 2.3
 * 
 * Tests verify the Prisma schema constraints and database behavior:
 * - Schema constraints (unique slugs, composite PKs)
 * - Optional relationships (nullable foreign keys)
 * - Ordering (sortOrder uniqueness per parent)
 * - Price precision (Decimal preserves .01 precision)
 * - Status values (enum validation)
 * - Cascade and set-null delete behavior
 * 
 * Requirements: Requirement 11 (criteria 11.1-11.8)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, ContentStatus, CollectionType, MediaType } from '@prisma/client';

const prisma = new PrismaClient();

// Test data cleanup helper. Scoped to rows this file created (unique slug /
// shareToken prefix) so seed data is never touched. Join rows and affiliate
// links are removed through onDelete: Cascade.
const P = 'zz-schema-';
async function cleanupTestData() {
  const where = { slug: { startsWith: P } };
  await prisma.collection.deleteMany({ where });
  await prisma.movie.deleteMany({ where });
  await prisma.character.deleteMany({ where });
  await prisma.product.deleteMany({ where });
  await prisma.franchise.deleteMany({ where });
  await prisma.tag.deleteMany({ where });
  await prisma.watchlist.deleteMany({ where: { shareToken: { startsWith: P } } });
}

beforeAll(async () => {
  // Ensure database connection works
  await prisma.$connect();
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await cleanupTestData();
});

describe('Schema Constraints', () => {
  describe('Unique Slug Constraints', () => {
    it('should enforce unique slugs per Collection', async () => {
      const slug = P + 'test-collection';
      
      await prisma.collection.create({
        data: {
          slug,
          title: 'Test Collection',
          type: CollectionType.THEME,
          introduction: 'Test intro',
          curatorNotes: 'Test notes',
        },
      });

      await expect(
        prisma.collection.create({
          data: {
            slug, // Duplicate slug
            title: 'Another Collection',
            type: CollectionType.THEME,
            introduction: 'Test intro',
            curatorNotes: 'Test notes',
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce unique slugs per Movie', async () => {
      const slug = P + 'test-movie';
      
      await prisma.movie.create({
        data: {
          slug,
          title: 'Test Movie',
        },
      });

      await expect(
        prisma.movie.create({
          data: {
            slug, // Duplicate slug
            title: 'Another Movie',
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce unique slugs per Character', async () => {
      const slug = P + 'test-character';
      
      await prisma.character.create({
        data: {
          slug,
          name: 'Test Character',
        },
      });

      await expect(
        prisma.character.create({
          data: {
            slug, // Duplicate slug
            name: 'Another Character',
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce unique slugs per Product', async () => {
      const slug = P + 'test-product';
      
      await prisma.product.create({
        data: {
          slug,
          name: 'Test Product',
        },
      });

      await expect(
        prisma.product.create({
          data: {
            slug, // Duplicate slug
            name: 'Another Product',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Composite Primary Keys', () => {
    it('should prevent duplicate CollectionMovie relationships', async () => {
      const collection = await prisma.collection.create({
        data: {
          slug: P + 'collection-1',
          title: 'Collection 1',
          type: CollectionType.THEME,
          introduction: 'Test',
          curatorNotes: 'Notes',
        },
      });

      const movie = await prisma.movie.create({
        data: {
          slug: P + 'movie-1',
          title: 'Movie 1',
        },
      });

      await prisma.collectionMovie.create({
        data: {
          collectionId: collection.id,
          movieId: movie.id,
          sortOrder: 1,
        },
      });

      await expect(
        prisma.collectionMovie.create({
          data: {
            collectionId: collection.id,
            movieId: movie.id, // Duplicate relationship
            sortOrder: 2,
          },
        })
      ).rejects.toThrow();
    });

    it('should prevent duplicate WatchlistMovie relationships', async () => {
      const watchlist = await prisma.watchlist.create({
        data: {
          shareToken: P + 'test-token-123',
          title: 'My Watchlist',
        },
      });

      const movie = await prisma.movie.create({
        data: {
          slug: P + 'movie-1',
          title: 'Movie 1',
        },
      });

      await prisma.watchlistMovie.create({
        data: {
          watchlistId: watchlist.id,
          movieId: movie.id,
          sortOrder: 1,
        },
      });

      await expect(
        prisma.watchlistMovie.create({
          data: {
            watchlistId: watchlist.id,
            movieId: movie.id, // Duplicate membership
            sortOrder: 2,
          },
        })
      ).rejects.toThrow();
    });

    it('should prevent duplicate CollectionRelated relationships', async () => {
      const collection1 = await prisma.collection.create({
        data: {
          slug: P + 'collection-1',
          title: 'Collection 1',
          type: CollectionType.THEME,
          introduction: 'Test',
          curatorNotes: 'Notes',
        },
      });

      const collection2 = await prisma.collection.create({
        data: {
          slug: P + 'collection-2',
          title: 'Collection 2',
          type: CollectionType.THEME,
          introduction: 'Test',
          curatorNotes: 'Notes',
        },
      });

      await prisma.collectionRelated.create({
        data: {
          sourceCollectionId: collection1.id,
          targetCollectionId: collection2.id,
          sortOrder: 1,
        },
      });

      await expect(
        prisma.collectionRelated.create({
          data: {
            sourceCollectionId: collection1.id,
            targetCollectionId: collection2.id, // Duplicate directed relationship
            sortOrder: 2,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Unique Share Tokens', () => {
    it('should enforce unique watchlist share tokens', async () => {
      const token = P + 'unique-share-token';
      
      await prisma.watchlist.create({
        data: {
          shareToken: token,
          title: 'Watchlist 1',
        },
      });

      await expect(
        prisma.watchlist.create({
          data: {
            shareToken: token, // Duplicate token
            title: 'Watchlist 2',
          },
        })
      ).rejects.toThrow();
    });
  });
});

describe('Optional Relationships', () => {
  it('should allow Movie without franchise', async () => {
    const movie = await prisma.movie.create({
      data: {
        slug: P + 'standalone-movie',
        title: 'Standalone Movie',
        franchiseId: null, // Explicitly null
      },
    });

    expect(movie.franchiseId).toBeNull();
  });

  it('should allow Character without franchise', async () => {
    const character = await prisma.character.create({
      data: {
        slug: P + 'standalone-character',
        name: 'Standalone Character',
        franchiseId: null,
      },
    });

    expect(character.franchiseId).toBeNull();
  });

  it('should allow Product without franchise', async () => {
    const product = await prisma.product.create({
      data: {
        slug: P + 'standalone-product',
        name: 'Standalone Product',
        franchiseId: null,
      },
    });

    expect(product.franchiseId).toBeNull();
  });

  it('should allow Movie with franchise', async () => {
    const franchise = await prisma.franchise.create({
      data: {
        slug: P + 'test-franchise',
        name: 'Test Franchise',
      },
    });

    const movie = await prisma.movie.create({
      data: {
        slug: P + 'franchise-movie',
        title: 'Franchise Movie',
        franchiseId: franchise.id,
      },
    });

    expect(movie.franchiseId).toBe(franchise.id);
  });

  it('should allow optional curator notes in CollectionMovie', async () => {
    const collection = await prisma.collection.create({
      data: {
        slug: P + 'collection-1',
        title: 'Collection 1',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    const movie = await prisma.movie.create({
      data: {
        slug: P + 'movie-1',
        title: 'Movie 1',
      },
    });

    const withNote = await prisma.collectionMovie.create({
      data: {
        collectionId: collection.id,
        movieId: movie.id,
        sortOrder: 1,
        curatorNote: 'This is a great starting point',
      },
    });

    expect(withNote.curatorNote).toBe('This is a great starting point');

    const movie2 = await prisma.movie.create({
      data: {
        slug: P + 'movie-2',
        title: 'Movie 2',
      },
    });

    const withoutNote = await prisma.collectionMovie.create({
      data: {
        collectionId: collection.id,
        movieId: movie2.id,
        sortOrder: 2,
        curatorNote: null,
      },
    });

    expect(withoutNote.curatorNote).toBeNull();
  });
});

describe('Ordering and Sort Order', () => {
  it('should enforce unique sortOrder per collection for movies', async () => {
    const collection = await prisma.collection.create({
      data: {
        slug: P + 'collection-1',
        title: 'Collection 1',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    const movie1 = await prisma.movie.create({
      data: { slug: P + 'movie-1', title: 'Movie 1' },
    });

    const movie2 = await prisma.movie.create({
      data: { slug: P + 'movie-2', title: 'Movie 2' },
    });

    await prisma.collectionMovie.create({
      data: {
        collectionId: collection.id,
        movieId: movie1.id,
        sortOrder: 1,
      },
    });

    // Duplicate sortOrder in same collection should fail
    await expect(
      prisma.collectionMovie.create({
        data: {
          collectionId: collection.id,
          movieId: movie2.id,
          sortOrder: 1, // Duplicate order
        },
      })
    ).rejects.toThrow();
  });

  it('should allow same sortOrder in different collections', async () => {
    const collection1 = await prisma.collection.create({
      data: {
        slug: P + 'collection-1',
        title: 'Collection 1',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    const collection2 = await prisma.collection.create({
      data: {
        slug: P + 'collection-2',
        title: 'Collection 2',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    const movie = await prisma.movie.create({
      data: { slug: P + 'movie-1', title: 'Movie 1' },
    });

    // Same sortOrder in different collections is OK
    const link1 = await prisma.collectionMovie.create({
      data: {
        collectionId: collection1.id,
        movieId: movie.id,
        sortOrder: 1,
      },
    });

    const link2 = await prisma.collectionMovie.create({
      data: {
        collectionId: collection2.id,
        movieId: movie.id,
        sortOrder: 1, // Same order, different collection
      },
    });

    expect(link1.sortOrder).toBe(1);
    expect(link2.sortOrder).toBe(1);
  });

  it('should enforce unique sortOrder per watchlist', async () => {
    const watchlist = await prisma.watchlist.create({
      data: {
        shareToken: P + 'test-token',
        title: 'Test Watchlist',
      },
    });

    const movie1 = await prisma.movie.create({
      data: { slug: P + 'movie-1', title: 'Movie 1' },
    });

    const movie2 = await prisma.movie.create({
      data: { slug: P + 'movie-2', title: 'Movie 2' },
    });

    await prisma.watchlistMovie.create({
      data: {
        watchlistId: watchlist.id,
        movieId: movie1.id,
        sortOrder: 1,
      },
    });

    await expect(
      prisma.watchlistMovie.create({
        data: {
          watchlistId: watchlist.id,
          movieId: movie2.id,
          sortOrder: 1, // Duplicate order
        },
      })
    ).rejects.toThrow();
  });

  it('should maintain stable ordering across queries', async () => {
    const collection = await prisma.collection.create({
      data: {
        slug: P + 'ordered-collection',
        title: 'Ordered Collection',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    // Create movies in non-sequential order
    const movie3 = await prisma.movie.create({
      data: { slug: P + 'movie-3', title: 'Movie 3' },
    });
    const movie1 = await prisma.movie.create({
      data: { slug: P + 'movie-1', title: 'Movie 1' },
    });
    const movie2 = await prisma.movie.create({
      data: { slug: P + 'movie-2', title: 'Movie 2' },
    });

    // Add with explicit ordering
    await prisma.collectionMovie.create({
      data: { collectionId: collection.id, movieId: movie1.id, sortOrder: 1 },
    });
    await prisma.collectionMovie.create({
      data: { collectionId: collection.id, movieId: movie2.id, sortOrder: 2 },
    });
    await prisma.collectionMovie.create({
      data: { collectionId: collection.id, movieId: movie3.id, sortOrder: 3 },
    });

    // Query with ordering
    const orderedMovies = await prisma.collectionMovie.findMany({
      where: { collectionId: collection.id },
      include: { movie: true },
      orderBy: { sortOrder: 'asc' },
    });

    expect(orderedMovies).toHaveLength(3);
    expect(orderedMovies[0].movie.title).toBe('Movie 1');
    expect(orderedMovies[1].movie.title).toBe('Movie 2');
    expect(orderedMovies[2].movie.title).toBe('Movie 3');
  });
});

describe('Price Precision', () => {
  it('should preserve decimal precision for product prices', async () => {
    const product = await prisma.product.create({
      data: {
        slug: P + 'priced-product',
        name: 'Priced Product',
        price: 29.99,
        currency: 'USD',
      },
    });

    const retrieved = await prisma.product.findUnique({
      where: { id: product.id },
    });

    expect(retrieved?.price).toBeDefined();
    expect(Number(retrieved?.price)).toBe(29.99);
  });

  it('should handle .01 precision accurately', async () => {
    const product = await prisma.product.create({
      data: {
        slug: P + 'penny-product',
        name: 'Penny Product',
        price: 0.01,
        currency: 'USD',
      },
    });

    const retrieved = await prisma.product.findUnique({
      where: { id: product.id },
    });

    expect(Number(retrieved?.price)).toBe(0.01);
  });

  it('should handle high-precision decimal values', async () => {
    const product = await prisma.product.create({
      data: {
        slug: P + 'precise-product',
        name: 'Precise Product',
        price: 1234.56,
        currency: 'USD',
      },
    });

    const retrieved = await prisma.product.findUnique({
      where: { id: product.id },
    });

    expect(Number(retrieved?.price)).toBe(1234.56);
  });

  it('should allow null price', async () => {
    const product = await prisma.product.create({
      data: {
        slug: P + 'unpriced-product',
        name: 'Unpriced Product',
        price: null,
        currency: null,
      },
    });

    expect(product.price).toBeNull();
    expect(product.currency).toBeNull();
  });

  it('should store currency as 3-character code', async () => {
    const product = await prisma.product.create({
      data: {
        slug: P + 'euro-product',
        name: 'Euro Product',
        price: 19.99,
        currency: 'EUR',
      },
    });

    expect(product.currency).toBe('EUR');
    expect(product.currency).toHaveLength(3);
  });
});

describe('Status Values and Enums', () => {
  it('should accept valid ContentStatus values', async () => {
    const draft = await prisma.collection.create({
      data: {
        slug: P + 'draft-collection',
        title: 'Draft',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
        status: ContentStatus.DRAFT,
      },
    });

    const published = await prisma.collection.create({
      data: {
        slug: P + 'published-collection',
        title: 'Published',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    const archived = await prisma.collection.create({
      data: {
        slug: P + 'archived-collection',
        title: 'Archived',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
        status: ContentStatus.ARCHIVED,
      },
    });

    expect(draft.status).toBe(ContentStatus.DRAFT);
    expect(published.status).toBe(ContentStatus.PUBLISHED);
    expect(archived.status).toBe(ContentStatus.ARCHIVED);
  });

  it('should accept valid CollectionType values', async () => {
    const types: CollectionType[] = [
      CollectionType.CHARACTER,
      CollectionType.THEME,
      CollectionType.BEGINNER,
      CollectionType.GIFT,
      CollectionType.SEASONAL_CHALLENGE,
      CollectionType.TRADITION,
    ];

    for (let i = 0; i < types.length; i++) {
      const collection = await prisma.collection.create({
        data: {
          slug: `${P}collection-type-${i}`,
          title: `Collection ${types[i]}`,
          type: types[i],
          introduction: 'Test',
          curatorNotes: 'Notes',
        },
      });

      expect(collection.type).toBe(types[i]);
    }
  });

  it('should accept valid MediaType values', async () => {
    const film = await prisma.movie.create({
      data: {
        slug: P + 'film',
        title: 'Film',
        mediaType: MediaType.FILM,
      },
    });

    const special = await prisma.movie.create({
      data: {
        slug: P + 'special',
        title: 'Special',
        mediaType: MediaType.TELEVISION_SPECIAL,
      },
    });

    const episode = await prisma.movie.create({
      data: {
        slug: P + 'episode',
        title: 'Episode',
        mediaType: MediaType.TELEVISION_EPISODE,
      },
    });

    expect(film.mediaType).toBe(MediaType.FILM);
    expect(special.mediaType).toBe(MediaType.TELEVISION_SPECIAL);
    expect(episode.mediaType).toBe(MediaType.TELEVISION_EPISODE);
  });

  it('should default to DRAFT status', async () => {
    const collection = await prisma.collection.create({
      data: {
        slug: P + 'default-status',
        title: 'Default Status',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
        // status not specified
      },
    });

    expect(collection.status).toBe(ContentStatus.DRAFT);
  });
});

describe('Cascade and Set Null Behavior', () => {
  it('should cascade delete CollectionMovie when Collection is deleted', async () => {
    const collection = await prisma.collection.create({
      data: {
        slug: P + 'cascade-collection',
        title: 'Cascade Collection',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    const movie = await prisma.movie.create({
      data: { slug: P + 'movie-1', title: 'Movie 1' },
    });

    await prisma.collectionMovie.create({
      data: {
        collectionId: collection.id,
        movieId: movie.id,
        sortOrder: 1,
      },
    });

    // Delete collection
    await prisma.collection.delete({
      where: { id: collection.id },
    });

    // Join record should be deleted
    const joins = await prisma.collectionMovie.findMany({
      where: { collectionId: collection.id },
    });

    expect(joins).toHaveLength(0);

    // Movie should still exist
    const movieStillExists = await prisma.movie.findUnique({
      where: { id: movie.id },
    });

    expect(movieStillExists).toBeDefined();
  });

  it('should cascade delete CollectionMovie when Movie is deleted', async () => {
    const collection = await prisma.collection.create({
      data: {
        slug: P + 'cascade-collection',
        title: 'Cascade Collection',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    const movie = await prisma.movie.create({
      data: { slug: P + 'movie-1', title: 'Movie 1' },
    });

    await prisma.collectionMovie.create({
      data: {
        collectionId: collection.id,
        movieId: movie.id,
        sortOrder: 1,
      },
    });

    // Delete movie
    await prisma.movie.delete({
      where: { id: movie.id },
    });

    // Join record should be deleted
    const joins = await prisma.collectionMovie.findMany({
      where: { movieId: movie.id },
    });

    expect(joins).toHaveLength(0);
  });

  it('should set franchiseId to null when Franchise is deleted', async () => {
    const franchise = await prisma.franchise.create({
      data: {
        slug: P + 'test-franchise',
        name: 'Test Franchise',
      },
    });

    const movie = await prisma.movie.create({
      data: {
        slug: P + 'franchise-movie',
        title: 'Franchise Movie',
        franchiseId: franchise.id,
      },
    });

    // Delete franchise
    await prisma.franchise.delete({
      where: { id: franchise.id },
    });

    // Movie should still exist with null franchiseId
    const updatedMovie = await prisma.movie.findUnique({
      where: { id: movie.id },
    });

    expect(updatedMovie).toBeDefined();
    expect(updatedMovie?.franchiseId).toBeNull();
  });

  it('should cascade delete AffiliateLink when Product is deleted', async () => {
    const product = await prisma.product.create({
      data: {
        slug: P + 'linked-product',
        name: 'Linked Product',
      },
    });

    await prisma.affiliateLink.create({
      data: {
        productId: product.id,
        provider: 'Amazon',
        url: 'https://example.com',
      },
    });

    await prisma.product.delete({
      where: { id: product.id },
    });

    const links = await prisma.affiliateLink.findMany({
      where: { productId: product.id },
    });

    expect(links).toHaveLength(0);
  });

  it('should cascade delete WatchlistMovie when Watchlist is deleted', async () => {
    const watchlist = await prisma.watchlist.create({
      data: {
        shareToken: P + 'cascade-token',
        title: 'Cascade Watchlist',
      },
    });

    const movie = await prisma.movie.create({
      data: { slug: P + 'movie-1', title: 'Movie 1' },
    });

    await prisma.watchlistMovie.create({
      data: {
        watchlistId: watchlist.id,
        movieId: movie.id,
        sortOrder: 1,
      },
    });

    await prisma.watchlist.delete({
      where: { id: watchlist.id },
    });

    const items = await prisma.watchlistMovie.findMany({
      where: { watchlistId: watchlist.id },
    });

    expect(items).toHaveLength(0);
  });
});

describe('Timestamps', () => {
  it('should auto-generate createdAt and updatedAt', async () => {
    const before = new Date();
    
    const collection = await prisma.collection.create({
      data: {
        slug: P + 'timestamp-test',
        title: 'Timestamp Test',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    const after = new Date();

    expect(collection.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(collection.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(collection.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(collection.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should update updatedAt on modification', async () => {
    const collection = await prisma.collection.create({
      data: {
        slug: P + 'update-test',
        title: 'Update Test',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    const originalUpdatedAt = collection.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updated = await prisma.collection.update({
      where: { id: collection.id },
      data: { title: 'Updated Title' },
    });

    expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(updated.createdAt.getTime()).toBe(collection.createdAt.getTime());
  });
});

describe('Directed Relationships', () => {
  it('should preserve directional related-collection relationships', async () => {
    const collection1 = await prisma.collection.create({
      data: {
        slug: P + 'collection-1',
        title: 'Collection 1',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    const collection2 = await prisma.collection.create({
      data: {
        slug: P + 'collection-2',
        title: 'Collection 2',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    // Create one-way relationship: collection1 → collection2
    await prisma.collectionRelated.create({
      data: {
        sourceCollectionId: collection1.id,
        targetCollectionId: collection2.id,
        sortOrder: 1,
      },
    });

    // Query from collection1
    const fromSource = await prisma.collectionRelated.findMany({
      where: { sourceCollectionId: collection1.id },
    });

    expect(fromSource).toHaveLength(1);
    expect(fromSource[0].targetCollectionId).toBe(collection2.id);

    // Query from collection2 (should have no outbound relations)
    const fromTarget = await prisma.collectionRelated.findMany({
      where: { sourceCollectionId: collection2.id },
    });

    expect(fromTarget).toHaveLength(0);
  });

  it('should allow bidirectional relationships when explicitly created', async () => {
    const collection1 = await prisma.collection.create({
      data: {
        slug: P + 'collection-1',
        title: 'Collection 1',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    const collection2 = await prisma.collection.create({
      data: {
        slug: P + 'collection-2',
        title: 'Collection 2',
        type: CollectionType.THEME,
        introduction: 'Test',
        curatorNotes: 'Notes',
      },
    });

    // Create both directions explicitly
    await prisma.collectionRelated.create({
      data: {
        sourceCollectionId: collection1.id,
        targetCollectionId: collection2.id,
        sortOrder: 1,
      },
    });

    await prisma.collectionRelated.create({
      data: {
        sourceCollectionId: collection2.id,
        targetCollectionId: collection1.id,
        sortOrder: 1,
      },
    });

    const from1to2 = await prisma.collectionRelated.findFirst({
      where: {
        sourceCollectionId: collection1.id,
        targetCollectionId: collection2.id,
      },
    });

    const from2to1 = await prisma.collectionRelated.findFirst({
      where: {
        sourceCollectionId: collection2.id,
        targetCollectionId: collection1.id,
      },
    });

    expect(from1to2).toBeDefined();
    expect(from2to1).toBeDefined();
  });
});
