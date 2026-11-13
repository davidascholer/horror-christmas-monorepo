/**
 * Homepage collection deduplication (owner review of Task 7.1). Pure, no I/O.
 *
 * Rule (decided by the owner): a collection is shown at most once across the
 * homepage sections. When `/home` lists the same collection more than once the
 * MORE SPECIFIC ROLE WINS:
 *   1. the gift collection (gift section)
 *   2. featured collections
 *   3. seasonal collections
 * Each remaining list keeps API (editorial) order. A section whose list ends up
 * empty is left out of the page. Identity is the slug. A repeat inside one list
 * keeps its first entry.
 *
 * This is a presentation rule of web/. The API contract and the server `/home`
 * endpoint are unchanged. `renderSite` applies it once to the model, so the embedded hydration
 * data, the head (ItemList JSON-LD) and the warnings all see the final lists;
 * `HomePage` applies the same function again as a guard, which is harmless
 * because it is idempotent.
 */
import type { HomeResponse } from '../types/api-contracts';

export interface HomeDedupeResult {
  /** The homepage model with the final, duplicate-free lists. Same object when nothing was removed. */
  home: HomeResponse;
  /** Entries removed from `featuredCollections`. */
  removedFromFeatured: number;
  /** Entries removed from `seasonalCollections`. */
  removedFromSeasonal: number;
  /** Total entries removed. */
  removed: number;
}

export function dedupeHomeCollections(home: HomeResponse): HomeDedupeResult {
  const shown = new Set<string>();
  if (home.giftCollection) shown.add(home.giftCollection.slug);
  const take = <T extends { slug: string }>(list: readonly T[]): T[] =>
    list.filter((c) => {
      if (shown.has(c.slug)) return false;
      shown.add(c.slug);
      return true;
    });
  const featured = take(home.featuredCollections);
  const seasonal = take(home.seasonalCollections);
  const removedFromFeatured = home.featuredCollections.length - featured.length;
  const removedFromSeasonal = home.seasonalCollections.length - seasonal.length;
  const removed = removedFromFeatured + removedFromSeasonal;
  if (removed === 0) return { home, removedFromFeatured, removedFromSeasonal, removed };
  return {
    home: { ...home, featuredCollections: featured, seasonalCollections: seasonal },
    removedFromFeatured,
    removedFromSeasonal,
    removed,
  };
}

/** The informational build warning text, or null when nothing was removed. */
export function dedupeMessage(result: Pick<HomeDedupeResult, 'removed' | 'removedFromFeatured' | 'removedFromSeasonal'>): string | null {
  if (result.removed === 0) return null;
  return (
    `removed ${result.removed} duplicate collection entries (${result.removedFromFeatured} from featured, ` +
    `${result.removedFromSeasonal} from seasonal); each collection is shown once (gift, then featured, then seasonal)`
  );
}
