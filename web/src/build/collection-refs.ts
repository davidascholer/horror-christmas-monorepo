/**
 * Collection references and the "missing collection" warning (Task 6.5;
 * Requirements 15.4, 18.2). Pure functions, no I/O.
 *
 * A page may reference a collection (a movie's "featured in" list, a
 * collection's related collections, ...) that is not among the collections
 * being built, for example because it was unpublished between API calls or the
 * API returned a stale relation. The page then shows the title as plain text
 * (see CollectionLinkList) and the build reports a warning. The build is not
 * failed: the data the API returned is internally inconsistent, not the
 * publication metadata of the page itself.
 */
import type { BuildData, BuildWarning } from './fetch-build-data';
import type { PageModel } from './page-model';

/** Slugs of the collections referenced by a page, in the order the page lists them. */
export function referencedCollectionSlugs(page: PageModel): string[] {
  switch (page.type) {
    case 'collection':
      return page.model.relatedCollections.map((r) => r.collection.slug);
    case 'movie':
    case 'character':
    case 'product':
      return page.model.collections.map((c) => c.slug);
  }
}

/** Referenced collection slugs (deduplicated, in order) that are not in `known`. */
export function missingCollectionSlugs(page: PageModel, known: ReadonlySet<string>): string[] {
  return [...new Set(referencedCollectionSlugs(page))].filter((slug) => !known.has(slug));
}

export function missingCollectionWarnings(page: PageModel, known: ReadonlySet<string>): BuildWarning[] {
  return missingCollectionSlugs(page, known).map((collectionSlug) => ({
    entityType: page.type,
    slug: page.model.slug,
    message:
      `${page.type} "${page.model.slug}": references collection "${collectionSlug}", which is not among the ` +
      'published collections being built; shown as plain text, not as a link',
  }));
}

/**
 * One prominent warning when there is published non-collection content but no
 * published collection at all: the product is collection-first, so this is
 * almost certainly a content or API problem. Null otherwise.
 */
export function noCollectionsWarning(
  data: Pick<BuildData, 'collections' | 'movies' | 'characters' | 'products'>,
): BuildWarning | null {
  if (data.collections.length > 0) return null;
  const others = data.movies.length + data.characters.length + data.products.length;
  if (others === 0) return null;
  return {
    entityType: 'collection',
    slug: '(none)',
    message:
      `NO PUBLISHED COLLECTIONS: ${data.movies.length} movies, ${data.characters.length} characters and ` +
      `${data.products.length} products are published but no collection is. The site is collection-first; ` +
      'these pages have no collection to link back to (Requirement 1.3)',
  };
}
