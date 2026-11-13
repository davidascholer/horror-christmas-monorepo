/**
 * Public route helpers (Task 6.2, Requirements 9.1, 9.2, 15.1).
 *
 * Routes are slug-based and end in a trailing slash. No internal IDs.
 * Shared by the page components (for links) and the static generator (for
 * output paths), so a link and the page it points to cannot drift apart.
 * Plain functions only. The React Router route table (src/app/routes.tsx)
 * takes its URL patterns from here (`ROUTE_PATTERNS`, `HOME_PATH`), so the
 * paths in links, output files and the router cannot drift apart.
 */
export type PageType = 'collection' | 'movie' | 'character' | 'product';

const SEGMENT: Record<PageType, string> = {
  collection: 'collections',
  movie: 'movies',
  character: 'characters',
  product: 'products',
};

/** Homepage route. Generated at build time from the /home projection (Task 7.1, Part B). */
export const HOME_PATH = '/';

/**
 * In-page anchor of the homepage's featured collections section. There is no
 * collections index page (open item), so the shell's "Collections" link and
 * the hero call to action both jump to this section.
 */
export const FEATURED_COLLECTIONS_ANCHOR = 'featured-collections';
export const FEATURED_COLLECTIONS_HREF = `${HOME_PATH}#${FEATURED_COLLECTIONS_ANCHOR}`;

/**
 * React Router patterns, one per page type, derived from the same segments as
 * the path builders: `/collections/:slug`. React Router matches them with or
 * without the trailing slash that the generated URLs carry.
 */
export const ROUTE_PATTERNS: Record<PageType, string> = {
  collection: `/${SEGMENT.collection}/:slug`,
  movie: `/${SEGMENT.movie}/:slug`,
  character: `/${SEGMENT.character}/:slug`,
  product: `/${SEGMENT.product}/:slug`,
};

/** Top-level output directories, one per page type. */
export const ROUTE_SEGMENTS: readonly string[] = Object.values(SEGMENT);

/** True if the slug is safe to use as one URL path segment and one directory name. */
export function isValidSlug(slug: string): boolean {
  return (
    slug.length > 0 &&
    slug !== '.' &&
    slug !== '..' &&
    !/[/\\\0?#%\s]/.test(slug)
  );
}

function routeFor(type: PageType, slug: string): string {
  if (!isValidSlug(slug)) {
    throw new Error(`Invalid ${type} slug ${JSON.stringify(slug)}: must be a single path segment`);
  }
  return `/${SEGMENT[type]}/${slug}/`;
}

export const collectionPath = (slug: string): string => routeFor('collection', slug);
export const moviePath = (slug: string): string => routeFor('movie', slug);
export const characterPath = (slug: string): string => routeFor('character', slug);
export const productPath = (slug: string): string => routeFor('product', slug);

/** Output file for a route, relative to the output directory: `movies/{slug}/index.html`. */
export function routeToOutputPath(route: string): string {
  return `${route.replace(/^\/+/, '')}index.html`;
}
