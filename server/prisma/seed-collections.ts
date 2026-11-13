/**
 * Launch Collections Seed Data
 * 
 * This file contains the 10 required launch collections from Requirement 6.2.
 * Each collection includes:
 * - Slug, title, and type
 * - Introduction and curator notes
 * - Hero image metadata
 * - SEO title and description
 * - Homepage sort order
 * - Status (DRAFT - will be published after movies are added in Task 3.3)
 * 
 * Collection relationships will be established after movies are created.
 */

import { PrismaClient, CollectionType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CollectionSeedData {
  slug: string;
  title: string;
  type: CollectionType;
  introduction: string;
  curatorNotes: string;
  summary: string;
  heroImage: string;
  heroImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  seasonal: boolean;
  sortOrder: number;
}

/**
 * The 10 required launch collections from Requirement 6.2
 */
export const launchCollections: CollectionSeedData[] = [
  {
    slug: 'essential-krampus',
    title: 'Essential Krampus Collection',
    type: 'CHARACTER',
    introduction: 'Krampus, the horned Christmas devil from Alpine folklore, has become one of horror\'s most iconic seasonal villains. This collection brings together the essential films that showcase this ancient creature\'s terrifying journey from folklore to modern horror.',
    curatorNotes: 'Start with "Krampus" (2015) for a perfect blend of horror and dark comedy that introduces the character to mainstream audiences. For deeper folklore exploration, move to independent interpretations that honor the Alpine traditions. This collection is ideal for anyone curious about Christmas horror\'s most famous monster and his roots in European mythology.',
    summary: 'Essential films featuring Krampus, the horned Christmas devil from Alpine folklore.',
    heroImage: '/images/collections/essential-krampus-hero.jpg',
    heroImageAlt: 'Krampus emerging from snowy darkness with glowing eyes and horns',
    seoTitle: 'Essential Krampus Movies - Christmas Horror Devil Collection',
    seoDescription: 'Discover the best Krampus horror films, from Michael Dougherty\'s 2015 classic to independent folklore-inspired interpretations of the Christmas devil.',
    featured: true,
    seasonal: false,
    sortOrder: 1,
  },
  {
    slug: 'winter-monsters',
    title: 'Winter Monsters',
    type: 'THEME',
    introduction: 'Beyond Krampus and Santa, winter brings its own menagerie of monsters. From ancient folklore creatures to modern horror inventions, these films explore the beasts that haunt the coldest, darkest nights of the year.',
    curatorNotes: 'This collection showcases the diversity of winter horror creatures - each film presents a unique monster with its own mythology. Perfect for viewers who love creature features and want to explore beyond the familiar Christmas horror icons. Start with the most well-known creatures and work toward the more obscure folkloric beings.',
    summary: 'Terrifying creatures and monsters that emerge during the winter season.',
    heroImage: '/images/collections/winter-monsters-hero.jpg',
    heroImageAlt: 'Silhouettes of various winter creatures against a moonlit snowy landscape',
    seoTitle: 'Winter Monsters Collection - Seasonal Horror Creatures',
    seoDescription: 'Explore winter horror beyond Krampus with films featuring Yule Cat, Frau Perchta, and other terrifying creatures from winter folklore and modern horror.',
    featured: true,
    seasonal: true,
    sortOrder: 2,
  },
  {
    slug: 'christmas-slashers',
    title: 'Christmas Slashers',
    type: 'THEME',
    introduction: 'When slasher films meet Christmas, the results are gloriously twisted. These films transform holiday traditions into weapons, Santa suits into disguises for killers, and festive gatherings into hunting grounds.',
    curatorNotes: 'Start with "Silent Night, Deadly Night" for the quintessential killer Santa experience, then explore "Black Christmas" for pioneering proto-slasher tension. This collection is perfect for slasher fans who appreciate how the genre subverts wholesome holiday imagery. Each film uses Christmas traditions in creative and disturbing ways.',
    summary: 'Classic and modern slasher films set during the Christmas season.',
    heroImage: '/images/collections/christmas-slashers-hero.jpg',
    heroImageAlt: 'Blood-spattered Santa hat and axe against Christmas lights',
    seoTitle: 'Christmas Slasher Movies - Holiday Horror Collection',
    seoDescription: 'The best Christmas slasher films including Silent Night Deadly Night, Black Christmas, and other killer Santa movies that transform holiday cheer into terror.',
    featured: true,
    seasonal: false,
    sortOrder: 3,
  },
  {
    slug: 'new-to-christmas-horror',
    title: 'New To Christmas Horror',
    type: 'BEGINNER',
    introduction: 'Never explored Christmas horror before? This beginner-friendly collection introduces the subgenre\'s range through accessible, entertaining films that balance scares with fun. These movies prove that Christmas and horror make a surprisingly perfect pairing.',
    curatorNotes: 'Begin with "Gremlins" - it\'s technically PG-13 and offers the perfect gateway between family-friendly Christmas movies and horror. Then try "Krampus" for folkloric creature feature fun, followed by "Better Watch Out" for a modern twist. This path gradually increases intensity while showcasing different sub-styles within Christmas horror. Perfect for horror-curious viewers or for introducing friends to the genre.',
    summary: 'Beginner-friendly introduction to Christmas horror films across different styles.',
    heroImage: '/images/collections/beginner-christmas-horror-hero.jpg',
    heroImageAlt: 'Welcoming Christmas tree with subtle eerie elements in the shadows',
    seoTitle: 'New to Christmas Horror - Beginner\'s Collection',
    seoDescription: 'Start your Christmas horror journey with this beginner-friendly collection featuring Gremlins, Krampus, and other accessible gateway films to the genre.',
    featured: true,
    seasonal: false,
    sortOrder: 4,
  },
  {
    slug: '25-days-of-christmas-horror',
    title: '25 Days of Christmas Horror',
    type: 'SEASONAL_CHALLENGE',
    introduction: 'A curated 25-day journey through Christmas horror, designed to be watched one film per day from December 1st through Christmas Day. This collection builds from lighthearted seasonal scares to darker, more intense films, creating the ultimate horror advent calendar experience.',
    curatorNotes: 'This collection is intentionally ordered to create a progressive experience throughout December. Start on December 1st with the most accessible entries and let the intensity build. By Christmas Eve, you\'ll be deep in the darkest corners of the subgenre. Mix creature features, slashers, and supernatural tales to keep each night fresh. Perfect for dedicated horror fans who want to make the whole season a celebration of Christmas horror.',
    summary: 'One film per day from December 1-25, building from light scares to dark horror.',
    heroImage: '/images/collections/25-days-hero.jpg',
    heroImageAlt: 'Advent calendar with horror-themed doors opening to reveal movie scenes',
    seoTitle: '25 Days of Christmas Horror Challenge - December Movie Marathon',
    seoDescription: 'Watch one Christmas horror movie each day in December with this curated 25-film challenge, building from festive scares to intense holiday horror.',
    featured: false,
    seasonal: true,
    sortOrder: 5,
  },
  {
    slug: 'best-gifts-for-krampus-fans',
    title: 'Best Gifts For Krampus Fans',
    type: 'GIFT',
    introduction: 'Shopping for someone who loves Christmas horror? This collection pairs essential films with the perfect merchandise - from Krampus figures to horror ornaments - to create the ultimate gift guide for fans of the dark side of the holidays.',
    curatorNotes: 'This gift collection connects films with related products to help you build the perfect present for Christmas horror enthusiasts. Each pairing suggests merchandise that complements the films, whether you\'re shopping for a newcomer who needs the essential movies or a dedicated collector looking for rare figures and artwork. Use this as a gift guide to introduce someone to the genre or to enhance an existing fan\'s collection.',
    summary: 'Gift ideas pairing Christmas horror films with perfect merchandise for fans.',
    heroImage: '/images/collections/krampus-gifts-hero.jpg',
    heroImageAlt: 'Wrapped presents with Krampus-themed decorations and collectibles',
    seoTitle: 'Best Gifts for Krampus Fans - Christmas Horror Gift Guide',
    seoDescription: 'Find the perfect gifts for Christmas horror fans with this curated collection of Krampus movies, figures, ornaments, and merchandise.',
    featured: false,
    seasonal: true,
    sortOrder: 6,
  },
  {
    slug: 'christmas-horror-comedies',
    title: 'Christmas Horror Comedies',
    type: 'THEME',
    introduction: 'Sometimes the best way to celebrate the season is with films that blend screams and laughter. These Christmas horror comedies prove that terror and humor make perfect holiday companions, offering the ideal balance of scares and satire.',
    curatorNotes: 'Start with "Gremlins" for the perfect horror-comedy gateway - it set the template that many others followed. These films work because they understand both genres deeply and aren\'t afraid to embrace the absurdity of combining Christmas cheer with genuine horror. Perfect for watch parties and viewers who appreciate genre-blending. The comedy enhances rather than undercuts the horror, creating a unique viewing experience.',
    summary: 'Horror comedies that blend Christmas cheer with scares and satire.',
    heroImage: '/images/collections/horror-comedies-hero.jpg',
    heroImageAlt: 'Grinning monster wearing a Santa hat surrounded by Christmas decorations',
    seoTitle: 'Christmas Horror Comedies - Funny Holiday Horror Films',
    seoDescription: 'The best Christmas horror comedies including Gremlins, Krampus, and other films that perfectly blend holiday cheer with screams and laughter.',
    featured: false,
    seasonal: false,
    sortOrder: 7,
  },
  {
    slug: 'black-christmas-collection',
    title: 'Black Christmas Collection',
    type: 'TRADITION',
    introduction: 'Bob Clark\'s 1974 "Black Christmas" invented many slasher conventions before Halloween codified them. This collection explores the original film\'s legacy through its remakes and the movies it influenced, showing how one Christmas horror film changed the genre forever.',
    curatorNotes: 'Begin with the 1974 original - it\'s essential viewing for understanding both Christmas horror and slasher film history. The film\'s innovations (the killer\'s POV, the calls coming from inside the house, the final girl) became genre staples. Then explore how later films reinterpreted and built upon its foundation. This collection is perfect for film students and horror historians interested in genre evolution and the roots of modern horror.',
    summary: 'The influential Black Christmas films and their impact on horror cinema.',
    heroImage: '/images/collections/black-christmas-hero.jpg',
    heroImageAlt: 'Sorority house window at night with shadow of person watching',
    seoTitle: 'Black Christmas Collection - Original and Remakes',
    seoDescription: 'Explore the Black Christmas legacy from Bob Clark\'s 1974 proto-slasher masterpiece through its remakes and the films it influenced.',
    featured: false,
    seasonal: false,
    sortOrder: 8,
  },
  {
    slug: 'christmas-horror-deep-cuts',
    title: 'Christmas Horror Deep Cuts',
    type: 'THEME',
    introduction: 'Beyond the well-known classics lie hidden gems and cult favorites that deserve attention. This collection uncovers lesser-known Christmas horror films - from obscure international productions to underseen indie efforts - that offer fresh perspectives on seasonal terror.',
    curatorNotes: 'This collection is for viewers who have exhausted the mainstream Christmas horror catalog and want to discover something new. These deep cuts range from genuinely good overlooked films to enjoyable cult oddities. Expect varying production values but consistent creativity. Perfect for dedicated genre fans who want to complete their Christmas horror education and discover films their friends haven\'t seen yet.',
    summary: 'Hidden gems and cult classics from the depths of Christmas horror cinema.',
    heroImage: '/images/collections/deep-cuts-hero.jpg',
    heroImageAlt: 'Dusty VHS tapes of obscure Christmas horror films',
    seoTitle: 'Christmas Horror Deep Cuts - Hidden Gems and Cult Classics',
    seoDescription: 'Discover underseen Christmas horror gems including obscure cult classics and international films that devoted fans need to experience.',
    featured: false,
    seasonal: false,
    sortOrder: 9,
  },
  {
    slug: 'holiday-horror-marathon',
    title: 'Holiday Horror Marathon',
    type: 'SEASONAL_CHALLENGE',
    introduction: 'Planning a Christmas horror movie marathon? This collection provides the perfect watch order for an all-day or weekend horror celebration. These films are selected for their pacing, variety, and ability to keep audiences engaged through multiple viewings.',
    curatorNotes: 'This marathon is designed for a group viewing experience over 8-12 hours. The order alternates between different styles - creature features, slashers, comedies, and supernatural tales - to maintain energy and prevent fatigue. Start in the afternoon with lighter fare and build toward darker, more intense films as night falls. Include breaks between films for discussion and food. This is perfect for dedicated horror fans who want to make Christmas horror the centerpiece of their holiday celebration.',
    summary: 'Perfect watch order for an all-day or weekend Christmas horror marathon.',
    heroImage: '/images/collections/marathon-hero.jpg',
    heroImageAlt: 'Cozy living room setup for movie marathon with Christmas horror posters',
    seoTitle: 'Holiday Horror Marathon - Christmas Horror Watch Order',
    seoDescription: 'Plan the perfect Christmas horror marathon with this collection curated for ideal pacing, variety, and all-day viewing enjoyment.',
    featured: false,
    seasonal: true,
    sortOrder: 10,
  },
];

/**
 * Related collection relationships
 * These will be created after collections exist in the database
 * Format: { sourceSlug: string, targetSlugs: string[] }
 */
export const collectionRelationships = {
  'essential-krampus': [
    'winter-monsters',
    'new-to-christmas-horror',
    'best-gifts-for-krampus-fans',
  ],
  'winter-monsters': [
    'essential-krampus',
    'christmas-horror-deep-cuts',
    'new-to-christmas-horror',
  ],
  'christmas-slashers': [
    'black-christmas-collection',
    '25-days-of-christmas-horror',
    'holiday-horror-marathon',
  ],
  'new-to-christmas-horror': [
    'essential-krampus',
    'christmas-horror-comedies',
    'winter-monsters',
  ],
  '25-days-of-christmas-horror': [
    'holiday-horror-marathon',
    'christmas-slashers',
    'new-to-christmas-horror',
  ],
  'best-gifts-for-krampus-fans': [
    'essential-krampus',
    'christmas-horror-comedies',
    'winter-monsters',
  ],
  'christmas-horror-comedies': [
    'new-to-christmas-horror',
    'best-gifts-for-krampus-fans',
    'holiday-horror-marathon',
  ],
  'black-christmas-collection': [
    'christmas-slashers',
    'christmas-horror-deep-cuts',
    '25-days-of-christmas-horror',
  ],
  'christmas-horror-deep-cuts': [
    'winter-monsters',
    'black-christmas-collection',
    'holiday-horror-marathon',
  ],
  'holiday-horror-marathon': [
    '25-days-of-christmas-horror',
    'christmas-slashers',
    'christmas-horror-comedies',
  ],
};

/**
 * Seed the launch collections into the database
 */
async function seedCollections() {
  console.log('🎄 Starting collection seed...\n');

  // Create all collections
  console.log('Creating collections...');
  const createdCollections = new Map<string, string>();

  for (const collection of launchCollections) {
    const created = await prisma.collection.create({
      data: {
        slug: collection.slug,
        title: collection.title,
        type: collection.type,
        introduction: collection.introduction,
        curatorNotes: collection.curatorNotes,
        summary: collection.summary,
        heroImage: collection.heroImage,
        heroImageAlt: collection.heroImageAlt,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        featured: collection.featured,
        seasonal: collection.seasonal,
        sortOrder: collection.sortOrder,
        status: 'DRAFT', // Will be published after movies are added
      },
    });

    createdCollections.set(collection.slug, created.id);
    console.log(`✓ Created: ${collection.title} (${collection.type})`);
  }

  // Create related collection relationships
  console.log('\nCreating related collection relationships...');
  let relationshipCount = 0;

  for (const [sourceSlug, targetSlugs] of Object.entries(collectionRelationships)) {
    const sourceId = createdCollections.get(sourceSlug);
    if (!sourceId) {
      console.warn(`⚠ Warning: Source collection not found: ${sourceSlug}`);
      continue;
    }

    for (let i = 0; i < targetSlugs.length; i++) {
      const targetSlug = targetSlugs[i];
      const targetId = createdCollections.get(targetSlug);
      
      if (!targetId) {
        console.warn(`⚠ Warning: Target collection not found: ${targetSlug}`);
        continue;
      }

      await prisma.collectionRelated.create({
        data: {
          sourceCollectionId: sourceId,
          targetCollectionId: targetId,
          sortOrder: i,
        },
      });

      relationshipCount++;
    }
  }

  console.log(`✓ Created ${relationshipCount} related collection relationships\n`);

  // Summary
  console.log('📊 Seed Summary:');
  console.log(`   Collections created: ${createdCollections.size}`);
  console.log(`   Related relationships: ${relationshipCount}`);
  console.log(`   Status: All collections in DRAFT (awaiting movies)\n`);

  // Collection type breakdown
  const typeBreakdown = new Map<string, number>();
  for (const collection of launchCollections) {
    typeBreakdown.set(
      collection.type,
      (typeBreakdown.get(collection.type) || 0) + 1
    );
  }

  console.log('📋 Collection Types:');
  for (const [type, count] of typeBreakdown.entries()) {
    console.log(`   ${type}: ${count}`);
  }

  console.log('\n✅ Collection seed complete!\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedCollections();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Only self-execute when run directly (e.g. `tsx prisma/seed-x.ts`), never on
// import, so prisma/seed.ts can run the steps in order.
import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedCollections, main };
