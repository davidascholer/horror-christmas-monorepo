# Repository Layer

This directory contains the repository layer for published content queries. All repositories follow consistent patterns for filtering, lookup, serialization, and null handling.

## Core Principles

### 1. Published-Only Queries
All repositories filter for `status = PUBLISHED` by default. Draft and archived content is excluded from public queries.

```typescript
// Example: Only published collections
const collections = await collectionRepo.list();
// Returns only collections with status = PUBLISHED
```

### 2. Slug-Based Lookups
All detail queries use stable slugs instead of internal database IDs.

```typescript
// Example: Lookup by slug
const movie = await movieRepo.findBySlug('krampus-2015');
// Returns null if not found or not published
```

### 3. 404 Behavior (Return Null)
Missing or unpublished slugs return `null` (not throw errors). The API layer converts null to 404 responses.

```typescript
// Example: Missing slug returns null
const collection = await collectionRepo.findBySlug('does-not-exist');
if (!collection) {
  // API layer will return 404
}
```

### 4. Ordered Relationships
Relationships preserve editorial `sortOrder` (ascending).

```typescript
// Example: Movies ordered in collection
const movies = await collectionRepo.getMovies('essential-krampus');
// Returns movies ordered by sortOrder ASC
// Each movie includes its curatorNote if present
```

### 5. Null Handling
Optional fields serialize as `null` (not `undefined`). No data fabrication.

```typescript
// Example: Null values preserved
const movie = await movieRepo.findBySlug('some-movie');
// movie.runtime could be null if not set
// Never fabricated or replaced with defaults
```

### 6. ISO-8601 Timestamps
All Date objects serialize to ISO-8601 strings using `toISOString()`.

```typescript
// Example: ISO-8601 timestamps
const collection = await collectionRepo.findBySlug('winter-monsters');
// collection.createdAt: "2024-01-15T10:30:00.000Z"
// collection.publishedAt: "2024-01-20T14:00:00.000Z" | null
```

### 7. Decimal Serialization
Product prices preserve fixed-precision decimal values as strings for JSON safety.

```typescript
// Example: Decimal price serialization
const product = await productRepo.findBySlug('krampus-figure');
// product.price: "29.99" (string, not number)
// product.currency: "USD"
```

## Available Repositories

### CollectionRepository

Handles collection queries with filtering and relationships.

**List Methods:**
- `list(filters?)` - List published collections with optional filters
  - `featured?: boolean` - Filter by featured flag
  - `seasonal?: boolean` - Filter by seasonal flag
  - `type?: CollectionType` - Filter by collection type

**Detail Methods:**
- `findBySlug(slug)` - Get collection by slug
- `getMovies(slug)` - Get ordered movies with curator notes
- `getCharacters(slug)` - Get ordered characters with curator notes
- `getProducts(slug)` - Get ordered products with curator notes
- `getFranchises(slug)` - Get ordered franchises
- `getTags(slug)` - Get tags
- `getRelatedCollections(slug)` - Get ordered related collections
- `getDetail(slug)` - Get complete detail with all relationships

**Example:**
```typescript
import { CollectionRepository } from './repositories/index.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const repo = new CollectionRepository(prisma);

// List featured collections
const featured = await repo.list({ featured: true });

// Get full collection detail
const detail = await repo.getDetail('essential-krampus');
if (detail) {
  console.log(detail.title);
  console.log(detail.movies); // Ordered with curator notes
  console.log(detail.relatedCollections); // Ordered related collections
}
```

### MovieRepository

Handles movie queries and relationships.

**List Methods:**
- `list()` - List all published movies (ordered by year desc, title asc)

**Detail Methods:**
- `findBySlug(slug)` - Get movie by slug
- `getCharacters(slug)` - Get ordered characters with roles
- `getCollections(slug)` - Get collections containing this movie
- `getTags(slug)` - Get tags
- `getRelatedProducts(slug)` - Get products related via shared characters
- `getDetail(slug)` - Get complete detail with all relationships

**Example:**
```typescript
const repo = new MovieRepository(prisma);

const movie = await repo.findBySlug('krampus-2015');
if (movie) {
  console.log(movie.releaseDate); // ISO-8601 string or null
  console.log(movie.runtime); // number or null
  console.log(movie.franchise); // FranchiseSummary or null
}

// Get characters in this movie
const characters = await repo.getCharacters('krampus-2015');
// Each character includes role and sortOrder
```

### CharacterRepository

Handles character queries and relationships.

**List Methods:**
- `list()` - List all published characters (ordered by name asc)

**Detail Methods:**
- `findBySlug(slug)` - Get character by slug
- `getMovies(slug)` - Get movies featuring this character
- `getProducts(slug)` - Get products related to this character
- `getCollections(slug)` - Get collections containing this character
- `getTags(slug)` - Get tags
- `getDetail(slug)` - Get complete detail with all relationships

**Example:**
```typescript
const repo = new CharacterRepository(prisma);

const character = await repo.findBySlug('krampus');
if (character) {
  console.log(character.biography); // string or null
  console.log(character.franchise); // FranchiseSummary or null
}

// Get all movies featuring this character
const movies = await repo.getMovies('krampus');
```

### ProductRepository

Handles product queries with decimal-safe price serialization.

**List Methods:**
- `list()` - List all published products (ordered by name asc)

**Detail Methods:**
- `findBySlug(slug)` - Get product by slug (includes affiliate links)
- `getCharacters(slug)` - Get ordered characters related to this product
- `getCollections(slug)` - Get collections containing this product
- `getTags(slug)` - Get tags
- `getDetail(slug)` - Get complete detail with all relationships

**Example:**
```typescript
const repo = new ProductRepository(prisma);

const product = await repo.findBySlug('krampus-ornament');
if (product) {
  console.log(product.price); // "19.99" as string (decimal-safe)
  console.log(product.currency); // "USD"
  console.log(product.affiliateLinks); // Array of affiliate links
}

// Get characters related to this product
const characters = await repo.getCharacters('krampus-ornament');
// Ordered by sortOrder
```

## Shared Utilities

### `PUBLISHED_ONLY_FILTER`
Standard filter constant for published content:
```typescript
const PUBLISHED_ONLY_FILTER = {
  status: ContentStatus.PUBLISHED,
};
```

### `serializeTimestamp(date)`
Converts Date to ISO-8601 string or null:
```typescript
serializeTimestamp(new Date()); // "2024-01-15T10:30:00.000Z"
serializeTimestamp(null); // null
```

### `serializeDecimal(decimal)`
Converts Prisma Decimal to string or null:
```typescript
serializeDecimal(new Decimal('29.99')); // "29.99"
serializeDecimal(null); // null
```

## Testing

Comprehensive tests verify:
- ✅ Published-only filtering (drafts/archived excluded)
- ✅ Slug-based lookups
- ✅ Filter support (featured, seasonal, type)
- ✅ Ordered relationships (sortOrder preserved)
- ✅ Null handling (no undefined values)
- ✅ ISO-8601 timestamp serialization
- ✅ Decimal price serialization
- ✅ 404 behavior (null returns)
- ✅ Cross-repository integration

Run tests:
```bash
npm test -- repositories.test.ts
```

## Design References

- **Design Document**: `.kiro/specs/collection-first-mvp/design.md` Section 4 (Components and Interfaces)
- **Requirements**: Requirements 10.1-10.2, 11.2-11.7
- **API Contracts**: `server/src/types/api-contracts.ts`

## Next Steps

Task 4.2+ will build the API layer on top of these repositories:
- `GET /home` - Homepage projection
- `GET /collections`, `GET /collections/:slug` - Collection endpoints
- `GET /movies/:slug`, `GET /characters/:slug`, `GET /products/:slug` - Detail endpoints
- All endpoints will use these repositories for consistent published-only queries
