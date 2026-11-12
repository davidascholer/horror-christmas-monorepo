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
| Routing | ❌ Open | Options: React Router, TanStack Router, Wouter, others |
| State Management | ❌ Open | Options: Context + Hooks, Zustand, Jotai, others |
| UI Component Library | ❌ Open | Options: None (custom), shadcn/ui, Mantine, others |
| CSS Approach | ❌ Open | Options: CSS Modules, Tailwind, Vanilla Extract, others |

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
| tsx (dev server) | ✅ Decided | Version 4.19.2 |
| Vitest | ✅ Decided | Version 2.1.8 (both web and server) |
| jsdom | ✅ Decided | Version 25.0.1 (web test environment) |
| Other npm packages | ❌ Open | Specific versions not selected yet |

## Configuration

| Decision | Status | Notes |
|----------|--------|-------|
| Environment variable approach | ❌ Open | .env files, runtime injection, build-time, etc. |
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
| Component test framework | ❌ Open | Options: Testing Library, others |
| E2E test framework | ❌ Open | Options: Playwright, Cypress, others |
| Property-based testing | ❌ Open | Options: fast-check, others |

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
