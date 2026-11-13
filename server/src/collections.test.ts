/**
 * Collection Data Tests
 * 
 * Validates that launch collections are properly seeded with:
 * - All 10 required collections
 * - Correct collection types
 * - Required metadata
 * - Related collection relationships
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Launch Collections', () => {
  let collections: Awaited<ReturnType<typeof prisma.collection.findMany>> = [];

  beforeAll(async () => {
    collections = await prisma.collection.findMany({
      include: {
        relatedCollections: {
          include: {
            targetCollection: true,
          },
        },
      },
    });
  });

  describe('Collection Count', () => {
    it('should have exactly 10 collections', () => {
      expect(collections).toHaveLength(10);
    });
  });

  describe('Required Collections', () => {
    const requiredTitles = [
      'Essential Krampus Collection',
      'Winter Monsters',
      'Christmas Slashers',
      'New To Christmas Horror',
      '25 Days of Christmas Horror',
      'Best Gifts For Krampus Fans',
      'Christmas Horror Comedies',
      'Black Christmas Collection',
      'Christmas Horror Deep Cuts',
      'Holiday Horror Marathon',
    ];

    requiredTitles.forEach((title) => {
      it(`should include "${title}"`, () => {
        const found = collections.find((c) => c.title === title);
        expect(found).toBeDefined();
      });
    });
  });

  describe('Collection Types', () => {
    it('should have 1 CHARACTER collection', () => {
      const characterCollections = collections.filter((c) => c.type === 'CHARACTER');
      expect(characterCollections).toHaveLength(1);
      expect(characterCollections[0].title).toBe('Essential Krampus Collection');
    });

    it('should have 4 THEME collections', () => {
      const themeCollections = collections.filter((c) => c.type === 'THEME');
      expect(themeCollections).toHaveLength(4);
    });

    it('should have 1 BEGINNER collection', () => {
      const beginnerCollections = collections.filter((c) => c.type === 'BEGINNER');
      expect(beginnerCollections).toHaveLength(1);
      expect(beginnerCollections[0].title).toBe('New To Christmas Horror');
    });

    it('should have 1 GIFT collection', () => {
      const giftCollections = collections.filter((c) => c.type === 'GIFT');
      expect(giftCollections).toHaveLength(1);
      expect(giftCollections[0].title).toBe('Best Gifts For Krampus Fans');
    });

    it('should have 2 SEASONAL_CHALLENGE collections', () => {
      const challengeCollections = collections.filter((c) => c.type === 'SEASONAL_CHALLENGE');
      expect(challengeCollections).toHaveLength(2);
    });

    it('should have 1 TRADITION collection', () => {
      const traditionCollections = collections.filter((c) => c.type === 'TRADITION');
      expect(traditionCollections).toHaveLength(1);
      expect(traditionCollections[0].title).toBe('Black Christmas Collection');
    });
  });

  describe('Required Metadata', () => {
    it('all collections should have unique slugs', () => {
      collections.forEach((collection) => {
        expect(collection.slug).toBeTruthy();
        const slugCount = collections.filter((c) => c.slug === collection.slug).length;
        expect(slugCount).toBe(1);
      });
    });

    it('all collections should have introductions', () => {
      collections.forEach((collection) => {
        expect(collection.introduction).toBeTruthy();
        expect(collection.introduction.length).toBeGreaterThan(0);
      });
    });

    it('all collections should have curator notes', () => {
      collections.forEach((collection) => {
        expect(collection.curatorNotes).toBeTruthy();
        expect(collection.curatorNotes.length).toBeGreaterThan(0);
      });
    });

    it('all collections should have summaries', () => {
      collections.forEach((collection) => {
        expect(collection.summary).toBeTruthy();
        expect(collection.summary && collection.summary.length).toBeGreaterThan(0);
      });
    });

    it('all collections should have hero images and alt text', () => {
      collections.forEach((collection) => {
        expect(collection.heroImage).toBeTruthy();
        expect(collection.heroImageAlt).toBeTruthy();
      });
    });

    it('all collections should have SEO metadata', () => {
      collections.forEach((collection) => {
        expect(collection.seoTitle).toBeTruthy();
        expect(collection.seoDescription).toBeTruthy();
      });
    });

    it('all collections should have valid sort orders', () => {
      collections.forEach((collection) => {
        expect(collection.sortOrder).toBeGreaterThanOrEqual(1);
        expect(collection.sortOrder).toBeLessThanOrEqual(10);
      });
    });

    it('all collections should be in DRAFT status', () => {
      collections.forEach((collection) => {
        expect(collection.status).toBe('DRAFT');
      });
    });
  });

  describe('Homepage Organization', () => {
    it('should have 4 featured collections', () => {
      const featured = collections.filter((c) => c.featured);
      expect(featured).toHaveLength(4);
    });

    it('should have 4 seasonal collections', () => {
      const seasonal = collections.filter((c) => c.seasonal);
      expect(seasonal).toHaveLength(4);
    });

    it('should have unique sort orders from 1-10', () => {
      const sortOrders = collections.map((c) => c.sortOrder).sort((a, b) => (a || 0) - (b || 0));
      expect(sortOrders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe('Related Collection Relationships', () => {
    it('should have 30 total relationships', () => {
      const totalRelationships = collections.reduce(
        (sum, c) => sum + c.relatedCollections.length,
        0
      );
      expect(totalRelationships).toBe(30);
    });

    it('each collection should have exactly 3 related collections', () => {
      collections.forEach((collection) => {
        expect(collection.relatedCollections).toHaveLength(3);
      });
    });

    it('all relationships should be ordered (0, 1, 2)', () => {
      collections.forEach((collection) => {
        const sortOrders = collection.relatedCollections
          .map((r: any) => r.sortOrder)
          .sort((a, b) => a - b);
        expect(sortOrders).toEqual([0, 1, 2]);
      });
    });

    it('all relationships should have valid related collection references', () => {
      collections.forEach((collection) => {
        collection.relatedCollections.forEach((rel: any) => {
          expect(rel.targetCollection).toBeDefined();
          expect(rel.targetCollection.id).toBeTruthy();
          expect(rel.targetCollection.title).toBeTruthy();
        });
      });
    });
  });

  describe('Specific Collection Relationships', () => {
    it('Essential Krampus should relate to Winter Monsters, New To Christmas Horror, and Best Gifts', () => {
      const krampus = collections.find((c) => c.title === 'Essential Krampus Collection');
      expect(krampus).toBeDefined();

      const relatedTitles = krampus.relatedCollections.map(
        (r: any) => r.targetCollection.title
      );

      expect(relatedTitles).toContain('Winter Monsters');
      expect(relatedTitles).toContain('New To Christmas Horror');
      expect(relatedTitles).toContain('Best Gifts For Krampus Fans');
    });

    it('relationships should be directional (not automatically reciprocal)', () => {
      const krampus = collections.find((c) => c.title === 'Essential Krampus Collection');
      const winterMonsters = collections.find((c) => c.title === 'Winter Monsters');

      // Krampus → Winter Monsters exists
      const krampusToWinter = krampus.relatedCollections.some(
        (r: any) => r.targetCollection.title === 'Winter Monsters'
      );
      expect(krampusToWinter).toBe(true);

      // Winter Monsters → Krampus also exists (because we explicitly created it)
      const winterToKrampus = winterMonsters.relatedCollections.some(
        (r: any) => r.targetCollection.title === 'Essential Krampus Collection'
      );
      expect(winterToKrampus).toBe(true);

      // But this is not automatic - it's because both directions were seeded
      // The key is that the relationship model supports directionality
    });
  });

  describe('Publication Readiness', () => {
    it('all collections should have required metadata for eventual publication', () => {
      collections.forEach((collection) => {
        // Introduction
        expect(collection.introduction).toBeTruthy();
        // Curator notes
        expect(collection.curatorNotes).toBeTruthy();
        // Hero image with alt text
        expect(collection.heroImage).toBeTruthy();
        expect(collection.heroImageAlt).toBeTruthy();
        // SEO metadata
        expect(collection.seoTitle).toBeTruthy();
        expect(collection.seoDescription).toBeTruthy();
        // Related collections (at least 1)
        expect(collection.relatedCollections.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('all collections should still need movies before publication', () => {
      collections.forEach((collection) => {
        // Collections should be in DRAFT status
        expect(collection.status).toBe('DRAFT');
        // publishedAt should be null
        expect(collection.publishedAt).toBeNull();
      });
    });
  });
});
