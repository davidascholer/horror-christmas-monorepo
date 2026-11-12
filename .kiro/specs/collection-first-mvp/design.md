# Horror Christmas — Collection-First MVP Design

This design turns the requirements into a technical shape without selecting
unapproved frameworks, package versions, hosting products, or runtime
configuration. The accepted architecture decisions are in [ADRs 001–009](../../../docs/adr/ADR-001.md);
the detailed source references remain in [Architecture](../../../docs/Architecture.md),
[Data Model](../../../docs/Data-Model.md), [API Contracts](../../../docs/API-Contracts.md),
[Content Generation](../../../docs/Content-Generation.md), [Collections](../../../docs/Collections.md),
and [User Flows](../../../docs/User-Flows.md).

## 1. Design principles and scope

- Collections are the primary product and experience layer; the remaining
  catalog entities provide structured content for collections.
- The frontend is React + TypeScript + Vite, as decided by ADR-002. It is a
  static application; this design does not use Next.js or require server-side
  rendering.
- The frontend and backend are separate applications. The backend is a
  Node.js/TypeScript modular monolith, organized around domain modules.
- PostgreSQL is the source of truth; Prisma is the ORM.
- Public content pages are generated as static HTML at build time from
  PostgreSQL-backed API data and deployed as CDN-compatible assets. Search and
  anonymous watchlists remain API-driven.
- Content is platform-curated. No visitor accounts or public user-generated
  content are required.
- Database and API contracts remain reusable by future clients, including
  mobile clients; mobile application implementation is out of MVP scope.
- Keep implementation choices not settled by an accepted ADR unresolved until
  the owner explicitly decides them. In particular, do not assume an API
  framework, CMS, package versions, deployment provider, object-storage
  provider, or runtime configuration.

## 2. System context and repository shape

```text
Browser
  ├─ Static React + TypeScript + Vite site (CDN)
  │    ├─ Build-generated public pages
  │    └─ Interactive search / anonymous watchlists
  └─ HTTPS API
       └─ Node.js + TypeScript modular monolith
            ├─ Collections
            ├─ Movies
            ├─ Characters
            ├─ Products / affiliate links
            ├─ Search
            └─ Watchlists
                 └─ Prisma
                      └─ PostgreSQL (authoritative data)
```

The public pages are generated at build time by a dedicated generation
pipeline that uses the Vite/React application and its page templates. Vite is
the frontend bundler, not an instruction to introduce a server-rendered
framework. The generator produces static routes for published content. The
React application provides client-side navigation and interactions for those
assets; server-side rendering at request time is not part of this design.

The API is independently deployable and is the shared business interface for
the website and future clients. A single modular backend is sufficient for the
MVP; microservices are not proposed. A pragmatic source layout may separate
web, API, shared contracts, and Prisma assets, but no file or directory layout
is mandatory until implementation is planned. The original implementation
plan is a supporting reference, not a second execution checklist.

## 3. Frontend and page experience

### 3.1 Routes and page responsibilities

Public canonical routes use slugs:

| Route | Page purpose | Principal content |
|---|---|---|
| `/` | Homepage discovery | Hero, featured and seasonal collections, featured character/movie, gift collection |
| `/collections/{slug}` | Primary curated experience | Hero, introduction, curator notes, ordered movies/characters/products/franchises, related collections |
| `/movies/{slug}` | Movie discovery | Movie information, trailer, characters, collections, related products, add-to-watchlist |
| `/characters/{slug}` | Character discovery | Biography/origin, movies, products, collections, franchise and tags |
| `/products/{slug}` | Commerce discovery | Product information/images, price when known, affiliate links, related characters and collections |
| Search interaction | Cross-catalog discovery | Collection-first results from the API |
| Watchlist interaction | Anonymous list management | Title, ordered movies, completion state, shareable bearer URL |

Collection, movie, character, and product pages are generated from published
content. Search and watchlists use the API at runtime. Homepage content is
curated from the API projection; the public homepage itself is statically
generated or served as a static route, with only interactive features making
runtime requests.

### 3.2 Collection presentation

A collection is a curated experience, not a tag, category, search result, or
automatically generated list. Each published collection presents its hero,
introduction, required curator notes, ordered content, and related collections.
Movies, characters, and products may be separate ordered sections. Franchises
and tags are also represented as relationships and available to relevant
projections. Relationship-specific curator notes accompany the corresponding
item.

The editorial model supports CHARACTER, THEME, BEGINNER, GIFT,
SEASONAL_CHALLENGE, and TRADITION collection types. Every published collection
has at least one movie and one related collection. The curation guide's
recommended size is 5–15 items, with no strict maximum. Its editorial notes
answer why the collection exists, who it is for, where to start, and what to do
next. Archive status keeps an item addressable for history but does not make
it public by default.

### 3.3 Client interactions and accessibility

The React client handles navigation, search input/results, watchlist actions,
and completion toggles. Keep static page content useful before client
JavaScript is required. Public templates need responsive layouts and image
alt-text support. Image delivery should support responsive variants, WebP,
lazy loading, and a fallback. Accessibility and mobile responsiveness are
launch-review gates; no numeric performance or conformance threshold is
specified by the source documents.

## 4. Backend modules and API contracts

The API is a domain-oriented modular monolith with the following ownership:

| Module | Responsibility |
|---|---|
| Collections | Published collection lists/detail, ordered composition, related collections, homepage collection projections |
| Movies | Movie retrieval and movie-to-character/collection/product relationships |
| Characters | Character retrieval and relationships |
| Products | Product retrieval and affiliate destinations |
| Search | PostgreSQL full-text search across the four searchable entity types and ranking |
| Watchlists | Anonymous token-protected creation, retrieval, membership, ordering, and completion |

Each module owns its domain behavior and encapsulates its data access where
practical. Modules communicate through defined interfaces. PostgreSQL
transactions are used for watchlist order changes.

### 4.1 Shared conventions

- Public item routes use unique stable slugs, never database IDs.
- List responses are JSON arrays; missing single resources return HTTP 404.
- Query parameters are URL-encoded and timestamps are ISO-8601.
- Unavailable optional data is `null`; consumers must not infer an unknown
  rating or runtime.
- Public content APIs return published records only; drafts and archived
  content remain out of public discovery unless an explicit policy permits
  otherwise.
- Product monetary values preserve fixed-precision decimal semantics and an
  explicit three-character currency code across JSON serialization.

### 4.2 Homepage contract

```http
GET /home
```

```ts
type HomeResponse = {
  featuredCollections: CollectionSummary[];
  seasonalCollections: CollectionSummary[];
  featuredMovie: MovieSummary | null;
  featuredCharacter: CharacterSummary | null;
  giftCollection: CollectionSummary | null;
};
```

### 4.3 Public content endpoints

```http
GET    /collections
GET    /collections/:slug
GET    /collections/:slug/movies
GET    /collections/:slug/characters
GET    /collections/:slug/products
GET    /collections/:slug/related

GET    /movies
GET    /movies/:slug
GET    /movies/:slug/collections

GET    /characters
GET    /characters/:slug

GET    /products
GET    /products/:slug
```

`GET /collections` accepts optional `featured`, `seasonal`, and `type` filters.
Its detail projection includes introduction, curator notes, hero and SEO
metadata, and ordered relationships to movies, characters, products,
franchises, tags, and related collections.

`GET /movies` accepts optional `q`, `year`, `genre`, and pagination parameters.
Movie detail includes title, release information, runtime, synopsis, poster,
trailer, characters, collections, tags, and related products.

Character detail includes biography, related movies, products, collections,
franchise, and tags. Product detail includes description, category, image,
price/currency when known, affiliate links, related characters, and
collections. Affiliate URLs are outbound destinations; purchasing, inventory,
and marketplace transactions are not handled.

The contract source does not define pagination parameter names, page-size
limits, or the full serialized shapes of every entity. Keep those details
explicitly open for implementation-time contract definition rather than
silently inventing them.

### 4.4 Search contract

```http
GET /search?q={query}
```

```ts
type SearchResult = {
  type: "collection" | "movie" | "character" | "product";
  id: string;
  slug: string;
  title: string;
  summary: string;
};
```

Search spans collections, movies, characters, and products. Results use
category priority `collections → movies → characters → products`. An empty or
whitespace-only query returns an empty result list. PostgreSQL full-text search
is the initial search mechanism; the initial model does not require persisted
search-vector Prisma entities or an external search service.

### 4.5 Anonymous watchlist contracts

```http
POST   /watchlists
GET    /watchlists/:shareToken
POST   /watchlists/:shareToken/movies
DELETE /watchlists/:shareToken/movies/:movieId
PATCH  /watchlists/:shareToken/movies/:movieId
```

- Creation accepts `{ "title": "..." }`; title is optional. It returns a
  watchlist with a random, unguessable `shareToken`.
- Add accepts `{ "movieId": "..." }`.
- Patch accepts `{ "completed": true }` or `{ "completed": false }`.
- List items include movie details, order, and completion state.
- The share token is a bearer capability: anyone holding it may read and
  modify the list. Do not put an internal watchlist ID in the share URL.
- Validate bodies and rate-limit anonymous operations in production.
- Watchlist rows persist manual order, `addedAt`, and optional `completedAt`.
  Initial order follows add sequence; unique per-list order is maintained
  transactionally during insertion, removal, and internal reindexing.

The source API contract defines no client reorder route or reorder request
shape. Therefore the MVP API above remains exact: do not infer an additional
route, overload the completion patch body, or implement a drag/reorder control.
If visitor-controlled reordering is desired, obtain owner approval for a
specific route and request/response shape and update the requirements, design,
and tasks before implementing it. The database order field and transactional
maintenance still preserve the list's current sequence.

The frontend-facing service signatures from the source contract are:

```ts
interface HorrorChristmasApi {
  getHome(): Promise<HomeContent>;
  listCollections(): Promise<Collection[]>;
  getCollection(slug: string): Promise<Collection | null>;
  listMovies(): Promise<Movie[]>;
  getMovie(slug: string): Promise<Movie | null>;
  listCharacters(): Promise<Character[]>;
  getCharacter(slug: string): Promise<Character | null>;
  listProducts(): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
  search(query: string): Promise<SearchResult[]>;
  createWatchlist(title?: string): Promise<Watchlist>;
  getWatchlist(shareToken: string): Promise<Watchlist | null>;
  addMovieToWatchlist(shareToken: string, movieId: string): Promise<Watchlist>;
  removeMovieFromWatchlist(
    shareToken: string,
    movieId: string,
  ): Promise<Watchlist>;
  setWatchlistMovieCompleted(
    shareToken: string,
    movieId: string,
    completed: boolean,
  ): Promise<Watchlist>;
}
```

## 5. Relational domain model

PostgreSQL is the authoritative store for the Christmas Horror Knowledge
Graph. Prisma models records and explicit joins. IDs are opaque Prisma
`cuid()` values; slugs are unique within each entity table and form canonical
public paths. Content records use `createdAt` and `updatedAt`; Prisma Client
maintains `updatedAt`.

### 5.1 Entity records

| Entity | Core / optional fields and behavior |
|---|---|
| Collection | Unique `slug`, `title`, `type`, required `introduction` and `curatorNotes`; optional `summary`, hero image/alt text, SEO title/description, featured/seasonal flags, homepage `sortOrder`, status, and `publishedAt` |
| Movie | Unique `slug`, `title`, `mediaType`, status; optional synopsis, original title, release year/date, runtime, poster/hero, trailer URL, SEO metadata, featured flag, and franchise |
| Character | Unique `slug`, `name`, status; optional summary, biography, image, SEO metadata, featured flag, and franchise |
| Product | Unique `slug`, `name`, status; optional description, category, image/alt text, fixed-precision price and currency, SEO metadata, featured flag, and franchise |
| Franchise | Groups related movies, characters, products, and collections; references from content are optional |
| Tag | Unique slug and optional description; vocabulary and assignment are platform-owned, not user-generated |
| AffiliateLink | Separate outbound provider/destination records related to products, allowing multiple providers per product |
| Watchlist | Optional title, unique random `shareToken`; no user/account relation |
| WatchlistMovie | Movie membership with unique per-list `sortOrder`, `addedAt`, and optional `completedAt` |

`ContentStatus` values are `DRAFT`, `PUBLISHED`, and `ARCHIVED`. Draft means
incomplete/not public; published means eligible for public APIs/static
generation; archived is retained for editorial/history but not automatically
included in discovery. Status and `publishedAt` do not replace editorial
publication validation.

### 5.2 Relationships and join data

| Relationship | Join model | Relationship data |
|---|---|---|
| Collection ↔ Movie | `CollectionMovie` | `sortOrder`, optional `curatorNote` |
| Collection ↔ Character | `CollectionCharacter` | `sortOrder`, optional `curatorNote` |
| Collection ↔ Product | `CollectionProduct` | `sortOrder`, optional `curatorNote` |
| Collection ↔ Franchise | `CollectionFranchise` | `sortOrder` |
| Collection ↔ Tag | `CollectionTag` | — |
| Movie ↔ Character | `MovieCharacter` | optional `role`, `sortOrder` |
| Movie ↔ Tag | `MovieTag` | — |
| Character ↔ Tag | `CharacterTag` | — |
| Product ↔ Tag | `ProductTag` | — |
| Product ↔ Character | `ProductCharacter` | `sortOrder` |
| Collection ↔ Collection | `CollectionRelated` | directed relation, `sortOrder` |
| Watchlist ↔ Movie | `WatchlistMovie` | `sortOrder`, `addedAt`, `completedAt` |

Joins use composite primary keys so an endpoint pair cannot be duplicated.
Collection item ordering is per entity type; clients may show separate
sections. Related-collection edges are directional. Deleting either endpoint
cascades its joins; deleting a franchise sets optional franchise references to
null. Indexes should support published/featured lookups, release-year and
franchise filters, and ordered relationship lookups.

The model deliberately omits accounts, roles, editorial audit history,
reviews, ratings, comments, user collections, inventory/order management, and
affiliate-click event persistence.

## 6. Publication and static-generation pipeline

### 6.1 Publishing validation

Before publication, validate the content-specific fields, relationships, and
launch checklist. A collection must have its required introduction and curator
notes, a hero image with alt text, SEO title/description, at least one movie,
and at least one related collection. The launch inventory requires SEO titles
and descriptions for every collection, movie, character, and product, plus
curator notes for every collection. Do not rely solely on database
nullability or silently publish incomplete records.

Public list/detail APIs and static generation include published records only.
Drafts and archived records are excluded unless an explicit content policy is
approved. Collection archives remain addressable according to that policy,
but do not automatically appear in discovery or sitemap output.

### 6.2 Build-time generation sequence

1. **Discover slugs:** request published slugs from `/build/collections`,
   `/build/movies`, `/build/characters`, and `/build/products`.
2. **Retrieve page models:** request each slug from the corresponding public
   detail route (for example `GET /collections/essential-krampus`).
3. **Render pages:** use page templates for collection, movie, character, and
   product content, producing complete static HTML and associated frontend
   assets.
4. **Emit SEO/site files:** generate metadata, structured data, sitemap, and
   robots policy for the built site.
5. **Deploy:** publish generated assets to a CDN/static host. The original
   documents list Cloudflare Pages, Netlify, and Azure Static Web Apps as
   possibilities; provider selection is not part of this design.

The recommended MVP regeneration strategy is a full site build on deployment.
Manual and CI deployment builds may trigger generation. Scheduled nightly,
incremental, on-demand, preview, and editor-draft rebuilds are future options,
not MVP requirements.

### 6.3 SEO and internal discovery

- Page title: `{Entity Name} | Horror Christmas`, unless an SEO title is
  supplied.
- Meta description fallback: `seoDescription`, then `summary`, then a generated
  excerpt. Required publication metadata is validated before publication.
- Generate canonical URL, Open Graph `og:title`, `og:description`, `og:image`,
  and `og:url`.
- Emit Schema.org `CollectionPage` or `ItemList` for collections where
  appropriate, `Movie` for movie pages, and `Product` for product pages.
- Generate `/sitemap.xml` from published collections, movies, characters, and
  products. Generate `robots.txt` to allow indexing and disallow
  administrative paths such as `/admin`.
- Internal-link priority: related collections, collection items, character
  links, movie links, product links. Collections are the highest SEO priority,
  followed by movies, characters, and products.
- Image binaries live in Cloudflare R2 or Amazon S3; records store URLs.
  Generation should support responsive variants, WebP, lazy loading, and a
  fallback image.
- A missing collection during generation emits a build warning. A missing
  image uses a fallback. Missing descriptions use the documented fallback;
  required publication metadata should block publishing instead of masking
  incomplete content.

Published static pages remain available if the API is offline. Most public
visits should not require a backend request. Runtime API access is retained
for search and watchlists.

## 7. Search, watchlist, and data failure behavior

### Search

Use PostgreSQL full-text search across collection, movie, character, and
product fields; the initial implementation needs no external search engine.
Apply category priority in the order collection, movie, character, product.
Empty/whitespace-only queries return `[]`. Search results use the exact
`SearchResult` shape above.

### Watchlists

No account is created. The random share token is the only access capability;
possession grants both read and write access. Never expose the internal
watchlist ID through a share URL. Validate title, movie membership, and
completion bodies. Rate-limit anonymous endpoints in production. Return movie
details, order, and completion state. Use transactional per-list order updates
to avoid unique-order conflicts.

### API and generation errors

Return 404 for missing single resources. Return optional missing data as null.
Use generation fallbacks for missing images and descriptions, but do not use
fallbacks to bypass publication requirements. Missing generated collection
data creates a build warning. Maintain complete static pages independently of
runtime API availability.

## 8. Analytics and measurement

Analytics are event-driven and used to validate the product hypothesis. MVP
events and measures include:

| Area | Events / measures |
|---|---|
| Discovery | Collection Viewed, Collection shares, time on collection page, collection-to-entity clicks, related collection clicks, Search Performed, search usage |
| Entity engagement | Movie Viewed, Character Viewed, Product Viewed |
| Watchlists | Watchlist Created, Watchlist Shared, additions/removals/completions where useful |
| Commerce | Affiliate Click, product views, collection-originated affiliate clicks |
| Retention | Pages per session, returning visitors, seasonal return visits |

The source documents do not specify an analytics vendor, event payload
schema, or analytics persistence model. Do not add a vendor or an
affiliate-click database table without an explicit decision.

## 9. Verification and correctness properties

The implementation must verify behavior at domain, API, generation, and
end-to-end levels. Tests are required work, not optional follow-up.

1. **Publication boundary:** every public list, detail, search, homepage, and
   build-slug result excludes draft and archived content by default.
2. **Collection integrity:** a collection cannot become public without its
   required editorial text, SEO metadata, hero image/alt text, movie member,
   and related collection; item and related-collection order is stable.
3. **Relationship integrity:** composite join keys prevent duplicates;
   collection relationships preserve per-type order; related-collection
   directionality is not accidentally made reciprocal; deletes follow cascade
   and set-null rules.
4. **Monetary integrity:** price precision and currency survive persistence and
   JSON conversion without implicit floating-point calculations.
5. **Search invariant:** matching entities are grouped by collection, movie,
   character, and product priority; an empty/whitespace query returns no
   results.
6. **Watchlist capability and order:** valid token holders can read/write; the
   token is unguessable; internal IDs are absent from share routes; completion
   toggles and removal work; concurrent/order changes preserve unique
   per-list ordering transactionally.
7. **Static output:** every published slug in each build source has the
   intended static route; unpublished content has no public page; generated
   pages contain complete content and metadata without a runtime API; the
   sitemap and robots policy are valid.
8. **SEO fallback:** supplied SEO values take precedence; description fallback
   order is consistent; canonical/Open Graph/schema output and internal links
   use correct slugs and public records.
9. **API contract:** endpoint methods, paths, optional filters, response
   shapes, nullability, ISO timestamps, and 404 behavior match this design and
   the source API contract.
10. **Launch inventory:** counts meet the stated minima; all ten launch
    collection names are present; every collection passes its curation and
    launch metadata checklist.
11. **No unsupported scope:** tests and launch checks do not require accounts,
    reviews, ratings, comments, forums, community features, user collections,
    recommendation engines, marketplace operations, or a mobile app.

## 10. Decision and reference handling

Accepted ADRs remain authoritative for their explicit decisions. These native
Kiro files are the single execution source of truth for MVP requirements,
design, and task status. Original documents are retained as supporting
references, not as a second implementation plan. If a reference conflicts
with an accepted ADR or these reviewed specifications, do not silently choose
one: stop before implementation, record the exact discrepancy, and ask the
product owner to approve a specification or ADR change. Update the native
specification and affected references together after approval.

Current scope decisions captured here include React + TypeScript + Vite (not
Next.js), a 10+ collection launch floor, static public content, API-driven
search/watchlists, and the explicit exclusions in requirements.
