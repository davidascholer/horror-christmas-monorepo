# Horror Christmas - API Server

## Overview

This is the **independently deployable** Node.js + TypeScript API application for Horror Christmas.

## Architecture

This is a **modular monolith** organized around domain modules:

- **Collections** - Published collection lists/detail, ordered composition, related collections, homepage projections
- **Movies** - Movie retrieval and relationships to characters/collections/products
- **Characters** - Character retrieval and relationships
- **Products** - Product retrieval and affiliate destinations
- **Search** - PostgreSQL full-text search across collections, movies, characters, products
- **Watchlists** - Anonymous token-protected creation, retrieval, membership, ordering, completion

## Responsibilities

### Data Layer
- **PostgreSQL** - Authoritative source of truth for the Christmas Horror Knowledge Graph
- **Prisma** - ORM for database access
- Prisma schema lives in `prisma/schema.prisma` (NOT at monorepo root)
- All database models and migrations are maintained here

### API Layer
- RESTful JSON API endpoints for all public content
- Domain-oriented modules (collections, movies, characters, products, search, watchlists)
- Shared API contracts defined in `src/types/api-contracts.ts`
- Validation, business logic, and authorization
- Build-time content discovery endpoints for static generation

### Domain Logic
- Content publication validation (editorial rules, required fields, relationships)
- Search implementation (PostgreSQL full-text search)
- Watchlist operations (anonymous bearer tokens, ordering, completion)
- Monetary precision handling (fixed-precision decimals with currency codes)

## Independence Requirements

This application MUST be:
- **Self-contained** - Contains all code necessary for deployment
- **Independently deployable** - Can be deployed without the web application
- **Fully testable** - Can run all tests without external dependencies beyond PostgreSQL

## Shared Code

API contracts in `src/types/api-contracts.ts` are duplicated in the web application.

When updating API contracts:
1. Update `server/src/types/api-contracts.ts` (source of truth)
2. Copy to `web/src/types/api-contracts.ts`
3. Verify both applications build successfully
4. Commit both changes together

See `.kiro/steering/shared-types.md` for synchronization details.

## Technology Constraints

### Decided
- **Language**: Node.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Architecture**: Modular monolith (not microservices)

### Open (requires owner approval)
- API framework (Express, Fastify, Hono, etc.)
- Package versions
- CMS/admin interface
- Deployment provider
- Object storage provider (Cloudflare R2, Amazon S3)
- Analytics vendor
- Runtime configuration approach

## Development

```bash
# Install dependencies (after package versions are selected)
npm install

# Development server (after implementation)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Prisma commands
npm run prisma:generate   # Generate Prisma Client
npm run prisma:migrate    # Run migrations
npm run prisma:studio     # Open Prisma Studio
```

## Publishing the seed catalog (local development)

Seeding (`npm run seed`) always creates DRAFT content. Publishing is a separate, deliberate step:

```bash
npm run seed:publish -- --dry-run   # show what would be published, write nothing
npm run seed:publish                # publish the seed records that pass validation
npm run verify:published            # call every public endpoint through the dev HTTP API
```

What `seed:publish` does (`prisma/publish-seed.ts`, logic in `src/publishing/publish-seed.ts`):

- Runs the publication validators (`src/validation/publication-validation.ts`) on every DRAFT seed Collection, Movie, Character and Product. Passing records become PUBLISHED with `publishedAt` set to now; failing records stay DRAFT and are printed with the exact reasons. Nothing is weakened or bypassed.
- Scope is the explicit slug allow-list taken from the seed files, never "every DRAFT row". Slugs with a test-fixture prefix (`zz-`, `t52`, `t43`, `e2e`, `test-`) are refused even if listed.
- Only DRAFT rows are considered: PUBLISHED rows are untouched (an existing `publishedAt` is never overwritten) and ARCHIVED rows are never revived. Running it twice changes nothing.
- Collections are decided last, because the static generator only links pages it builds: a collection also needs at least one member movie that will be published, and every related collection must be published too (resolved to a fixed point). A collection held back this way is reported with the reason.
- Refuses to run unless `DATABASE_URL` points at `localhost`, `127.0.0.1` or `::1`. All reads and writes run in one transaction.

To get back to a clean DRAFT baseline without touching the dev database, seed a scratch database (for example `CREATE DATABASE hc_scratch`, `DATABASE_URL=... npx prisma migrate deploy`, `DATABASE_URL=... npm run seed`) and run the suite with that `DATABASE_URL`.

### Image placeholders (owner action before launch)

The seed uses root-relative image paths (`/images/collections/*-hero.jpg`, `/images/movies/*-poster.jpg` and `*-hero.jpg`, `/images/characters/*.jpg`, `/images/products/*.jpg`). They pass the web build's URL rules (http(s) or root-relative) but no files exist at those paths yet, so published pages reference images that return 404 until the files are added under `web/public/images/` or the values are replaced with the object-storage URLs (R2 vs S3 is undecided). No CDN domain was invented and no image was downloaded. Product affiliate links and the Krampus trailer URL are also placeholders to review before launch.

## Directory Structure

```
server/
├── prisma/
│   └── schema.prisma        # Prisma schema (NOT at monorepo root)
├── src/
│   ├── types/
│   │   └── api-contracts.ts # Shared API contracts (source of truth)
│   ├── modules/             # Domain modules (to be created)
│   │   ├── collections/
│   │   ├── movies/
│   │   ├── characters/
│   │   ├── products/
│   │   ├── search/
│   │   └── watchlists/
│   └── index.ts            # Application entry point
├── dist/                   # Build output
├── package.json
├── tsconfig.json
└── README.md
```

## Testing Strategy

- Unit tests for domain logic and validation
- Integration tests for API endpoints
- Database tests with test PostgreSQL instance
- API contract tests verifying request/response shapes
- Tests for monetary precision, slug uniqueness, publication rules
