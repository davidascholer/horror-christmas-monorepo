/**
 * Relationship Seed Data
 * 
 * This file establishes relationships between:
 * - Movies and Characters (MovieCharacter)
 * - Products and Characters (ProductCharacter)
 * - Collections and Movies (CollectionMovie)
 * - Collections and Characters (CollectionCharacter)
 * - Collections and Products (CollectionProduct)
 * - Collections and Franchises (CollectionFranchise)
 * - Collections and Tags (CollectionTag)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Movie-Character relationships with roles
 */
export const movieCharacterRelationships = [
  // Gremlins
  { movieSlug: 'gremlins', characterSlug: 'gizmo', role: 'Protagonist', sortOrder: 0 },
  { movieSlug: 'gremlins', characterSlug: 'stripe', role: 'Main Antagonist', sortOrder: 1 },
  { movieSlug: 'gremlins-2-the-new-batch', characterSlug: 'gizmo', role: 'Protagonist', sortOrder: 0 },
  { movieSlug: 'gremlins-2-the-new-batch', characterSlug: 'stripe', role: 'Antagonist (Flashback)', sortOrder: 1 },
  
  // Silent Night, Deadly Night
  { movieSlug: 'silent-night-deadly-night', characterSlug: 'billy-chapman', role: 'Protagonist/Killer', sortOrder: 0 },
  { movieSlug: 'silent-night-deadly-night-part-2', characterSlug: 'ricky-caldwell', role: 'Protagonist/Killer', sortOrder: 0 },
  { movieSlug: 'silent-night-deadly-night-part-2', characterSlug: 'billy-chapman', role: 'Appeared (Flashbacks)', sortOrder: 1 },
  
  // Krampus
  { movieSlug: 'krampus-2015', characterSlug: 'krampus', role: 'Main Antagonist', sortOrder: 0 },
  { movieSlug: 'krampus-2015', characterSlug: 'santa-claus-krampus-2015', role: 'Implied Presence', sortOrder: 1 },
  { movieSlug: 'krampus-2015', characterSlug: 'troll', role: 'Minions', sortOrder: 2 },
  { movieSlug: 'krampus-the-reckoning', characterSlug: 'krampus', role: 'Summoned Antagonist', sortOrder: 0 },
  
  // Black Christmas
  { movieSlug: 'black-christmas-1974', characterSlug: 'billy-lenz', role: 'The Killer', sortOrder: 0 },
  { movieSlug: 'black-christmas-2019', characterSlug: 'fiona-black-christmas', role: 'Cult Antagonists', sortOrder: 0 },
  
  // Other films
  { movieSlug: 'christmas-evil', characterSlug: 'harry-stadling', role: 'Protagonist/Killer', sortOrder: 0 },
  { movieSlug: 'rare-exports', characterSlug: 'real-santa-rare-exports', role: 'Main Antagonist', sortOrder: 0 },
  { movieSlug: 'better-watch-out', characterSlug: 'ash-luke-ashley', role: 'Antagonist', sortOrder: 0 },
  { movieSlug: 'violent-night', characterSlug: 'violent-night-santa', role: 'Protagonist', sortOrder: 0 },
  { movieSlug: 'jack-frost-1997', characterSlug: 'jack-frost-character', role: 'Main Antagonist', sortOrder: 0 },
  { movieSlug: 'jack-frost-2', characterSlug: 'jack-frost-character', role: 'Main Antagonist', sortOrder: 0 },
  { movieSlug: 'the-children', characterSlug: 'the-children-from-the-children', role: 'Antagonists', sortOrder: 0 },
  { movieSlug: 'christmas-horror-story', characterSlug: 'krampus', role: 'Antagonist (Segment)', sortOrder: 0 },
];

/**
 * Product-Character relationships
 */
export const productCharacterRelationships = [
  // Krampus products
  { productSlug: 'neca-krampus-ultimate-7-inch', characterSlug: 'krampus', sortOrder: 0 },
  { productSlug: 'living-dead-dolls-krampus', characterSlug: 'krampus', sortOrder: 0 },
  { productSlug: 'mezco-designer-series-krampus', characterSlug: 'krampus', sortOrder: 0 },
  { productSlug: 'hallmark-krampus-ornament', characterSlug: 'krampus', sortOrder: 0 },
  { productSlug: 'fright-rags-krampus-snow-globe-ornament', characterSlug: 'krampus', sortOrder: 0 },
  { productSlug: 'fright-rags-krampus-christmas-sweater', characterSlug: 'krampus', sortOrder: 0 },
  
  // Gizmo products
  { productSlug: 'funko-pop-gremlins-gizmo', characterSlug: 'gizmo', sortOrder: 0 },
  { productSlug: 'neca-gremlins-ultimate-gizmo', characterSlug: 'gizmo', sortOrder: 0 },
  { productSlug: 'nendoroid-gizmo', characterSlug: 'gizmo', sortOrder: 0 },
  { productSlug: 'hallmark-gremlins-gizmo-ornament', characterSlug: 'gizmo', sortOrder: 0 },
  { productSlug: 'department-56-gremlins-gizmo-mini', characterSlug: 'gizmo', sortOrder: 0 },
  { productSlug: 'super7-reaction-gremlins-gizmo', characterSlug: 'gizmo', sortOrder: 0 },
  { productSlug: 'kidrobot-phunny-gizmo-plush', characterSlug: 'gizmo', sortOrder: 0 },
  
  // Stripe products
  { productSlug: 'funko-pop-gremlins-stripe', characterSlug: 'stripe', sortOrder: 0 },
  { productSlug: 'neca-gremlins-ultimate-stripe', characterSlug: 'stripe', sortOrder: 0 },
  { productSlug: 'neca-gremlins-stripe-ornament', characterSlug: 'stripe', sortOrder: 0 },
  { productSlug: 'yesterdays-gremlins-stripe-sweater', characterSlug: 'stripe', sortOrder: 0 },
  
  // Billy Chapman products
  { productSlug: 'trick-or-treat-studios-billy-chapman-mask', characterSlug: 'billy-chapman', sortOrder: 0 },
  { productSlug: 'silent-night-deadly-night-collection', characterSlug: 'billy-chapman', sortOrder: 0 },
  { productSlug: 'silent-night-deadly-night-collection', characterSlug: 'ricky-caldwell', sortOrder: 1 },
];

/**
 * Collection content relationships
 * Each collection gets movies, characters, products, franchises, and tags
 */
export const collectionContentRelationships = {
  'essential-krampus': {
    movies: [
      { slug: 'krampus-2015', sortOrder: 0, curatorNote: 'The definitive mainstream Krampus film. Start here for the perfect blend of horror, humor, and folklore.' },
      { slug: 'krampus-the-reckoning', sortOrder: 1, curatorNote: 'Darker independent take on the legend with genuine scares.' },
      { slug: 'christmas-horror-story', sortOrder: 2, curatorNote: 'Anthology featuring a memorable Krampus segment among other Christmas terrors.' },
      { slug: 'krampus-the-devil-returns', sortOrder: 3, curatorNote: 'Revenge-focused interpretation with grittier horror approach.' },
    ],
    characters: [
      { slug: 'krampus', sortOrder: 0, curatorNote: 'The horned Christmas demon himself - from Alpine folklore to horror icon.' },
      { slug: 'frau-perchta', sortOrder: 1, curatorNote: 'Krampus\'s female counterpart from the same Alpine traditions.' },
      { slug: 'santa-claus-krampus-2015', sortOrder: 2, curatorNote: 'The corrupted Santa from Krampus (2015).' },
    ],
    products: [
      { slug: 'neca-krampus-ultimate-7-inch', sortOrder: 0, curatorNote: 'Premium action figure of Krampus from the 2015 film.' },
      { slug: 'hallmark-krampus-ornament', sortOrder: 1 },
      { slug: 'fright-rags-krampus-christmas-sweater', sortOrder: 2 },
      { slug: 'krampus-collectors-edition-bluray', sortOrder: 3 },
      { slug: 'fright-rags-krampus-poster', sortOrder: 4 },
    ],
    franchises: [
      { slug: 'krampus', sortOrder: 0 },
    ],
    tags: [
      'folklore',
      'creature-feature',
      'dark-comedy',
      'beginner-friendly',
    ],
  },
  'winter-monsters': {
    movies: [
      { slug: 'rare-exports', sortOrder: 0, curatorNote: 'Finnish masterpiece reimagining Santa as ancient evil. Essential viewing.' },
      { slug: 'krampus-2015', sortOrder: 1, curatorNote: 'Features Krampus and his menagerie of nightmare helpers.' },
      { slug: 'the-children', sortOrder: 2, curatorNote: 'Children transformed into something monstrous during winter.' },
      { slug: 'saint', sortOrder: 3, curatorNote: 'Dutch take on Sinterklaas as murderous bishop.' },
      { slug: 'christmas-horror-story', sortOrder: 4, curatorNote: 'Anthology featuring multiple winter creatures including Krampus.' },
    ],
    characters: [
      { slug: 'krampus', sortOrder: 0 },
      { slug: 'yule-cat', sortOrder: 1, curatorNote: 'The giant cat from Icelandic folklore who devours those without new clothes.' },
      { slug: 'frau-perchta', sortOrder: 2 },
      { slug: 'real-santa-rare-exports', sortOrder: 3 },
      { slug: 'gryla', sortOrder: 4 },
      { slug: 'the-yule-lads', sortOrder: 5 },
    ],
    products: [
      { slug: 'kreepsville-666-yule-cat-ornament', sortOrder: 0 },
      { slug: 'rare-exports-bluray', sortOrder: 1 },
      { slug: 'krampus-folklore-art-print', sortOrder: 2 },
      { slug: 'gothic-homeware-perchta-ornament', sortOrder: 3 },
    ],
    franchises: [
      { slug: 'krampus', sortOrder: 0 },
    ],
    tags: [
      'folklore',
      'creature-feature',
      'international',
      'winter-setting',
    ],
  },
  'christmas-slashers': {
    movies: [
      { slug: 'silent-night-deadly-night', sortOrder: 0, curatorNote: 'The quintessential killer Santa film. Controversial and iconic.' },
      { slug: 'black-christmas-1974', sortOrder: 1, curatorNote: 'Proto-slasher masterpiece that invented genre conventions.' },
      { slug: 'silent-night-deadly-night-part-2', sortOrder: 2, curatorNote: 'Infamous for "Garbage Day!" - cult classic sequel.' },
      { slug: 'christmas-evil', sortOrder: 3, curatorNote: 'Psychological approach to killer Santa - John Waters\' favorite.' },
      { slug: 'silent-night', sortOrder: 4, curatorNote: 'Brutal modern remake with extreme gore.' },
      { slug: 'black-christmas-2006', sortOrder: 5 },
      { slug: 'all-through-the-house', sortOrder: 6 },
      { slug: 'to-all-goodnight', sortOrder: 7 },
    ],
    characters: [
      { slug: 'billy-chapman', sortOrder: 0 },
      { slug: 'ricky-caldwell', sortOrder: 1 },
      { slug: 'billy-lenz', sortOrder: 2 },
      { slug: 'harry-stadling', sortOrder: 3 },
    ],
    products: [
      { slug: 'silent-night-deadly-night-collection', sortOrder: 0 },
      { slug: 'trick-or-treat-studios-billy-chapman-mask', sortOrder: 1 },
      { slug: 'black-christmas-scream-factory', sortOrder: 2 },
      { slug: 'fright-rags-killer-santa-ornament-set', sortOrder: 3 },
      { slug: 'silent-night-deadly-night-video-store-poster', sortOrder: 4 },
      { slug: 'trick-or-treat-silent-night-deadly-night-axe', sortOrder: 5 },
    ],
    franchises: [
      { slug: 'silent-night-deadly-night', sortOrder: 0 },
      { slug: 'black-christmas', sortOrder: 1 },
      { slug: 'christmas-evil-universe', sortOrder: 2 },
    ],
    tags: [
      'killer-santa',
      'slasher',
      'family-trauma',
      'cult-classic',
    ],
  },
  'new-to-christmas-horror': {
    movies: [
      { slug: 'gremlins', sortOrder: 0, curatorNote: 'Perfect gateway film. PG-13 rated with perfect horror-comedy balance.' },
      { slug: 'krampus-2015', sortOrder: 1, curatorNote: 'Mainstream horror-comedy with heart. Accessible scares.' },
      { slug: 'better-watch-out', sortOrder: 2, curatorNote: 'Modern thriller with clever twists. Intense but not extreme.' },
      { slug: 'anna-and-the-apocalypse', sortOrder: 3, curatorNote: 'Zombie musical! Unique and fun entry point.' },
      { slug: 'violent-night', sortOrder: 4, curatorNote: 'Action-horror with Santa. Die Hard meets horror.' },
      { slug: 'rare-exports', sortOrder: 5, curatorNote: 'Atmospheric and creative without extreme violence.' },
    ],
    characters: [
      { slug: 'gizmo', sortOrder: 0, curatorNote: 'Adorable Mogwai - the perfect introduction to creature horror.' },
      { slug: 'stripe', sortOrder: 1 },
      { slug: 'krampus', sortOrder: 2 },
      { slug: 'violent-night-santa', sortOrder: 3 },
    ],
    products: [
      { slug: 'gremlins-4k-uhd-steelbook', sortOrder: 0 },
      { slug: 'funko-pop-gremlins-gizmo', sortOrder: 1 },
      { slug: 'krampus-collectors-edition-bluray', sortOrder: 2 },
      { slug: 'gremlins-gizmo-tshirt', sortOrder: 3 },
      { slug: 'hallmark-gremlins-gizmo-ornament', sortOrder: 4 },
      { slug: 'violent-night-4k-bluray', sortOrder: 5 },
    ],
    franchises: [
      { slug: 'gremlins', sortOrder: 0 },
      { slug: 'krampus', sortOrder: 1 },
      { slug: 'better-watch-out-universe', sortOrder: 2 },
    ],
    tags: [
      'beginner-friendly',
      'dark-comedy',
      'creature-feature',
    ],
  },
  '25-days-of-christmas-horror': {
    movies: [
      { slug: 'gremlins', sortOrder: 0, curatorNote: 'Day 1: Start light with this accessible classic.' },
      { slug: 'anna-and-the-apocalypse', sortOrder: 1, curatorNote: 'Day 2: Musical zombie fun.' },
      { slug: 'violent-night', sortOrder: 2, curatorNote: 'Day 3: Action-packed Santa adventure.' },
      { slug: 'krampus-2015', sortOrder: 3, curatorNote: 'Day 4: Introduce the Christmas demon.' },
      { slug: 'rare-exports', sortOrder: 4, curatorNote: 'Day 5: Finnish folklore horror.' },
      { slug: 'christmas-horror-story', sortOrder: 5, curatorNote: 'Day 6: Anthology variety.' },
      { slug: 'better-watch-out', sortOrder: 6, curatorNote: 'Day 7: Twist-filled thriller.' },
      { slug: 'gremlins-2-the-new-batch', sortOrder: 7, curatorNote: 'Day 8: Campy sequel fun.' },
      { slug: 'black-christmas-1974', sortOrder: 8, curatorNote: 'Day 9: Essential proto-slasher.' },
      { slug: 'christmas-evil', sortOrder: 9, curatorNote: 'Day 10: Psychological killer Santa.' },
      { slug: 'silent-night-deadly-night', sortOrder: 10, curatorNote: 'Day 11: Iconic controversial slasher.' },
      { slug: 'the-children', sortOrder: 11, curatorNote: 'Day 12: Disturbing British horror.' },
      { slug: 'dead-end', sortOrder: 12, curatorNote: 'Day 13: Psychological road trip terror.' },
      { slug: 'p2', sortOrder: 13, curatorNote: 'Day 14: Parking garage thriller.' },
      { slug: 'wind-chill', sortOrder: 14, curatorNote: 'Day 15: Supernatural winter ghost story.' },
      { slug: 'the-lodge', sortOrder: 15, curatorNote: 'Day 16: Atmospheric psychological horror.' },
      { slug: 'await-further-instructions', sortOrder: 16, curatorNote: 'Day 17: Claustrophobic family nightmare.' },
      { slug: 'saint', sortOrder: 17, curatorNote: 'Day 18: Violent Dutch Sinterklaas.' },
      { slug: 'red-christmas', sortOrder: 18, curatorNote: 'Day 19: Controversial family horror.' },
      { slug: 'inside', sortOrder: 19, curatorNote: 'Day 20: Extreme French horror.' },
      { slug: 'good-tidings', sortOrder: 20, curatorNote: 'Day 21: Relentlessly dark British horror.' },
      { slug: 'christmas-cruelty', sortOrder: 21, curatorNote: 'Day 22: Norwegian extreme horror.' },
      { slug: 'christmas-bloody-christmas', sortOrder: 22, curatorNote: 'Day 23: Robot Santa carnage.' },
      { slug: 'silent-night', sortOrder: 23, curatorNote: 'Day 24: Brutal remake with extreme kills.' },
      { slug: 'treevenge', sortOrder: 24, curatorNote: 'Day 25: End with absurd violent short film.' },
    ],
    characters: [],
    products: [],
    franchises: [
      { slug: 'gremlins', sortOrder: 0 },
      { slug: 'krampus', sortOrder: 1 },
      { slug: 'black-christmas', sortOrder: 2 },
      { slug: 'silent-night-deadly-night', sortOrder: 3 },
    ],
    tags: [
      'slasher',
      'creature-feature',
      'psychological',
      'extreme',
      'international',
    ],
  },
  'best-gifts-for-krampus-fans': {
    movies: [
      { slug: 'krampus-2015', sortOrder: 0 },
      { slug: 'gremlins', sortOrder: 1 },
      { slug: 'rare-exports', sortOrder: 2 },
    ],
    characters: [
      { slug: 'krampus', sortOrder: 0 },
      { slug: 'gizmo', sortOrder: 1 },
      { slug: 'stripe', sortOrder: 2 },
    ],
    products: [
      { slug: 'neca-krampus-ultimate-7-inch', sortOrder: 0, curatorNote: 'Top-tier Krampus figure - perfect centerpiece gift.' },
      { slug: 'hallmark-krampus-ornament', sortOrder: 1, curatorNote: 'Classic ornament for their holiday tree.' },
      { slug: 'fright-rags-krampus-christmas-sweater', sortOrder: 2, curatorNote: 'Wearable Christmas horror for parties.' },
      { slug: 'krampus-collectors-edition-bluray', sortOrder: 3, curatorNote: 'Essential viewing with bonus features.' },
      { slug: 'funko-pop-gremlins-gizmo', sortOrder: 4, curatorNote: 'Affordable collectible to complement Krampus items.' },
      { slug: 'gremlins-4k-uhd-steelbook', sortOrder: 5, curatorNote: 'Premium presentation of a gateway horror classic.' },
      { slug: 'krampus-folklore-art-print', sortOrder: 6, curatorNote: 'Traditional folklore artwork for display.' },
      { slug: 'mezco-designer-series-krampus', sortOrder: 7, curatorNote: 'High-end designer figure for serious collectors.' },
      { slug: 'fright-rags-krampus-snow-globe-ornament', sortOrder: 8 },
      { slug: 'gruss-vom-krampus-shirt', sortOrder: 9 },
    ],
    franchises: [
      { slug: 'krampus', sortOrder: 0 },
      { slug: 'gremlins', sortOrder: 1 },
    ],
    tags: [
      'folklore',
      'beginner-friendly',
    ],
  },
  'christmas-horror-comedies': {
    movies: [
      { slug: 'gremlins', sortOrder: 0, curatorNote: 'The template - perfect horror-comedy balance.' },
      { slug: 'gremlins-2-the-new-batch', sortOrder: 1, curatorNote: 'Embraces camp and satire beautifully.' },
      { slug: 'krampus-2015', sortOrder: 2, curatorNote: 'Dark comedy with genuine scares and heart.' },
      { slug: 'anna-and-the-apocalypse', sortOrder: 3, curatorNote: 'Zombie Christmas musical - gloriously unique.' },
      { slug: 'rare-exports', sortOrder: 4, curatorNote: 'Darkly funny Finnish twist on Santa.' },
      { slug: 'christmas-horror-story', sortOrder: 5 },
      { slug: 'jack-frost-1997', sortOrder: 6, curatorNote: 'Absurd killer snowman embracing its premise.' },
      { slug: 'santas-slay', sortOrder: 7 },
    ],
    characters: [
      { slug: 'gizmo', sortOrder: 0 },
      { slug: 'stripe', sortOrder: 1 },
      { slug: 'krampus', sortOrder: 2 },
      { slug: 'jack-frost-character', sortOrder: 3 },
    ],
    products: [
      { slug: 'gremlins-4k-uhd-steelbook', sortOrder: 0 },
      { slug: 'neca-gremlins-ultimate-gizmo', sortOrder: 1 },
      { slug: 'krampus-collectors-edition-bluray', sortOrder: 2 },
      { slug: 'mondo-gremlins-poster-variant', sortOrder: 3 },
      { slug: 'jack-frost-bluray-double', sortOrder: 4 },
    ],
    franchises: [
      { slug: 'gremlins', sortOrder: 0 },
      { slug: 'krampus', sortOrder: 1 },
      { slug: 'jack-frost', sortOrder: 2 },
    ],
    tags: [
      'dark-comedy',
      'creature-feature',
      'campy',
      'beginner-friendly',
    ],
  },
  'black-christmas-collection': {
    movies: [
      { slug: 'black-christmas-1974', sortOrder: 0, curatorNote: 'Essential - the film that started it all.' },
      { slug: 'black-christmas-2006', sortOrder: 1, curatorNote: 'Gore-heavy remake for modern slasher fans.' },
      { slug: 'black-christmas-2019', sortOrder: 2, curatorNote: 'Feminist reimagining with social commentary.' },
      { slug: 'silent-night-deadly-night', sortOrder: 3, curatorNote: 'Influenced by Black Christmas - killer Santa evolution.' },
    ],
    characters: [
      { slug: 'billy-lenz', sortOrder: 0 },
      { slug: 'fiona-black-christmas', sortOrder: 1 },
      { slug: 'billy-chapman', sortOrder: 2 },
    ],
    products: [
      { slug: 'black-christmas-scream-factory', sortOrder: 0, curatorNote: 'Definitive edition with restoration and bonus features.' },
      { slug: 'black-christmas-1974-original-poster', sortOrder: 1 },
      { slug: 'mondo-black-christmas-poster', sortOrder: 2 },
      { slug: 'horror-block-black-christmas-phone-ornament', sortOrder: 3 },
      { slug: 'black-christmas-sorority-hoodie', sortOrder: 4 },
      { slug: 'funko-pop-billy-lenz', sortOrder: 5 },
    ],
    franchises: [
      { slug: 'black-christmas', sortOrder: 0 },
      { slug: 'silent-night-deadly-night', sortOrder: 1 },
    ],
    tags: [
      'slasher',
      'atmospheric',
      'cult-classic',
      '1970s',
      'psychological',
    ],
  },
  'christmas-horror-deep-cuts': {
    movies: [
      { slug: 'dial-code-santa-claus', sortOrder: 0, curatorNote: 'French thriller predating Home Alone with real horror.' },
      { slug: 'elves', sortOrder: 1, curatorNote: 'Bizarrely entertaining Nazi elf conspiracy.' },
      { slug: 'blood-beat', sortOrder: 2, curatorNote: 'Surreal samurai ghost Christmas - genuinely weird.' },
      { slug: 'sheitan', sortOrder: 3, curatorNote: 'Disturbing French horror with Vincent Cassel.' },
      { slug: 'a-cadaver-christmas', sortOrder: 4, curatorNote: 'Micro-budget zombie gem with heart.' },
      { slug: 'dont-open-till-christmas', sortOrder: 5 },
      { slug: 'christmas-with-the-dead', sortOrder: 6 },
      { slug: 'stirring', sortOrder: 7 },
      { slug: 'lake-artifact', sortOrder: 8 },
      { slug: 'the-gingerdead-man', sortOrder: 9 },
    ],
    characters: [],
    products: [],
    franchises: [],
    tags: [
      'cult-classic',
      'international',
      'campy',
      'atmospheric',
    ],
  },
  'holiday-horror-marathon': {
    movies: [
      { slug: 'gremlins', sortOrder: 0, curatorNote: 'Start afternoon with accessible fun.' },
      { slug: 'krampus-2015', sortOrder: 1, curatorNote: 'Build with mainstream horror-comedy.' },
      { slug: 'better-watch-out', sortOrder: 2, curatorNote: 'Afternoon thriller with twists.' },
      { slug: 'rare-exports', sortOrder: 3, curatorNote: 'Atmospheric Finnish entry as evening begins.' },
      { slug: 'violent-night', sortOrder: 4, curatorNote: 'Action-packed palette cleanser.' },
      { slug: 'black-christmas-1974', sortOrder: 5, curatorNote: 'Classic proto-slasher as darkness falls.' },
      { slug: 'christmas-evil', sortOrder: 6, curatorNote: 'Psychological horror for late evening.' },
      { slug: 'silent-night-deadly-night', sortOrder: 7, curatorNote: 'Iconic slasher for night hours.' },
      { slug: 'the-lodge', sortOrder: 8, curatorNote: 'Atmospheric slow-burn for late night.' },
      { slug: 'inside', sortOrder: 9, curatorNote: 'Intense extremity to close out.' },
    ],
    characters: [],
    products: [],
    franchises: [
      { slug: 'gremlins', sortOrder: 0 },
      { slug: 'krampus', sortOrder: 1 },
      { slug: 'black-christmas', sortOrder: 2 },
      { slug: 'silent-night-deadly-night', sortOrder: 3 },
    ],
    tags: [
      'slasher',
      'creature-feature',
      'psychological',
      'atmospheric',
    ],
  },
};

/**
 * Seed all relationships
 */
async function seedRelationships() {
  console.log('🔗 Starting relationship seed...\n');

  // Get all entity IDs
  const movies = await prisma.movie.findMany();
  const movieMap = new Map(movies.map(m => [m.slug, m.id]));

  const characters = await prisma.character.findMany();
  const characterMap = new Map(characters.map(c => [c.slug, c.id]));

  const products = await prisma.product.findMany();
  const productMap = new Map(products.map(p => [p.slug, p.id]));

  const collections = await prisma.collection.findMany();
  const collectionMap = new Map(collections.map(c => [c.slug, c.id]));

  const franchises = await prisma.franchise.findMany();
  const franchiseMap = new Map(franchises.map(f => [f.slug, f.id]));

  const tags = await prisma.tag.findMany();
  const tagMap = new Map(tags.map(t => [t.slug, t.id]));

  // 1. Seed Movie-Character relationships
  console.log('Creating Movie-Character relationships...');
  let movieCharCount = 0;
  
  // Delete existing relationships first
  await prisma.movieCharacter.deleteMany({});
  
  for (const rel of movieCharacterRelationships) {
    const movieId = movieMap.get(rel.movieSlug);
    const characterId = characterMap.get(rel.characterSlug);

    if (!movieId || !characterId) {
      console.warn(`⚠ Skipping: movie=${rel.movieSlug}, character=${rel.characterSlug}`);
      continue;
    }

    await prisma.movieCharacter.create({
      data: {
        movieId,
        characterId,
        role: rel.role,
        sortOrder: rel.sortOrder,
      },
    });
    movieCharCount++;
  }
  console.log(`✓ Created ${movieCharCount} movie-character relationships\n`);

  // 2. Seed Product-Character relationships
  console.log('Creating Product-Character relationships...');
  let prodCharCount = 0;
  
  // Delete existing relationships first
  await prisma.productCharacter.deleteMany({});
  
  for (const rel of productCharacterRelationships) {
    const productId = productMap.get(rel.productSlug);
    const characterId = characterMap.get(rel.characterSlug);

    if (!productId || !characterId) {
      console.warn(`⚠ Skipping: product=${rel.productSlug}, character=${rel.characterSlug}`);
      continue;
    }

    await prisma.productCharacter.create({
      data: {
        productId,
        characterId,
        sortOrder: rel.sortOrder,
      },
    });
    prodCharCount++;
  }
  console.log(`✓ Created ${prodCharCount} product-character relationships\n`);

  // 3. Seed Collection relationships
  console.log('Creating Collection relationships...');
  let collMovieCount = 0;
  let collCharCount = 0;
  let collProdCount = 0;
  let collFranchCount = 0;
  let collTagCount = 0;

  // Delete existing collection relationships
  await prisma.collectionMovie.deleteMany({});
  await prisma.collectionCharacter.deleteMany({});
  await prisma.collectionProduct.deleteMany({});
  await prisma.collectionFranchise.deleteMany({});
  await prisma.collectionTag.deleteMany({});

  for (const [collectionSlug, content] of Object.entries(collectionContentRelationships)) {
    const collectionId = collectionMap.get(collectionSlug);
    if (!collectionId) {
      console.warn(`⚠ Collection not found: ${collectionSlug}`);
      continue;
    }

    // Collection Movies
    for (const movie of content.movies) {
      const movieId = movieMap.get(movie.slug);
      if (!movieId) {
        console.warn(`⚠ Movie not found: ${movie.slug}`);
        continue;
      }

      await prisma.collectionMovie.create({
        data: {
          collectionId,
          movieId,
          sortOrder: movie.sortOrder,
          curatorNote: movie.curatorNote,
        },
      });
      collMovieCount++;
    }

    // Collection Characters
    for (const character of content.characters) {
      const characterId = characterMap.get(character.slug);
      if (!characterId) {
        console.warn(`⚠ Character not found: ${character.slug}`);
        continue;
      }

      await prisma.collectionCharacter.create({
        data: {
          collectionId,
          characterId,
          sortOrder: character.sortOrder,
          curatorNote: character.curatorNote,
        },
      });
      collCharCount++;
    }

    // Collection Products
    for (const product of content.products) {
      const productId = productMap.get(product.slug);
      if (!productId) {
        console.warn(`⚠ Product not found: ${product.slug}`);
        continue;
      }

      await prisma.collectionProduct.create({
        data: {
          collectionId,
          productId,
          sortOrder: product.sortOrder,
          curatorNote: product.curatorNote,
        },
      });
      collProdCount++;
    }

    // Collection Franchises
    for (let i = 0; i < content.franchises.length; i++) {
      const franchise = content.franchises[i];
      const franchiseId = franchiseMap.get(franchise.slug);
      if (!franchiseId) {
        console.warn(`⚠ Franchise not found: ${franchise.slug}`);
        continue;
      }

      await prisma.collectionFranchise.create({
        data: {
          collectionId,
          franchiseId,
          sortOrder: franchise.sortOrder,
        },
      });
      collFranchCount++;
    }

    // Collection Tags
    for (const tagSlug of content.tags) {
      const tagId = tagMap.get(tagSlug);
      if (!tagId) {
        console.warn(`⚠ Tag not found: ${tagSlug}`);
        continue;
      }

      await prisma.collectionTag.create({
        data: {
          collectionId,
          tagId,
        },
      });
      collTagCount++;
    }

    console.log(`✓ Populated collection: ${collectionSlug}`);
  }

  console.log(`\n✅ Collection relationships complete!`);
  console.log(`   Collection-Movie: ${collMovieCount}`);
  console.log(`   Collection-Character: ${collCharCount}`);
  console.log(`   Collection-Product: ${collProdCount}`);
  console.log(`   Collection-Franchise: ${collFranchCount}`);
  console.log(`   Collection-Tag: ${collTagCount}\n`);

  console.log('📊 Total Relationships Created:');
  console.log(`   Movie-Character: ${movieCharCount}`);
  console.log(`   Product-Character: ${prodCharCount}`);
  console.log(`   Collection relationships: ${collMovieCount + collCharCount + collProdCount + collFranchCount + collTagCount}\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedRelationships();
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

export { seedRelationships, main };
