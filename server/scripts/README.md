# Collection Management Scripts

Scripts for loading and verifying launch collections.

## Quick Start

```bash
# Load all 10 launch collections into the database
npm run seed:collections

# Verify collections are properly loaded
npm run verify:collections

# Or use the combined shell script
./scripts/load-collections.sh
```

## Scripts

### seed:collections
**File:** `prisma/seed-collections.ts`  
**Command:** `npm run seed:collections`

Loads all 10 required launch collections into the database with:
- Complete metadata (introduction, curator notes, SEO)
- Hero image paths and alt text
- Collection types (CHARACTER, THEME, BEGINNER, GIFT, SEASONAL_CHALLENGE, TRADITION)
- Homepage sort order
- Featured and seasonal flags
- Related collection relationships (3 per collection, 30 total)

**Output:**
```
🎄 Starting collection seed...
Creating collections...
✓ Created: Essential Krampus Collection (CHARACTER)
✓ Created: Winter Monsters (THEME)
...
Creating related collection relationships...
✓ Created 30 related collection relationships
📊 Seed Summary:
   Collections created: 10
   Related relationships: 30
   Status: All collections in DRAFT (awaiting movies)
```

### verify:collections
**File:** `scripts/verify-collections.ts`  
**Command:** `npm run verify:collections`

Verifies the database contains all 10 launch collections with proper metadata:
- ✅ All required collections exist
- ✅ Required fields populated (introduction, curator notes, hero, SEO)
- ✅ Unique slugs
- ✅ Correct collection types
- ✅ Related collection relationships
- ✅ Homepage organization (sort order, featured, seasonal)

**Output:**
```
🔍 Verifying Launch Collections
Found 10 collections in database

📋 Collection Types:
  BEGINNER (1): ...
  CHARACTER (1): ...
  GIFT (1): ...
  SEASONAL_CHALLENGE (2): ...
  THEME (4): ...
  TRADITION (1): ...

📊 Homepage Organization:
  1. Essential Krampus Collection [featured]
  2. Winter Monsters [featured, seasonal]
  ...

🔗 Related Collection Relationships:
  Essential Krampus Collection: 3 related collection(s)
  ...
  Total relationships: 30

⚠  Warnings:
  [All collections] No movies assigned yet (expected - Task 3.3)

✅ Collections verified with 10 warning(s)
```

### load-collections.sh
**File:** `scripts/load-collections.sh`  
**Command:** `./scripts/load-collections.sh`

Combined script that:
1. Checks database connection
2. Runs seed script
3. Shows next steps

## Database State

After running these scripts, the database contains:

**Collection table (10 records):**
- All 10 required launch collections
- Status: DRAFT (awaiting movies)
- Complete metadata for eventual publication

**CollectionRelated table (30 records):**
- 3 related collections per collection
- Directional relationships (A→B does not imply B→A)
- Ordered by sortOrder

## Next Steps

1. **Task 3.3:** Add movies to collections
   - Create movie seed data
   - Link movies via CollectionMovie join table
   - Set sortOrder for movies within collections

2. **Task 3.4:** Validation
   - Verify all collections have at least 1 movie
   - Test publication validation logic
   - Confirm launch metadata completeness

3. **Later:** Publication
   - Upload hero images to object storage
   - Update image URLs
   - Change status: DRAFT → PUBLISHED
   - Set publishedAt timestamps

## Testing

Collection tests are located in `src/collections.test.ts`:

```bash
# Run collection tests
npm test -- collections.test.ts --run

# Watch mode
npm test -- collections.test.ts
```

Tests verify:
- All 10 collections exist
- Correct collection types
- Complete metadata
- Related collection relationships
- Homepage organization
- Publication readiness requirements

## Troubleshooting

### "Database is not running"
Start the database first:
```bash
./start-db.sh
```

### "Collection already exists"
Collections are idempotent by slug. To reset:
```bash
# Delete all collections
npx prisma studio
# Or use SQL:
psql $DATABASE_URL -c "DELETE FROM \"Collection\";"
```

### Verification warnings
Warnings about missing movies are expected at this stage. Collections need movies before publication (Task 3.3).

## Files

- `prisma/seed-collections.ts` - Collection data and seeding logic
- `scripts/verify-collections.ts` - Verification script
- `scripts/load-collections.sh` - Combined load script
- `src/collections.test.ts` - Automated tests
- `COLLECTIONS-DOCUMENTATION.md` - Strategy documentation
