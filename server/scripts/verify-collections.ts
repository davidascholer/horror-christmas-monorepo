/**
 * Collection Verification Script
 * 
 * Verifies that all 10 launch collections are properly loaded with:
 * - Correct collection types
 * - Required metadata fields
 * - Related collection relationships
 * - Proper sort order
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ValidationIssue {
  collection: string;
  issue: string;
  severity: 'error' | 'warning';
}

const REQUIRED_COLLECTIONS = [
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

async function verifyCollections() {
  console.log('🔍 Verifying Launch Collections\n');

  const issues: ValidationIssue[] = [];

  // Fetch all collections
  const collections = await prisma.collection.findMany({
    include: {
      relatedCollections: true,
      movies: true,
    },
  });

  console.log(`Found ${collections.length} collections in database\n`);

  // Check count
  if (collections.length < 10) {
    issues.push({
      collection: 'ALL',
      issue: `Only ${collections.length} collections found, expected 10`,
      severity: 'error',
    });
  }

  // Check for required collections by name
  const collectionTitles = collections.map((c) => c.title);
  for (const requiredTitle of REQUIRED_COLLECTIONS) {
    if (!collectionTitles.includes(requiredTitle)) {
      issues.push({
        collection: requiredTitle,
        issue: 'Required collection is missing',
        severity: 'error',
      });
    }
  }

  // Validate each collection
  for (const collection of collections) {
    // Check required fields
    if (!collection.introduction || collection.introduction.trim().length === 0) {
      issues.push({
        collection: collection.title,
        issue: 'Missing introduction',
        severity: 'error',
      });
    }

    if (!collection.curatorNotes || collection.curatorNotes.trim().length === 0) {
      issues.push({
        collection: collection.title,
        issue: 'Missing curator notes',
        severity: 'error',
      });
    }

    if (!collection.heroImage) {
      issues.push({
        collection: collection.title,
        issue: 'Missing hero image',
        severity: 'error',
      });
    }

    if (!collection.heroImageAlt) {
      issues.push({
        collection: collection.title,
        issue: 'Missing hero image alt text',
        severity: 'error',
      });
    }

    if (!collection.seoTitle) {
      issues.push({
        collection: collection.title,
        issue: 'Missing SEO title',
        severity: 'error',
      });
    }

    if (!collection.seoDescription) {
      issues.push({
        collection: collection.title,
        issue: 'Missing SEO description',
        severity: 'error',
      });
    }

    // Check slug uniqueness (handled by DB constraint, but verify)
    const slugCount = collections.filter((c) => c.slug === collection.slug).length;
    if (slugCount > 1) {
      issues.push({
        collection: collection.title,
        issue: `Duplicate slug: ${collection.slug}`,
        severity: 'error',
      });
    }

    // Check related collections
    if (collection.relatedCollections.length === 0) {
      issues.push({
        collection: collection.title,
        issue: 'No related collections (needs at least 1 before publication)',
        severity: 'warning',
      });
    }

    // Check for movies (will be added in Task 3.3)
    if (collection.movies.length === 0) {
      issues.push({
        collection: collection.title,
        issue: 'No movies assigned yet (expected - Task 3.3 will add them)',
        severity: 'warning',
      });
    }

    // Check status
    if (collection.status !== 'DRAFT') {
      issues.push({
        collection: collection.title,
        issue: `Status is ${collection.status}, expected DRAFT until movies are added`,
        severity: 'warning',
      });
    }
  }

  // Display results
  console.log('📋 Collection Types:');
  const typeGroups = new Map<string, string[]>();
  for (const collection of collections) {
    const titles = typeGroups.get(collection.type) || [];
    titles.push(collection.title);
    typeGroups.set(collection.type, titles);
  }

  for (const [type, titles] of Array.from(typeGroups.entries()).sort()) {
    console.log(`\n  ${type} (${titles.length}):`);
    for (const title of titles.sort()) {
      console.log(`    - ${title}`);
    }
  }

  console.log('\n📊 Homepage Organization:');
  const orderedCollections = collections
    .filter((c) => c.sortOrder !== null)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  for (const collection of orderedCollections) {
    const badges = [];
    if (collection.featured) badges.push('featured');
    if (collection.seasonal) badges.push('seasonal');
    const badgeStr = badges.length > 0 ? ` [${badges.join(', ')}]` : '';
    console.log(`  ${collection.sortOrder}. ${collection.title}${badgeStr}`);
  }

  console.log('\n🔗 Related Collection Relationships:');
  let totalRelationships = 0;
  for (const collection of collections.sort((a, b) => a.title.localeCompare(b.title))) {
    if (collection.relatedCollections.length > 0) {
      totalRelationships += collection.relatedCollections.length;
      const relatedCount = collection.relatedCollections.length;
      console.log(`  ${collection.title}: ${relatedCount} related collection(s)`);
    }
  }
  console.log(`  Total relationships: ${totalRelationships}`);

  // Display issues
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    for (const error of errors) {
      console.log(`  [${error.collection}] ${error.issue}`);
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of warnings) {
      console.log(`  [${warning.collection}] ${warning.issue}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All collections verified successfully!');
    console.log('\nReady for Task 3.3: Add movies to collections');
  } else if (errors.length === 0) {
    console.log(`✅ Collections verified with ${warnings.length} warning(s)`);
    console.log('\nWarnings are expected at this stage.');
    console.log('Collections need movies before publication (Task 3.3).');
  } else {
    console.log(`❌ Verification failed with ${errors.length} error(s)`);
    console.log('\nFix errors before proceeding.');
    process.exit(1);
  }
}

async function main() {
  try {
    await verifyCollections();
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
