/**
 * Master Seed Script
 * 
 * Executes all seed files in the correct order:
 * 1. Collections (already exist from Task 3.2)
 * 2. Franchises
 * 3. Tags
 * 4. Movies
 * 5. Characters
 * 6. Products
 * 7. Relationships (all join tables)
 */

import { PrismaClient } from '@prisma/client';
import { seedCollections } from './seed-collections';
import { seedFranchises } from './seed-franchises';
import { seedTags } from './seed-tags';
import { seedMovies } from './seed-movies';
import { seedCharacters } from './seed-characters';
import { seedProducts } from './seed-products';
import { seedRelationships } from './seed-relationships';

const prisma = new PrismaClient();

async function main() {
  console.log('🎄 Starting complete Horror Christmas catalog seed...\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Collections (may already exist from Task 3.2)
    console.log('\n📚 Step 1: Collections');
    console.log('-'.repeat(60));
    const existingCollections = await prisma.collection.count();
    if (existingCollections === 0) {
      await seedCollections();
    } else {
      console.log(`✓ Collections already seeded (${existingCollections} found)\n`);
    }

    // Step 2: Franchises
    console.log('\n🎬 Step 2: Franchises');
    console.log('-'.repeat(60));
    await seedFranchises();

    // Step 3: Tags
    console.log('\n🏷️  Step 3: Tags');
    console.log('-'.repeat(60));
    await seedTags();

    // Step 4: Movies
    console.log('\n🎥 Step 4: Movies');
    console.log('-'.repeat(60));
    await seedMovies();

    // Step 5: Characters
    console.log('\n🎭 Step 5: Characters');
    console.log('-'.repeat(60));
    await seedCharacters();

    // Step 6: Products
    console.log('\n🎁 Step 6: Products');
    console.log('-'.repeat(60));
    await seedProducts();

    // Step 7: Relationships
    console.log('\n🔗 Step 7: Relationships');
    console.log('-'.repeat(60));
    await seedRelationships();

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETE - Final Inventory:\n');

    const collections = await prisma.collection.count();
    const movies = await prisma.movie.count();
    const characters = await prisma.character.count();
    const products = await prisma.product.count();
    const franchises = await prisma.franchise.count();
    const tags = await prisma.tag.count();
    const movieChars = await prisma.movieCharacter.count();
    const productChars = await prisma.productCharacter.count();
    const collectionMovies = await prisma.collectionMovie.count();
    const collectionChars = await prisma.collectionCharacter.count();
    const collectionProds = await prisma.collectionProduct.count();
    const collectionFranchises = await prisma.collectionFranchise.count();
    const collectionTags = await prisma.collectionTag.count();
    const collectionRelated = await prisma.collectionRelated.count();

    console.log('📊 Entity Counts:');
    console.log(`   Collections: ${collections} ${collections >= 10 ? '✓' : '✗ (minimum 10 required)'}`);
    console.log(`   Movies: ${movies} ${movies >= 50 ? '✓' : '✗ (minimum 50 required)'}`);
    console.log(`   Characters: ${characters} ${characters >= 20 ? '✓' : '✗ (minimum 20 required)'}`);
    console.log(`   Products: ${products} ${products >= 50 ? '✓' : '✗ (minimum 50 required)'}`);
    console.log(`   Franchises: ${franchises} ${franchises >= 5 ? '✓' : '✗ (minimum 5 required)'}`);
    console.log(`   Tags: ${tags} ${tags >= 20 ? '✓' : '✗ (minimum 20 required)'}`);

    console.log('\n🔗 Relationship Counts:');
    console.log(`   Movie-Character: ${movieChars}`);
    console.log(`   Product-Character: ${productChars}`);
    console.log(`   Collection-Movie: ${collectionMovies}`);
    console.log(`   Collection-Character: ${collectionChars}`);
    console.log(`   Collection-Product: ${collectionProds}`);
    console.log(`   Collection-Franchise: ${collectionFranchises}`);
    console.log(`   Collection-Tag: ${collectionTags}`);
    console.log(`   Collection-Related: ${collectionRelated}`);

    // Verify requirements
    console.log('\n✓ Requirement Verification:');
    
    // Check named required characters
    const requiredCharacterSlugs = ['krampus', 'billy-chapman', 'stripe', 'gizmo', 'yule-cat', 'frau-perchta'];
    const foundCharacters = await prisma.character.findMany({
      where: { slug: { in: requiredCharacterSlugs } },
      select: { slug: true },
    });
    const foundCharacterSlugs = new Set(foundCharacters.map(c => c.slug));
    console.log('   Required Characters:');
    for (const slug of requiredCharacterSlugs) {
      console.log(`     ${slug}: ${foundCharacterSlugs.has(slug) ? '✓' : '✗'}`);
    }

    // Check named required franchises
    const requiredFranchiseSlugs = ['gremlins', 'black-christmas', 'silent-night-deadly-night', 'krampus'];
    const foundFranchises = await prisma.franchise.findMany({
      where: { slug: { in: requiredFranchiseSlugs } },
      select: { slug: true },
    });
    const foundFranchiseSlugs = new Set(foundFranchises.map(f => f.slug));
    console.log('\n   Required Franchises:');
    for (const slug of requiredFranchiseSlugs) {
      console.log(`     ${slug}: ${foundFranchiseSlugs.has(slug) ? '✓' : '✗'}`);
    }

    // Check product categories
    const productsByCategory = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
    });
    const categoryMap = new Map(productsByCategory.map(p => [p.category, p._count]));
    const requiredCategories = ['figures', 'ornaments', 'posters', 'blu-rays', 'apparel'];
    console.log('\n   Required Product Categories:');
    for (const category of requiredCategories) {
      const count = categoryMap.get(category) || 0;
      console.log(`     ${category}: ${count > 0 ? '✓' : '✗'} (${count} products)`);
    }

    // Check named collections
    const requiredCollectionSlugs = [
      'essential-krampus',
      'winter-monsters',
      'christmas-slashers',
      'new-to-christmas-horror',
      '25-days-of-christmas-horror',
      'best-gifts-for-krampus-fans',
      'christmas-horror-comedies',
      'black-christmas-collection',
      'christmas-horror-deep-cuts',
      'holiday-horror-marathon',
    ];
    const foundCollections = await prisma.collection.findMany({
      where: { slug: { in: requiredCollectionSlugs } },
      select: { slug: true },
    });
    const foundCollectionSlugs = new Set(foundCollections.map(c => c.slug));
    console.log('\n   Required Named Collections:');
    for (const slug of requiredCollectionSlugs) {
      console.log(`     ${slug}: ${foundCollectionSlugs.has(slug) ? '✓' : '✗'}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎄 Horror Christmas catalog is ready!\n');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
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
