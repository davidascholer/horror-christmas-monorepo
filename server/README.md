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
