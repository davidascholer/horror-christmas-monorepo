---
inclusion: always
---

# Technology steering

## Accepted stack

- Frontend: React + TypeScript + Vite, delivered as a static application
  ([ADR-002](../../docs/adr/ADR-002.md)).
- Backend: separate Node.js + TypeScript application, organized as a
  domain-oriented modular monolith ([ADR-003](../../docs/adr/ADR-003.md),
  [ADR-006](../../docs/adr/ADR-006.md)).
- Persistence: PostgreSQL as the source of truth and Prisma as the primary ORM
  ([ADR-005](../../docs/adr/ADR-005.md)).
- Search: PostgreSQL full-text search initially
  ([ADR-008](../../docs/adr/ADR-008.md)).
- Public content delivery: build-time static page generation, complete HTML,
  then CDN-compatible static deployment ([ADR-004](../../docs/adr/ADR-004.md)).

Do not substitute Next.js for the accepted Vite frontend. Do not add runtime
server rendering for public content pages.

## Architecture constraints

The frontend and API are separate applications. The API is the shared business
interface for the website and future clients. Keep domain boundaries around
collections, movies, characters, products, search, and watchlists; do not
introduce microservices for the MVP.

Use explicit relational join models for content relationships. Preserve
collection ordering and directed related-collection links. Public APIs expose
published content using slugs. Product money uses fixed-precision decimal
values and explicit currency; never use implicit JavaScript-number conversion
for monetary calculations.

Static generation reads published slugs and detail models from the
PostgreSQL-backed API. Search and anonymous watchlists are API-driven.
Watchlist share tokens are bearer capabilities: keep them random/unguessable,
validate inputs, rate-limit anonymous operations in production, and never
expose internal watchlist IDs in share URLs. Update per-list ordering
transactionally.

## Do not assume undecided implementation choices

No API framework, package versions, CMS, deployment host, object-storage
provider, analytics vendor, or runtime configuration is selected by these
documents. Keep such decisions open until approved. Image storage may use
Cloudflare R2 or Amazon S3; hosting possibilities are examples, not selections.

Detailed system and contract references: [Architecture](../../docs/Architecture.md),
[Data Model](../../docs/Data-Model.md), [API Contracts](../../docs/API-Contracts.md),
[Content Generation](../../docs/Content-Generation.md), and
[ADRs 001–009](../../docs/adr/ADR-001.md).
