# Launch Collections Documentation

## Overview

This document describes the 10 required launch collections from Requirement 6.2, their types, relationships, and curation strategy.

## Collection Types

### CHARACTER (1 collection)
**Focus:** Collections centered on specific characters or creatures

- **Essential Krampus Collection**: The definitive collection for Krampus, Christmas horror's most iconic monster

### THEME (4 collections)
**Focus:** Collections organized around thematic concepts

- **Winter Monsters**: Diverse winter folklore creatures beyond Krampus
- **Christmas Slashers**: Killer Santas and holiday-themed slasher films
- **Christmas Horror Comedies**: Films that blend horror and comedy during Christmas
- **Christmas Horror Deep Cuts**: Hidden gems and cult classics for completists

### BEGINNER (1 collection)
**Focus:** Gateway collections for newcomers to the genre

- **New To Christmas Horror**: Accessible entry points that showcase the subgenre's range

### GIFT (1 collection)
**Focus:** Shopping guides pairing films with merchandise

- **Best Gifts For Krampus Fans**: Curated gift suggestions for Christmas horror enthusiasts

### SEASONAL_CHALLENGE (2 collections)
**Focus:** Structured viewing experiences over time

- **25 Days of Christmas Horror**: One film per day throughout December (advent calendar style)
- **Holiday Horror Marathon**: Curated all-day/weekend viewing order

### TRADITION (1 collection)
**Focus:** Collections exploring important films and their legacy

- **Black Christmas Collection**: The 1974 proto-slasher and its influence on the genre

## Homepage Organization

Collections are ordered by `sortOrder` for homepage presentation:

1. Essential Krampus Collection (featured)
2. Winter Monsters (featured, seasonal)
3. Christmas Slashers (featured)
4. New To Christmas Horror (featured)
5. 25 Days of Christmas Horror (seasonal)
6. Best Gifts For Krampus Fans (seasonal)
7. Christmas Horror Comedies
8. Black Christmas Collection
9. Christmas Horror Deep Cuts
10. Holiday Horror Marathon (seasonal)

**Featured collections** (4): Appear in the primary discovery section
**Seasonal collections** (4): Highlighted during the holiday season

## Related Collection Relationships

Related collections are **directional** - a relationship from A→B does not imply B→A. Each collection has 3 related collections that provide logical next steps for visitors.

### Relationship Strategy

#### Essential Krampus Collection →
- **Winter Monsters**: Explore more winter creatures
- **New To Christmas Horror**: If Krampus is your entry point
- **Best Gifts For Krampus Fans**: For collectors and gift shoppers

#### Winter Monsters →
- **Essential Krampus**: Deep dive into the most famous winter monster
- **Christmas Horror Deep Cuts**: Discover more obscure creatures
- **New To Christmas Horror**: Accessible entries featuring these creatures

#### Christmas Slashers →
- **Black Christmas Collection**: The proto-slasher that started it all
- **25 Days of Christmas Horror**: Include slashers in your marathon
- **Holiday Horror Marathon**: Perfect for slasher-heavy marathon viewing

#### New To Christmas Horror →
- **Essential Krampus**: Graduate to the genre's icon
- **Christmas Horror Comedies**: Ease into horror through comedy
- **Winter Monsters**: Explore creature features

#### 25 Days of Christmas Horror →
- **Holiday Horror Marathon**: Alternative marathon format
- **Christmas Slashers**: Focus on one subgenre
- **New To Christmas Horror**: If you're new to the challenge

#### Best Gifts For Krampus Fans →
- **Essential Krampus**: Films to pair with Krampus merchandise
- **Christmas Horror Comedies**: Lighter gift options
- **Winter Monsters**: Expand beyond Krampus gifts

#### Christmas Horror Comedies →
- **New To Christmas Horror**: Great gateway genre
- **Best Gifts For Krampus Fans**: Gift ideas for comedy-horror fans
- **Holiday Horror Marathon**: Include in your marathon mix

#### Black Christmas Collection →
- **Christmas Slashers**: The broader slasher context
- **Christmas Horror Deep Cuts**: More historical/cult films
- **25 Days of Christmas Horror**: Include in your challenge

#### Christmas Horror Deep Cuts →
- **Winter Monsters**: Obscure creature features
- **Black Christmas Collection**: Historical context
- **Holiday Horror Marathon**: Add variety to your marathon

#### Holiday Horror Marathon →
- **25 Days of Christmas Horror**: Extended challenge option
- **Christmas Slashers**: If you loved the slasher entries
- **Christmas Horror Comedies**: If you prefer lighter fare

## Curator Guidance Strategy

Each collection's `curatorNotes` answers four key questions:

1. **Why does this collection exist?** - The collection's purpose and theme
2. **Who is it for?** - The target audience
3. **Where should I start?** - Recommended entry point
4. **What should I do next?** - Next steps and related explorations

This ensures visitors always have clear guidance on how to use each collection.

## Content Requirements

Per Requirement 3.5 and Design correctness properties, before a collection can be published (status → PUBLISHED), it must have:

- ✅ Introduction (what this collection is about)
- ✅ Curator notes (answering the four key questions)
- ✅ Hero image with alt text (visual identity)
- ✅ SEO title and description (search discovery)
- ⏳ At least one movie (will be added in Task 3.3)
- ⏳ At least one related collection (relationships created, verified after movies)

**Current Status:** All 10 collections are created with complete metadata and related-collection relationships. They remain in `DRAFT` status until movies are added in Task 3.3.

## Movie Assignment Strategy (for Task 3.3)

When adding movies to collections, maintain these principles:

### Essential Krampus Collection
- Focus: Films prominently featuring Krampus
- Size target: 5-8 films
- Include: "Krampus" (2015) as the gateway, plus folklore-inspired independents

### Winter Monsters
- Focus: Non-Krampus winter creatures (Yule Cat, Frau Perchta, etc.)
- Size target: 8-12 films
- Variety: Mix well-known and obscure creatures

### Christmas Slashers
- Focus: Killer Santas and holiday slashers
- Size target: 8-12 films
- Include: "Silent Night, Deadly Night" series, "Christmas Evil"

### New To Christmas Horror
- Focus: Accessible gateway films across styles
- Size target: 6-10 films
- Include: "Gremlins" (PG-13), "Krampus", "Better Watch Out"
- Order: Gradually increase intensity

### 25 Days of Christmas Horror
- Focus: Advent calendar progression
- Size: Exactly 25 films
- Order: Critical - light to dark, Dec 1-25 sequence
- Variety: Mix all subgenres to avoid fatigue

### Best Gifts For Krampus Fans
- Focus: Films with strong merchandise tie-ins
- Size target: 8-10 films
- Include: Films with collectible figures, ornaments, posters available

### Christmas Horror Comedies
- Focus: Horror-comedy blend
- Size target: 8-12 films
- Include: "Gremlins", "Krampus", comedy-heavy entries

### Black Christmas Collection
- Focus: "Black Christmas" (1974) and its legacy
- Size target: 5-8 films
- Include: Original, remakes, directly influenced films

### Christmas Horror Deep Cuts
- Focus: Obscure, cult, international films
- Size target: 12-15 films
- Include: Lesser-known gems for completists

### Holiday Horror Marathon
- Focus: All-day viewing with pacing variety
- Size target: 8-12 films
- Order: Critical - designed for sequential marathon viewing
- Mix: Alternate styles for energy management

## Image Assets

All collections reference hero images in `/images/collections/`. These are currently placeholder paths. Actual image assets will need to be:

1. Created or sourced
2. Uploaded to object storage (Cloudflare R2 or Amazon S3 per Requirement 12.6)
3. URLs updated in collection records before publication

Image requirements:
- Hero images with descriptive alt text (accessibility)
- Responsive variants support (WebP, multiple sizes)
- Fallback image available for missing assets

## SEO Strategy

Each collection has:

- **SEO Title**: Optimized for search engines (includes key terms like "Krampus," "Christmas Horror," "Collection")
- **SEO Description**: 150-160 characters, includes target keywords and value proposition
- **Summary**: Shorter description for internal discovery

The SEO metadata targets:
- Genre fans searching for "Christmas horror movies"
- Character fans searching for "Krampus films"
- Gift shoppers searching for "gifts for horror fans"
- Marathon planners searching for "Christmas horror marathon"

## Testing Checklist

Before Task 3.4, verify:

- [ ] All 10 collections exist in database
- [ ] All collection types are represented correctly
- [ ] All slugs are unique
- [ ] All required fields are populated (introduction, curator notes, hero, SEO)
- [ ] Related collection relationships are directional and correct
- [ ] Homepage sortOrder creates logical browsing sequence
- [ ] Featured/seasonal flags align with discovery strategy
- [ ] All collections remain in DRAFT status (correct for this phase)

## Future Phases

### Task 3.3: Add Movies
- Assign movies to collections via `CollectionMovie` join table
- Include relationship-specific curator notes where appropriate
- Set `sortOrder` for each movie within its collection

### Task 3.4: Validation
- Run publication validation checks
- Verify all collections have required relationships
- Test editorial warnings for missing memberships
- Confirm launch metadata completeness

### Later Phases: Publication
- After all content relationships are complete
- Update status from DRAFT → PUBLISHED
- Set `publishedAt` timestamp
- Collections become discoverable via public APIs and static generation
