/**
 * Franchises Seed Data
 * 
 * This file contains 8 franchises for the Christmas horror catalog.
 * Required franchises from Requirement 6.4: Gremlins, Black Christmas, 
 * Silent Night Deadly Night, and Krampus.
 * 
 * Additional franchises included for catalog depth.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FranchiseSeedData {
  slug: string;
  name: string;
  description: string;
}

/**
 * Launch franchises including all named requirements plus additional entries
 */
export const franchises: FranchiseSeedData[] = [
  {
    slug: 'gremlins',
    name: 'Gremlins',
    description: 'Joe Dante\'s beloved horror-comedy franchise about cute Mogwai that transform into chaos-wreaking Gremlins. Set during Christmas, these films perfectly blend family-friendly adventure with creature horror.',
  },
  {
    slug: 'black-christmas',
    name: 'Black Christmas',
    description: 'The pioneering slasher franchise that started with Bob Clark\'s 1974 proto-slasher masterpiece. Known for inventing many conventions that would define the slasher genre, including the killer\'s POV and the calls from inside the house.',
  },
  {
    slug: 'silent-night-deadly-night',
    name: 'Silent Night, Deadly Night',
    description: 'The controversial killer Santa franchise that sparked outrage upon its 1984 release. Following traumatized protagonist Billy Chapman and his violent Santa-suited rampage, the series explores holiday trauma and childhood psychological damage.',
  },
  {
    slug: 'krampus',
    name: 'Krampus',
    description: 'Michael Dougherty\'s franchise bringing the Alpine Christmas demon to mainstream horror. Combining folklore authenticity with darkly comic modern storytelling, these films explore the consequences of losing Christmas spirit.',
  },
  {
    slug: 'jack-frost',
    name: 'Jack Frost',
    description: 'The killer snowman horror franchise featuring a serial killer reincarnated as a murderous snowman. Known for its campy humor and creative kills, these low-budget cult films embrace their absurd premise completely.',
  },
  {
    slug: 'christmas-evil-universe',
    name: 'Christmas Evil Universe',
    description: 'Psychological horror films exploring holiday obsession and delusion. Starting with the cult classic "You Better Watch Out" (aka Christmas Evil), these character-driven stories examine how Christmas mythology can fuel dangerous psychosis.',
  },
  {
    slug: 'tales-from-the-crypt-christmas',
    name: 'Tales from the Crypt - Christmas Episodes',
    description: 'The holiday-themed episodes from the iconic horror anthology series. These darkly comic tales feature the Crypt Keeper\'s twisted take on Christmas traditions, delivering memorable scares with signature EC Comics-style morality.',
  },
  {
    slug: 'better-watch-out-universe',
    name: 'Better Watch Out Universe',
    description: 'Contemporary home invasion horror set during Christmas. These films subvert holiday home-alone scenarios, transforming festive suburban settings into tense psychological battlegrounds with shocking twists.',
  },
];

/**
 * Seed franchises into the database
 */
async function seedFranchises() {
  console.log('🎬 Starting franchise seed...\n');

  const createdFranchises = new Map<string, string>();

  for (const franchise of franchises) {
    const created = await prisma.franchise.upsert({
      where: { slug: franchise.slug },
      update: {
        name: franchise.name,
        description: franchise.description,
      },
      create: {
        slug: franchise.slug,
        name: franchise.name,
        description: franchise.description,
      },
    });

    createdFranchises.set(franchise.slug, created.id);
    console.log(`✓ Upserted: ${franchise.name}`);
  }

  console.log(`\n✅ Franchise seed complete! Created ${createdFranchises.size} franchises.\n`);

  return createdFranchises;
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedFranchises();
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

export { seedFranchises, main };
