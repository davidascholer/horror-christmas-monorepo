# Horror Christmas - Monorepo Architecture

## Repository Structure

This is a monorepo containing two **independently deployable** applications:

```
horror-christmas-monorepo/
├── web/                    # React + TypeScript + Vite frontend
├── server/                 # Node.js + TypeScript API
├── docs/                   # Product documentation
├── .kiro/                  # Kiro specs and configuration
├── ARCHITECTURE.md         # This file
└── README.md              # Project overview
```

## Design Principles

### 1. Repository Independence

Both `web/` and `server/` are **complete, standalone applications**:

- ✅ Each has its own `package.json` with independent dependencies
- ✅ Each has its own TypeScript configuration
- ✅ Each has its own build and test scripts
- ✅ Each can be deployed independently
- ✅ Each contains all code necessary for deployment
- ❌ NO shared code folders at monorepo root
- ❌ NO shared dependencies or workspaces

### 2. Deployment Independence

Each application is deployed separately:

- **Web** - Static assets to CDN (Cloudflare Pages, Netlify, Azure Static Web Apps, etc.)
- **Server** - API service to Node.js runtime (exact provider TBD)

The web application can be built and deployed without the server running. Static pages remain available if the API is offline (search and watchlists require the API).

### 3. Shared Contracts via Duplication

API contracts are **intentionally duplicated** between applications:

- **Source of truth**: `server/src/types/api-contracts.ts`
- **Duplicate**: `web/src/types/api-contracts.ts`

**Synchronization process:**
1. Update contracts in server (source of truth)
2. Copy to web application
3. Verify both applications build
4. Commit both changes together

See `.kiro/steering/shared-types.md` for details.

## Application Boundaries

### Server Application (`server/`)

**Owns:**
- PostgreSQL database (authoritative data store)
- Prisma schema and migrations
- All domain logic and business rules
- Public API endpoints (RESTful JSON)
- Build-time content discovery endpoints
- Content publication validation
- Search implementation
- Watchlist management
- Monetary precision handling

**Modules:**
- Collections
- Movies
- Characters
- Products
- Search
- Watchlists

**Key files:**
- `prisma/schema.prisma` - Database schema (NOT at monorepo root)
- `src/types/api-contracts.ts` - API contracts (source of truth)
- `src/index.ts` - Application entry point

### Web Application (`web/`)

**Owns:**
- React components and pages
- Static page templates
- Client-side navigation and interactions
- Build-time static generation pipeline
- SEO metadata generation
- Image optimization hooks
- User experience and accessibility

**Pages:**
- Homepage (static)
- Collection pages (static)
- Movie pages (static)
- Character pages (static)
- Product pages (static)
- Search interface (runtime API)
- Watchlist interface (runtime API)

**Key files:**
- `src/types/api-contracts.ts` - API contracts (copied from server)
- `src/main.tsx` - Application entry point
- `vite.config.ts` - Vite configuration

## Data Flow

### Build Time (Static Generation)

```
Server API (running)
  ↓
Web build process requests:
  1. GET /build/collections (published slugs)
  2. GET /build/movies (published slugs)
  3. GET /build/characters (published slugs)
  4. GET /build/products (published slugs)
  5. GET /collections/:slug (page data)
  6. GET /movies/:slug (page data)
  ... etc
  ↓
Web generates static HTML pages
  ↓
Deploy to CDN
```

### Runtime (Interactive Features)

```
Browser → CDN → Static HTML (works offline)
Browser → API → PostgreSQL (search, watchlists)
```

## Technology Stack

### Decided

| Aspect | Technology | Decision Source |
|--------|-----------|----------------|
| Frontend framework | React + TypeScript | ADR-002 |
| Frontend bundler | Vite | ADR-002 |
| Backend runtime | Node.js + TypeScript | Design doc |
| Database | PostgreSQL | Design doc |
| ORM | Prisma | Design doc |
| Architecture | Modular monolith | Design doc |
| Rendering | Static generation | Design doc |

### Open (Requires Owner Approval)

- API framework (Express, Fastify, Hono, etc.)
- React Router vs alternatives
- State management approach
- UI component library
- CSS approach
- Package versions
- CMS/admin interface
- Deployment providers
- Object storage provider
- Analytics vendor
- Runtime configuration

## Repository Naming Conventions

All folders and files use **kebab-case**:
- ✅ `this-is-correct`
- ❌ `This Is Wrong`
- ❌ `this_is_wrong`

## Development Workflow

Each application has independent development commands:

```bash
# Server development
cd server
npm install
npm run dev

# Web development
cd web
npm install
npm run dev
```

## Testing Strategy

Each application maintains its own test suite:

### Server Tests
- Unit tests (domain logic, validation)
- Integration tests (API endpoints)
- Database tests (PostgreSQL)
- API contract tests
- Monetary precision tests

### Web Tests
- Component tests (UI)
- Integration tests (page rendering)
- Static generation tests
- Accessibility tests
- Responsive layout tests

## Database Location

⚠️ **Important:** The Prisma schema lives in `server/prisma/schema.prisma`, **NOT** at the monorepo root.

This reinforces that:
- The database is owned by the server application
- The server is independently deployable
- The web application has no direct database access

## What This Is NOT

This is **not**:
- ❌ A workspace/monorepo with shared dependencies
- ❌ A yarn/pnpm workspace
- ❌ A lerna monorepo
- ❌ A turborepo setup
- ❌ A Next.js application (server-side rendering)
- ❌ A microservices architecture

This **is**:
- ✅ Two independent applications in one repository
- ✅ Shared contracts via intentional duplication
- ✅ Independent deployment and testing
- ✅ Static frontend + API backend architecture

## Launch Phases

Implementation proceeds through 10 sequential phases (see `.kiro/specs/collection-first-mvp/tasks.md`):

1. **Foundation** - Project structure and contracts (current)
2. **Data Model** - Prisma schema and migrations
3. **Content & Editorial** - Seed data and validation
4. **Public API** - Content endpoints
5. **Search** - PostgreSQL full-text search
6. **Static Generation** - Build-time page generation
7. **React UI** - Public pages and interactions
8. **Watchlists** - Anonymous shareable lists
9. **Analytics** - Event instrumentation
10. **Launch Review** - End-to-end verification

Each phase must complete before the next begins.
