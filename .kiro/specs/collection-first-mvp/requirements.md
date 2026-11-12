# Horror Christmas — Collection-First MVP Requirements

This is the canonical, execution-ready product requirement set for the MVP.
The existing product and editorial documents remain detailed supporting
references; see the [repository README](../../../README.md) for the documentation
map and precedence/change process. Product direction is grounded in
[Positioning](../../../docs/Positioning.md), the [MVP specification](../../../docs/MVP-Specification.md),
[Collections](../../../docs/Collections.md), [curation standards](../../../docs/Collection-Curation-Guide.md),
the [launch inventory](../../../docs/launch/Launch-Content.md), the
[seed checklist](../../../docs/launch/Seed-Content-Checklist.md), and accepted
[ADRs 001–009](../../../docs/adr/ADR-001.md).

## Requirement 1: Collection-first product

**User story:** As a Christmas horror fan, I want curated collections to be the
main way I discover the subject, so that the platform offers connected
experiences rather than a disconnected directory.

### Acceptance criteria

1.1 WHEN a visitor enters the platform THE SYSTEM SHALL present collections as
the primary product experience and movies, characters, products, franchises,
and tags as supporting content.

1.2 WHEN the system presents navigation, homepage content, search results, or
related content THE SYSTEM SHALL favor collection discovery over isolated
entity browsing.

1.3 WHEN a visitor explores a content entity THE SYSTEM SHALL provide a route
back into one or more relevant curated collections where such relationships
exist.

1.4 WHEN collection order is configured THE SYSTEM SHALL preserve editorial
order because order communicates the curator's intended path.

## Requirement 2: Homepage discovery

**User story:** As a visitor, I want an inviting homepage with curated entry
points, so that I can quickly find a collection and begin exploring.

### Acceptance criteria

2.1 WHEN the homepage is rendered THE SYSTEM SHALL show the platform
introduction and featured collections.

2.2 WHEN seasonal collections are available THE SYSTEM SHALL present them in a
distinct seasonal discovery section.

2.3 WHEN homepage feature content is configured THE SYSTEM SHALL support a
featured movie, a featured character, and a gift-focused collection; absent
featured movie, character, or gift collection values SHALL be represented as
unavailable rather than fabricated.

2.4 WHEN a visitor selects a featured collection THE SYSTEM SHALL navigate to
that collection's public page.

2.5 WHEN homepage collection lists are generated THE SYSTEM SHALL respect
editorial ordering and include only content eligible for public publication.

## Requirement 3: Curated collection experience

**User story:** As a visitor, I want a collection to explain its theme and
present an ordered set of related content, so that I know why it exists, where
to start, and what to explore next.

### Acceptance criteria

3.1 WHEN a published collection page is generated THE SYSTEM SHALL show its
hero, introduction, required curator notes, collection items, and related
collections.

3.2 WHEN a collection contains movies, characters, products, or franchises
THE SYSTEM SHALL preserve each relationship's editorial order and may render
the entity types in separate sections.

3.3 WHEN collection items have relationship-specific curator notes THE SYSTEM
SHALL make those notes available with their corresponding ordered items.

3.4 WHEN a visitor views a collection THE SYSTEM SHALL explain the collection's
theme and intended audience, and curator guidance SHALL identify a useful
starting point and/or next action.

3.5 WHEN a collection is published THE SYSTEM SHALL require at least one movie
and at least one related collection, together with the required introduction
and curator notes.

3.6 WHEN a curator creates a collection THE SYSTEM SHALL support the types
CHARACTER, THEME, BEGINNER, GIFT, SEASONAL_CHALLENGE, and TRADITION.

3.7 WHEN collections are curated THE SYSTEM SHALL support collection-to-movie,
collection-to-character, collection-to-product, collection-to-franchise,
collection-to-tag, and directed collection-to-collection relationships.

3.8 WHEN a collection is archived THE SYSTEM SHALL keep its record addressable
for editorial/history purposes but exclude it from public discovery unless an
explicit publishing policy says otherwise.

## Requirement 4: Movie, character, and product discovery

**User story:** As a visitor, I want useful pages for movies, characters, and
products, so that I can learn about an entity and continue through related
collections.

### Acceptance criteria

4.1 WHEN a published movie page is generated THE SYSTEM SHALL support its
title, release information, runtime, synopsis, poster, trailer, related
characters, collections, tags, and related products where supplied.

4.2 WHEN a visitor views a movie THE SYSTEM SHALL provide an add-to-watchlist
action and links to related discovery content.

4.3 WHEN a published character page is generated THE SYSTEM SHALL support its
name, summary, biography, origin story where supplied, image, franchise, tags,
related movies, products, and collections.

4.4 WHEN a published product page is generated THE SYSTEM SHALL support its
name, description, category, image and alt text, price and currency when known,
affiliate links, related characters, and collections.

4.5 WHEN an entity has a franchise THE SYSTEM SHALL make the franchise
relationship available on its public detail projection.

4.6 WHEN an entity is a film, television special, or television episode THE
SYSTEM SHALL preserve its media type.

4.7 WHEN price data is read, written, or serialized THE SYSTEM SHALL use
decimal-safe fixed-precision values and an explicit three-character currency
code, and SHALL NOT use implicit JavaScript-number conversion for monetary
calculations.

4.8 WHEN entity content is incomplete or unpublished THE SYSTEM SHALL NOT
expose it through public entity pages or public content lists.

## Requirement 5: Knowledge-graph relationships and tags

**User story:** As a visitor and future client, I want content relationships to
be explicit and dependable, so that collection discovery can grow without
losing integrity.

### Acceptance criteria

5.1 WHEN collections, movies, characters, products, franchises, and tags are
stored THE SYSTEM SHALL model them as structured relational content with stable
opaque internal identifiers and unique per-entity slugs.

5.2 WHEN collection membership is stored THE SYSTEM SHALL use explicit
relationships for movies, characters, products, franchises, and tags, with
relationship order and curator notes where specified by the domain model.

5.3 WHEN movies are related to characters or tags, characters to tags, products
to tags or characters, or collections to tags THE SYSTEM SHALL preserve those
relationships using explicit join records.

5.4 WHEN a related-collection link is stored THE SYSTEM SHALL preserve its
direction and order; a link from collection A to B SHALL NOT imply a reciprocal
link from B to A.

5.5 WHEN a content item is prepared for launch THE SYSTEM SHALL flag an item
without collection membership as incomplete for editorial review.

## Requirement 6: Launch content inventory

**User story:** As a launch editor, I want a complete minimum content catalog,
so that the first public release demonstrates the breadth of the collection
experience.

### Acceptance criteria

6.1 WHEN launch content is approved THE SYSTEM SHALL include at least 10
curated collections.

6.2 WHEN launch collections are approved THE SYSTEM SHALL include all ten
named launch collections: Essential Krampus Collection; Winter Monsters;
Christmas Slashers; New To Christmas Horror; 25 Days of Christmas Horror;
Best Gifts For Krampus Fans; Christmas Horror Comedies; Black Christmas
Collection; Christmas Horror Deep Cuts; and Holiday Horror Marathon.

6.3 WHEN launch content is approved THE SYSTEM SHALL include at least 50
movies, at least 20 characters, at least 50 products, at least 5 franchises,
and at least 20 tags.

6.4 WHEN the seed catalog is prepared THE SYSTEM SHALL include the named
example franchises Gremlins, Black Christmas, Silent Night Deadly Night, and
Krampus; the minimum remains five franchises.

6.5 WHEN the seed catalog is prepared THE SYSTEM SHALL support the documented
product categories figures, ornaments, posters, Blu-rays, and apparel, and the
documented example characters Krampus, Billy Chapman, Stripe, Gizmo, Yule Cat,
and Frau Perchta.

6.6 WHEN launch collections are reviewed THE SYSTEM SHALL target 5–15 items
per collection, with no strict maximum, and SHALL include at least one movie
and one related collection per published collection.

6.7 WHEN seed content is complete THE SYSTEM SHALL provide a content set
sufficient for end-to-end testing of collections and their movie, character,
product, franchise, and tag relationships.

## Requirement 7: Unified collection-priority search

**User story:** As a visitor, I want one search across the main content types,
so that I can find a topic and enter a relevant collection first.

### Acceptance criteria

7.1 WHEN a non-empty search query is submitted THE SYSTEM SHALL search
collections, movies, characters, and products.

7.2 WHEN results are returned THE SYSTEM SHALL rank result categories in this
order: collections, movies, characters, products.

7.3 WHEN a query is empty or contains only whitespace THE SYSTEM SHALL return
an empty result list.

7.4 WHEN search results are serialized THE SYSTEM SHALL return each result's
type, ID, slug, display title, and summary using the SearchResult shape in the
design.

7.5 WHEN the initial search implementation is built THE SYSTEM SHALL use
PostgreSQL full-text search without requiring a separate search service.

## Requirement 8: Anonymous shareable watchlists

**User story:** As a visitor, I want to make and share a seasonal movie
watchlist without registering, so that I can plan a marathon and return to it.

### Acceptance criteria

8.1 WHEN a visitor creates a watchlist THE SYSTEM SHALL allow an optional title
and SHALL issue a random, unguessable share token.

8.2 WHEN a visitor possesses a watchlist share token THE SYSTEM SHALL allow
that bearer to read and modify the associated watchlist without an account.

8.3 WHEN a movie is added to a watchlist THE SYSTEM SHALL record the movie,
its explicit list order and added timestamp and SHALL prevent duplicate
membership in the same list; initial order SHALL follow the sequence in which
movies are added.

8.4 WHEN a visitor removes a movie or marks it complete/incomplete THE SYSTEM
SHALL update the list and return its current details, ordering, and completion
state.

8.5 WHEN watchlist membership is inserted or removed, or order values are
internally reindexed, THE SYSTEM SHALL update order values transactionally to
avoid per-list order conflicts; the MVP SHALL NOT add a client reorder route
without an owner-approved API contract.

8.6 WHEN a watchlist is shared THE SYSTEM SHALL use the share token as the
bearer URL capability and SHALL NOT expose the internal watchlist database ID
in the share URL.

8.7 WHEN a watchlist is read or changed THE SYSTEM SHALL preserve movie
details, order, and completion state in its response.

8.8 WHEN watchlist operations are exposed THE SYSTEM SHALL validate request
bodies and apply rate limiting in the production implementation.

## Requirement 9: Static public content, metadata, and SEO

**User story:** As a visitor arriving from a search engine, I want public
content to load as complete, indexable pages, so that collections are
discoverable without depending on client-side rendering or a live API.

### Acceptance criteria

9.1 WHEN a production build runs THE SYSTEM SHALL generate static pages at
build time for published collections, movies, characters, and products, without
runtime rendering for those public content pages.

9.2 WHEN public content pages are generated THE SYSTEM SHALL derive their
content from the PostgreSQL-backed API and SHALL NOT treat frontend-only
hardcoded records or JSON as the authoritative public content source.

9.3 WHEN the static generator discovers build content THE SYSTEM SHALL obtain
published slugs from `/build/collections`, `/build/movies`,
`/build/characters`, and `/build/products`, then retrieve each page model from
the corresponding public content API.

9.4 WHEN a public page is generated THE SYSTEM SHALL provide a page title, meta
description, Open Graph title/description/image/URL, canonical URL, and
structured data where applicable.

9.5 WHEN meta descriptions are generated THE SYSTEM SHALL prefer
`seoDescription`, then `summary`, then a generated excerpt; page titles SHALL
use entity name followed by `| Horror Christmas` unless an SEO title is
provided.

9.6 WHEN a site build completes THE SYSTEM SHALL generate `/sitemap.xml` from
published collections, movies, characters, and products and generate an
indexable `robots.txt` that disallows administrative routes such as `/admin`.

9.7 WHEN structured data is emitted THE SYSTEM SHALL use CollectionPage or
ItemList for collection pages where suitable, Movie for movie pages, and
Product for product pages.

9.8 WHEN a public page is rendered THE SYSTEM SHALL include internal links
favoring related collections, collection items, character links, movie links,
and product links in that priority order.

## Requirement 10: API and future-client compatibility

**User story:** As a future mobile or web client, I want stable domain-oriented
API contracts, so that the MVP's business functions can be reused without
redesigning the backend.

### Acceptance criteria

10.1 WHEN the API serves public content THE SYSTEM SHALL return published
records only and use stable slugs, rather than database IDs, in public item
routes.

10.2 WHEN the API returns list resources THE SYSTEM SHALL return JSON arrays,
return 404 for missing single resources, URL-encode query parameters, and
serialize timestamps as ISO-8601 strings.

10.3 WHEN the API serves the homepage THE SYSTEM SHALL implement `GET /home`
with `HomeResponse` containing `featuredCollections`,
`seasonalCollections`, `featuredMovie`, `featuredCharacter`, and
`giftCollection`, where the final three fields may be `null`.

10.4 WHEN the API serves collections THE SYSTEM SHALL implement `GET
/collections`, `GET /collections/:slug`, `GET /collections/:slug/movies`,
`GET /collections/:slug/characters`, `GET /collections/:slug/products`, and
`GET /collections/:slug/related`; the collection list SHALL accept optional
`featured`, `seasonal`, and `type` filters.

10.5 WHEN the API serves movies THE SYSTEM SHALL implement `GET /movies`,
`GET /movies/:slug`, and `GET /movies/:slug/collections`; the movie list SHALL
accept optional `q`, `year`, `genre`, and pagination parameters.

10.6 WHEN the API serves characters, products, and search THE SYSTEM SHALL
implement `GET /characters`, `GET /characters/:slug`, `GET /products`,
`GET /products/:slug`, and `GET /search?q={query}`.

10.7 WHEN the API serves anonymous watchlists THE SYSTEM SHALL implement
`POST /watchlists`, `GET /watchlists/:shareToken`,
`POST /watchlists/:shareToken/movies`,
`DELETE /watchlists/:shareToken/movies/:movieId`, and
`PATCH /watchlists/:shareToken/movies/:movieId`.

10.8 WHEN API responses contain unavailable optional data THE SYSTEM SHALL
represent that data as `null` and clients SHALL NOT infer a rating or runtime
that was not supplied.

## Requirement 11: Data integrity and serialization

**User story:** As a maintainer, I want a relational source of truth with
consistent relationship and serialization rules, so that content can safely
power APIs and static pages.

### Acceptance criteria

11.1 WHEN core records are persisted THE SYSTEM SHALL use PostgreSQL as the
authoritative source of truth and Prisma as the primary ORM.

11.2 WHEN records are created THE SYSTEM SHALL use opaque Prisma-generated
`cuid()` IDs and unique slugs per entity type; public canonical routes SHALL
use slugs rather than IDs.

11.3 WHEN core records are persisted THE SYSTEM SHALL support collection,
movie, character, product, franchise, tag, affiliate-link, watchlist, and
watchlist-movie data, with `createdAt` and `updatedAt` timestamps on content
records.

11.4 WHEN a join record is stored THE SYSTEM SHALL prevent duplicate endpoint
pairs with composite keys and preserve the relationship data specified in the
design.

11.5 WHEN an endpoint of a join relationship is deleted THE SYSTEM SHALL
cascade the join row; when a franchise is deleted THE SYSTEM SHALL set optional
franchise references to null.

11.6 WHEN public content is queried THE SYSTEM SHALL exclude `DRAFT` and
`ARCHIVED` records unless an explicit publishing policy permits them.

11.7 WHEN product prices cross a JSON/API boundary THE SYSTEM SHALL serialize
fixed-precision decimal values deliberately, with a three-character currency
code, and never rely on implicit JavaScript-number conversion for money.

11.8 WHEN watchlist items are persisted THE SYSTEM SHALL preserve unique
per-watchlist order, `addedAt`, and optional `completedAt`.

## Requirement 12: Editorial publishing and collection quality

**User story:** As a curator, I want clear editorial quality and publication
rules, so that incomplete or low-quality content does not become public.

### Acceptance criteria

12.1 WHEN a collection is prepared for publication THE SYSTEM SHALL require
its introduction and curator notes and verify required SEO fields and a hero
image with alt text.

12.2 WHEN any public content entity is prepared for launch THE SYSTEM SHALL
verify its SEO title and SEO description; launch review SHALL verify those
fields for every collection, movie, character, and product.

12.3 WHEN a collection has a curator note THE SYSTEM SHALL ensure the notes
explain why the collection exists, who it is for, where the visitor should
start, and what the visitor can discover or do next.

12.4 WHEN a collection is authored THE SYSTEM SHALL treat it as manually
curated editorial content, not a tag, category, search result, or automatically
generated list.

12.5 WHEN a collection changes through create, expand, refresh, seasonal
update, or archive THE SYSTEM SHALL preserve its editorial purpose and
collection-item order.

12.6 WHEN content is publicly delivered THE SYSTEM SHALL keep image binaries
in object storage (Cloudflare R2 or Amazon S3) and store their URLs in content
records.

## Requirement 13: Analytics and MVP measurement

**User story:** As a product owner, I want discovery, engagement, commerce, and
retention signals, so that I can test whether collections create meaningful
exploration.

### Acceptance criteria

13.1 WHEN a collection page is viewed THE SYSTEM SHALL record a collection
view, with collection shares, time on page, collection-to-entity clicks, and
related-collection clicks available as collection engagement measures.

13.2 WHEN a movie, character, or product page is viewed THE SYSTEM SHALL
support the corresponding entity-view event.

13.3 WHEN a visitor searches THE SYSTEM SHALL record search usage and the
Search Performed event.

13.4 WHEN a watchlist is created or shared THE SYSTEM SHALL support tracking
Watchlist Created and Watchlist Shared.

13.5 WHEN a visitor selects an affiliate destination THE SYSTEM SHALL record
an Affiliate Click, including its originating collection where applicable.

13.6 WHEN MVP engagement is evaluated THE SYSTEM SHALL support measuring
pages per session, returning visitors, seasonal return visits, collection
engagement, watchlist creation/sharing, and affiliate clicks.

## Requirement 14: Launch readiness and outcome

**User story:** As a release owner, I want explicit launch gates, so that the
MVP is not declared ready until content, core behavior, SEO, and analytics are
verified.

### Acceptance criteria

14.1 WHEN launch readiness is assessed THE SYSTEM SHALL require the core schema
and seed content to be complete.

14.2 WHEN launch readiness is assessed THE SYSTEM SHALL require functional
collection pages, search, watchlists, and static generation.

14.3 WHEN launch readiness is assessed THE SYSTEM SHALL require configured
analytics and operational affiliate links.

14.4 WHEN the final review is performed THE SYSTEM SHALL verify technical
performance, accessibility, SEO, mobile responsiveness, content inventory,
metadata, and collection quality.

14.5 WHEN the MVP is complete THE SYSTEM SHALL enable a user to discover the
platform, enter a collection, explore movies/characters/products, build a
watchlist, return to continue exploring, and click through to relevant
merchandise without an account, community feature, or mobile application.

14.6 WHEN MVP success is evaluated THE SYSTEM SHALL prioritize collection
engagement, multi-page exploration, watchlist creation, return visits, search
usage, organic discovery, and contextual affiliate clicks rather than raw
traffic alone.

## Requirement 15: Usability and performance

**User story:** As a visitor, I want a fast and usable experience on common
devices, so that discovery and seasonal use remain accessible.

### Acceptance criteria

15.1 WHEN a public page is served THE SYSTEM SHALL deliver pre-generated
content as static assets through a CDN-compatible deployment.

15.2 WHEN an image is displayed THE SYSTEM SHALL support responsive image
variants, WebP output, lazy loading, and a fallback image when an image is
missing.

15.3 WHEN a visitor uses the site on a mobile device THE SYSTEM SHALL provide
mobile-responsive pages.

15.4 WHEN a public content build encounters a missing collection THE SYSTEM
SHALL emit a build warning; when a description or SEO value is missing it
SHALL apply the documented fallback or publishing validation rather than
inventing content.

15.5 WHEN MVP performance and accessibility are reviewed THE SYSTEM SHALL
record the results as launch-readiness evidence without inventing a numeric
threshold absent from the source documents.

## Requirement 16: MVP exclusions

**User story:** As a product owner, I want the first release to stay focused,
so that it validates collection-led discovery without adding unrelated
operational or community scope.

### Acceptance criteria

16.1 WHEN the MVP is implemented THE SYSTEM SHALL NOT require visitor accounts
or user authentication.

16.2 WHEN the MVP is implemented THE SYSTEM SHALL NOT include reviews,
ratings, comments, discussions, forums, or other community features.

16.3 WHEN the MVP is implemented THE SYSTEM SHALL NOT allow user-created
collections or other user-generated public content.

16.4 WHEN the MVP is implemented THE SYSTEM SHALL NOT include a recommendation
engine, marketplace transactions, or buying/selling inventory.

16.5 WHEN the MVP is implemented THE SYSTEM SHALL NOT include mobile
applications; the API and domain model SHALL remain compatible with future
mobile clients.

## Requirement 17: Seasonal experiences and collection lifecycle

**User story:** As a seasonal visitor, I want collections to support repeatable
challenges and traditions, so that I can return to Christmas horror throughout
the season.

### Acceptance criteria

17.1 WHEN a curator creates a seasonal challenge collection THE SYSTEM SHALL
allow its content to be arranged as an intentional sequence such as 25 Days of
Christmas Horror.

17.2 WHEN a visitor uses a challenge collection THE SYSTEM SHALL allow
watchlist completion state for movies but SHALL NOT imply that collection-wide
progress tracking is included in the MVP.

17.3 WHEN a collection is refreshed for a new season THE SYSTEM SHALL preserve
the collection's route and editorial identity unless a deliberate editorial
change is approved.

17.4 WHEN a collection is shared or linked from another public page THE
SYSTEM SHALL provide a stable slug-based URL.

17.5 WHEN a collection is maintained over time THE SYSTEM SHALL support
create, expand, refresh, seasonal update, and archive as editorial lifecycle
activities.

## Requirement 18: Failure behavior and public access safety

**User story:** As a visitor and operator, I want clear failure behavior and
safe public access, so that missing data or anonymous endpoints do not expose
internal identifiers or mislead visitors.

### Acceptance criteria

18.1 WHEN a public single-resource route cannot find a record THE SYSTEM SHALL
return a 404 response.

18.2 WHEN a generated page has no image THE SYSTEM SHALL use a fallback image;
when a collection is missing during generation THE SYSTEM SHALL issue a build
warning.

18.3 WHEN a missing description can be rendered THE SYSTEM SHALL fall back
from SEO description to summary and then a generated excerpt; missing required
publication metadata SHALL block publication.

18.4 WHEN a share token is used THE SYSTEM SHALL treat it as a bearer
capability and SHALL NOT expose internal watchlist IDs in public share URLs or
content projections.

18.5 WHEN an API operation accepts user-supplied values THE SYSTEM SHALL
validate its request body; anonymous watchlist operations SHALL be rate-limited
in production.
