# Horror Christmas - Web Application

## Overview

This is the **independently deployable** React + TypeScript + Vite frontend application for Horror Christmas.

## Architecture

This is a **static React application** - NOT Next.js or server-side rendered.

- **Build output**: Static HTML, CSS, and JavaScript files
- **Deployment**: CDN-compatible static assets (Cloudflare Pages, Netlify, Azure Static Web Apps, etc.)
- **Runtime API calls**: Only for search and watchlists
- **Public content pages**: Generated at build time, available offline

## Responsibilities

### Public Content Pages
All generated as static HTML at build time:
- **Homepage** - Hero, featured/seasonal collections, featured movie/character, gift collection
- **Collection pages** - Hero, introduction, curator notes, ordered items, related collections
- **Movie pages** - Details, trailer, characters, collections, products, add-to-watchlist
- **Character pages** - Biography, movies, products, collections, franchise
- **Product pages** - Description, images, price, affiliate links, related content

### Interactive Features
Runtime API calls for:
- **Search** - Cross-catalog discovery with collection-first results
- **Watchlists** - Anonymous list creation, viewing, editing, sharing

### User Experience
- Client-side navigation between static pages
- Responsive layouts (mobile-first)
- Accessibility (keyboard navigation, alt text, ARIA)
- Image optimization (responsive variants, WebP, lazy loading)
- Collection-first discovery patterns

## Independence Requirements

This application MUST be:
- **Self-contained** - Contains all code necessary for deployment
- **Independently deployable** - Can be built and deployed without the server running
- **Fully testable** - Can run all tests without external dependencies
- **Offline-capable** - Static pages work without API (search/watchlists need API)

## Shared Code

API contracts in `src/types/api-contracts.ts` are duplicated from the server application.

When API contracts change:
1. Server updates `server/src/types/api-contracts.ts` (source of truth)
2. Copy to `web/src/types/api-contracts.ts`
3. Verify both applications build successfully
4. Commit both changes together

See `.kiro/steering/shared-types.md` for synchronization details.

## Technology Constraints

### Decided
- **Framework**: React + TypeScript
- **Bundler**: Vite
- **Rendering**: Static generation (NOT server-side rendering)
- **Deployment**: CDN-compatible static assets
- **Routing**: React Router v7 in library mode (no framework mode, no SSR features)
- **Styling**: Tailwind CSS v4, dark theme only for now
- **Components**: custom only, no component library
- **Client data cache**: TanStack Query for the browser's API calls; no other state library
- **Animation**: Tailwind transition/animation utilities for now; a dedicated library (for example Motion) may be added later

### Open (requires owner approval)
- Brand / display font (system font stack for now)
- Environment-variable approach (`VITE_API_BASE_URL` is provisional)
- Deployment provider (and with it: SPA fallback for dynamic URLs such as `/watchlists/{token}`)
- Analytics vendor
- HTTP caching headers on the API (follow-up, not in scope)

## Development

```bash
npm install
# Dev server (client-only rendering, no page data; see "Frontend foundation")
npm run dev
# Tests and type checking
npm test
npm run type-check
# Client bundle only (JS + CSS + manifest into dist-static/)
npm run build:client
# Type-check, then the client bundle (does not need the API)
npm run build
# The deployable site: client bundle, then static pages (needs API_BASE_URL and SITE_URL)
API_BASE_URL=http://127.0.0.1:3000 SITE_URL=https://example.com npm run build:site
# Static pages only (the client build must already be in the output directory)
npm run build:static
# Linting (eslint is not installed yet; this script does not run)
npm run lint
```

## Directory Structure

```
web/
├── public/               # Static assets (images/image-unavailable.svg); copied by the static generator
├── src/
│   ├── types/api-contracts.ts   # Shared API contracts (copied from server)
│   ├── routes.ts                # Path builders and route patterns (single source for URLs)
│   ├── app/                     # App shell, route table, route elements, hydration data
│   ├── pages/                   # Page templates (collection, movie, character, product)
│   ├── client/                  # Browser startup (mountApp: hydrate or client render)
│   ├── api/                     # Browser API client, query hooks, QueryClient defaults
│   ├── theme/                   # Contrast helpers and the palette contrast test
│   ├── build/                   # Static generator: fetch, render, write, head, SEO
│   ├── entry-client.tsx         # Browser entry (Rollup input of the client build)
│   └── styles.css               # Tailwind import, theme tokens, page styles
├── dist-static/        # THE deployable artifact (gitignored): assets + pages
├── index.html          # Dev-server shell only (npm run dev); never deployed
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts      # Vite configuration
└── README.md
```

## Static Generation Pipeline

The build-time generation sequence:

1. **Discover slugs** - Request published slugs from server's `/build/*` endpoints
2. **Retrieve page models** - Request each slug's data from public API
3. **Render pages** - Use page templates to produce static HTML
4. **Emit SEO files** - Generate sitemap.xml, robots.txt, structured data
5. **Deploy** - Publish static assets to CDN

This pipeline will be implemented in Phase 6 of the task plan.

## SEO and Metadata

Each static page includes:
- Page title: `{Entity Name} | Horror Christmas`
- Meta description with fallback order: `seoDescription` → `summary` → excerpt
- Canonical URL
- Open Graph tags (title, description, image, URL)
- Schema.org structured data (CollectionPage, Movie, Product)
- Internal links in the Req 9.8 priority order (see "Internal-link priority")

## Testing Strategy

- Component tests for UI elements
- Integration tests for page rendering
- Static generation tests
- Accessibility tests (keyboard nav, alt text, ARIA)
- Responsive layout tests
- Offline availability tests for static pages

## Build-time data retrieval (`src/build/`)

`fetchBuildData` in `src/build/fetch-build-data.ts` discovers published slugs from `GET /build/{collections,movies,characters,products}`, retrieves the homepage projection `GET /home` (Task 7.1, `BuildData.home`) in the same discovery step, and retrieves each page model from the matching public detail route. It uses the built-in `fetch`, bounds detail requests (default 8 at a time), and never reads local content files.

- **Configuration:** `API_BASE_URL` (required, no default host), e.g. `API_BASE_URL=http://localhost:3000`. Read with `readApiBaseUrl(env)`. The overall environment-variable approach is still an open decision.
- **Failures:** a failed `/build` list fails the build with the URL and status. `/home` has the same semantics: non-OK, network error, invalid JSON or a malformed body (not an object, `featuredCollections`/`seasonalCollections` not arrays of `{ slug, title }`, or `featuredMovie`/`featuredCharacter`/`giftCollection` neither `null` nor `{ slug, title|name }`) fails the build with `/home`'s URL and status, and no page model is requested. Only the five contract keys are kept. A 404 on one page model is returned as a warning and skipped. Any other detail error fails the build.
- **Unit tests** (fake fetch, no network): `npm test`.
- **Manual integration check** against a live local API (not part of `npm test`):

  ```
  API_BASE_URL=http://127.0.0.1:3000 npm run test:integration
  ```

  Start the API first from `server/` with `npm run dev:http` (a minimal `node:http` adapter over the route table, not a framework choice).

## Static page generation (`src/pages/`, `src/build/`, `scripts/`)

`npm run build:static` fetches build data (see above), renders every published collection, movie, character and product to HTML, writes the files, and prints a summary (counts per type, output directory, warnings). Any fatal error (missing `API_BASE_URL`, missing or invalid `SITE_URL`, API failure, unusable slug, write failure) exits with code 1. With no published content it generates nothing, writes nothing and says so.

```
API_BASE_URL=http://127.0.0.1:3000 SITE_URL=https://example.com npm run build:static            # writes web/dist-static/
API_BASE_URL=http://127.0.0.1:3000 SITE_URL=https://example.com npm run build:static -- --out ./out
```

- **Output:** `dist-static/` (gitignored) is the single deployable artifact: the Vite client build writes `assets/` and `.vite/manifest.json` there first, the generator adds the pages (see "Frontend foundation"). Routes are `/collections/{slug}/`, `/movies/{slug}/`, `/characters/{slug}/`, `/products/{slug}/`, each written as `{slug}/index.html`. Only those four directories are cleared per run so unpublished content leaves no stale page.
- **Rendering:** `renderToString` from `react-dom/server`, at build time only, through the same app the browser hydrates (see "Frontend foundation"). Pages are complete with JavaScript off. Scripts in a page: the `application/ld+json` block, the `application/json` hydration data and one `<script type="module" src>` for the client entry; no inline executable script.
- **Structure:**
  - `src/routes.ts`: slug route helpers, shared by links and output paths.
  - `src/pages/`: `CollectionPage`, `MoviePage`, `CharacterPage`, `ProductPage`, plus `shared.tsx`. These are plain components with no build-time dependencies; they are the route elements of the app. `src/build/Document.tsx` is the html/head/scripts wrapper (server only).
  - `src/build/render-site.tsx`: pure `renderSite(BuildData) -> { path, outputPath, html }[]`.
  - `src/build/write-pages.ts`: file writing only. `src/build/generate-static.ts`: the run (fetch, render, write, summary). `scripts/generate-static.ts`: CLI entry.
- **Extension points:** `src/build/page-head.tsx` (`buildPageHead`) assembles the head (see "Page metadata" below). Every image goes through `PageImage` in `shared.tsx` (see "Image delivery" below). The add-to-watchlist placeholder in `MoviePage.tsx` is for Task 8.3.
- **Content rules:** only contract fields are used; missing optional data omits its section. Collection items keep the order the API returned. Price is printed as the given decimal string. Affiliate links use `rel="sponsored noopener"` and `target="_blank"`; non-http(s) URLs are dropped.

## Page metadata (`src/build/`, Task 6.3)
Every page gets a title, meta description, canonical URL, Open Graph and Twitter tags, and Schema.org JSON-LD. Pure functions, each tested on its own:
- `seo.ts`: `pageTitle`, `createExcerpt`, `resolveDescription`
- `site-url.ts`: `normalizeSiteUrl`, `readSiteUrl`, `canonicalUrl`, `resolveImageUrl`
- `open-graph.ts`: `buildSocialTags` (and the og:type table)
- `json-ld.ts`: `buildJsonLd`, `serializeJsonLd`
- `page-head.tsx`: `resolvePageMetadata` (data) and `buildPageHead` (JSX); `page-model.ts`: which contract field feeds what.

**How the head is built:** React 19's built-in document metadata support: `<title>`, `<meta>` and `<link>` are plain JSX placed in `<head>`, escaped by React. No head library, no string templates. The JSON-LD `<script>` is the one exception: React would HTML-escape its text and break the JSON, so its body is set from `serializeJsonLd`, which escapes `<`, `>`, `&`, U+2028 and U+2029 as `\uXXXX` (still valid JSON, cannot close the script). `<meta charset>`, the viewport meta and `<html lang="en">` come from `Layout`.

**`SITE_URL` (required, provisional):** the public site origin, e.g. `SITE_URL=https://example.com`. The domain and hosting are undecided, so nothing is hardcoded. It must be an absolute http(s) URL with no credentials, query or fragment; trailing slashes are removed and a path prefix is kept. If it is missing or invalid the build fails before any API request, with a message saying why. Canonical URL = `SITE_URL` + the route from `routes.ts` (with trailing slash). Root-relative image URLs resolve against it.

**Rules**
- **Title:** `{Entity Name} | Horror Christmas`. A supplied `seoTitle` replaces the whole title (trimmed, no suffix appended).
- **Description:** `seoDescription`, then `summary` (collections and characters only; the other contracts have none), then a generated excerpt. Blank or whitespace-only values are missing at each step. Supplied values are used whole (whitespace collapsed).
- **Excerpt:** from collection `introduction`, movie `synopsis`, character `biography`, product `description`. Whitespace runs collapse to one space; text up to 160 characters is used whole; longer text is cut at the last word boundary so that text plus one `…` is at most 160 characters, trailing `, ; : -` removed. Only if the first word alone exceeds the limit is it cut mid-word, never inside a surrogate pair or leaving a half `&entity`. If no text exists the description tag and `og:description` are omitted, and a build warning names the entity.
- **Open Graph:** `og:site_name`, `og:type`, `og:title`, `og:description` (= meta description), `og:url` (= canonical), `og:image`. `twitter:card` is `summary_large_image` with an image, else `summary`. Image: collection `heroImageUrl`; movie `posterUrl`, then `heroImageUrl`; character `imageUrl`; product `imageUrl`. Must be absolute http(s) or root-relative; otherwise the site fallback image is used (Task 6.5, see "Image delivery").
- **og:type:** collection `website`, movie `website`, character `article`, product `product`.
- **JSON-LD:** collection `CollectionPage` with `mainEntity` `ItemList` (movies, then characters, then products, API order, `position` from 1, absolute item URLs); movie `Movie` (`datePublished` from release date, else release year; `duration` as ISO-8601 from runtime; no `trailer`, since a valid VideoObject needs name, thumbnail and upload date the API does not have); character `Thing` (Schema.org has no fictional-character type and `Person` is for real people); product `Product` with `offers` only when price is a plain decimal string and currency is a three-letter code (price passed through as the exact string, `url` = first valid affiliate link, no availability). Missing properties are left out; no ratings or reviews.
- **Warnings:** missing description and fallback image add one line each (`type "slug": ...`) to the build summary. They never fail the build; a bad `SITE_URL` or a publication validation error does (below).

## sitemap.xml and robots.txt (`src/build/sitemap.ts`, Task 6.4)

`npm run build:static` also writes `sitemap.xml` and `robots.txt` at the root of the output directory (`dist-static/`). Pure functions (`buildSitemapXml`, `buildRobotsTxt`, `collectSitemapEntries`, `renderSeoFiles`), plain string building with XML escaping, no library. File writing is `writeSeoFiles` in `write-pages.ts`. The build summary prints the URL count and both file paths.

- **URLs:** published collections, movies, characters and products only (that is all `BuildData` holds), in that order, each by slug. `<loc>` is built by `canonicalUrl` from `site-url.ts`, the same function as the canonical tags, so they cannot disagree (tested). `SITE_URL` rules are unchanged, including a path prefix.
- **`lastmod`:** full ISO-8601 UTC timestamp from the `/build` `updatedAt` (valid W3C Datetime). `BuildData.updatedAt` keeps these per slug, since the page models do not all carry one. Omitted if missing or unparsable.
- **No `priority` / `changefreq`:** Google ignores them, and made-up values are noise.
- **Limits:** more than 50,000 URLs or 50 MB uncompressed fails the build with a message that a sitemap index is needed. Nothing is truncated, and nothing is written when this fails.
- **Homepage:** `/` is the first entry (`STATIC_SITEMAP_ROUTES` in `sitemap.ts`, Task 7.1), without `lastmod` (the `/home` projection has no date). It is emitted only when at least one content page is built, like the homepage page itself. Other static routes (for example a future `/search/`) are added to the same list.
- **robots.txt:** `User-agent: *`, `Disallow: /admin`, `Allow: /`, blank line, `Sitemap: {SITE_URL}/sitemap.xml`. `/admin` does not exist yet (the CMS/admin approach is an open decision); the Disallow is a precaution. `Allow: /` is harmless: it states the default, and crawlers apply the most specific rule, so `/admin` stays blocked. robots.txt is a crawler hint, not a security control. If `SITE_URL` has a path prefix, the file must still be served from the host root for crawlers to find it.
- **No published content:** no pages are written (as before) and no `sitemap.xml` is written, because the sitemaps.org schema needs at least one `<url>`; a stale `sitemap.xml` from an earlier run is removed. `robots.txt` is still written, without a `Sitemap:` line, so it never points at a missing file.
- **Stale output:** only `sitemap.xml` and `robots.txt` are removed and rewritten each run; nothing else in or outside the output directory is touched.

## Internal-link priority (Task 6.5, Requirement 9.8)
Req 9.8: internal links favor related collections, collection items, character links, movie links, then product links. One definition, `LINK_GROUP_ORDER` in `src/pages/link-priority.tsx`, and one component, `PrioritizedLinkSections`, used by all four templates: a template lists its link sections, and the component renders them in priority order whatever order they were listed in. Each section carries `data-link-group="..."`, which the DOM-order tests read. Only sections are ordered; items inside a section keep the API order (Req 1.4).

| Page | DOM order of internal-link sections (after the editorial text, before tags) |
|------|----------------------------------------------------------------------------|
| Collection | related collections, then collection items: movies, characters, products (each section in editorial order) |
| Movie | collections ("Featured in collections"), characters, related products |
| Character | collections, movies, products |
| Product | collections, related characters |
| Homepage (`HOME_LINK_GROUP_ORDER`) | featured collections, seasonal collections, gift collection, featured character, featured movie (the hero and its in-page call to action come first) |

The homepage uses the same mechanism (`OrderedLinkSections` with its own order list; its sections carry `data-link-group` too): collections first (it is the product), then the character, then the movie, which follows Req 9.8's character-before-movie order. It has no product links.

Groups that do not apply to a page type are absent (a movie page has no movie links, a collection page has no separate character/movie/product groups because those are its collection items). On entity pages the collections the entity belongs to count as "related collections", so Req 1.3 (route back to a collection) is kept and now comes first.

**Changes against the earlier page order (Tasks 6.2):**
- Collection: related collections moved from after tags/franchises to before the items.
- Movie: collections moved from after characters to first.
- Character: collections moved from last to first.
- Product: collections moved from after characters to first.
- Not links, so not affected: trailer and affiliate links (outbound), franchises and tags (plain text).

DOM order is what search engines and screen readers see; it is not necessarily the visual order. When styling arrives, a collection page may show items before related collections visually (CSS) while the DOM keeps this order; that is a design decision.

## Image delivery (Task 6.5, Requirements 15.2, 18.2)
All images go through one component, `PageImage` (`src/pages/shared.tsx`); rules and the resolver are in `src/pages/image-sources.ts`.

- **alt is always set.** Model alt text when present (collection `heroImageAlt`, product `imageAlt`); otherwise a deterministic fallback, the entity name: movie title, character name, product name, collection title. The movie and character models carry no alt text, so their images always use the name. Whitespace-only counts as missing. Only the placeholder uses `alt=""` (with `role="presentation"`): it carries no information, so it is decorative.
- **Loading.** The single primary image of a page (collection hero, movie poster, character image, product image; there is one per page today) gets `loading="eager"` and `fetchpriority="high"`. Any other image would be `loading="lazy"`. All images get `decoding="async"`. The page templates currently render no secondary images (list items show no thumbnails), so the lazy branch is covered by component tests only. React prints the attributes as `fetchPriority` / `srcSet` in the HTML; HTML attribute names are case-insensitive.
- **Dimensions.** `width`/`height` are rendered only if passed as positive integers. The API models carry no image dimensions and none are invented, so pages have no intrinsic size for their image: **known limitation**, a layout-shift risk until the API or pipeline supplies dimensions.
- **Movie image choice:** `posterUrl`, then `heroImageUrl`, then the fallback. Same order as `og:image`.
- **Usable URL:** absolute http(s) with a host, or root-relative. `javascript:`, `data:`, protocol-relative (`//x`, `/\x`), relative paths, blank and whitespace are not usable. `usableImageUrl` and the metadata `resolveImageUrl` apply the same rules (tested), so the page and `og:image` always agree.
- **Responsive and WebP hook.** `ImageSourceResolver = (url) => { src, srcset?, sizes?, webp?: { srcset, sizes? } }` is a pure function passed as `renderSite(data, { siteUrl, imageResolver })`. The default returns `{ src: url }`: no invented variants, and no URL convention is guessed. With `webp`, the output is `<picture><source type="image/webp" srcset sizes><img ...></picture>` with the original as the fallback `<img>`; with only `srcset`, a plain `<img srcset sizes>`; otherwise a plain `<img>`. **This is the extension point for a future image pipeline.** No image-processing dependency, CDN or storage provider has been chosen (R2 vs S3 and variant production are open decisions).
- **One "Image unavailable" placeholder (owner decision).** Exactly one placeholder asset exists: `web/public/images/image-unavailable.svg` (1200x630, near-black background, bone broken-picture icon with a blood-red crack, slime accent rule, the words "Image unavailable" in a generic system font stack, no external references, no script, about 1 KB). It is used in three cases: the entity has no image URL, the URL is unusable (see above), and (build time) a root-relative URL whose file does not exist under `public/`. It is shown as a decorative image (`alt=""`, `role="presentation"`): every slot has visible text beside it (card title or page `h1`), so a spoken "Image unavailable" would only add noise; the words are part of the picture for sighted users. In cards it sits in an `aspect-video` box with `object-cover`; the icon and text are centered with wide margins, so the small crop from 1.9:1 to 16:9 does not touch them. **Missing files:** `src/build/missing-images.ts` (`substituteMissingImages`) runs in the generator after validation and before rendering; it replaces every root-relative `heroImageUrl`, `posterUrl` and `imageUrl` whose file is not a regular file under `public/` with the placeholder path IN THE DATA, so the markup, the embedded `#__PAGE_DATA__` and the browser's hydration use the same values (the browser never recomputes this; no JavaScript is needed). Lookup rules: path segments are matched against real directory entries (case-sensitive), query and fragment ignored, one percent-decode; `..`, `.`, empty segments, backslashes, NUL, dotfiles and symlinks (file or directory) count as missing, and nothing outside `public/` is listed or read. Absolute http(s) URLs pass through unchanged (no network requests at build time). **Real files are picked up automatically:** put a file at the URL's path under `web/public/` and rebuild, no code change (tested). **Warnings:** one aggregated, sorted line (`images: N image files were not found under public/ and use the placeholder ... (R references; first 5: ...)`) instead of one per image; the per-entity `no usable image` line remains only for entities that had no usable URL at all. The generator copies the contents of `web/public/` into the output directory (`copyPublicAssets`): files only, symlinks and dotfiles skipped, every destination checked to be inside the output, nothing deleted. The build fails before writing if `images/image-unavailable.svg` is missing from `public/`. The dev server serves `public/`; builds copy it in the generator only (no double copy). A build warning names type and slug whenever the placeholder is used for a missing URL: `movie "slug": no usable image; using fallback image ...`. A collection without a usable hero image is a validation error, not a fallback (below).
- **og:image fallback.** An entity without a usable image gets `og:image` = `{SITE_URL}/images/image-unavailable.svg` and `twitter:card` = `summary` (a generic placeholder should not be shown as a large card); an entity's own image keeps `summary_large_image`. The same applies when the build substituted the placeholder for a missing file (the aggregated warning counts it). JSON-LD still omits `image` for such entities, since the placeholder is not the entity's image. **Open:** some platforms do not render SVG in link previews, so those previews may show no image. A PNG/JPG fallback asset is an owner/design decision (OPEN-DECISIONS.md).
- **Preload links.** React 19 adds `<link rel="preload" as="image">` to `<head>` for rendered images. Checked in the generated HTML: it adds one for the primary (eager) image only, with `fetchpriority="high"`, which is correct and kept; it adds none for `loading="lazy"` images and none for images inside `<picture>` (the browser chooses the source). So nothing needs suppressing; tests pin this. If a future design adds a secondary eager image, it would be preloaded too.

## Build warnings and publication validation (Task 6.5, Requirements 15.4, 18.2, 18.3, 12.1, 12.2)
**Warnings** (printed in the summary, never fail the build):
- *Missing collection:* a page references a collection that is not among the built published collections (a movie/character/product `collections` entry, or a collection's `relatedCollections`). The warning names the referencing page and the collection slug. The reference is rendered as **plain text** (title kept, no link), so there is no dead link. With the real API this is not expected, since it already leaves unpublished collections out of those lists (checked against a live local API with a DRAFT collection); it guards against stale or inconsistent data. Collection items that point to an unbuilt movie, character or product are not checked.
- *No collections at all:* if movies, characters or products are published but no collection is, one `NO PUBLISHED COLLECTIONS: ...` warning is emitted.
- *Fallback image* and *no description*: as above and in "Page metadata".

**Validation errors** (`src/build/validate-publication.ts`, run in `generateStatic` after fetching and before rendering or writing anything, so a failure leaves the output untouched; exit code 1; every problem of every entity is listed). Rules mirror `server/src/validation/publication-validation.ts`, duplicated on purpose because web and server are independently deployable:
- collection: `introduction`, `curatorNotes`, `heroImageUrl`, `heroImageAlt`, `seoTitle`, `seoDescription`, at least one `movies` item, at least one `relatedCollections` item
- movie, character, product: `seoTitle`, `seoDescription`
- Blank and whitespace-only values are missing. The API field for the server's `heroImage` is `heroImageUrl`.
- Addition to the server rules: a collection `heroImageUrl` that is present but unusable (for example `javascript:`) is an error, so the fallback image cannot hide a broken hero image.
- Not verifiable by the build: publication status (the API serves published records only and the models have no `status`) and anything the page models do not expose.

**Required vs optional.** Missing optional data (images on movies/characters/products, summaries, descriptions other than the SEO ones, alt text on non-collection images) uses a fallback and a warning. Missing required publication metadata is an error. **Reading of Req 18.3:** the description fallback (`seoDescription` then `summary` then an excerpt, Task 6.3) applies "when a missing description can be rendered"; the SEO description is a required launch field (Req 12.2), so its absence is a validation error even though the metadata function could fall back. In `npm run build:static` that fallback is therefore unreachable for SEO descriptions; it remains in the pure metadata functions (used by `renderSite` directly and by tests) as a safety net. This is the tension with Task 6.3's fallback behavior.

There is no flag to skip validation. A local-development opt-out was considered and not added; see OPEN-DECISIONS.md.

## Verifying the generated site (Task 6.6, Phase 6 checkpoint)

Two checks prove that the static pages are complete and need no API once built (Requirements 9.1-9.8, 15.1, 15.2, 15.4, 18.2, 18.3, 3.8, 4.8, 11.6; Design 9, properties 7 and 8).

**1. Offline black-box suite (part of `npm test`, no network, no database).** `src/build/static-output.test.ts` runs the real `generateStatic` pipeline against a fixture API (`static-output-fixture.ts`, served by an injected fetch) into a temp directory, then inspects only the files on disk. It uses strict, dependency-free parsers (`markup-test-helpers.ts`: any unclosed tag, bare `&`, stray `<`, unquoted attribute or comment fails) and a node:http static server (`static-server.ts`). It covers: routes (one file per published slug, none for DRAFT/ARCHIVED or for a slug whose detail 404s, no internal ids), complete HTML (exactly the three known scripts, no inline executable script, no `on*` handlers), head metadata (title, description, canonical = sitemap loc, Open Graph, Twitter, absolute `og:image` incl. fallback), JSON-LD (types, ItemList order and positions, exact price string, hostile text cannot break out), sitemap/robots (well-formed XML, exact URL set and order, lastmod, exact robots.txt), fallbacks and warnings, **a crawl of every internal link** (each must exist in the output; the explicit allow-list `ALLOWED_NON_GENERATED_LINKS` is empty since the homepage exists, so a dead link to `/` fails like any other; the crawl also checks that a fragment such as `/#featured-collections` names an id on the target page) plus the Req 9.8 link-group order, validation failure leaving a pre-populated output directory untouched, byte-identical output on a second run (random request timing, reversed list order), and serving every route over real HTTP with the same bytes as on disk and no reference to the API host.

```
npm test                                    # includes the suite
npx vitest run src/build/static-output.test.ts
```

Title format and the description fallback order are checked through `renderSite` plus `writePages` in the same file, because publication validation requires `seoTitle` and `seoDescription`, so `build:static` cannot reach those fallbacks (see "Build warnings and publication validation").

**2. Real stack with the API actually stopped (manual, not in `npm test`).**

```
npm run verify:static-offline        # from web/
```

Prerequisites: the Docker PostgreSQL from `server/.env` is running (port 5433), the server's Prisma client is generated, port 3000 is free (set `API_PORT` to use another). The script (`scripts/verify-static-offline.ts`, imports nothing from `server/`):

1. inserts a small PUBLISHED fixture set (2 collections, 2 movies, 1 character, 1 product) whose slugs start with `zz-offline-check`, by running server's helper `npm run fixture:static-offline -- seed zz-offline-check` as a child process (`server/scripts/static-offline-fixture.ts`; seed data is not touched or published);
2. starts `npm run dev:http` in `server/` itself, so it can also stop it;
3. builds the client bundle into a fresh temp directory (`vite build --outDir`), then runs `npm run build:static` against the API with `SITE_URL=https://example.test` into the same directory (`web/dist-static` is left alone);
4. kills the API's process group and checks that the port refuses connections;
5. serves the output with node:http and fetches every generated route, `sitemap.xml`, `robots.txt`, the fallback image and the built JS and CSS, asserting 200, content type and content, with the API confirmed down;
6. always cleans up: stops both servers, deletes the temp output, runs `... -- clean zz-offline-check` and verifies zero fixture rows remain.

Exit code 0 means PASS. If a run is killed half-way, remove leftovers with `cd server && npm run fixture:static-offline -- clean zz-offline-check` (deletes only rows whose slug starts with that `zz-` prefix) and stop any `dev:http` still on port 3000. `FIXTURE_PREFIX` overrides the prefix (must start with `zz-`).

Known limit shared by both checks: collection items that point to a movie, character or product that was not built are not checked by the generator (the live API never returns them); the suite's fixture keeps item links consistent, so the link crawl would catch such a dead link only if the fixture contained one.

## Frontend foundation (Task 7.1, Part A)

### Architecture

Public pages stay build-time static HTML (ADR-004). JavaScript is progressive enhancement: hydration, later client navigation, search and watchlists.

```
npm run build:site
  1. vite build   (npm run build:client)
       input  src/entry-client.tsx  (imports styles.css -> Tailwind)
       output dist-static/assets/entry-client-<hash>.{js,css}
              dist-static/.vite/manifest.json      <- maps entry -> hashed files
       (previous assets/ and .vite/ are removed first; nothing else in dist-static is touched)
  2. tsx scripts/generate-static.ts   (npm run build:static)
       reads  dist-static/.vite/manifest.json   (missing = clear build error, before any API call)
       fetches published content from the API
       for each page:  renderToString(
           <Document head assets payload>              src/build/Document.tsx   (html, head, scripts)
             <div id="root">
               <StaticRouter location=route>
                 <App payload />                       src/app/App.tsx          (shell + routes)
       writes dist-static/{collections,movies,characters,products}/<slug>/index.html,
              sitemap.xml, robots.txt, images/ (copy of public/)

Browser (page loaded from dist-static, JavaScript on)
  <script type="module" src="/assets/entry-client-<hash>.js">
    -> src/entry-client.tsx -> mountApp (src/client/mount.tsx)
       - reads <script type="application/json" id="__PAGE_DATA__">
       - #root has server HTML  -> hydrateRoot(<QueryClientProvider><BrowserRouter><App payload/>)
       - #root is empty (npm run dev) -> createRoot, no page data

dist-static/ is the one artifact to deploy.
```

- **One route table** (`src/app/routes.tsx`) is rendered by the server (`StaticRouter`) and the browser (`BrowserRouter`). Patterns come from `src/routes.ts` (`ROUTE_PATTERNS`, `HOME_PATH`), which also builds the generated URLs. Routes: `/`, `/collections/:slug`, `/movies/:slug`, `/characters/:slug`, `/products/:slug`, and a catch-all not-found. `/search` and `/watchlists` come with Tasks 7.4 and 8.3. The entity routes render the existing page templates; `/` renders `HomePage` from the embedded `/home` projection (see "Homepage" below).
- **Why `renderToString`:** `hydrateRoot` needs the inert `<!-- -->` separators React writes between adjacent text nodes (for example `(1984)`). `renderToStaticMarkup` omits them and the browser would report a mismatch.
- **Hydration data:** each page embeds its model once in `#__PAGE_DATA__` (`src/app/page-data.ts`), escaped with `serializeJsonForScript` (`<`, `>`, `&`, U+2028, U+2029), so the browser hydrates without refetching. Internal ids are replaced by neutral tokens (`pseudonymizeIds`) because the output must expose no internal ids; the templates only use ids as React keys. The payload also carries the list of built collection slugs, which decides whether a collection mention is a link or plain text. A custom `ImageSourceResolver` is a function and cannot be embedded: the browser always uses the default one.
- **Head:** unchanged system (`buildPageHead`). The head elements are written directly inside `<head>` by `Document`, so there is exactly one title, canonical and so on; the stylesheet and `modulepreload` links come after them. React hoists the primary image preload into the head as before.
- **Shell:** `src/app/AppShell.tsx` has a skip link, one `<nav aria-label="Site">`, the `main#main` landmark and a footer. "Collections" links to `/#featured-collections`, the featured collections section of the homepage: there is no collections index page (open item). The shell gives the homepage a full-width `main` and every other page the narrow `page-content` column. Nav links are at least 44px tall. Links are plain anchors on purpose; each page is a separate document and the browser has no data for other pages yet.
- **`public/`** is copied by the generator only (`copyPublicAssets`). Vite's own public-dir copy is off for builds (the dev server still serves `public/`), so there is exactly one mechanism. A top-level `public/assets` is refused.
- **Dev server:** `npm run dev` serves `index.html` and renders client-side without page data, so entity routes show a notice. Use `build:site` to see real pages.

### Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `API_BASE_URL` | static generator (`build:static`) | required; read from the process environment |
| `SITE_URL` | static generator | required; canonical URLs |
| `VITE_API_BASE_URL` | browser API client (`src/api/client.ts`) | inlined at build time by Vite; unset or invalid is a clear error when the client is first used. Provisional: the overall env-variable approach is an open decision |

### Browser API client and data cache

`src/api/client.ts`: `createApiClient({ baseUrl, fetch? })` with typed helpers (`getHome` so far), returning `api-contracts.ts` types. A non-OK answer throws `ApiRequestError` (`kind` network / http / invalid-response, `status`, API error `code`); nothing is swallowed. `src/api/queries.ts` has one example hook, `useHome` (`GET /home`). `src/api/query-client.ts`: `staleTime` 5 min, `gcTime` 30 min, retry twice for network and 5xx but never for 4xx, no refetch on window focus. The `QueryClientProvider` exists only in the browser entry. No UI calls the API yet. HTTP caching headers (`Cache-Control`, `ETag`) on the API are a possible follow-up, not in scope.

### Theme (`src/styles.css`)

Tailwind v4 `@theme` tokens; components use the names, never hex values (`bg-ink`, `text-bone`, `text-slime`, `bg-blood`).

| Token | Value | Role |
|---|---|---|
| `ink` | `#0a0a0b` | page background |
| `surface`, `raised`, `line` | `#131316`, `#1c1c20`, `#34343a` | header/footer, raised areas, borders |
| `bone` | `#f4f1ea` | primary text |
| `bone-muted` | `#b5b0a4` | secondary text |
| `slime`, `slime-soft`, `slime-deep` | `#7dff2e`, `#b4ff82`, `#2f7d14` | links, focus, accent; hover; decoration |
| `blood`, `blood-glow`, `blood-deep` | `#c1121f`, `#ff5a5f`, `#8f0d17` | buttons (bone text), borders and large text; red text on dark; pressed state |

Dark only; no light theme. Typography is the system font stack (`--font-sans`); a brand/display font is an open design decision and no font is loaded.

**Contrast (WCAG 2.x).** Enforced by `src/theme/contrast.test.ts`, which reads the real tokens from `styles.css`. Plain `blood` on `ink` is under 4.5:1 and is therefore only for buttons with bone text, borders, large text and decoration; red text on dark uses `blood-glow`.

| Foreground | Background | Use | Ratio | AA normal (4.5) | AA large / UI (3) |
|---|---|---|---|---|---|
| bone `#f4f1ea` | ink `#0a0a0b` | body text on the page | 17.54:1 | pass | pass |
| bone `#f4f1ea` | surface `#131316` | brand name, footer, header text | 16.44:1 | pass | pass |
| bone `#f4f1ea` | raised `#1c1c20` | inline code | 15.06:1 | pass | pass |
| bone-muted `#b5b0a4` | ink `#0a0a0b` | secondary text, labels | 9.15:1 | pass | pass |
| bone-muted `#b5b0a4` | surface `#131316` | footer text | 8.58:1 | pass | pass |
| slime `#7dff2e` | ink `#0a0a0b` | links, skip link, focus ring | 15.28:1 | pass | pass |
| slime `#7dff2e` | surface `#131316` | navigation links, focus ring | 14.32:1 | pass | pass |
| slime-soft `#b4ff82` | ink `#0a0a0b` | link hover | 16.55:1 | pass | pass |
| slime-soft `#b4ff82` | surface `#131316` | navigation link hover | 15.51:1 | pass | pass |
| blood-glow `#ff5a5f` | ink `#0a0a0b` | red text and list markers | 6.48:1 | pass | pass |
| blood-glow `#ff5a5f` | surface `#131316` | brand hover | 6.08:1 | pass | pass |
| bone `#f4f1ea` | blood `#c1121f` | label on a blood-red button | 5.52:1 | pass | pass |
| bone `#f4f1ea` | blood-deep `#8f0d17` | button label, pressed | 8.32:1 | pass | pass |
| blood `#c1121f` | ink `#0a0a0b` | red borders, rules, large decorative text | 3.18:1 | **fail** | pass |

Homepage pairs (Task 7.1), all enforced in `contrast.test.ts` (it computes the ratios; run it for the exact numbers): bone, bone-muted, blood-glow and slime-soft on `surface` and on `ink` (cards on the page, and cards inside the surface-colored seasonal band); bone-muted on `raised` (broken-image alt text); blood-glow on `surface` (card hover border, 3:1). Plain `blood` on `surface` is 2.98:1, so the card hover border uses `blood-glow`. The hero text sits on translucent gradients: the test blends the strongest red glow over ink and requires AA for bone, blood-glow and slime there (an earlier, stronger glow failed at 4.24:1 for the eyebrow and was reduced). The numbers in the test mirror `styles.css` and a test fails if they drift. Snow specks are at most a few pixels wide and are decoration; where one passes behind a letter the pair stays above 3:1.

### Motion convention

- Animate only behind `motion-safe:` (for example `motion-safe:transition-colors`, `motion-safe:animate-fade-up`). Visitors with `prefers-reduced-motion` then get none. `styles.css` also has a global reduced-motion rule as a safety net.
- Theme keyframes: `animate-fade-up` (rise and fade in) and `animate-flicker` (slow, shallow opacity change; keep it slow and low contrast, WCAG 2.3.1). Add new ones next to them in `@theme`.
- The homepage (Task 7.1) animates only the hero atmosphere (`animate-flicker` on the glow, `animate-snow-far` / `animate-snow-near` on two snow layers) and card transitions/lift, all as `motion-safe:` utilities. Verified: in the built CSS every `.motion-safe\:animate-*` rule is inside `@media (prefers-reduced-motion: no-preference)`, and a test requires the `motion-safe:` prefix on every animation, transition and movement class in the homepage markup. The snow moves with `transform` only (compositor), looping seamlessly because it travels exactly one tile.
- An animation library (for example Motion) may be added later when the Tailwind utilities are not enough; none is installed.

### How to add a page type or route

1. Path builder and pattern in `src/routes.ts`; output directory name in `SEGMENT` if it is generated.
2. Template under `src/pages/` as a plain component of the model.
3. Route element in `src/app/route-elements.tsx` and an entry in `src/app/routes.tsx` (client and server pick it up together).
4. Model type in `PageModel` / `entityFacts` (`src/build/page-model.ts`) and the render switch in `src/build/render-site.tsx` if it needs a generated page; fetch it in `fetch-build-data.ts`.
5. Tests: `src/app/routes.test.tsx`, the black-box suite `static-output.test.ts`, and hydration (`src/client/hydration.test.tsx`).

## Homepage (Task 7.1, Part B)

`/` is generated at build time to `dist-static/index.html` from `GET /home` (`BuildData.home`); nothing about collections, the featured movie or character is written in code (Req 9.2). `src/pages/HomePage.tsx` is the template (route element `HomeRoute`), `src/pages/home-content.ts` holds the fixed site text.

**Content and DOM order** (collections are the product; the order is the homepage link-priority definition, see the table above):
1. **Hero** (`<h1>`): "Everything Christmas Horror. One Home.", a collection-first intro and a call to action, "Explore featured collections", an in-page anchor to `#featured-collections` (no `/collections` route is invented). The call to action is left out when there are no featured collections, so it never points at nothing.
2. **Featured collections** (`id="featured-collections"`), API order (editorial order, Req 2.5).
3. **Seasonal collections**, a visually distinct band; only when `seasonalCollections` is not empty.
4. **Gift ideas**: the `giftCollection` as a large card; omitted when null.
5. **Featured character**, then **featured movie**; each omitted when null.

**Each collection appears once (owner decision).** A collection can be in several `/home` lists. The more specific role wins: (1) the gift collection (gift section), (2) featured collections, (3) seasonal collections. So a collection that is featured and seasonal is shown only as featured, and the gift collection is shown only in the gift section (removed from featured and seasonal). Each remaining list keeps API (editorial) order; a section emptied by this is omitted (and the hero call to action follows the final featured list). One pure function, `dedupeHomeCollections` (`src/pages/home-collections.ts`), implements it; `renderSite` applies it to the model before anything else reads it, so the markup, the embedded hydration data, the featured-collections `ItemList` JSON-LD, the link-priority order and the "no featured collections" warning all see the same final lists. When entries were removed the build prints one informational line (`home "/": removed N duplicate collection entries (...); each collection is shown once ...`). A repeat inside one list keeps its first entry. This is presentation only: the server `/home` endpoint and contract are unchanged (Design 4.2).

**Featured character before featured movie (owner decision):** the order follows Req 9.8's link-priority order. Req 2.3 lists them the other way round; the owner chose character first.

**Header width:** the shell header/footer (`max-w-5xl`) and the homepage content (`max-w-6xl`) differ; the owner will settle one width after the MVP. Not changed here.

**Semantics:** one `h1`, one `h2` per section, one `h3` per card. Cards are `<li>` in a `<ul role="list">`; the link is in the `h3` and its text is the title; a stretched `::after` makes the whole card clickable without nested links. Cards show only fields of the Summary types: collection type label and summary, media type and year with the synopsis for a movie, character summary.

**Images:** every card image goes through `PageImage`, all `loading="lazy"`; the hero has none. Decision: the hero is a text hero that fills most of the first screen, so no card image is reliably above the fold; making one eager would be a guess, and an eager image also adds a preload link. No image is `fetchpriority="high"` and the head has no image preload. Alt text is the card title (the summaries carry none). Missing images (no URL, unusable URL, or a root-relative file that does not exist under `public/`) use the "Image unavailable" placeholder (see Image delivery). The seed data's `/images/...` files do not exist yet, so the cards show the placeholder until real files are added to `web/public/images/...`.

**References that are not built:** a `/home` entry whose slug is not among the built pages renders as plain text and adds a build warning (`home "/": references movie "x" (featured movie), which is not ...`). The hydration data carries the built movie and character slugs (`knownMovieSlugs`, `knownCharacterSlugs`, homepage only) so the browser renders the same plain text.

**Warnings (never errors):** `NO FEATURED COLLECTIONS` when collections are published but the homepage DISPLAYS no featured collection (after deduplication); one informational line when duplicates were removed; the unbuilt-reference warnings above; `home "/": no usable image; using fallback image ...` on every build (see Metadata); and the one aggregated missing-image-files line (see Image delivery).

**Metadata:** title `Horror Christmas | Everything Christmas Horror. One Home.` (brand first, a constant), description from a constant (at most 160 characters, tested), canonical `{SITE_URL}/`, `og:type` website, `og:image` the fallback SVG (so `twitter:card` is `summary` and the fallback warning applies, as for entities), JSON-LD in one `@graph`: `WebSite` (name, url, description; deliberately **no** `SearchAction`, there is no search UI yet) and an `ItemList` of the featured collections that are built (positions from 1, absolute URLs; no ItemList when none).

**No JavaScript needed:** the page is complete HTML; hydration (the standard `#__PAGE_DATA__` mechanism) adds no behavior. The hydration test covers a full page and a page with every optional part absent.

**How to edit the hero copy:** edit the constants in `src/pages/home-content.ts` (`HOME_EYEBROW`, `HOME_HEADLINE_LEAD` / `HOME_HEADLINE_TAIL`, `HOME_INTRO`, `HOME_CTA_LABEL`, `HOME_HEADINGS`, `HOME_TITLE`, `HOME_DESCRIPTION`) and rebuild. The wording is provisional (OPEN-DECISIONS.md).

**Hero atmosphere** (`styles.css`, `.hero-*`): layered CSS gradients, a vignette, a flickering red glow and two snow layers, all `aria-hidden`, no image, font or script. Delete the three decorative `div`s in `Hero` to remove it, or tune the colors/strengths in the CSS (then re-check `contrast.test.ts`).

**Tests:** `pages/home.test.tsx` (template), `build/home.test.tsx` (warnings, metadata, JSON-LD, renderSite), `build/static-output.test.ts` ("homepage" block, the crawl, sitemap, determinism), `client/hydration.test.tsx`, `build/fetch-build-data.test.ts` (/home), `theme/contrast.test.ts`. `npm run verify:static-offline` also checks `/`.

### Not verified

The homepage was checked in headless Chrome (layout at 320, 390 and 1280px, no horizontal overflow, contrast by eye plus the computed tests); the other pages' appearance and real keyboard focus rings were not. Reduced-motion behavior was verified in the built CSS and markup, not by emulating the preference in a browser. Visual appearance (layout, colors, focus rings, the 320px layout) of the entity pages was not checked in a browser. Hydration is verified in jsdom against the real generated pages; the production JS bundle has not been executed in a real browser.
