# Task 2.3: Schema Migration and Validation

This document provides instructions for completing Task 2.3: Create and apply migrations to a disposable development/test database; test schema constraints, optional relationships, ordering, price precision, and status values.

## Overview

Task 2.3 implements the complete PostgreSQL/Prisma knowledge graph defined in Tasks 2.1 and 2.2, then validates its integrity with comprehensive tests.

## Super Quick Start (Automated)

If you want to run everything with one command:

```bash
cd server
./setup-task-2.3.sh
```

This script will:
1. ✅ Check Docker is running
2. ✅ Start PostgreSQL container
3. ✅ Test database connection
4. ✅ Generate and apply migration
5. ✅ Verify tables were created
6. ✅ Run all schema validation tests

## Manual Quick Start

If you prefer step-by-step control:

### 1. Start Docker (if not already running)

Open Docker Desktop application or start Docker from the command line.

### 2. Set Up PostgreSQL Database

**Option A: Using Docker (Recommended)**

```bash
# From the server directory
cd server

# Start PostgreSQL container
./start-db.sh
```

**Option B: Manual Docker Command**

```bash
docker run --name horror-christmas-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=horror_christmas_dev \
  -p 5432:5432 \
  -d postgres:16-alpine
```

**Option C: Use Local PostgreSQL**

If you prefer to use a local PostgreSQL installation, see [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

### 3. Verify Database Connection

```bash
# Check container is running (Docker)
docker ps | grep horror-christmas-postgres

# Test connection
docker exec -it horror-christmas-postgres pg_isready -U postgres
```

### 4. Generate and Apply Migration

```bash
# Generate Prisma Client and create migration
npm run prisma:migrate

# When prompted for migration name, enter: init
```

This command will:
- Generate SQL from the `prisma/schema.prisma` file
- Create a migration file in `prisma/migrations/TIMESTAMP_init/migration.sql`
- Apply the migration to the database
- Generate the Prisma Client with TypeScript types

### 5. Verify Migration

```bash
# List all tables in the database
docker exec -it horror-christmas-postgres psql -U postgres -d horror_christmas_dev -c '\dt'
```

Expected tables:
```
Collection              Movie               Character
Product                 Franchise           Tag
AffiliateLink          Watchlist           WatchlistMovie
CollectionMovie         CollectionCharacter CollectionProduct
CollectionFranchise     CollectionTag       CollectionRelated
MovieCharacter          MovieTag            CharacterTag
ProductTag              ProductCharacter
_prisma_migrations
```

### 6. Run Schema Validation Tests

```bash
# Run all tests
npm test

# Or run with watch mode during development
npm run test:watch

# Or run only schema tests
npm test schema.test.ts
```

## Test Coverage

The test suite (`src/schema.test.ts`) validates:

### ✅ Schema Constraints
- Unique slugs per entity type (Collection, Movie, Character, Product)
- Composite primary keys prevent duplicate relationships
- Unique share tokens for watchlists

### ✅ Optional Relationships
- Nullable franchise foreign keys on Movie, Character, Product
- Optional curator notes in collection relationships
- Optional role field in MovieCharacter

### ✅ Ordering
- Unique `sortOrder` per parent entity
- Same `sortOrder` allowed across different parents
- Stable ordering maintained across queries
- Directed relationships (CollectionRelated)

### ✅ Price Precision
- Decimal values preserve .01 precision
- Fixed-precision DECIMAL(10,2) storage
- Currency stored as 3-character code (CHAR(3))
- Null prices allowed

### ✅ Status Values
- ContentStatus enum (DRAFT, PUBLISHED, ARCHIVED)
- CollectionType enum (CHARACTER, THEME, BEGINNER, GIFT, SEASONAL_CHALLENGE, TRADITION)
- MediaType enum (FILM, TELEVISION_SPECIAL, TELEVISION_EPISODE)
- Default status is DRAFT

### ✅ Cascade and Set Null Behavior
- Join tables cascade when either endpoint is deleted
- Franchise foreign keys set to null when franchise is deleted
- AffiliateLinks cascade when product is deleted
- WatchlistMovies cascade when watchlist is deleted

### ✅ Timestamps
- Auto-generated `createdAt` and `updatedAt`
- `updatedAt` auto-updates on modification
- `createdAt` remains stable

### ✅ Directed Relationships
- Related collections are directional (not reciprocal)
- Explicit bidirectional relationships allowed when created

## Expected Test Results

All tests should pass:

```
✓ Schema Constraints (8 tests)
✓ Optional Relationships (6 tests)
✓ Ordering and Sort Order (4 tests)
✓ Price Precision (5 tests)
✓ Status Values and Enums (4 tests)
✓ Cascade and Set Null Behavior (5 tests)
✓ Timestamps (2 tests)
✓ Directed Relationships (2 tests)

Test Files  1 passed (1)
Tests  36 passed (36)
```

## Troubleshooting

### Database Connection Errors

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
1. Ensure Docker is running: `docker ps`
2. Start the container: `./start-db.sh` or `docker start horror-christmas-postgres`
3. Check logs: `docker logs horror-christmas-postgres`

### Migration Errors

**Error:** `P1003: Database does not exist`

**Solution:**
```bash
docker exec -it horror-christmas-postgres psql -U postgres -c "CREATE DATABASE horror_christmas_dev;"
```

**Error:** `P3014: The migration cannot be applied because...`

**Solution:** Reset the database (destroys all data):
```bash
npx prisma migrate reset
npm run prisma:migrate
```

### Test Failures

**Error:** Tests timeout or hang

**Solution:**
1. Ensure the database is running
2. Check `DATABASE_URL` in `.env` is correct
3. Verify connection: `docker exec -it horror-christmas-postgres pg_isready -U postgres`

### Port Already in Use

**Error:** Port 5432 is already allocated

**Solution:** Either stop the conflicting service or use a different port:
```bash
# Stop existing container
docker stop horror-christmas-postgres
docker rm horror-christmas-postgres

# Or use a different port (update .env accordingly)
docker run --name horror-christmas-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=horror_christmas_dev \
  -p 5433:5432 \
  -d postgres:16-alpine
```

Then update `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/horror_christmas_dev"
```

## Database Management

### View Data with Prisma Studio

```bash
npm run prisma:studio
```

Opens a GUI at http://localhost:5555

### Reset Database

```bash
# WARNING: Destroys all data
npx prisma migrate reset
```

### Stop PostgreSQL Container

```bash
docker stop horror-christmas-postgres
```

### Start PostgreSQL Container

```bash
docker start horror-christmas-postgres
```

### Remove Container (Destroys Data)

```bash
docker rm -f horror-christmas-postgres
```

## Files Created

### Documentation
- `DATABASE_SETUP.md` - Comprehensive PostgreSQL setup guide
- `MIGRATION_GUIDE.md` - Detailed migration instructions
- `TASK-2.3-README.md` - This file

### Configuration
- `.env` - Database connection configuration (git-ignored)
- `start-db.sh` - Shell script to start PostgreSQL container

### Tests
- `src/schema.test.ts` - Comprehensive schema validation tests (36 tests)

### Migration
- `prisma/migrations/TIMESTAMP_init/migration.sql` - Generated SQL migration

## Verification Checklist

After completing all steps, verify:

- [ ] PostgreSQL container is running
- [ ] Database `horror_christmas_dev` exists
- [ ] Migration has been applied successfully
- [ ] All database tables exist (20+ tables)
- [ ] Prisma Client has been generated
- [ ] All 36 schema tests pass
- [ ] No connection errors or warnings

## Next Steps

Once Task 2.3 is complete:

1. ✅ Review test results and ensure all pass
2. ✅ Commit migration files to git
3. ➡️  Proceed to **Task 2.4**: Add domain/API serialization tests proving that money retains decimal precision and currency and that public routes use slugs rather than internal IDs
4. ➡️  Then begin **Phase 3**: Editorial workflow and launch seed content

## Requirements Validated

This task validates the following requirements:

- **Requirement 4.7**: Fixed-precision price and currency handling
- **Requirement 5.1**: Structured relational content with stable identifiers and unique slugs
- **Requirement 5.2**: Explicit relationships with order and curator notes
- **Requirement 5.4**: Directed related-collection links
- **Requirement 11.1**: PostgreSQL as source of truth
- **Requirement 11.2**: Opaque cuid() IDs and unique slugs
- **Requirement 11.3**: Core records with timestamps
- **Requirement 11.4**: Composite keys prevent duplicates
- **Requirement 11.5**: Cascade and set-null delete behavior
- **Requirement 11.8**: Unique per-watchlist order

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Vitest Documentation](https://vitest.dev/)
