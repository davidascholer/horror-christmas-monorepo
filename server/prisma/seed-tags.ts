/**
 * Tags Seed Data
 * 
 * This file contains 25 tags for categorizing Christmas horror content.
 * Tags cover themes, subgenres, moods, and content characteristics.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TagSeedData {
  slug: string;
  name: string;
  description: string;
}

/**
 * Content tags for movies, characters, products, and collections
 */
export const tags: TagSeedData[] = [
  {
    slug: 'folklore',
    name: 'Folklore',
    description: 'Content rooted in traditional folklore and mythology, especially Alpine and European winter legends.',
  },
  {
    slug: 'killer-santa',
    name: 'Killer Santa',
    description: 'Films featuring murderers dressed as Santa Claus or Santa-themed killers.',
  },
  {
    slug: 'creature-feature',
    name: 'Creature Feature',
    description: 'Movies centered on monsters, creatures, or supernatural beings.',
  },
  {
    slug: 'slasher',
    name: 'Slasher',
    description: 'Traditional slasher film conventions: masked killers, final girls, and creative kills.',
  },
  {
    slug: 'dark-comedy',
    name: 'Dark Comedy',
    description: 'Horror that balances scares with humor, often satirizing holiday traditions.',
  },
  {
    slug: 'family-trauma',
    name: 'Family Trauma',
    description: 'Stories exploring dysfunctional families, childhood trauma, and holiday family tensions.',
  },
  {
    slug: 'supernatural',
    name: 'Supernatural',
    description: 'Content featuring ghosts, demons, curses, or other paranormal elements.',
  },
  {
    slug: 'home-invasion',
    name: 'Home Invasion',
    description: 'Horror centered on intruders threatening people in their homes during the holidays.',
  },
  {
    slug: 'anthology',
    name: 'Anthology',
    description: 'Collections of multiple short horror stories or segments.',
  },
  {
    slug: 'cult-classic',
    name: 'Cult Classic',
    description: 'Films with dedicated fan followings despite limited mainstream success.',
  },
  {
    slug: '1970s',
    name: '1970s',
    description: 'Classic horror from the 1970s era.',
  },
  {
    slug: '1980s',
    name: '1980s',
    description: 'Horror from the golden age of 1980s genre filmmaking.',
  },
  {
    slug: '1990s',
    name: '1990s',
    description: '1990s era horror films.',
  },
  {
    slug: '2000s',
    name: '2000s',
    description: 'Early 2000s horror cinema.',
  },
  {
    slug: '2010s',
    name: '2010s',
    description: 'Modern horror from the 2010s.',
  },
  {
    slug: 'psychological',
    name: 'Psychological',
    description: 'Mind-bending horror that plays with perception, sanity, and psychological tension.',
  },
  {
    slug: 'campy',
    name: 'Campy',
    description: 'Intentionally over-the-top, embracing absurdity and B-movie aesthetics.',
  },
  {
    slug: 'atmospheric',
    name: 'Atmospheric',
    description: 'Films that emphasize mood, tension, and visual storytelling over explicit violence.',
  },
  {
    slug: 'practical-effects',
    name: 'Practical Effects',
    description: 'Notable for impressive practical creature effects, makeup, and animatronics.',
  },
  {
    slug: 'winter-setting',
    name: 'Winter Setting',
    description: 'Takes full advantage of snow, cold, and winter isolation.',
  },
  {
    slug: 'beginner-friendly',
    name: 'Beginner Friendly',
    description: 'Accessible entry points for viewers new to horror or Christmas horror.',
  },
  {
    slug: 'extreme',
    name: 'Extreme',
    description: 'Intense, graphic, or disturbing content for seasoned horror fans only.',
  },
  {
    slug: 'subversive',
    name: 'Subversive',
    description: 'Deliberately challenges or inverts traditional Christmas movie expectations.',
  },
  {
    slug: 'nostalgic',
    name: 'Nostalgic',
    description: 'Evokes nostalgia for particular eras of holiday or horror filmmaking.',
  },
  {
    slug: 'international',
    name: 'International',
    description: 'Non-English or international productions bringing global perspectives.',
  },
];

/**
 * Seed tags into the database
 */
async function seedTags() {
  console.log('🏷️  Starting tag seed...\n');

  const createdTags = new Map<string, string>();

  for (const tag of tags) {
    const created = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {
        name: tag.name,
        description: tag.description,
      },
      create: {
        slug: tag.slug,
        name: tag.name,
        description: tag.description,
      },
    });

    createdTags.set(tag.slug, created.id);
    console.log(`✓ Upserted: ${tag.name}`);
  }

  console.log(`\n✅ Tag seed complete! Created ${createdTags.size} tags.\n`);

  return createdTags;
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedTags();
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

export { seedTags, main };
