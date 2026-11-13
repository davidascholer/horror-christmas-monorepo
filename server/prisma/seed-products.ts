/**
 * Products Seed Data
 * 
 * This file contains 55 Christmas horror products across required categories.
 * Required categories from Requirement 6.5: figures, ornaments, posters, Blu-rays, apparel.
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProductSeedData {
  slug: string;
  name: string;
  description: string;
  category: string;
  image: string;
  imageAlt: string;
  price?: string; // Will be converted to Decimal
  currency?: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  franchiseSlug?: string;
  tagSlugs: string[];
  affiliateLinks: Array<{
    provider: string;
    url: string;
  }>;
}

/**
 * 55 Christmas horror products across all required categories
 */
export const products: ProductSeedData[] = [
  // FIGURES (15 products)
  {
    slug: 'neca-krampus-ultimate-7-inch',
    name: 'NECA Krampus Ultimate 7-Inch Action Figure',
    description: 'Highly detailed 7-inch scale action figure of Krampus from the 2015 film. Features over 25 points of articulation, detailed sculpting of fur and horns, interchangeable hands, chains, and a sack accessory. Perfect for display or collecting.',
    category: 'figures',
    image: '/images/products/neca-krampus-figure.jpg',
    imageAlt: 'NECA Krampus action figure with chains and accessories',
    price: '34.99',
    currency: 'USD',
    seoTitle: 'NECA Krampus Ultimate Action Figure - 7 Inch',
    seoDescription: 'Official Krampus movie action figure from NECA with accessories and articulation. Premium collectible figure.',
    featured: true,
    franchiseSlug: 'krampus',
    tagSlugs: ['practical-effects', 'nostalgic'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/krampus-neca-figure' },
      { provider: 'Entertainment Earth', url: 'https://entertainmentearth.com/krampus-figure' },
    ],
  },
  {
    slug: 'funko-pop-gremlins-gizmo',
    name: 'Funko POP! Gremlins - Gizmo',
    description: 'Adorable Funko POP vinyl figure of everyone\'s favorite Mogwai. Features Gizmo\'s signature big eyes and ears. Stands approximately 3.75 inches tall. Essential for any Gremlins collection.',
    category: 'figures',
    image: '/images/products/funko-gizmo.jpg',
    imageAlt: 'Funko POP Gizmo figure in box',
    price: '12.99',
    currency: 'USD',
    seoTitle: 'Funko POP Gizmo - Gremlins Collectible Figure',
    seoDescription: 'Official Gizmo Funko POP figure from Gremlins. Adorable collectible vinyl figure.',
    featured: true,
    franchiseSlug: 'gremlins',
    tagSlugs: ['beginner-friendly', 'nostalgic'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/funko-gizmo' },
      { provider: 'Target', url: 'https://target.com/funko-gizmo' },
    ],
  },
  {
    slug: 'funko-pop-gremlins-stripe',
    name: 'Funko POP! Gremlins - Stripe',
    description: 'Funko POP vinyl figure of Stripe, the malevolent Gremlin leader. Captures his distinctive mohawk stripe and menacing expression. Approximately 3.75 inches tall. Perfect companion to Gizmo.',
    category: 'figures',
    image: '/images/products/funko-stripe.jpg',
    imageAlt: 'Funko POP Stripe figure showing mohawk detail',
    price: '12.99',
    currency: 'USD',
    seoTitle: 'Funko POP Stripe - Gremlins Villain Figure',
    seoDescription: 'Stripe Funko POP from Gremlins. Collectible figure of the Gremlin leader with mohawk.',
    featured: false,
    franchiseSlug: 'gremlins',
    tagSlugs: ['creature-feature', 'nostalgic'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/funko-stripe' },
    ],
  },
  {
    slug: 'trick-or-treat-studios-billy-chapman-mask',
    name: 'Trick or Treat Studios Billy Chapman Killer Santa Mask',
    description: 'Screen-accurate mask from Silent Night, Deadly Night. Full over-the-head latex mask featuring Billy\'s crazed expression. Officially licensed with detailed sculpting. Perfect for cosplay or display.',
    category: 'figures',
    image: '/images/products/billy-mask.jpg',
    imageAlt: 'Billy Chapman killer Santa mask',
    price: '64.99',
    currency: 'USD',
    seoTitle: 'Billy Chapman Killer Santa Mask - Silent Night Deadly Night',
    seoDescription: 'Official Billy Chapman mask from Silent Night Deadly Night. Screen-accurate latex collectible.',
    featured: false,
    franchiseSlug: 'silent-night-deadly-night',
    tagSlugs: ['killer-santa', 'practical-effects'],
    affiliateLinks: [
      { provider: 'Spirit Halloween', url: 'https://spirithalloween.com/billy-mask' },
    ],
  },
  {
    slug: 'living-dead-dolls-krampus',
    name: 'Living Dead Dolls Krampus',
    description: 'Mezco\'s Living Dead Dolls interpretation of Krampus. 10-inch tall doll with horns, chains, and traditional Alpine clothing. Features the signature LDD styling with button eyes. Comes in a coffin-shaped window box.',
    category: 'figures',
    image: '/images/products/ldd-krampus.jpg',
    imageAlt: 'Living Dead Dolls Krampus figure in coffin box',
    price: '42.99',
    currency: 'USD',
    seoTitle: 'Living Dead Dolls Krampus Figure',
    seoDescription: 'Krampus Living Dead Doll from Mezco. Gothic interpretation of the Christmas demon.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'creature-feature'],
    affiliateLinks: [
      { provider: 'Entertainment Earth', url: 'https://entertainmentearth.com/ldd-krampus' },
    ],
  },
  {
    slug: 'neca-gremlins-ultimate-gizmo',
    name: 'NECA Gremlins Ultimate Gizmo 7-Inch Figure',
    description: 'Ultimate edition Gizmo with fabric clothing, multiple accessories including sunglasses and headphones, and various interchangeable hands. Highly detailed sculpt captures Gizmo\'s expressive face perfectly.',
    category: 'figures',
    image: '/images/products/neca-gizmo.jpg',
    imageAlt: 'NECA Ultimate Gizmo figure with accessories',
    price: '32.99',
    currency: 'USD',
    seoTitle: 'NECA Ultimate Gizmo 7-Inch Figure - Gremlins',
    seoDescription: 'Premium NECA Gizmo figure with fabric clothing and multiple accessories from Gremlins.',
    featured: true,
    franchiseSlug: 'gremlins',
    tagSlugs: ['creature-feature', 'practical-effects'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/neca-gizmo-ultimate' },
    ],
  },
  {
    slug: 'neca-gremlins-ultimate-stripe',
    name: 'NECA Gremlins Ultimate Stripe 7-Inch Figure',
    description: 'Ultimate edition Stripe with detailed sculpting and paint applications. Includes chainsaw, sunglasses, popcorn bag, and interchangeable hands. Captures Stripe\'s menacing personality perfectly.',
    category: 'figures',
    image: '/images/products/neca-stripe.jpg',
    imageAlt: 'NECA Ultimate Stripe figure with chainsaw',
    price: '32.99',
    currency: 'USD',
    seoTitle: 'NECA Ultimate Stripe Figure - Gremlins Villain',
    seoDescription: 'Premium Stripe action figure from NECA with chainsaw and accessories. Gremlins collectible.',
    featured: false,
    franchiseSlug: 'gremlins',
    tagSlugs: ['creature-feature', 'practical-effects'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/neca-stripe-ultimate' },
    ],
  },
  {
    slug: 'diamond-select-nightmare-before-christmas-jack',
    name: 'Diamond Select NBC Jack Skellington Figure',
    description: 'While not exclusively Christmas horror, Jack Skellington\'s Halloween-Christmas fusion makes this a must-have. Detailed 7-inch figure with accessories. Perfect for crossover holiday horror collections.',
    category: 'figures',
    image: '/images/products/jack-skellington-figure.jpg',
    imageAlt: 'Jack Skellington action figure',
    price: '29.99',
    currency: 'USD',
    seoTitle: 'Jack Skellington Action Figure - Nightmare Before Christmas',
    seoDescription: 'Jack Skellington figure for Christmas horror collections. Halloween-Christmas crossover icon.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['dark-comedy', 'beginner-friendly', 'nostalgic'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/jack-skellington-figure' },
    ],
  },
  {
    slug: 'mezco-designer-series-krampus',
    name: 'Mezco Designer Series Krampus Deluxe Figure',
    description: 'Premium 6-inch designer series Krampus with real fabric clothing, multiple accessories including chains and switch bundle, and swappable horns. Highly detailed sculpt with weathering effects.',
    category: 'figures',
    image: '/images/products/mezco-krampus.jpg',
    imageAlt: 'Mezco Designer Series Krampus with fabric clothing',
    price: '89.99',
    currency: 'USD',
    seoTitle: 'Mezco Designer Krampus Deluxe Figure',
    seoDescription: 'Premium Krampus designer figure with fabric clothing and accessories. High-end collectible.',
    featured: false,
    franchiseSlug: 'krampus',
    tagSlugs: ['folklore', 'practical-effects'],
    affiliateLinks: [
      { provider: 'Mezco Direct', url: 'https://mezcotoyz.com/krampus-designer' },
    ],
  },
  {
    slug: 'nendoroid-gizmo',
    name: 'Good Smile Company Nendoroid Gizmo',
    description: 'Adorable chibi-style Nendoroid of Gizmo. Features interchangeable faces, accessories, and poseable stand. Approximately 4 inches tall. Perfect for desk display.',
    category: 'figures',
    image: '/images/products/nendoroid-gizmo.jpg',
    imageAlt: 'Nendoroid Gizmo chibi figure',
    price: '54.99',
    currency: 'USD',
    seoTitle: 'Nendoroid Gizmo - Gremlins Chibi Figure',
    seoDescription: 'Gizmo Nendoroid from Good Smile Company. Adorable poseable chibi collectible.',
    featured: false,
    franchiseSlug: 'gremlins',
    tagSlugs: ['beginner-friendly'],
    affiliateLinks: [
      { provider: 'Good Smile', url: 'https://goodsmileus.com/nendoroid-gizmo' },
    ],
  },
  {
    slug: 'funko-pop-billy-lenz',
    name: 'Funko POP! Black Christmas Billy with Phone',
    description: 'Exclusive Funko POP of Billy from Black Christmas. Features him holding the iconic phone. Captures the mysterious killer\'s essence in POP form.',
    category: 'figures',
    image: '/images/products/funko-billy-lenz.jpg',
    imageAlt: 'Funko POP Billy from Black Christmas',
    price: '14.99',
    currency: 'USD',
    seoTitle: 'Funko POP Billy - Black Christmas Exclusive',
    seoDescription: 'Billy from Black Christmas Funko POP with phone. Exclusive horror collectible.',
    featured: false,
    franchiseSlug: 'black-christmas',
    tagSlugs: ['slasher', 'cult-classic'],
    affiliateLinks: [
      { provider: 'Hot Topic', url: 'https://hottopic.com/funko-billy-lenz' },
    ],
  },
  {
    slug: 'super7-reaction-gremlins-gizmo',
    name: 'Super7 ReAction Gremlins Gizmo Figure',
    description: 'Retro-style 3.75-inch action figure in the style of 1980s Kenner toys. Simple articulation and vintage-inspired card back. Nostalgic collectible for Gremlins fans.',
    category: 'figures',
    image: '/images/products/super7-gizmo.jpg',
    imageAlt: 'Super7 ReAction Gizmo retro figure',
    price: '18.99',
    currency: 'USD',
    seoTitle: 'Super7 ReAction Gizmo - Retro Gremlins Figure',
    seoDescription: 'Retro-style Gizmo action figure from Super7. Vintage 1980s inspired collectible.',
    featured: false,
    franchiseSlug: 'gremlins',
    tagSlugs: ['nostalgic', '1980s'],
    affiliateLinks: [
      { provider: 'Super7', url: 'https://super7.com/reaction-gizmo' },
    ],
  },
  {
    slug: 'mcfarlane-black-christmas-diorama',
    name: 'McFarlane Black Christmas Sorority House Diorama',
    description: 'Detailed diorama recreation of the Black Christmas sorority house scene. Includes figure and highly detailed environment. Limited edition collectible for serious horror fans.',
    category: 'figures',
    image: '/images/products/mcfarlane-black-christmas.jpg',
    imageAlt: 'Black Christmas diorama with sorority house',
    price: '44.99',
    currency: 'USD',
    seoTitle: 'McFarlane Black Christmas Diorama Set',
    seoDescription: 'Black Christmas sorority house diorama from McFarlane. Detailed horror collectible scene.',
    featured: false,
    franchiseSlug: 'black-christmas',
    tagSlugs: ['atmospheric', 'cult-classic'],
    affiliateLinks: [
      { provider: 'McFarlane Store', url: 'https://mcfarlanestore.com/black-christmas' },
    ],
  },
  {
    slug: 'kidrobot-phunny-gizmo-plush',
    name: 'Kidrobot Phunny Gremlins Gizmo Plush',
    description: 'Soft plush Gizmo in Kidrobot\'s Phunny style. Made from premium materials, features embroidered details. Perfect for hugging or display. Approximately 7 inches tall.',
    category: 'figures',
    image: '/images/products/kidrobot-gizmo-plush.jpg',
    imageAlt: 'Kidrobot Gizmo plush toy',
    price: '16.99',
    currency: 'USD',
    seoTitle: 'Kidrobot Gizmo Plush - Gremlins Soft Toy',
    seoDescription: 'Soft Gizmo plush from Kidrobot. Cuddly Gremlins collectible.',
    featured: false,
    franchiseSlug: 'gremlins',
    tagSlugs: ['beginner-friendly'],
    affiliateLinks: [
      { provider: 'Kidrobot', url: 'https://kidrobot.com/phunny-gizmo' },
    ],
  },
  {
    slug: 'trick-or-treat-krampus-gloves',
    name: 'Trick or Treat Studios Krampus Hands Gloves',
    description: 'Latex Krampus hands with fur and claws. Perfect for cosplay or completing a Krampus costume. Highly detailed with individual claw sculpting.',
    category: 'figures',
    image: '/images/products/krampus-gloves.jpg',
    imageAlt: 'Krampus costume hands with claws',
    price: '39.99',
    currency: 'USD',
    seoTitle: 'Krampus Hands Costume Gloves',
    seoDescription: 'Krampus costume hands with claws from Trick or Treat Studios. Latex cosplay accessory.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'practical-effects'],
    affiliateLinks: [
      { provider: 'Spirit Halloween', url: 'https://spirithalloween.com/krampus-hands' },
    ],
  },

  // ORNAMENTS (12 products)
  {
    slug: 'hallmark-gremlins-gizmo-ornament',
    name: 'Hallmark Keepsake Gremlins Gizmo Ornament',
    description: 'Official Hallmark Keepsake ornament featuring Gizmo. Detailed sculpting with hand-painted accents. Comes in collectible Hallmark box. Perfect for horror-themed Christmas trees.',
    category: 'ornaments',
    image: '/images/products/hallmark-gizmo-ornament.jpg',
    imageAlt: 'Hallmark Gizmo Christmas ornament',
    price: '19.99',
    currency: 'USD',
    seoTitle: 'Hallmark Gizmo Ornament - Gremlins Christmas',
    seoDescription: 'Official Gizmo Hallmark Keepsake ornament from Gremlins. Christmas horror tree decoration.',
    featured: true,
    franchiseSlug: 'gremlins',
    tagSlugs: ['beginner-friendly', 'nostalgic'],
    affiliateLinks: [
      { provider: 'Hallmark', url: 'https://hallmark.com/gizmo-ornament' },
      { provider: 'Amazon', url: 'https://amazon.com/hallmark-gizmo' },
    ],
  },
  {
    slug: 'hallmark-krampus-ornament',
    name: 'Hallmark Keepsake Krampus Ornament',
    description: 'Detailed Krampus ornament from Hallmark\'s Keepsake collection. Features horns, chains, and menacing expression. Hand-painted with quality craftsmanship.',
    category: 'ornaments',
    image: '/images/products/hallmark-krampus-ornament.jpg',
    imageAlt: 'Hallmark Krampus Christmas ornament with chains',
    price: '24.99',
    currency: 'USD',
    seoTitle: 'Hallmark Krampus Ornament - Christmas Demon',
    seoDescription: 'Krampus Hallmark Keepsake ornament with detailed sculpting. Christmas horror decoration.',
    featured: true,
    franchiseSlug: 'krampus',
    tagSlugs: ['folklore'],
    affiliateLinks: [
      { provider: 'Hallmark', url: 'https://hallmark.com/krampus-ornament' },
    ],
  },
  {
    slug: 'fright-rags-killer-santa-ornament-set',
    name: 'Fright Rags Killer Santa Ornament 3-Pack',
    description: 'Set of three killer Santa ornaments featuring iconic moments from Silent Night Deadly Night, Christmas Evil, and Santa\'s Slay. High-quality resin construction.',
    category: 'ornaments',
    image: '/images/products/killer-santa-ornaments.jpg',
    imageAlt: 'Set of three killer Santa Christmas ornaments',
    price: '34.99',
    currency: 'USD',
    seoTitle: 'Killer Santa Ornament Set - Horror Christmas',
    seoDescription: 'Three killer Santa ornaments from classic Christmas horror films. Collectible decoration set.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['killer-santa', 'cult-classic'],
    affiliateLinks: [
      { provider: 'Fright Rags', url: 'https://frightrrags.com/killer-santa-ornaments' },
    ],
  },
  {
    slug: 'christopher-radko-nightmare-krampus',
    name: 'Christopher Radko Krampus Glass Ornament',
    description: 'Hand-blown glass ornament from luxury brand Christopher Radko. European-style glass craftsmanship depicts Krampus in traditional Alpine detail. Premium collectible ornament.',
    category: 'ornaments',
    image: '/images/products/radko-krampus.jpg',
    imageAlt: 'Hand-blown glass Krampus ornament',
    price: '68.00',
    currency: 'USD',
    seoTitle: 'Christopher Radko Krampus Glass Ornament',
    seoDescription: 'Premium hand-blown glass Krampus ornament from Christopher Radko. Luxury Christmas horror decoration.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore'],
    affiliateLinks: [
      { provider: 'Radko', url: 'https://christopherradko.com/krampus' },
    ],
  },
  {
    slug: 'kreepsville-666-yule-cat-ornament',
    name: 'Kreepsville 666 Yule Cat Ornament',
    description: 'Gothic-style Yule Cat ornament featuring the Icelandic Christmas monster. Black and silver design with glitter accents. Approximately 4 inches tall.',
    category: 'ornaments',
    image: '/images/products/yule-cat-ornament.jpg',
    imageAlt: 'Yule Cat gothic Christmas ornament',
    price: '14.99',
    currency: 'USD',
    seoTitle: 'Yule Cat Ornament - Icelandic Christmas Monster',
    seoDescription: 'Yule Cat ornament featuring the Icelandic folklore creature. Gothic Christmas decoration.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'international'],
    affiliateLinks: [
      { provider: 'Kreepsville', url: 'https://kreepsville666.com/yule-cat' },
    ],
  },
  {
    slug: 'department-56-gremlins-gizmo-mini',
    name: 'Department 56 Gremlins Gizmo Mini Ornament',
    description: 'Miniature Gizmo ornament from Department 56\'s village collection. Detailed resin construction with ribbon hanger. Collectible miniature perfect for horror fans.',
    category: 'ornaments',
    image: '/images/products/dept56-gizmo.jpg',
    imageAlt: 'Department 56 mini Gizmo ornament',
    price: '16.99',
    currency: 'USD',
    seoTitle: 'Department 56 Gizmo Mini Ornament',
    seoDescription: 'Miniature Gizmo ornament from Department 56. Gremlins collectible decoration.',
    featured: false,
    franchiseSlug: 'gremlins',
    tagSlugs: ['beginner-friendly'],
    affiliateLinks: [
      { provider: 'Department 56', url: 'https://department56.com/gizmo' },
    ],
  },
  {
    slug: 'horror-block-black-christmas-phone-ornament',
    name: 'Black Christmas Vintage Phone Ornament',
    description: 'Replica of the infamous phone from Black Christmas. Resin ornament with hand-painted details. Iconic horror prop as Christmas decoration.',
    category: 'ornaments',
    image: '/images/products/black-christmas-phone.jpg',
    imageAlt: 'Black Christmas vintage phone ornament',
    price: '18.99',
    currency: 'USD',
    seoTitle: 'Black Christmas Phone Ornament - Horror Prop',
    seoDescription: 'Vintage phone ornament from Black Christmas. Iconic horror film prop decoration.',
    featured: false,
    franchiseSlug: 'black-christmas',
    tagSlugs: ['cult-classic', 'nostalgic'],
    affiliateLinks: [
      { provider: 'Horror Merch', url: 'https://horrormerch.com/black-christmas-phone' },
    ],
  },
  {
    slug: 'neca-gremlins-stripe-ornament',
    name: 'NECA Gremlins Stripe Scalers Ornament',
    description: 'Stripe that hangs from your tree branches. Approximately 2 inches, features Stripe clinging with his claws. Unique hanging display piece.',
    category: 'ornaments',
    image: '/images/products/neca-stripe-scaler.jpg',
    imageAlt: 'Stripe hanging from Christmas tree branch',
    price: '9.99',
    currency: 'USD',
    seoTitle: 'NECA Stripe Scalers Ornament - Gremlins',
    seoDescription: 'Stripe scalers ornament that clings to tree branches. Unique Gremlins decoration.',
    featured: false,
    franchiseSlug: 'gremlins',
    tagSlugs: ['creature-feature'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/stripe-scaler' },
    ],
  },
  {
    slug: 'fright-rags-krampus-snow-globe-ornament',
    name: 'Fright Rags Krampus Snow Globe Ornament',
    description: 'Mini snow globe ornament featuring Krampus. When shaken, red glitter snow swirls around the Christmas demon. Glass globe with resin base.',
    category: 'ornaments',
    image: '/images/products/krampus-snow-globe.jpg',
    imageAlt: 'Krampus snow globe ornament with red glitter',
    price: '22.99',
    currency: 'USD',
    seoTitle: 'Krampus Snow Globe Ornament',
    seoDescription: 'Krampus snow globe ornament with red glitter snow. Unique Christmas horror decoration.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore'],
    affiliateLinks: [
      { provider: 'Fright Rags', url: 'https://frightrrags.com/krampus-globe' },
    ],
  },
  {
    slug: 'trick-or-treat-silent-night-deadly-night-axe',
    name: 'Silent Night Deadly Night Axe Ornament',
    description: 'Miniature replica of Billy Chapman\'s axe. Detailed resin construction with metallic paint. Morbidly festive decoration for horror fans.',
    category: 'ornaments',
    image: '/images/products/sndn-axe-ornament.jpg',
    imageAlt: 'Silent Night Deadly Night axe ornament',
    price: '15.99',
    currency: 'USD',
    seoTitle: 'Silent Night Deadly Night Axe Ornament',
    seoDescription: 'Billy Chapman\'s axe as a Christmas ornament. Silent Night Deadly Night collectible.',
    featured: false,
    franchiseSlug: 'silent-night-deadly-night',
    tagSlugs: ['killer-santa'],
    affiliateLinks: [
      { provider: 'Horror Decor', url: 'https://horrordecor.com/sndn-axe' },
    ],
  },
  {
    slug: 'gothic-homeware-perchta-ornament',
    name: 'Gothic Homeware Frau Perchta Ornament',
    description: 'Handcrafted Frau Perchta ornament featuring her dual nature - beautiful on one side, haggish on the other. Gothic European styling with aged finish.',
    category: 'ornaments',
    image: '/images/products/perchta-ornament.jpg',
    imageAlt: 'Frau Perchta double-sided ornament',
    price: '27.99',
    currency: 'USD',
    seoTitle: 'Frau Perchta Ornament - Alpine Christmas Witch',
    seoDescription: 'Frau Perchta double-sided ornament. Alpine folklore Christmas decoration.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'international'],
    affiliateLinks: [
      { provider: 'Etsy Gothic', url: 'https://etsy.com/perchta-ornament' },
    ],
  },
  {
    slug: 'hallmark-nightmare-before-christmas-jack',
    name: 'Hallmark Jack Skellington "What\'s This?" Ornament',
    description: 'Musical Hallmark ornament featuring Jack discovering Christmas Town. Plays "What\'s This?" when activated. Detailed sculpting with battery compartment.',
    category: 'ornaments',
    image: '/images/products/hallmark-jack-whats-this.jpg',
    imageAlt: 'Jack Skellington musical Christmas ornament',
    price: '29.99',
    currency: 'USD',
    seoTitle: 'Hallmark Jack Skellington Musical Ornament',
    seoDescription: 'Jack Skellington musical ornament playing "What\'s This?" Nightmare Before Christmas decoration.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['dark-comedy', 'beginner-friendly', 'nostalgic'],
    affiliateLinks: [
      { provider: 'Hallmark', url: 'https://hallmark.com/jack-whats-this' },
    ],
  },

  // POSTERS (10 products)
  {
    slug: 'mondo-gremlins-poster-variant',
    name: 'Mondo Gremlins Screen Print - Variant Edition',
    description: 'Limited edition screen-printed poster for Gremlins by renowned artist. Hand-numbered and signed. Premium paper stock. Approximately 24x36 inches. Highly collectible art print.',
    category: 'posters',
    image: '/images/products/mondo-gremlins.jpg',
    imageAlt: 'Mondo Gremlins art print with Gizmo and Stripe',
    price: '75.00',
    currency: 'USD',
    seoTitle: 'Mondo Gremlins Screen Print Poster - Limited Edition',
    seoDescription: 'Limited edition Gremlins poster from Mondo. Hand-numbered screen print art.',
    featured: true,
    franchiseSlug: 'gremlins',
    tagSlugs: ['nostalgic', 'cult-classic'],
    affiliateLinks: [
      { provider: 'Mondo', url: 'https://mondoshop.com/gremlins-variant' },
    ],
  },
  {
    slug: 'black-christmas-1974-original-poster',
    name: 'Black Christmas (1974) Original Theatrical Poster Reproduction',
    description: 'High-quality reproduction of the original 1974 Black Christmas theatrical poster. Printed on premium poster stock. 27x40 inches. Classic horror poster art.',
    category: 'posters',
    image: '/images/products/black-christmas-poster.jpg',
    imageAlt: 'Black Christmas 1974 original movie poster',
    price: '29.99',
    currency: 'USD',
    seoTitle: 'Black Christmas 1974 Poster Reproduction',
    seoDescription: 'Original Black Christmas theatrical poster reproduction. Classic 1974 horror art.',
    featured: true,
    franchiseSlug: 'black-christmas',
    tagSlugs: ['cult-classic', 'nostalgic', '1970s'],
    affiliateLinks: [
      { provider: 'AllPosters', url: 'https://allposters.com/black-christmas-1974' },
    ],
  },
  {
    slug: 'fright-rags-krampus-poster',
    name: 'Fright-Rags Krampus (2015) Illustrated Poster',
    description: 'Officially licensed illustrated poster for Krampus. Features stunning artwork of Krampus and his helpers. 18x24 inches on premium paper.',
    category: 'posters',
    image: '/images/products/fright-rags-krampus-poster.jpg',
    imageAlt: 'Illustrated Krampus movie poster',
    price: '24.99',
    currency: 'USD',
    seoTitle: 'Krampus Movie Poster - Illustrated Edition',
    seoDescription: 'Illustrated Krampus poster from Fright-Rags. Official movie artwork.',
    featured: false,
    franchiseSlug: 'krampus',
    tagSlugs: ['folklore', 'dark-comedy'],
    affiliateLinks: [
      { provider: 'Fright Rags', url: 'https://frightrrags.com/krampus-poster' },
    ],
  },
  {
    slug: 'silent-night-deadly-night-video-store-poster',
    name: 'Silent Night, Deadly Night VHS Video Store Poster',
    description: 'Reproduction of the infamous video store promotional poster. Features the controversial Santa with weapon imagery. 24x36 inches. Historic horror marketing.',
    category: 'posters',
    image: '/images/products/sndn-video-poster.jpg',
    imageAlt: 'Silent Night Deadly Night video store poster',
    price: '34.99',
    currency: 'USD',
    seoTitle: 'Silent Night Deadly Night VHS Poster Reproduction',
    seoDescription: 'Controversial Silent Night Deadly Night video store poster. Historic horror marketing reproduction.',
    featured: false,
    franchiseSlug: 'silent-night-deadly-night',
    tagSlugs: ['killer-santa', 'nostalgic', '1980s'],
    affiliateLinks: [
      { provider: 'Horror Posters', url: 'https://horrorposters.com/sndn-vhs' },
    ],
  },
  {
    slug: 'rare-exports-finnish-poster',
    name: 'Rare Exports Finnish Theatrical Poster',
    description: 'Reproduction of the original Finnish theatrical release poster. Atmospheric snowy design featuring the ancient Santa. 27x40 inches.',
    category: 'posters',
    image: '/images/products/rare-exports-poster.jpg',
    imageAlt: 'Rare Exports Finnish movie poster',
    price: '32.99',
    currency: 'USD',
    seoTitle: 'Rare Exports Finnish Poster - Christmas Tale',
    seoDescription: 'Original Finnish theatrical poster for Rare Exports. Atmospheric Christmas horror art.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['international', 'atmospheric'],
    affiliateLinks: [
      { provider: 'International Posters', url: 'https://intlposters.com/rare-exports' },
    ],
  },
  {
    slug: 'better-watch-out-uk-quad',
    name: 'Better Watch Out UK Quad Poster',
    description: 'UK quad poster format (30x40 inches) for Better Watch Out. Features the film\'s iconic twisted holiday imagery. High-quality reproduction.',
    category: 'posters',
    image: '/images/products/better-watch-out-poster.jpg',
    imageAlt: 'Better Watch Out UK quad poster',
    price: '39.99',
    currency: 'USD',
    seoTitle: 'Better Watch Out UK Quad Poster',
    seoDescription: 'Better Watch Out UK quad format poster. Twisted holiday horror art.',
    featured: false,
    franchiseSlug: 'better-watch-out-universe',
    tagSlugs: ['subversive', 'psychological'],
    affiliateLinks: [
      { provider: 'Film on Paper', url: 'https://filmonpaper.com/better-watch-out' },
    ],
  },
  {
    slug: 'christmas-evil-john-waters-quote-poster',
    name: 'Christmas Evil "Greatest Christmas Film" Quote Poster',
    description: 'Art print featuring John Waters\' famous quote about Christmas Evil being the greatest Christmas film ever made. Stylized design with film imagery. 16x20 inches.',
    category: 'posters',
    image: '/images/products/christmas-evil-quote.jpg',
    imageAlt: 'Christmas Evil John Waters quote poster',
    price: '22.99',
    currency: 'USD',
    seoTitle: 'Christmas Evil John Waters Quote Poster',
    seoDescription: 'Christmas Evil poster with John Waters quote. Cult classic horror art print.',
    featured: false,
    franchiseSlug: 'christmas-evil-universe',
    tagSlugs: ['cult-classic', 'psychological'],
    affiliateLinks: [
      { provider: 'Redbubble', url: 'https://redbubble.com/christmas-evil-waters' },
    ],
  },
  {
    slug: 'gremlins-2-poster-set',
    name: 'Gremlins 2: The New Batch Character Poster Set',
    description: 'Set of 4 character posters featuring mutated Gremlins from the sequel. Includes Brain Gremlin, Bat Gremlin, Electric Gremlin, and Vegetable Gremlin. Each 11x17 inches.',
    category: 'posters',
    image: '/images/products/gremlins-2-set.jpg',
    imageAlt: 'Set of four Gremlins 2 character posters',
    price: '44.99',
    currency: 'USD',
    seoTitle: 'Gremlins 2 Character Poster Set',
    seoDescription: 'Four Gremlins 2 character posters featuring mutated Gremlins. Collectible set.',
    featured: false,
    franchiseSlug: 'gremlins',
    tagSlugs: ['creature-feature', 'campy'],
    affiliateLinks: [
      { provider: 'Horror Prints', url: 'https://horrorprints.com/gremlins-2-set' },
    ],
  },
  {
    slug: 'krampus-folklore-art-print',
    name: 'Alpine Krampus Folklore Art Print',
    description: 'Traditional Alpine art print depicting Krampus in historical style. Museum-quality print on archival paper. Based on vintage Krampuskarten. 16x20 inches.',
    category: 'posters',
    image: '/images/products/krampus-folklore-art.jpg',
    imageAlt: 'Traditional Alpine Krampus art print',
    price: '38.00',
    currency: 'USD',
    seoTitle: 'Alpine Krampus Folklore Art Print',
    seoDescription: 'Traditional Krampus folklore art print. Historical Alpine Christmas demon illustration.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'international'],
    affiliateLinks: [
      { provider: 'Etsy Art', url: 'https://etsy.com/krampus-folklore-print' },
    ],
  },
  {
    slug: 'mondo-black-christmas-poster',
    name: 'Mondo Black Christmas Anniversary Poster',
    description: 'Special anniversary edition screen print by Mondo celebrating Black Christmas. Limited to 250 copies. Hand-numbered. 24x36 inches on premium stock.',
    category: 'posters',
    image: '/images/products/mondo-black-christmas.jpg',
    imageAlt: 'Mondo Black Christmas anniversary poster',
    price: '85.00',
    currency: 'USD',
    seoTitle: 'Mondo Black Christmas Anniversary Poster',
    seoDescription: 'Limited edition Black Christmas anniversary poster from Mondo. Premium screen print.',
    featured: false,
    franchiseSlug: 'black-christmas',
    tagSlugs: ['cult-classic', 'atmospheric'],
    affiliateLinks: [
      { provider: 'Mondo', url: 'https://mondoshop.com/black-christmas-anniversary' },
    ],
  },

  // BLU-RAYS (10 products)
  {
    slug: 'gremlins-4k-uhd-steelbook',
    name: 'Gremlins 4K Ultra HD Steelbook Edition',
    description: 'Premium 4K Ultra HD + Blu-ray steelbook edition of Gremlins. Restored picture and sound. Includes hours of bonus features, commentary, and behind-the-scenes footage. Collectible steelbook packaging.',
    category: 'blu-rays',
    image: '/images/products/gremlins-4k-steel.jpg',
    imageAlt: 'Gremlins 4K steelbook case',
    price: '42.99',
    currency: 'USD',
    seoTitle: 'Gremlins 4K Ultra HD Steelbook',
    seoDescription: 'Gremlins 4K steelbook with restoration and bonus features. Premium collectible edition.',
    featured: true,
    franchiseSlug: 'gremlins',
    tagSlugs: ['nostalgic', 'practical-effects'],
    affiliateLinks: [
      { provider: 'Best Buy', url: 'https://bestbuy.com/gremlins-4k-steel' },
    ],
  },
  {
    slug: 'black-christmas-scream-factory',
    name: 'Black Christmas Scream Factory Collector\'s Edition Blu-ray',
    description: 'Definitive Scream Factory release of Black Christmas (1974). New 4K restoration, multiple audio commentaries, new interviews, and rare archival material. Slipcover packaging.',
    category: 'blu-rays',
    image: '/images/products/black-christmas-scream.jpg',
    imageAlt: 'Black Christmas Scream Factory Blu-ray',
    price: '34.99',
    currency: 'USD',
    seoTitle: 'Black Christmas Scream Factory Blu-ray',
    seoDescription: 'Black Christmas Scream Factory collector\'s edition with 4K restoration and bonus features.',
    featured: true,
    franchiseSlug: 'black-christmas',
    tagSlugs: ['cult-classic', 'atmospheric'],
    affiliateLinks: [
      { provider: 'Shout Factory', url: 'https://shoutfactory.com/black-christmas' },
    ],
  },
  {
    slug: 'krampus-collectors-edition-bluray',
    name: 'Krampus Collector\'s Edition Blu-ray',
    description: 'Collector\'s edition of Krampus (2015) with extended cut and theatrical version. Includes making-of documentaries, creature effects features, and animated short. Digital copy included.',
    category: 'blu-rays',
    image: '/images/products/krampus-collectors-bluray.jpg',
    imageAlt: 'Krampus collector\'s edition Blu-ray',
    price: '24.99',
    currency: 'USD',
    seoTitle: 'Krampus Collector\'s Edition Blu-ray',
    seoDescription: 'Krampus Blu-ray with extended cut and making-of features. Collector\'s edition.',
    featured: true,
    franchiseSlug: 'krampus',
    tagSlugs: ['folklore', 'practical-effects'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/krampus-collectors' },
    ],
  },
  {
    slug: 'silent-night-deadly-night-collection',
    name: 'Silent Night, Deadly Night Collection Blu-ray',
    description: 'Complete collection of all five Silent Night, Deadly Night films. Restored and remastered. Hours of bonus content including the controversial 1984 documentary. Collectible box set.',
    category: 'blu-rays',
    image: '/images/products/sndn-collection.jpg',
    imageAlt: 'Silent Night Deadly Night complete collection',
    price: '69.99',
    currency: 'USD',
    seoTitle: 'Silent Night Deadly Night Complete Collection Blu-ray',
    seoDescription: 'All five Silent Night Deadly Night films in one Blu-ray collection. Complete killer Santa saga.',
    featured: false,
    franchiseSlug: 'silent-night-deadly-night',
    tagSlugs: ['killer-santa', 'cult-classic'],
    affiliateLinks: [
      { provider: 'Shout Factory', url: 'https://shoutfactory.com/sndn-collection' },
    ],
  },
  {
    slug: 'rare-exports-bluray',
    name: 'Rare Exports: A Christmas Tale Blu-ray',
    description: 'Blu-ray release of the Finnish horror film Rare Exports. Includes English subtitles, making-of documentary, and the original short films that inspired the feature. Region-free.',
    category: 'blu-rays',
    image: '/images/products/rare-exports-bluray.jpg',
    imageAlt: 'Rare Exports Blu-ray cover',
    price: '19.99',
    currency: 'USD',
    seoTitle: 'Rare Exports Blu-ray - Finnish Christmas Horror',
    seoDescription: 'Rare Exports Blu-ray with original shorts and making-of. Finnish Christmas horror classic.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['international', 'folklore'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/rare-exports-bluray' },
    ],
  },
  {
    slug: 'better-watch-out-bluray',
    name: 'Better Watch Out Blu-ray + DVD Combo',
    description: 'Blu-ray and DVD combo pack of Better Watch Out. Includes deleted scenes, audio commentary, and making-of featurette. Slipcover packaging.',
    category: 'blu-rays',
    image: '/images/products/better-watch-out-bluray.jpg',
    imageAlt: 'Better Watch Out Blu-ray combo pack',
    price: '16.99',
    currency: 'USD',
    seoTitle: 'Better Watch Out Blu-ray + DVD',
    seoDescription: 'Better Watch Out Blu-ray combo with bonus features. Home invasion Christmas horror.',
    featured: false,
    franchiseSlug: 'better-watch-out-universe',
    tagSlugs: ['psychological', 'subversive'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/better-watch-out-bluray' },
    ],
  },
  {
    slug: 'christmas-evil-vinegar-syndrome',
    name: 'Christmas Evil Vinegar Syndrome Blu-ray',
    description: 'Vinegar Syndrome restoration of Christmas Evil (1980). New 4K scan from original film elements. Includes John Waters introduction, interviews, and rare promotional materials.',
    category: 'blu-rays',
    image: '/images/products/christmas-evil-vinegar.jpg',
    imageAlt: 'Christmas Evil Vinegar Syndrome Blu-ray',
    price: '32.99',
    currency: 'USD',
    seoTitle: 'Christmas Evil Vinegar Syndrome Blu-ray',
    seoDescription: 'Christmas Evil restored by Vinegar Syndrome with John Waters introduction. 4K restoration.',
    featured: false,
    franchiseSlug: 'christmas-evil-universe',
    tagSlugs: ['cult-classic', 'psychological'],
    affiliateLinks: [
      { provider: 'Vinegar Syndrome', url: 'https://vinegarsyndrome.com/christmas-evil' },
    ],
  },
  {
    slug: 'anna-and-apocalypse-bluray',
    name: 'Anna and the Apocalypse Blu-ray + Soundtrack',
    description: 'Blu-ray of the zombie Christmas musical with digital download of the complete soundtrack. Includes sing-along mode, behind-the-scenes, and choreography breakdowns.',
    category: 'blu-rays',
    image: '/images/products/anna-apocalypse-bluray.jpg',
    imageAlt: 'Anna and the Apocalypse Blu-ray with soundtrack',
    price: '22.99',
    currency: 'USD',
    seoTitle: 'Anna and the Apocalypse Blu-ray with Soundtrack',
    seoDescription: 'Anna and the Apocalypse Blu-ray with digital soundtrack. Zombie Christmas musical.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['dark-comedy', 'subversive'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/anna-apocalypse-bluray' },
    ],
  },
  {
    slug: 'violent-night-4k-bluray',
    name: 'Violent Night 4K Ultra HD + Blu-ray',
    description: 'Violent Night in 4K Ultra HD with Dolby Atmos audio. Includes Blu-ray copy and digital code. Bonus features include fight choreography breakdown and David Harbour interviews.',
    category: 'blu-rays',
    image: '/images/products/violent-night-4k.jpg',
    imageAlt: 'Violent Night 4K Ultra HD cover',
    price: '29.99',
    currency: 'USD',
    seoTitle: 'Violent Night 4K Ultra HD Blu-ray',
    seoDescription: 'Violent Night 4K with Dolby Atmos. David Harbour action Christmas horror.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['dark-comedy', 'beginner-friendly'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/violent-night-4k' },
    ],
  },
  {
    slug: 'jack-frost-bluray-double',
    name: 'Jack Frost 1 & 2 Blu-ray Double Feature',
    description: 'Both Jack Frost killer snowman films on Blu-ray. Newly remastered. Includes commentary tracks, interviews, and behind-the-scenes footage. Cult classic double feature.',
    category: 'blu-rays',
    image: '/images/products/jack-frost-double.jpg',
    imageAlt: 'Jack Frost 1 and 2 Blu-ray set',
    price: '26.99',
    currency: 'USD',
    seoTitle: 'Jack Frost 1 & 2 Blu-ray Double Feature',
    seoDescription: 'Both Jack Frost killer snowman films on Blu-ray. Cult horror comedy double feature.',
    featured: false,
    franchiseSlug: 'jack-frost',
    tagSlugs: ['campy', 'dark-comedy', 'cult-classic'],
    affiliateLinks: [
      { provider: 'Vinegar Syndrome', url: 'https://vinegarsyndrome.com/jack-frost-double' },
    ],
  },

  // APPAREL (8 products)
  {
    slug: 'fright-rags-krampus-christmas-sweater',
    name: 'Fright-Rags Krampus Ugly Christmas Sweater',
    description: 'Premium knit ugly Christmas sweater featuring Krampus design. Traditional holiday sweater styling with horror twist. Unisex sizes S-3XL. Officially licensed.',
    category: 'apparel',
    image: '/images/products/krampus-sweater.jpg',
    imageAlt: 'Krampus ugly Christmas sweater',
    price: '59.99',
    currency: 'USD',
    seoTitle: 'Krampus Ugly Christmas Sweater',
    seoDescription: 'Official Krampus ugly Christmas sweater. Horror holiday apparel.',
    featured: true,
    franchiseSlug: 'krampus',
    tagSlugs: ['folklore'],
    affiliateLinks: [
      { provider: 'Fright Rags', url: 'https://frightrrags.com/krampus-sweater' },
    ],
  },
  {
    slug: 'gremlins-gizmo-tshirt',
    name: 'Gremlins "Rules" T-Shirt',
    description: 'Classic Gremlins t-shirt featuring the three rules with Gizmo illustration. Soft cotton blend. Unisex fit. Officially licensed Warner Bros merchandise.',
    category: 'apparel',
    image: '/images/products/gremlins-rules-shirt.jpg',
    imageAlt: 'Gremlins three rules t-shirt',
    price: '24.99',
    currency: 'USD',
    seoTitle: 'Gremlins Rules T-Shirt - Official Merchandise',
    seoDescription: 'Gremlins t-shirt with the three Mogwai rules and Gizmo. Official apparel.',
    featured: true,
    franchiseSlug: 'gremlins',
    tagSlugs: ['beginner-friendly', 'nostalgic'],
    affiliateLinks: [
      { provider: 'Amazon', url: 'https://amazon.com/gremlins-rules-shirt' },
      { provider: 'Hot Topic', url: 'https://hottopic.com/gremlins-shirt' },
    ],
  },
  {
    slug: 'cavitycolors-silent-night-tee',
    name: 'Cavity Colors Silent Night Deadly Night T-Shirt',
    description: 'Retro-styled Silent Night Deadly Night t-shirt with VHS-inspired artwork. Soft vintage feel. Independent horror apparel brand. Limited run.',
    category: 'apparel',
    image: '/images/products/sndn-cavity-shirt.jpg',
    imageAlt: 'Silent Night Deadly Night retro t-shirt',
    price: '28.99',
    currency: 'USD',
    seoTitle: 'Silent Night Deadly Night Retro T-Shirt',
    seoDescription: 'Vintage-style Silent Night Deadly Night t-shirt. Killer Santa horror apparel.',
    featured: false,
    franchiseSlug: 'silent-night-deadly-night',
    tagSlugs: ['killer-santa', 'nostalgic'],
    affiliateLinks: [
      { provider: 'Cavity Colors', url: 'https://cavitycolors.com/sndn-shirt' },
    ],
  },
  {
    slug: 'black-christmas-sorority-hoodie',
    name: 'Black Christmas Sorority House Hoodie',
    description: 'Black Christmas themed hoodie with sorority house design. Heavyweight fleece. Kangaroo pocket. Unisex sizing. Cult horror fashion.',
    category: 'apparel',
    image: '/images/products/black-christmas-hoodie.jpg',
    imageAlt: 'Black Christmas hoodie',
    price: '49.99',
    currency: 'USD',
    seoTitle: 'Black Christmas Sorority House Hoodie',
    seoDescription: 'Black Christmas hoodie with sorority house design. Classic horror apparel.',
    featured: false,
    franchiseSlug: 'black-christmas',
    tagSlugs: ['cult-classic', 'atmospheric'],
    affiliateLinks: [
      { provider: 'Fright Rags', url: 'https://frightrrags.com/black-christmas-hoodie' },
    ],
  },
  {
    slug: 'yesterdays-gremlins-stripe-sweater',
    name: 'Yesterdays Gremlins Stripe Cardigan Sweater',
    description: 'Retro cardigan sweater featuring Stripe and Gremlins imagery. Button-front styling. Vintage 1980s inspired design. Limited edition knit.',
    category: 'apparel',
    image: '/images/products/stripe-cardigan.jpg',
    imageAlt: 'Gremlins Stripe cardigan sweater',
    price: '74.99',
    currency: 'USD',
    seoTitle: 'Gremlins Stripe Cardigan Sweater',
    seoDescription: 'Retro Gremlins cardigan with Stripe design. 1980s inspired knit sweater.',
    featured: false,
    franchiseSlug: 'gremlins',
    tagSlugs: ['nostalgic', 'creature-feature'],
    affiliateLinks: [
      { provider: 'Yesterdays', url: 'https://yesterdays.co/stripe-cardigan' },
    ],
  },
  {
    slug: 'krampus-gruss-vom-krampus-shirt',
    name: 'Gruss Vom Krampus Traditional T-Shirt',
    description: 'Traditional Alpine "Greetings from Krampus" design based on vintage Krampuskarten postcards. Retro horror imagery. Cultural folklore apparel.',
    category: 'apparel',
    image: '/images/products/gruss-vom-krampus.jpg',
    imageAlt: 'Gruss Vom Krampus vintage style shirt',
    price: '26.99',
    currency: 'USD',
    seoTitle: 'Gruss Vom Krampus Traditional T-Shirt',
    seoDescription: 'Traditional Krampus greeting shirt based on vintage postcards. Alpine folklore apparel.',
    featured: false,
    franchiseSlug: undefined,
    tagSlugs: ['folklore', 'international'],
    affiliateLinks: [
      { provider: 'Etsy', url: 'https://etsy.com/gruss-vom-krampus' },
    ],
  },
  {
    slug: 'mondo-tees-gremlins-ringer',
    name: 'Mondo Tees Gremlins Ringer T-Shirt',
    description: 'Exclusive Gremlins ringer tee with Mondo artwork. Vintage ringer style with contrasting collar and sleeves. Premium soft cotton. Limited availability.',
    category: 'apparel',
    image: '/images/products/mondo-gremlins-ringer.jpg',
    imageAlt: 'Gremlins Mondo ringer t-shirt',
    price: '32.00',
    currency: 'USD',
    seoTitle: 'Mondo Gremlins Ringer T-Shirt',
    seoDescription: 'Exclusive Gremlins ringer tee with Mondo artwork. Premium vintage style.',
    featured: false,
    franchiseSlug: 'gremlins',
    tagSlugs: ['nostalgic'],
    affiliateLinks: [
      { provider: 'Mondo', url: 'https://mondoshop.com/gremlins-ringer' },
    ],
  },
  {
    slug: 'halloween-vintage-jack-frost-tee',
    name: 'Halloween Vintage Jack Frost Killer Snowman Tee',
    description: 'Cult classic Jack Frost t-shirt with retro VHS artwork. Soft vintage wash. Celebrates the campy horror comedy. Horror cult fashion.',
    category: 'apparel',
    image: '/images/products/jack-frost-vintage-tee.jpg',
    imageAlt: 'Jack Frost vintage horror t-shirt',
    price: '27.99',
    currency: 'USD',
    seoTitle: 'Jack Frost Killer Snowman Vintage T-Shirt',
    seoDescription: 'Jack Frost cult horror t-shirt with VHS art. Campy Christmas horror apparel.',
    featured: false,
    franchiseSlug: 'jack-frost',
    tagSlugs: ['campy', 'cult-classic'],
    affiliateLinks: [
      { provider: 'Fright Rags', url: 'https://frightrrags.com/jack-frost-tee' },
    ],
  },
];

/**
 * Seed products into the database
 */
async function seedProducts() {
  console.log('🎁 Starting product seed...\n');

  // Get franchise IDs
  const franchises = await prisma.franchise.findMany();
  const franchiseMap = new Map(franchises.map(f => [f.slug, f.id]));

  // Get tag IDs
  const tags = await prisma.tag.findMany();
  const tagMap = new Map(tags.map(t => [t.slug, t.id]));

  const createdProducts = new Map<string, string>();

  for (const product of products) {
    // Get franchise ID if specified
    const franchiseId = product.franchiseSlug 
      ? franchiseMap.get(product.franchiseSlug)
      : undefined;

    if (product.franchiseSlug && !franchiseId) {
      console.warn(`⚠ Warning: Franchise not found: ${product.franchiseSlug}`);
    }

    // Convert price string to Decimal if present
    const price = product.price ? new Prisma.Decimal(product.price) : undefined;

    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        category: product.category,
        image: product.image,
        imageAlt: product.imageAlt,
        price: price,
        currency: product.currency,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        featured: product.featured,
        franchiseId: franchiseId,
      },
      create: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        image: product.image,
        imageAlt: product.imageAlt,
        price: price,
        currency: product.currency,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        featured: product.featured,
        franchiseId: franchiseId,
        status: 'DRAFT', // Will be published after relationships are set up
      },
    });

    createdProducts.set(product.slug, created.id);

    // Delete and recreate tag relationships
    await prisma.productTag.deleteMany({
      where: { productId: created.id },
    });

    // Create tag relationships
    for (const tagSlug of product.tagSlugs) {
      const tagId = tagMap.get(tagSlug);
      if (tagId) {
        await prisma.productTag.create({
          data: {
            productId: created.id,
            tagId: tagId,
          },
        });
      }
    }

    // Delete and recreate affiliate links
    await prisma.affiliateLink.deleteMany({
      where: { productId: created.id },
    });

    // Create affiliate links
    for (const link of product.affiliateLinks) {
      await prisma.affiliateLink.create({
        data: {
          provider: link.provider,
          url: link.url,
          productId: created.id,
        },
      });
    }

    console.log(`✓ Upserted: ${product.name}`);
  }

  console.log(`\n✅ Product seed complete! Created ${createdProducts.size} products.\n`);

  // Statistics
  const categoryBreakdown = new Map<string, number>();
  const featuredCount = products.filter(p => p.featured).length;
  
  for (const product of products) {
    categoryBreakdown.set(
      product.category,
      (categoryBreakdown.get(product.category) || 0) + 1
    );
  }

  console.log('📊 Statistics:');
  console.log('   Category Breakdown:');
  for (const [category, count] of categoryBreakdown.entries()) {
    console.log(`     ${category}: ${count}`);
  }
  console.log(`\n   Featured Products: ${featuredCount}`);
  console.log(`   Total Products: ${products.length}`);
  console.log(`   Total Affiliate Links: ${products.reduce((sum, p) => sum + p.affiliateLinks.length, 0)}\n`);

  // Verify required categories
  const requiredCategories = ['figures', 'ornaments', 'posters', 'blu-rays', 'apparel'];
  console.log('✓ Required Categories Present:');
  for (const category of requiredCategories) {
    const found = categoryBreakdown.has(category);
    const count = categoryBreakdown.get(category) || 0;
    console.log(`   ${category}: ${found ? '✓' : '✗'} (${count} products)`);
  }
  console.log();

  return createdProducts;
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedProducts();
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

export { seedProducts, main };
