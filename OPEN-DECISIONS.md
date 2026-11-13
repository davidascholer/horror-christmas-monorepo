# Open Implementation Decisions

This document tracks implementation choices that remain unresolved and require owner approval before selection.

## Decision Status

✅ = Decided (documented in ADRs or design)  
❌ = Open (requires owner approval)

## Technology Stack

### Backend (Server)

| Decision | Status | Notes |
|----------|--------|-------|
| Runtime | ✅ Node.js + TypeScript | Decided |
| Database | ✅ PostgreSQL | Decided |
| ORM | ✅ Prisma | Decided |
| Architecture | ✅ Modular monolith | Decided |
| API Framework | ❌ Open | Options: Express, Fastify, Hono, others |
| CMS/Admin Interface | ❌ Open | Options: Custom, Payload CMS, KeystoneJS, others |
| Object Storage | ❌ Open | Options: Cloudflare R2, Amazon S3, others |

### Frontend (Web)

| Decision | Status | Notes |
|----------|--------|-------|
| Framework | ✅ React + TypeScript | ADR-002 |
| Bundler | ✅ Vite | ADR-002 |
| Rendering | ✅ Static generation | Design doc (NOT Next.js) |
| Routing | ✅ Decided | React Router v7, library mode (no framework mode, no SSR features). One route table shared by the static render and the browser |
| State Management | ✅ Decided | TanStack Query for the browser's API calls (first users: search, watchlists). No other state library. Static content pages need no cache |
| UI Component Library | ✅ Decided | None. Custom components only |
| CSS Approach | ✅ Decided | Tailwind CSS v4 with `@theme` tokens; dark theme only, no light theme. Transition/animation utilities only, honoring `prefers-reduced-motion`; an animation library (for example Motion) may be added later, none now |

### Infrastructure

| Decision | Status | Notes |
|----------|--------|-------|
| Web Deployment | ❌ Open | Options: Cloudflare Pages, Netlify, Azure Static Web Apps |
| API Deployment | ❌ Open | Options: Railway, Render, Fly.io, AWS, Azure, GCP |
| Database Hosting | ❌ Open | For dev/stage/prod (currently Docker for testing) |
| CDN | ❌ Open | May be included with web deployment provider |

### Observability

| Decision | Status | Notes |
|----------|--------|-------|
| Analytics Vendor | ❌ Open | Options: Plausible, Fathom, Google Analytics, others |
| Error Tracking | ❌ Open | Options: Sentry, Rollbar, others |
| Logging | ❌ Open | Options: Pino, Winston, others |

### Package Versions

| Category | Status | Notes |
|----------|--------|-------|
| React | ✅ Decided | Version 19.3.1 |
| React DOM | ✅ Decided | Version 19.3.1 |
| TypeScript | ✅ Decided | Version 5.7.2 |
| Vite | ✅ Decided | Version 6.0.3 |
| Node types | ✅ Decided | @types/node 22.10.2 |
| Prisma Client | ✅ Decided | Version 6.1.0 |
| Prisma CLI | ✅ Decided | Version 6.1.0 |
| tsx (dev server) | ✅ Decided | Version 4.19.2 (also pinned exactly in `web/` devDependencies in Task 6.2 to run `npm run build:static`) |
| @types/node (web) | ✅ Decided | 22.10.2, pinned exactly in `web/` devDependencies in Task 6.2 (the generator uses `node:fs`) |
| Vitest | ✅ Decided | Version 2.1.8 (both web and server) |
| jsdom | ✅ Decided | Version 25.0.1 (web test environment) |
| React Router (web) | ✅ Decided | 7.18.5, pinned exactly. Peer deps `react >=18`, `react-dom >=18` (React 19 supported). One package for client and server rendering (`StaticRouter`, `BrowserRouter`). v8 exists (`latest` tag) but needs Node >= 22.22; v7 was the owner's choice |
| TanStack Query (web) | ✅ Decided | @tanstack/react-query 5.107.1, pinned exactly. Peer deps `react ^18 \|\| ^19` |
| Tailwind CSS (web, dev dependency) | ✅ Decided | tailwindcss 4.3.5 and @tailwindcss/vite 4.3.5, pinned exactly; build-time only. `@tailwindcss/vite` peers `vite ^5.2 \|\| ^6 \|\| ^7 \|\| ^8` (Vite 6.4.6 installed) |
| Other npm packages | ❌ Open | Specific versions not selected yet |

## Configuration

| Decision | Status | Notes |
|----------|--------|-------|
| Environment variable approach | ❌ Open | .env files, runtime injection, build-time, etc. Provisional in `web/`: the generator reads `API_BASE_URL` and `SITE_URL` from the process environment; the browser reads `VITE_API_BASE_URL` (inlined by Vite at build time) |
| `SITE_URL` (static build) | ⚠️ Provisional | Public site origin used for canonical, `og:url` and JSON-LD URLs; read from the environment, required, validated (absolute http(s), no query/fragment). The actual domain and hosting are still open. Added in Task 6.3 |
| Feature flags | ❌ Open | Needed or not? Which service/approach? |
| CORS configuration | ❌ Open | Specific origins and headers |

## Development Workflow

| Decision | Status | Notes |
|----------|--------|-------|
| Linting rules | ❌ Open | ESLint configuration details |
| Formatting | ❌ Open | Prettier configuration or alternative |
| Git hooks | ❌ Open | Husky, lint-staged, or alternatives |
| CI/CD platform | ❌ Open | GitHub Actions, GitLab CI, others |

## Testing

| Decision | Status | Notes |
|----------|--------|-------|
| Unit test framework | ✅ Decided | Vitest (both web and server) |
| Component test framework | ❌ Open | Options: Testing Library, others. Not needed so far: component and hydration tests use react-dom with `act` in jsdom. Playwright/Cypress are not approved |
| E2E test framework | ❌ Open | Options: Playwright, Cypress, others |
| Property-based testing | ❌ Open | Options: fast-check, others |

## API Query Behavior

Raised during Task 4.3, partly decided by the owner before Task 4.4. Design section 4.3 lists `GET /movies` with optional `q`, `year`, `genre`, and pagination but does not define parameter names, limits, or matching semantics. Implemented in `server/src/services/movie.service.ts` and `server/src/repositories/movie.repository.ts`, and asserted by `server/src/api/routes.test.ts`.

| Decision | Status | Notes |
|----------|--------|-------|
| Pagination parameter names | ✅ Decided | `page` / `pageSize` (indexed pagination), as in the `MovieListQuery` contract |
| Default and maximum page size | ✅ Decided | Indexed pagination: default `pageSize` is 50 (applied when omitted; `page` defaults to 1) and the maximum is 200. A `pageSize` above 200 is rejected with `RangeError` (the API layer maps it to 400), never silently clamped. No maximum would apply only if the API moved to cursor-based/continuous-scroll pagination, which is not the current design |
| `genre` semantics | ✅ Decided | `genre` is a tag slug (case-insensitive match against a linked tag `slug`); the Movie model has no genre field |
| `q` semantics | ✅ Decided | Case-insensitive substring match on `title` and `originalTitle`. Full-text search belongs to the Search module |
| Oversized `pageSize` handling | ✅ Decided (owner, Task 5.1) | `pageSize` above 200 is rejected with a 400, not clamped |
| API error body shape | ✅ Decided (owner, Task 5.1) | `{ error: { code, message } }` |
| API route representation | ✅ Decided (owner, Task 5.1) | Plain route table in `server/src/api/routes.ts`; no HTTP framework selected yet (API Framework above is still open) |
| Search implementation details | ✅ Implemented (Task 5.1) | PostgreSQL FTS via parameterized `$queryRaw` (`websearch_to_tsquery('english')`), published only, query capped at 200 chars. Summary fallback and ordering documented in `server/src/services/search.service.ts` |
| Search GIN index | ✅ Decided (owner, before Task 6.1) | No GIN index for now: the catalogue is small. Revisit if data grows or search is slow |
| Search result cap | ✅ Decided (owner, before Task 6.1) | Results are capped at 50 total across categories (`MAX_SEARCH_RESULTS`); lowest-priority categories are cut first. Both choices kept |
| `/build/*` response shape | ⚠️ Decided by implementation (Task 6.1), awaiting owner review | Design 6.2 names the four endpoints but not their payload. Each returns a bare JSON array of `{ slug, updatedAt }` objects (`BuildSlugEntry`), published only, slug ascending (code-unit order, independent of DB collation), `updatedAt` ISO-8601. Objects rather than bare strings so the sitemap task (6.4) can emit `lastmod` without extra requests; no internal IDs. Always 200, empty array when nothing is published. Implemented in `server/src/services/build.service.ts` |
| Web build-time API base URL | ⚠️ Decided by implementation (Task 6.1), awaiting owner review | Read from the `API_BASE_URL` environment variable (required; no default host, build fails with a clear message if unset). Module: `web/src/build/`. This is not the open "Environment variable approach" decision below, only the name used until that is settled |
| Static page generation (Task 6.2) | ⚠ Decided by implementation, awaiting owner review | Pages are rendered at build time with `react-dom/server` `renderToStaticMarkup` (no hydration markers; switch to `renderToString` when Phase 7 adds hydration). Output goes to `web/dist-static/` (gitignored), deliberately separate from Vite's `dist/`; only `collections/`, `movies/`, `characters/`, `products/` under it are cleared per run. Wiring both outputs into one deployable artifact is left to the deployment/Phase 7 work. Run with `npm run build:static` (`API_BASE_URL` required; optional `-- --out <dir>`). Routes: `/{collections,movies,characters,products}/{slug}/` emitted as `{slug}/index.html` |
| Page styling (Task 6.2) | ❌ Still open | Pages ship with no stylesheet and plain semantic HTML. The CSS approach row above is unchanged |
| Routing / client navigation (Task 6.2) | ❌ Still open | Pages use plain `<a href>` links built from slug route helpers (`web/src/routes.ts`). No router chosen |
| Homepage link in layout (Task 6.2) | ⚠ Placeholder | The header links to `/`, the planned Phase 7 homepage route, which does not exist yet |
| Images without alt text (Task 6.2) | ✅ Resolved in Task 6.5 | Movie posters and character images are rendered; with no model alt text the entity name is the alt (see Image delivery below). The React-added `<link rel="preload" as="image">` is kept: it is emitted for the primary image only, not for lazy images or images in `<picture>` |
| Affiliate link disclosure text (Task 6.2) | ❌ Open | Affiliate links render with `rel="sponsored noopener"` and `target="_blank"` but no visible disclosure copy; wording is an editorial/legal decision |
| Tags and franchises (Task 6.2) | ⚠ Decided by implementation | No tag or franchise pages exist, so both render as plain text, not links |
| Pagination response metadata | ❌ Open | Interim: the response is a bare `MovieSummary[]` per the current contract, with no total count or next-page indicator |
| Pagination for other list routes | ❌ Open | `/collections`, `/characters`, `/products` still return all published items with no default or maximum. Flagged for a later decision; behavior unchanged |

## Security

| Decision | Status | Notes |
|----------|--------|-------|
| Rate limiting approach | ❌ Open | Watchlist endpoints need rate limiting |
| Input validation library | ❌ Open | Options: Zod, Yup, others |
| HTTPS enforcement | ❌ Open | Infrastructure level or application level |

## Process for Resolving Open Decisions

1. **Document the options** - Research and list viable alternatives
2. **Present tradeoffs** - Analyze pros/cons for each option
3. **Owner approval** - Product owner makes the decision
4. **Update documentation** - Update this file and relevant docs
5. **Implement** - Proceed with the selected option

## Notes

- Do not select package versions, frameworks, or services without explicit owner approval
- When implementation requires a decision, pause and document the options
- Keep this file updated as decisions are made
- Move decided items to relevant ADRs or design documents

## SEO metadata (Task 6.3)

Implemented with provisional choices; the owner may want to revisit them.

| Item | Status | Notes |
|------|--------|-------|
| Site domain / canonical host | ❌ Open | Supplied through `SITE_URL`; nothing hardcoded |
| Generated excerpt rule | ⚠️ Provisional | Source text per entity (collection introduction, movie synopsis, character biography, product description); whitespace collapsed; at most 160 characters including a one-character `…`; cut at a word boundary |
| SEO title vs. suffix | ⚠️ Provisional | A supplied `seoTitle` is used as given, without ` \| Horror Christmas` appended (reading of Req 9.5) |
| Character structured data | ⚠️ Provisional | `Thing`: Schema.org has no fictional-character type and `Person` is for real people |
| `og:type` values | ⚠️ Provisional | collection `website`, movie `website` (`video.movie` not used; needs extra properties), character `article`, product `product` |
| Movie trailer in JSON-LD | ⚠️ Omitted | A valid `VideoObject` needs name, thumbnail and upload date; the API only has a trailer URL |
| Product `offers` | ⚠️ Provisional | Only with price and currency; no availability claim, since stock is not tracked |
| Fallback image for pages without one | ✅ Implemented (Task 6.5) | `og:image` is `{SITE_URL}/images/image-unavailable.svg` with a build warning; `twitter:card` is `summary`. SVG preview limitation: see Image delivery below |

## Sitemap and robots.txt (Task 6.4)
Implemented with provisional choices; the owner may want to revisit them.
| Item | Status | Notes |
|------|--------|-------|
| Homepage in sitemap | ⚠ Deferred to Phase 7 | The homepage does not exist yet. Add `'/'` to `STATIC_SITEMAP_ROUTES` in `web/src/build/sitemap.ts` when it ships (tested extension point) |
| `lastmod` format | ⚠ Provisional | Full ISO-8601 UTC timestamp from the `/build` `updatedAt`; omitted when unavailable |
| `priority` / `changefreq` | ⚠ Omitted | Ignored by Google |
| Sitemap index | ⚠ Not implemented | Over 50,000 URLs or 50 MB fails the build with a clear message |
| Empty content | ⚠ Provisional | No `sitemap.xml` (schema needs one URL; stale one removed); `robots.txt` written without a `Sitemap:` line |
| `/admin` Disallow | ⚠ Precaution | No admin route exists; CMS/admin approach is still open. robots.txt is not a security control |

## Image delivery, link priority and publication validation (Task 6.5)
Implemented with provisional choices; the owner may want to revisit them. Details in `web/README.md`.

| Item | Status | Notes |
|------|--------|-------|
| Responsive / WebP image variants | ❌ Open | Only the hook exists: `ImageSourceResolver` (`web/src/pages/image-sources.ts`, passed as `renderSite({ imageResolver })`). The default returns the original URL and invents no variants. How variants are produced (build step, image CDN or service), their URL convention and their widths are undecided; no image-processing dependency was added |
| Object storage / image CDN (R2 vs S3) | ❌ Open | Unchanged. Image URLs are used as the API gives them |
| Image dimensions | ⚠ Limitation | The API models carry no width/height, so `<img>` has none and pages can shift layout while images load. Needs dimensions from the API or the image pipeline |
| Alt text for movie and character images | ⚠ Provisional | The models have no alt field; the entity name is used (movie title, character name, product name if `imageAlt` is empty, collection title if `heroImageAlt` is empty). A dedicated alt field per image is an editorial/API decision |
| Fallback image asset | ✅ DECIDED by the owner (one placeholder) | `web/public/images/image-unavailable.svg` ("Image unavailable", broken-picture icon, theme colors, 1200x630) is the only placeholder. It replaces `fallback.svg` and is used for no URL, an unusable URL, and a root-relative URL whose file is not under `public/` (substituted at build time, one summary warning). Shown as a decorative image (`alt=""`, `role="presentation"`): every slot has visible text next to it (card title, page h1). Final artwork is still a design decision |
| SVG fallback in link previews (`og:image`) | ❌ Open | `og:image` for entities without an image (or whose file is missing) is `{SITE_URL}/images/image-unavailable.svg`. Some platforms do not render SVG in link previews, so such previews may show no image. A PNG/JPG fallback asset (for example 1200x630) is an owner/design decision; once it exists, change `FALLBACK_IMAGE_PATH` or add a separate og fallback constant |
| `twitter:card` for the fallback | ⚠ Provisional | `summary` (small card) when the fallback image is used, `summary_large_image` for an entity's own image |
| Internal-link order (Req 9.8) | ⚠ Provisional reading | Related collections, then collection items, then characters, movies, products. On entity pages the collections the entity belongs to are the "related collections" and come first. On collection pages the items are movies, characters, products (editorial order kept). DOM order only; visual order is a later design decision. Table in `web/README.md` |
| Unresolved collection reference | ⚠ Provisional | Rendered as plain text (title kept) with a build warning, not omitted and not failed. The live API already leaves unpublished collections out, so this guards against inconsistent data |
| Zero published collections | ⚠ Provisional | One warning, not a failure, although the product is collection-first. Whether this should fail a production build is an owner decision |
| Publication validation in the web build | ⚠ Decided by implementation, awaiting owner review | `web/src/build/validate-publication.ts`, rules mirrored (duplicated) from `server/src/validation/publication-validation.ts`; fails the build with an aggregated list. Addition: a collection hero URL that is present but unusable is an error. Reading of Req 18.3: the SEO description is required for launch (Req 12.2), so its absence is an error even though the Task 6.3 description fallback could render something; that fallback is now unreachable in `build:static` for SEO descriptions. Keep the strict reading or relax it is an owner decision |
| Validation opt-out for local development | ❌ Not added | A strict build blocks building a partial local dataset. No flag was added because a silent bypass could ship incomplete pages. If wanted, the owner should choose between a loud flag (for example one that prints every skipped problem and refuses `NODE_ENV=production`) or loading complete fixture data locally |
| Web / server validation drift | ⚠ Risk | The two validators are separate copies by design. Tests pin the web rules; a change to the server rules must be repeated in `web/src/build/validate-publication.ts` |

## Phase 6 checkpoint (Task 6.6)
Decided by implementation while writing the output verification; the owner may want to revisit. Details in `web/README.md`.

| Item | Status | Notes |
|------|--------|-------|
| Fixture helper for the real-stack check | ⚠ Decided by implementation | `server/scripts/static-offline-fixture.ts` (`npm run fixture:static-offline -- seed\|count\|clean <zz-prefix>`) is a small permanent server-side helper, run as a child process by `web/scripts/verify-static-offline.ts`, so `web/` imports nothing from `server/`. It only touches rows whose slug starts with a `zz-` prefix. The alternative (a throwaway insert script run by hand) was rejected as not repeatable |
| `verify:static-offline` output directory | ⚠ Provisional | Writes to a fresh temp directory, not `web/dist-static`, so an existing local build is never deleted |
| Title format and description fallbacks in `build:static` | ⚠ Existing tension, now pinned | Because publication validation requires `seoTitle` and `seoDescription` (Task 6.5), the `Name \| Horror Christmas` title and the summary/excerpt description fallbacks are unreachable through `build:static`; they are verified through `renderSite` + `writePages`. See the Task 6.5 row on strict vs relaxed validation |
| Collection items pointing at unbuilt entities | ⚠ Not checked by the generator | Only collection references are checked (warning, plain text). A collection item whose movie/character/product has no built page would render a dead link. The live API does not return unpublished items, so this is guarded only by the API |
| Homepage as link target | ⚠ Allow-listed | The output test allows exactly `/` as a link target that has no generated page (Phase 7). Adding the homepage should keep that list at `/`; adding any other entry needs a reason |

## Publishing the seed catalog (Task 3.5)
Implemented on the owner's direction ("seed the test data into a database so we have full restful functionality"). Details in `server/README.md`.

| Item | Status | Notes |
|------|--------|-------|
| Publish step separate from seeding | ✅ Owner direction | `npm run seed:publish` (`server/prisma/publish-seed.ts`). Seed scripts still create DRAFT |
| Scope of the publish step | ⚠ Decided by implementation | Only the slugs in the seed files; fixture prefixes (`zz-`, `t52`, `t43`, `e2e`, `test-`) refused; localhost-only `DATABASE_URL` guard. How a real editorial publish flow (CMS/admin, still open) will replace this is undecided |
| Collection publish rules beyond the validators | ⚠ Decided by implementation, awaiting owner review | A collection is published only if one of its member movies will be published and all its related collections will be published (avoids unresolved references in the static build). Stricter than "at least one related collection" |
| Placeholder image paths | ❌ Owner action | Seed images are root-relative paths (`/images/...`) with no files behind them; replace with real assets or object-storage URLs before launch |
| Placeholder affiliate links / trailer | ❌ Owner action | Affiliate URLs point at real retailer domains with made-up paths; the Krampus trailer ID is unverified. A corrupted Gremlins trailer URL was removed |
| Task 3.4 editorial findings | ⚠ Reported, unchanged | 18 movies, 7 characters and 25 products belong to no collection; 6 collections have more than 15 items. Catalog shape not altered |

## Frontend foundation (Task 7.1, Part A)

Owner decisions (routing, styling, components, data cache, palette) are in the tables above. Details in `web/README.md`, "Frontend foundation".

### Decided by implementation (owner may revisit)

| Item | Status | Notes |
|------|--------|-------|
| Palette values | ⚠ Chosen within the owner's roles | ink `#0a0a0b`, bone `#f4f1ea`, slime `#7dff2e`, blood `#c1121f`, plus tints (`surface`, `raised`, `line`, `bone-muted`, `slime-soft`, `slime-deep`, `blood-glow`, `blood-deep`). Real contrast ratios are in the `web/README.md` table and enforced by `src/theme/contrast.test.ts`. Plain blood on ink is 3.18:1: buttons with bone text (5.52:1), borders and large text only; red text on dark uses `blood-glow` (6.48:1) |
| Output layout | ⚠ Decided by implementation | `web/dist-static/` is the single deployable artifact. `vite build` writes `assets/` and `.vite/manifest.json` there (no `index.html` is emitted, so nothing collides with the generated homepage); the generator reads the manifest and adds pages. A small Vite plugin removes only the previous `assets/` and `.vite/` before each client build. `dist/` stays gitignored and unused |
| `public/` copy | ⚠ Decided by implementation | One mechanism: the generator's `copyPublicAssets`. Vite's public-dir copy is off for builds and on for the dev server |
| Hydration data | ⚠ Decided by implementation | Each page embeds its model in `#__PAGE_DATA__` so the browser hydrates without refetching (about 1.4 KB to 16 KB per page on the current catalog). Internal ids are replaced by neutral tokens (the output must not expose ids). Cost: page content exists twice in the HTML |
| Strictness of output tests | ⚠ Changed deliberately | Pages now legitimately contain three scripts (ld+json, hydration JSON, one module script). The "no internal ids", "no `javascript:`" and "no unresolved collection slug" checks look at markup and attributes, not at the inert hydration JSON, which still holds the model fields those pages are built from. See the Task 7.1 Part A report |
| "Collections" nav link | ⚠ Interim | Since Task 7.1 Part B it points to `/#featured-collections`, the featured collections section of the homepage, because there is no collections index page (see Part B below) |
| Navigation between pages | ⚠ Plain anchors | Full page loads. Client-side navigation needs a way to get another page's data in the browser (embedded index or API fetch) |
| Browser API base URL | ⚠ Provisional | `VITE_API_BASE_URL`; part of the open environment-variable decision |
| API HTTP caching headers | ❌ Follow-up, not in scope | `Cache-Control` / `ETag` on the API would complement the client cache |

### Open items found

| Item | Status | Notes |
|------|--------|-------|
| (a) Dynamic URLs such as `/watchlists/{token}` | ❌ Open, blocks Task 8.3 planning | They cannot be pre-generated. They need a host-level SPA fallback or a static shell route with a rewrite rule. The hosting provider is undecided, so Task 8.3 depends on that choice |
| (b) No `/collections` index page | ❌ Open | The header "Collections" link jumps to the homepage's featured collections until the owner decides |
| (c) Brand / display font | ❌ Open | System font stack for now; no font dependency, nothing hotlinked |
| (d) Fallback `og:image` is an SVG | ❌ Open | Many social platforms do not render SVG; a PNG or JPG fallback is needed before launch |
| (e) Seed image files do not exist | ⚠ Mitigated, owner action remains | The build now shows the "Image unavailable" placeholder for every root-relative image URL whose file is not in `web/public/`, so pages have no broken images. Add real files under `web/public/images/...` (or use absolute URLs) and the next build picks them up with no code change. Absolute http(s) URLs cannot be checked at build time |


## Homepage (Task 7.1, Part B)
Details in `web/README.md`, "Homepage".
### Decided by implementation (owner may revisit)
| Item | Status | Notes |
|------|--------|-------|
| Brand copy | ⚠ Provisional, owner to rewrite | Headline is the brand promise "Everything Christmas Horror. One Home."; eyebrow "Christmas horror, curated", the intro, the call to action label, section headings, `<title>` and meta description are drafts in `web/src/pages/home-content.ts` (one file, rebuild to apply) |
| Hero atmosphere | ⚠ Decided by implementation | CSS only: layered gradients, vignette, a flickering red glow and two slowly falling snow layers; no image, font, script or dependency; all animation is `motion-safe:`. Red glow strengths were lowered once to keep the eyebrow at AA; they are pinned by a test. Owner may want imagery, a different effect, or none |
| Image priority | ⚠ Decided by implementation | All homepage images are lazy; the hero has no image. Revisit if the design puts an image above the fold |
| Homepage og:image | ❌ Open | Uses the fallback SVG, so every build emits one standing warning (`home "/": no usable image ...`) and the Twitter card is `summary`. A brand share image (PNG/JPG, see item (d) above) resolves both |
| `ItemList` / no `SearchAction` | ⚠ Decided by implementation | WebSite + ItemList of featured collections. The sitelinks searchbox (`SearchAction`) is deliberately absent until search exists (Task 7.4) |
| A collection in several sections | ✅ DECIDED by the owner | Each collection appears at most once on the homepage. The more specific role wins: gift collection, then featured, then seasonal. API order is kept; a section emptied by this is omitted; the build prints one informational line when entries were removed. Presentation rule in `web/` (`src/pages/home-collections.ts`); the server `/home` contract is unchanged (Design 4.2). The dev data repeats "Winter Monsters" and "Best Gifts For Krampus Fans" |
| Character before movie | ✅ DECIDED by the owner | Featured character comes before the featured movie in DOM and visually. This follows Req 9.8's link-priority order; Req 2.3 lists them the other way round, and the owner chose character first |
| Section layout | ⚠ Decided by implementation | Featured character, movie and gift each have their own section and h2 (one h2 per section); a combined "also worth a look" row could be tighter |
| Shell width | ⚠ Deferred to post-MVP styling (owner) | Header and footer content use `max-w-5xl`; the homepage content uses `max-w-6xl`, so the brand name and the section edge do not line up on wide screens. The owner will fix it after the MVP; deliberately left unchanged |
| Homepage not generated without content | ⚠ Decided by implementation | With nothing published, no pages (homepage included) and no sitemap are written, as before |
### Open items found
| Item | Status | Notes |
|------|--------|-------|
| Logo / wordmark | ❌ Open | The brand is plain text in the header |
| Brand / display font | ❌ Open | Same as (c) above; the hero headline uses the system stack and would benefit most |
| Hero imagery | ❌ Open | Needs assets and a decision on eager loading / dimensions |
| `/collections` index | ❌ Open | The hero call to action and the nav link only jump to the featured section; a full list (and its link in the nav) is still undecided |
| Client-side navigation | ❌ Open | Homepage cards and nav are plain anchors (full page loads), as everywhere |
| Dev data has no `featured` flag audit | ⚠ Note | The homepage is only as good as the `featured` / `seasonal` flags; the build warns only when no collection at all is featured |
