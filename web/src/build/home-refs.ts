/**
 * Homepage validation (Task 7.1; Requirements 2.x, 15.4, 18.2). Pure functions,
 * no I/O. Everything here is a WARNING; none of it fails the build.
 *
 * Two rules:
 *  1. Published collections exist but `/home` has no featured collection: the
 *     site is collection-first, so a homepage without featured collections
 *     is almost certainly a content mistake (nothing is flagged `featured`).
 *  2. `/home` references a collection, movie or character that is not among the
 *     pages being built (for example unpublished between two API calls). The
 *     homepage renders that card as plain text, never a dead link (HomePage),
 *     and the warning names it. Same policy as other missing references.
 */
import type { BuildData, BuildWarning } from './fetch-build-data';
import type { HomeResponse } from '../types/api-contracts';
import { HOME_PATH } from '../routes';
import { dedupeHomeCollections, dedupeMessage } from '../pages/home-collections';

type Built = Pick<BuildData, 'collections' | 'movies' | 'characters'>;

const warning = (message: string): BuildWarning => ({ entityType: 'home', slug: HOME_PATH, message: `home "${HOME_PATH}": ${message}` });

/**
 * Warnings for the homepage. `given` is the `/home` projection as the API returned
 * it; the checks look at what the page actually displays (the deduplicated lists,
 * pages/home-collections.ts), the same lists the render, the hydration data and
 * the JSON-LD use.
 */
export function homeWarnings(given: HomeResponse, built: Built): BuildWarning[] {
  const warnings: BuildWarning[] = [];
  const dedupe = dedupeHomeCollections(given);
  const home = dedupe.home;

  if (built.collections.length > 0 && home.featuredCollections.length === 0) {
    const why =
      given.featuredCollections.length > 0
        ? ` (/home returned ${given.featuredCollections.length}, all shown elsewhere on the page as the gift collection)`
        : '';
    warnings.push(
      warning(
        `NO FEATURED COLLECTIONS: ${built.collections.length} collections are published but the homepage displays no featured collection${why}. ` +
          'The homepage has no featured collections section; mark at least one published collection as featured',
      ),
    );
  }
  const info = dedupeMessage(dedupe);
  if (info) warnings.push(warning(info));

  const collections = new Set(built.collections.map((c) => c.slug));
  const movies = new Set(built.movies.map((m) => m.slug));
  const characters = new Set(built.characters.map((c) => c.slug));
  const seen = new Set<string>();
  const check = (kind: string, slug: string, known: ReadonlySet<string>, where: string) => {
    const key = `${kind}:${slug}`;
    if (known.has(slug) || seen.has(key)) return;
    seen.add(key);
    warnings.push(
      warning(
        `references ${kind} "${slug}" (${where}), which is not among the published pages being built; shown as plain text, not as a link`,
      ),
    );
  };
  home.featuredCollections.forEach((c) => check('collection', c.slug, collections, 'featured collections'));
  home.seasonalCollections.forEach((c) => check('collection', c.slug, collections, 'seasonal collections'));
  if (home.giftCollection) check('collection', home.giftCollection.slug, collections, 'gift collection');
  if (home.featuredCharacter) check('character', home.featuredCharacter.slug, characters, 'featured character');
  if (home.featuredMovie) check('movie', home.featuredMovie.slug, movies, 'featured movie');
  return warnings;
}
