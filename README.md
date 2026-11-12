# Horror Christmas

Horror Christmas is a collection-first destination for Christmas horror
culture. **Collections are the product**: they connect movies, characters,
products, folklore, collecting, and seasonal traditions into curated discovery
experiences.

## Project status

This repository currently contains product, architecture, and launch-planning
documents. It does **not** contain an implemented application, frontend
`src/`, Prisma schema, package manifests, or a runnable app. No app build or
runtime validation has been performed. The accepted frontend decision is React
+ TypeScript + Vite, with build-time static generation for public content;
Next.js is not the selected frontend.

## Start with the Kiro specifications

The native Kiro files are the reviewed execution source of truth:

1. [Requirements](.kiro/specs/collection-first-mvp/requirements.md)
2. [Design](.kiro/specs/collection-first-mvp/design.md)
3. [Phased tasks](.kiro/specs/collection-first-mvp/tasks.md) (all unchecked;
   implementation has not started)
4. Always-included [product steering](.kiro/steering/product.md),
   [technology steering](.kiro/steering/tech.md), and
   [structure steering](.kiro/steering/structure.md)

To continue in Kiro, open this same project root in the Kiro IDE. Review the
imported native spec and steering files, then ask Kiro to use the existing
`collection-first-mvp` spec before starting or executing tasks. Review the
requirements/design/task plan and approve any proposed changes before
implementation. This onboarding describes the intended process; it does not
claim that Kiro has been run or that an application exists.

Official Kiro references:

- [Specs](https://kiro.dev/docs/specs/)
- [Feature specs](https://kiro.dev/docs/specs/feature-specs/)
- [Steering](https://kiro.dev/docs/steering/)

## Documentation map

### Product and editorial references

- [Positioning and mission](docs/Positioning.md)
- [Original MVP specification](docs/MVP-Specification.md)
- [Collection model and discovery](docs/Collections.md)
- [Collection curation guide](docs/Collection-Curation-Guide.md)
- [User flows](docs/User-Flows.md)
- [Launch content inventory](docs/launch/Launch-Content.md)
- [Seed-content checklist](docs/launch/Seed-Content-Checklist.md)

### Technical references

- [Architecture](docs/Architecture.md)
- [Data model](docs/Data-Model.md)
- [API contracts](docs/API-Contracts.md)
- [Static content generation and SEO](docs/Content-Generation.md)
- [Original implementation sequence](docs/Implementation-Plan.md)
- [Building and Kiro workflow](docs/BUILDING.md)

### Accepted architecture decisions

- [ADR-001 — Collections are first-class entities](docs/adr/ADR-001.md)
- [ADR-002 — React + Vite frontend](docs/adr/ADR-002.md)
- [ADR-003 — Separate frontend and backend](docs/adr/ADR-003.md)
- [ADR-004 — Static public page generation](docs/adr/ADR-004.md)
- [ADR-005 — PostgreSQL source of truth](docs/adr/ADR-005.md)
- [ADR-006 — Modular domain backend](docs/adr/ADR-006.md)
- [ADR-007 — Curated before community-driven](docs/adr/ADR-007.md)
- [ADR-008 — PostgreSQL full-text search](docs/adr/ADR-008.md)
- [ADR-009 — Collections rank first in discovery](docs/adr/ADR-009.md)

## Source-of-truth and conflict policy

The native Kiro requirements, design, and tasks are the single execution
source of truth. Accepted ADRs remain authoritative for the decisions they
explicitly record. The original product, architecture, and implementation
documents are retained as detailed supporting references, not as a second
canonical task plan.

When a reference disagrees with a native spec or an accepted ADR, do not
silently assume precedence or proceed on an unreviewed interpretation. Record
the exact discrepancy and ask the product owner to approve a decision or ADR
change. After approval, update the native specification and affected
references together. Current reconciled decisions include React + TypeScript
+ Vite (not Next.js), at least 10 launch collections, and no existing app
implementation.

## MVP boundaries

The MVP focuses on curated collections, public content, collection-priority
search, static SEO-friendly pages, affiliate discovery, and anonymous
shareable movie watchlists. It does not include visitor accounts, reviews,
ratings, comments, discussions, forums, community features, user-created
collections, recommendation engines, marketplace transactions, or mobile
application implementation. The API and domain model should remain suitable
for future mobile clients.
