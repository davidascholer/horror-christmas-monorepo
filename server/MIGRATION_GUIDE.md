# Database Migration Guide

This guide walks you through generating and applying the initial Prisma migration.

## Prerequisites

Before running migrations, ensure you have:

1. **PostgreSQL running** - See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for setup instructions
2. **Database created** - The `horror_christmas_dev` database must exist
3. **Connection configured** - The `.env` file must contain a valid `DATABASE_URL`

## Quick Start

```bash
# 1. Start the database (Docker option)
./start-db.sh

# OR manually start Docker container
docker run --name horror-christmas-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=horror_christmas_dev \
  -p 5432:5432 \
  -d postgres:16-alpine

# 2. Generate and apply migration
npm run prisma:migrate

# When prompted for migration name, enter: init

# 3. Run schema validation tests
npm test
```

## What the Migration Creates

The initial migration creates the complete Horror Christmas knowledge graph schema:

### Core Entity Tables
- `Collection` - Curated collections with type, status, and editorial content
- `Movie` - Films, TV specials, and episodes with metadata
- `Character` - Horror characters with biographies and relationships
- `Product` - Merchandise with fixed-precision pricing
- `Franchise` - Movie/character franchises (e.g., Gremlins, Black Christmas)
- `Tag` - Platform-curated tags for categorization
- `AffiliateLink` - Product affiliate destinations
- `Watchlist` - Anonymous shareable watchlists with bearer tokens
- `WatchlistMovie` - Watchlist membership with ordering and completion state

### Join Tables (Many-to-Many Relationships)
- `CollectionMovie` - Collections to movies (ordered, with curator notes)
- `CollectionCharacter` - Collections to characters (ordered, with curator notes)
- `CollectionProduct` - Collections to products (ordered, with curator notes)
- `CollectionFranchise` - Collections to franchises (ordered)
- `CollectionTag` - Collections to tags
- `CollectionRelated` - Directed related-collection relationships (ordered)
- `MovieCharacter` - Movies to characters (ordered, with role)
- `MovieTag` - Movies to tags
- `CharacterTag` - Characters to tags
- `ProductTag` - Products to tags
- `ProductCharacter` - Products to characters (ordered)

### Key Schema Features

1. **Composite Primary Keys** - Join tables use composite PKs to prevent duplicates
2. **Unique Slugs** - Every content entity has a unique slug for public URLs
3. **Ordered Relationships** - Collection items and related collections maintain sort order
4. **Fixed-Precision Prices** - Product prices use `DECIMAL(10,2)` for money-safe arithmetic
5. **Content Status** - DRAFT, PUBLISHED, ARCHIVED states control visibility
6. **Cascade Deletes** - Join records cascade when parent entities are deleted
7. **Set Null** - Optional franchise references set to null when franchise is deleted
8. **Unique Sort Orders** - Per-parent unique constraints prevent order conflicts
9. **Indexes** - Strategic indexes on slugs, status, featured flags, and foreign keys

## Migration Commands

### Generate and Apply Migration (Development)

```bash
npm run prisma:migrate
```

This command:
1. Compares `schema.prisma` with the current database state
2. Generates SQL migration files in `prisma/migrations/`
3. Applies the migration to the database
4. Regenerates Prisma Client with TypeScript types

### Generate Prisma Client Only

```bash
npm run prisma:generate
```

Use this after pulling migration files from git (doesn't modify the database).

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

Opens a GUI at http://localhost:5555 to browse and edit data.

## Verifying the Migration

After running the migration, verify it was successful:

### 1. Check Migration Files

```bash
ls -la prisma/migrations/
```

You should see a timestamped directory containing `migration.sql`.

### 2. List Database Tables

```bash
# Docker
docker exec -it horror-christmas-postgres psql -U postgres -d horror_christmas_dev -c '\dt'

# Local PostgreSQL (adjust connection as needed)
psql -d horror_christmas_dev -c '\dt'
```

Expected tables:
```
Collection, Movie, Character, Product, Franchise, Tag,
AffiliateLink, Watchlist, WatchlistMovie,
CollectionMovie, CollectionCharacter, CollectionProduct,
CollectionFranchise, CollectionTag, CollectionRelated,
MovieCharacter, MovieTag, CharacterTag, ProductTag,
ProductCharacter, _prisma_migrations
```

### 3. Run Schema Tests

```bash
npm test
```

The test suite verifies:
- ✅ Unique slug constraints
- ✅ Composite primary keys prevent duplicates
- ✅ Optional relationships (nullable foreign keys)
- ✅ Ordered relationships (unique sortOrder per parent)
- ✅ Fixed-precision price handling
- ✅ Content status enum validation
- ✅ Cascade and set-null delete behavior

## Troubleshooting

### Migration Already Applied

If you see "No migration found":
```
The database is already in sync with your Prisma schema.
```

This means the migration was previously applied. No action needed.

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

PostgreSQL is not running. Start it using the instructions in [DATABASE_SETUP.md](./DATABASE_SETUP.md).

### Database Does Not Exist

```
Error: P1003: Database `horror_christmas_dev` does not exist
```

Create the database:
```bash
# Docker
docker exec -it horror-christmas-postgres psql -U postgres -c "CREATE DATABASE horror_christmas_dev;"

# Local
createdb horror_christmas_dev
```

### Schema Already Exists

If tables already exist but migrations are out of sync:

```bash
# Reset the database (WARNING: destroys all data)
npx prisma migrate reset

# Then apply migrations
npm run prisma:migrate
```

### Authentication Failed

Check your `DATABASE_URL` in `.env` matches your PostgreSQL setup.

## Production Migrations

For production deployments:

```bash
# Apply migrations without prompting
npx prisma migrate deploy
```

This command:
- Does not create new migrations
- Only applies pending migrations from `prisma/migrations/`
- Safe for CI/CD pipelines

## Next Steps

After successfully running migrations:

1. ✅ Verify all tables exist
2. ✅ Run the test suite (`npm test`)
3. ✅ Proceed to Task 2.4 (domain/API serialization tests)
4. ✅ Begin implementing seed data (Phase 3)

## Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
