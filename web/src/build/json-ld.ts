/**
 * Schema.org JSON-LD (Task 6.3, Requirement 9.7). Pure functions.
 *
 * Choices:
 * - collection: CollectionPage whose mainEntity is an ItemList of the items.
 * - movie: Movie. The `trailer` property is omitted: a correct VideoObject
 *   needs name, description, thumbnailUrl and uploadDate, and the API only has
 *   a trailer URL, so emitting one would be incomplete or invented.
 * - character: Schema.org has no fictional-character type (Person is for real
 *   people), so the generic `Thing` is used with name, description, image, url.
 * - product: Product. `offers` only with a known price AND currency, never
 *   with availability, since the data cannot support such a claim.
 * - home: one `@graph` with a WebSite (name, url, description) and an ItemList of
 *   the featured collections that are built. No SearchAction: there is no
 *   search UI yet, and a sitelinks searchbox must not promise one.
 * No aggregateRating or review (MVP has no ratings or reviews).
 */
import { characterPath, collectionPath, moviePath, productPath } from '../routes';
import { absoluteHttpUrl, canonicalUrl } from './site-url';
import { SITE_NAME, isPresent } from './seo';
import type { SitePageModel } from './page-model';
import { HOME_ITEM_LIST_NAME } from '../pages/home-content';
import { serializeJsonForScript } from './safe-json';

export type JsonLd = { [key: string]: unknown };

/**
 * Removes properties that are undefined, null, empty strings, empty arrays or
 * empty objects, recursively. Nothing missing ever reaches the output.
 */
export function prune(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(prune).filter((v) => v !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const pruned = prune(v);
      if (pruned !== undefined) out[k] = pruned;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value.trim() === '' ? undefined : value;
  return value;
}

/** ISO-8601 duration from whole minutes: 98 -> PT1H38M, 120 -> PT2H, 45 -> PT45M. Undefined if not a positive integer. */
export function isoDuration(minutes: number | null | undefined): string | undefined {
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return 'PT' + (h > 0 ? `${h}H` : '') + (m > 0 ? `${m}M` : '');
}

/** `YYYY-MM-DD` (optionally with a time part) is kept as given; a valid release year becomes `YYYY`. */
function datePublished(releaseDate: string | null, releaseYear: number | null): string | undefined {
  // The API serializes the release date column as a full ISO timestamp
  // ("1974-10-16T00:00:00.000Z"); a release date has no time of day, so keep the date part.
  const date = isPresent(releaseDate) ? /^(\d{4}-\d{2}-\d{2})(?:T[\d:.+Z-]+)?$/.exec(releaseDate.trim()) : null;
  if (date) return date[1];
  if (typeof releaseYear === 'number' && Number.isInteger(releaseYear) && releaseYear >= 1000 && releaseYear <= 9999) {
    return String(releaseYear);
  }
  return undefined;
}

export interface JsonLdContext {
  siteUrl: string;
  /** Canonical URL of this page. */
  url: string;
  /** Resolved meta description, or null. */
  description: string | null;
  /** Absolute image URL, or null. */
  image: string | null;
  /**
   * Homepage only: slugs of the built collections. Featured collections that
   * are not built are left out of the ItemList (no URL to a missing page).
   * Null or absent: all are listed.
   */
  knownCollectionSlugs?: ReadonlySet<string> | null;
}

/** Builds the JSON-LD object for a page. Missing data is left out. */
export function buildJsonLd(page: SitePageModel, ctx: JsonLdContext): JsonLd {
  const base = { '@context': 'https://schema.org' };
  const abs = (route: string) => canonicalUrl(ctx.siteUrl, route);

  switch (page.type) {
    case 'home': {
      const featured = page.model.featuredCollections.filter(
        (c) => !ctx.knownCollectionSlugs || ctx.knownCollectionSlugs.has(c.slug),
      );
      return prune({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', name: SITE_NAME, url: ctx.url, description: ctx.description },
          // No ItemList at all when nothing is featured: an empty list says nothing.
          featured.length > 0
            ? {
                '@type': 'ItemList',
                name: HOME_ITEM_LIST_NAME,
                numberOfItems: featured.length,
                itemListElement: featured.map((c, i) => ({
                  '@type': 'ListItem', position: i + 1, name: c.title, url: abs(collectionPath(c.slug)),
                })),
              }
            : undefined,
        ],
      }) as JsonLd;
    }
    case 'collection': {
      const c = page.model;
      // Items keep the order the API returned, grouped movies, characters, products
      // (the same order as the page); positions run on from 1.
      const entries: Array<{ name: string; route: string }> = [
        ...c.movies.map((x) => ({ name: x.movie.title, route: moviePath(x.movie.slug) })),
        ...c.characters.map((x) => ({ name: x.character.name, route: characterPath(x.character.slug) })),
        ...c.products.map((x) => ({ name: x.product.name, route: productPath(x.product.slug) })),
      ];
      const items = entries.map((e, i) => ({
        '@type': 'ListItem', position: i + 1, name: e.name, url: abs(e.route),
      }));
      return prune({
        ...base,
        '@type': 'CollectionPage',
        name: c.title,
        description: ctx.description,
        url: ctx.url,
        image: ctx.image,
        mainEntity: items.length > 0
          ? { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items }
          : undefined,
      }) as JsonLd;
    }
    case 'movie': {
      const m = page.model;
      return prune({
        ...base,
        '@type': 'Movie',
        name: m.title,
        description: ctx.description,
        url: ctx.url,
        image: ctx.image,
        datePublished: datePublished(m.releaseDate, m.releaseYear),
        duration: isoDuration(m.runtime),
      }) as JsonLd;
    }
    case 'character': {
      const c = page.model;
      return prune({
        ...base,
        '@type': 'Thing',
        name: c.name,
        description: ctx.description,
        url: ctx.url,
        image: ctx.image,
      }) as JsonLd;
    }
    case 'product': {
      const p = page.model;
      const price = isPresent(p.price) ? p.price.trim() : null;
      const currency = isPresent(p.currency) ? p.currency.trim() : null;
      const priceOk = price !== null && /^\d+(\.\d+)?$/.test(price);
      const currencyOk = currency !== null && /^[A-Z]{3}$/.test(currency);
      // First affiliate link whose URL is a valid absolute http(s) URL.
      const link = p.affiliateLinks
        .map((l) => absoluteHttpUrl(l.url))
        .find((u): u is string => u !== null);
      return prune({
        ...base,
        '@type': 'Product',
        name: p.name,
        description: ctx.description,
        url: ctx.url,
        image: ctx.image,
        category: p.category,
        offers: priceOk && currencyOk
          ? { '@type': 'Offer', price, priceCurrency: currency, url: link }
          : undefined,
      }) as JsonLd;
    }
  }
}

/**
 * Serializes JSON-LD for the body of a `<script type="application/ld+json">`.
 * Shares the escaping with the hydration data blob (safe-json.ts).
 */
export function serializeJsonLd(data: unknown): string {
  return serializeJsonForScript(data);
}
