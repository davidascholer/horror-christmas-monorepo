---
inclusion: always
---

# Shared Types and Synchronization

## Repository Independence

The `web/` and `server/` directories are separate, independently deployable applications. Each must contain all code necessary for deployment. There is no shared code folder at the monorepo root.

## Shared Type Management

Certain TypeScript types and contracts must remain synchronized between `web/` and `server/`:

### API Contracts (must stay in sync)

**Location:**
- `server/src/types/api-contracts.ts` (source of truth)
- `web/src/types/api-contracts.ts` (copy)

**Contents:**
- `HomeResponse` and related types
- `CollectionSummary`, `MovieSummary`, `CharacterSummary`, `ProductSummary`
- Collection, Movie, Character, Product detail types
- `SearchResult` type
- Watchlist types and request/response shapes

### Synchronization Process

**When API contracts change:**
1. Update the contract in `server/src/types/api-contracts.ts`
2. Copy the updated types to `web/src/types/api-contracts.ts`
3. Verify both applications build successfully
4. Commit both changes together

**Agent responsibility:**
- When modifying API types, update both locations in the same task
- Flag any API type drift as an error
- Never create shared code folders outside `web/` or `server/`

### Non-Shared Code

The following are intentionally separate and should NOT be kept in sync:
- Database models (Prisma) - only in `server/`
- API implementation - only in `server/`
- React components - only in `web/`
- Build configurations - separate per app
- Dependencies - managed independently

## Folder Naming Convention

Use kebab-case for all folder and file names: `this-is-an-example`, never spaces.
