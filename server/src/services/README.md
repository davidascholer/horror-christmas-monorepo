# Services

Service layer for the Horror Christmas API. Services implement business logic and coordinate between repositories.

## Service Modules

### HomeService

Implements the `GET /home` endpoint logic for homepage content projection.

**Responsibilities:**
- Featured collections (featured=true, ordered by sortOrder)
- Seasonal collections (seasonal=true, ordered by sortOrder)  
- Featured movie (single item, featured=true)
- Featured character (single item, featured=true)
- Gift collection (slug "best-gifts-for-krampus-fans" or type=GIFT)

**Key rules:**
- All content must be PUBLISHED only
- Featured/seasonal items that don't exist return null or empty array
- Collections ordered by sortOrder (nulls last), then title

**Usage:**
```typescript
import { PrismaClient } from '@prisma/client';
import { HomeService } from './services/index.js';

const prisma = new PrismaClient();
const homeService = new HomeService(prisma);

const homepage = await homeService.getHome();
```

### CollectionService, MovieService, CharacterService, ProductService (Task 4.3)

| Route | Method | Missing/unpublished |
|-------|--------|---------------------|
| `GET /collections` | `CollectionService.listCollections({ featured, seasonal, type })` | n/a |
| `GET /collections/:slug` | `getCollection` / `getCollectionDetail` | `null` |
| `GET /collections/:slug/movies` | `getCollectionMovies` | `null` |
| `GET /collections/:slug/characters` | `getCollectionCharacters` | `null` |
| `GET /collections/:slug/products` | `getCollectionProducts` | `null` |
| `GET /collections/:slug/related` | `getRelatedCollections` | `null` |
| `GET /movies` | `MovieService.listMovies({ q, year, genre, page, pageSize })` | n/a (`RangeError` on invalid paging; `pageSize` defaults to 50, max 200, above is rejected) |
| `GET /movies/:slug` | `getMovie` / `getMovieDetail` | `null` |
| `GET /movies/:slug/collections` | `getMovieCollections` | `null` |
| `GET /characters` | `CharacterService.listCharacters` | n/a |
| `GET /characters/:slug` | `getCharacter` / `getCharacterDetail` | `null` |
| `GET /products` | `ProductService.listProducts` | n/a |
| `GET /products/:slug` | `getProduct` / `getProductDetail` | `null` |

`null` means the API layer should respond 404. An existing resource with no related items returns `[]`. Joins with `sortOrder` are returned in that order, and tags (which have no `sortOrder`) are ordered by name. Prices are two-decimal strings (`"12.50"`) and come with a currency. Media types are mapped to the contract values `FILM`/`TV_SPECIAL`/`TV_EPISODE`. The `/movies` query semantics are decided except response metadata: see "API Query Behavior" in `OPEN-DECISIONS.md`.

Tests use `test-fixtures.ts`, which builds a self-contained, uniquely prefixed catalog and does not depend on seed data.

## Design Principles

1. **Published content only**: All queries filter by `status: PUBLISHED`
2. **Repository composition**: Services use repositories for data access
3. **Business logic location**: Service methods contain domain logic and orchestration
4. **Type safety**: All services use strict TypeScript contracts from api-contracts.ts
5. **Testability**: Services are unit-testable with Prisma mocks or test database

## Testing

Each service has a corresponding `.test.ts` file with comprehensive test coverage:

- Unit tests for each method
- Published-only filtering
- Ordering and sorting logic
- Null handling for missing data
- Edge cases and error conditions

Run service tests:
```bash
npm test -- services/
```

## Adding a New Service

1. Create `service-name.service.ts` in this directory
2. Implement service class with Prisma dependency injection
3. Create `service-name.service.test.ts` with comprehensive tests
4. Export service from `index.ts`
5. Update this README with service documentation

## Route table and contract tests (Task 4.4)

`server/src/api/routes.ts` is a framework-neutral route table (method, path, service mapping, query parsing, 200/404/400 mapping) for a future HTTP adapter. `server/src/api/routes.test.ts` asserts it against `api-contracts.ts`. The HTTP framework is still an open decision.
