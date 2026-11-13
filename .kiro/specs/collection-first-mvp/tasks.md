# Implementation Plan: Horror Christmas — Collection-First MVP

## Overview

This document contains the phased implementation tasks for the Horror Christmas Collection-First MVP. All tasks are intentionally unchecked as no application code, dependencies, or runtime configuration have been created yet.

Work through these phases sequentially. Do not start a later phase until the previous phase's deliverables and required tests pass. A failure at a phase checkpoint must be resolved before proceeding. This is the single execution task list; the original [implementation plan](../../../docs/Implementation-Plan.md) is a supporting reference only.

## Task Dependency Graph

```json
{
  "waves": [
    {"name": "Phase 1: Foundation", "tasks": [1]},
    {"name": "Phase 2: Data Model", "tasks": [2]},
    {"name": "Phase 3: Content & Editorial", "tasks": [3]},
    {"name": "Phase 4: Public API", "tasks": [4]},
    {"name": "Phase 5: Search", "tasks": [5]},
    {"name": "Phase 6: Static Generation", "tasks": [6]},
    {"name": "Phase 7: React UI", "tasks": [7]},
    {"name": "Phase 8: Watchlists", "tasks": [8]},
    {"name": "Phase 9: Analytics", "tasks": [9]},
    {"name": "Phase 10: Launch Review", "tasks": [10]}
  ]
}
```

**Dependency Rules:**
- Each phase must be completed before the next phase begins
- Within each phase, tasks may have sub-task dependencies  
- Phases 1-4 are strictly sequential
- Phases 5 and 6 can proceed in parallel after Phase 4
- Phase 7 requires both Phases 5 and 6 to be complete
- Phases 7-10 are strictly sequential

## Tasks

### Phase 1 — Foundation and contracts

- [x] 1. Establish the separate React + TypeScript + Vite web application, Node.js + TypeScript API application, shared API/domain contracts, repository tooling, and a repeatable local development/test workflow; do not select unapproved package versions, backend framework, CMS, deployment provider, or runtime configuration.
  - [x] 1.1 Create the agreed web/API/shared-code/Prisma project boundaries and document their responsibilities.
  - [x] 1.2 Define API-level shared types and service boundaries from the approved contracts without inventing fields not supported by the source contract.
  - [x] 1.3 Add and run foundation checks for the selected project structure and test commands; record explicit decisions still needing owner approval.
  
  _Requirements: Requirement 1 (criteria 1.1–1.4); Requirement 10 (criteria 10.1–10.8); Requirement 11 (criterion 11.1); Requirement 15 (criterion 15.3); Requirement 16 (criteria 16.1–16.5)._

### Phase 2 — Relational domain model

- [x] 2. Implement the PostgreSQL/Prisma knowledge graph and verify its integrity before loading launch content.
  - [x] 2.1 Implement Collection, Movie, Character, Product, Franchise, Tag, AffiliateLink, Watchlist, WatchlistMovie, publishing status, slugs, timestamps, indexes, and fixed-precision product price/currency fields.
  - [x] 2.2 Implement every explicit join model, composite uniqueness, sort/order and curator-note fields, directed related-collection relation, and documented cascade/set-null behavior.
  - [x] 2.3 Create and apply migrations to a disposable development/test database; test schema constraints, optional relationships, ordering, price precision, and status values.
  - [x] 2.4 Add domain/API serialization tests proving that money retains decimal precision and currency and that public routes use slugs rather than internal IDs.
  
  _Requirements: Requirement 4 (criteria 4.7–4.8); Requirement 5 (criteria 5.1–5.5); Requirement 11 (criteria 11.1–11.8)._

### Phase 3 — Editorial workflow and launch seed content

- [x] 3. Create launch seed data and editorial publication validation; pass the content inventory checkpoint before building public experiences.
  - [x] 3.1 Implement validation for required collection introduction, curator notes, hero image/alt text, SEO metadata, at least one movie, and at least one related collection; validate SEO title/description for every launch entity.
  - [x] 3.2 Create all ten named launch collections and make their collection types, sequence/order, curator guidance, and related-collection relationships explicit.
  - [x] 3.3 Seed at least 50 movies, 20 characters, 50 products, 5 franchises, and 20 tags; include the named example characters, franchises, and product categories in the requirements.
  - [x] 3.4 Verify all collection/entity relationships, missing-membership editorial warnings, recommended 5–15 collection item guidance, statuses, slugs, and launch metadata with seed-data tests.
  - [x] 3.5 Complete any missing launch metadata in the seed content, then publish the seed catalog in the local development database so the public API and static generator operate on real PUBLISHED data; publish only records that pass the publication validators and report every record that cannot be published.
  
  _Requirements: Requirement 3 (criteria 3.1–3.8); Requirement 4 (criteria 4.1–4.6, 4.8); Requirement 5 (criteria 5.2–5.5); Requirement 6 (criteria 6.1–6.7); Requirement 12 (criteria 12.1–12.6); Requirement 17 (criteria 17.1–17.5)._

### Phase 4 — Public API and content projections

- [x] 4. Implement and contract-test the public homepage, collection, movie, character, and product APIs.
  - [x] 4.1 Implement published-only list/detail queries, stable slug routes, documented filters, ordered relationships, null handling, ISO-8601 timestamps, and 404 behavior.
  - [x] 4.2 Implement `GET /home` with the exact HomeResponse field names and nullable featured movie/character/gift collection.
  - [x] 4.3 Implement all collection, movie, character, and product routes and their source-defined detail projections, including related content and affiliate destinations.
  - [x] 4.4 Add API contract tests for every method/path, optional query parameter, status behavior, serialized response shape, public content boundary, and decimal-safe product price representation.
  
  _Requirements: Requirement 2 (criteria 2.1–2.5); Requirement 4 (criteria 4.1–4.8); Requirement 9 (criterion 9.2); Requirement 10 (criteria 10.1–10.6, 10.8); Requirement 11 (criteria 11.2–11.7); Requirement 12 (criteria 12.1–12.6); Requirement 18 (criteria 18.1, 18.3)._

### Phase 5 — Collection-first search

- [x] 5. Implement PostgreSQL full-text search across the four MVP entity types and verify exact ranking behavior.
  - [x] 5.1 Implement `GET /search?q={query}` with the exact SearchResult fields, published-only records, and empty results for empty/whitespace queries.
  - [x] 5.2 Add tests proving category ordering is collections, movies, characters, products for mixed matches and that slugs/IDs/summaries are serialized correctly.
  
  _Requirements: Requirement 1 (criteria 1.1–1.3); Requirement 7 (criteria 7.1–7.5); Requirement 10 (criteria 10.1, 10.2, 10.6); Requirement 11 (criterion 11.6); Requirement 13 (criterion 13.3)._

### Phase 6 — Build-time static generation and SEO

- [x] 6. Implement the dedicated static content-generation pipeline using the Vite/React application, then validate the generated output independently of runtime API availability.
  - [x] 6.1 Fetch published slugs from `/build/collections`, `/build/movies`, `/build/characters`, and `/build/products`, then retrieve their public page models.
  - [x] 6.2 Generate complete static HTML/routes for each published collection, movie, character, and product from shared page templates; do not use Next.js or runtime rendering.
  - [x] 6.3 Generate page titles, meta descriptions with the documented fallback order, canonical URLs, Open Graph metadata, and appropriate Schema.org data.
  - [x] 6.4 Generate `/sitemap.xml` and `robots.txt` from published content, including the administrative-route exclusion.
  - [x] 6.5 Implement internal-link priorities, responsive/WebP/lazy image delivery hooks and fallback behavior; make missing collections emit a build warning and publication errors fail validation.
  - [x] 6.6 Test static routes, metadata, structured data, sitemap/robots output, fallback behavior, unpublished-content exclusion, and availability of generated pages with the API stopped after build.
  
  _Requirements: Requirement 1 (criteria 1.1–1.4); Requirement 3 (criteria 3.1–3.8); Requirement 4 (criteria 4.1–4.8); Requirement 9 (criteria 9.1–9.8); Requirement 10 (criteria 10.1, 10.2); Requirement 11 (criteria 11.2, 11.6, 11.7); Requirement 12 (criteria 12.1, 12.2, 12.6); Requirement 15 (criteria 15.1, 15.2, 15.4); Requirement 17 (criterion 17.4); Requirement 18 (criteria 18.1–18.3)._

### Phase 7 — React visitor experience

- [ ] 7. Build the public collection-first React experience on the approved Vite frontend and test its navigation and usability.
  - [x] 7.1 Build the homepage with hero, featured/seasonal collections, featured character/movie, and gift discovery from the homepage API projection.
  - [ ] 7.2 Build collection pages with ordered content, collection context/curator guidance, related collections, and useful next-step links.
  - [ ] 7.3 Build movie, character, and product pages with their required details, related relationships, collection links, trailers/images, and affiliate destinations where available.
  - [ ] 7.4 Build unified search interaction against the search API and ensure collection-priority results remain clear and navigable.
  - [ ] 7.5 Verify responsive layouts, keyboard/accessibility behavior, image alt text/fallbacks, static page usability before client interaction, and collection-first navigation across the documented user flows.
  
  _Requirements: Requirement 1 (criteria 1.1–1.4); Requirement 2 (criteria 2.1–2.5); Requirement 3 (criteria 3.1–3.8); Requirement 4 (criteria 4.1–4.6); Requirement 7 (criteria 7.1–7.4); Requirement 15 (criteria 15.2, 15.3, 15.5); Requirement 17 (criteria 17.1, 17.3–17.5)._

### Phase 8 — Anonymous watchlists

- [ ] 8. Implement and verify anonymous shareable watchlists without adding accounts or exposing internal IDs.
  - [ ] 8.1 Implement all five watchlist routes, random unguessable token generation, optional title, bearer read/write access, and request-body validation.
  - [ ] 8.2 Implement add/remove/complete operations with ordered movie details, completion timestamps, duplicate prevention, and transactional ordering on insert/remove/reindex; do not add a client reorder route without owner-approved API shape.
  - [ ] 8.3 Build watchlist creation, viewing, editing, completion, and sharing interactions; use only the share token in public share URLs.
  - [ ] 8.4 Add API, transaction, authorization-capability, URL privacy, request validation, and UI tests; verify production rate limiting is configured without requiring user accounts.
  
  _Requirements: Requirement 8 (criteria 8.1–8.8); Requirement 10 (criteria 10.7, 10.8); Requirement 11 (criteria 11.3, 11.4, 11.8); Requirement 13 (criterion 13.4); Requirement 16 (criteria 16.1, 16.5); Requirement 17 (criteria 17.2, 17.5); Requirement 18 (criteria 18.4, 18.5)._

### Phase 9 — Analytics instrumentation

- [ ] 9. Instrument MVP discovery, engagement, commerce, and retention measures without selecting an unapproved vendor or adding speculative persistence.
  - [ ] 9.1 Emit collection, movie, character, and product view events; capture collection shares/time, collection-to-entity and related-collection navigation, and search usage.
  - [ ] 9.2 Emit watchlist created/shared and affiliate-click events, including collection origin when available; support pages/session and returning/seasonal visit measures.
  - [ ] 9.3 Test event emission and payload source attribution and document the analytics-provider decision as open if none has been approved.
  
  _Requirements: Requirement 13 (criteria 13.1–13.6); Requirement 14 (criteria 14.3, 14.6)._

### Phase 10 — Integrated launch-readiness checkpoint

- [ ] 10. Complete an end-to-end technical, editorial, and product launch review; do not declare launch readiness while a required gate is unmet.
  - [ ] 10.1 Run affected-unit and whole-solution builds and tests; verify no warnings/errors are left in touched units and document any environment-dependent check.
  - [ ] 10.2 Re-run inventory and editorial checks for all named collections and minimum entity counts, collection completeness, SEO title/description coverage, collection hero/alt text, and curator notes.
  - [ ] 10.3 Review performance, accessibility, SEO, mobile responsiveness, static generation, analytics, functional search/watchlists, and affiliate-link operation; record evidence and any accepted limitation.
  - [ ] 10.4 Walk through homepage discovery, search discovery, character and product discovery, anonymous watchlist creation/sharing, seasonal collection use, and return exploration end-to-end.
  - [ ] 10.5 Confirm MVP exclusions remain absent and evaluate success using collection engagement, multi-page exploration, watchlists, returning visits, search use, organic traffic, and contextual affiliate clicks.
  
  _Requirements: Requirement 6 (criteria 6.1–6.7); Requirement 8 (criteria 8.1–8.8); Requirement 12 (criteria 12.1–12.6); Requirement 13 (criteria 13.1–13.6); Requirement 14 (criteria 14.1–14.6); Requirement 15 (criteria 15.1–15.5); Requirement 16 (criteria 16.1–16.5); Requirement 18 (criteria 18.1–18.5)._

## Notes

- **Status:** All implementation tasks are intentionally unchecked. No application code, dependencies, or runtime configuration have been created by this documentation conversion.
- **Monorepo structure:** This root folder is the monorepo containing both the frontend and backend applications.
- **Sequential execution:** Work through phases in order. Phase failures must be resolved before proceeding.
- **Reference documents:** The original [implementation plan](../../../docs/Implementation-Plan.md) and other docs are supporting references, not a second execution checklist.
- **Open decisions:** Some implementation choices (API framework, package versions, CMS, deployment provider, object storage, analytics vendor) remain open and require owner approval before selection.
