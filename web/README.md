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

### Open (requires owner approval)
- React Router vs other routing solutions
- State management approach
- UI component library (if any)
- Package versions
- CSS approach (CSS Modules, Tailwind, etc.)
- Deployment provider
- Analytics vendor

## Development

```bash
# Install dependencies (after package versions are selected)
npm install

# Development server (after implementation)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Directory Structure

```
web/
├── public/               # Static assets (images, fonts, etc.)
├── src/
│   ├── types/
│   │   └── api-contracts.ts  # Shared API contracts (copied from server)
│   ├── components/      # React components (to be created)
│   ├── pages/          # Page components (to be created)
│   ├── hooks/          # Custom React hooks (to be created)
│   ├── utils/          # Utility functions (to be created)
│   ├── App.tsx         # Root component
│   └── main.tsx        # Application entry point
├── dist/               # Build output (static assets)
├── index.html          # HTML entry point
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
- Internal links prioritizing collections → movies → characters → products

## Testing Strategy

- Component tests for UI elements
- Integration tests for page rendering
- Static generation tests
- Accessibility tests (keyboard nav, alt text, ARIA)
- Responsive layout tests
- Offline availability tests for static pages
