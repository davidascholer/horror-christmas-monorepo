/**
 * Hydration data: what the static generator embeds in each page so the browser
 * can hydrate the server-rendered markup without refetching anything.
 *
 * The generator writes this payload into
 * `<script type="application/json" id="__PAGE_DATA__">` (escaped with
 * serializeJsonForScript). The client reads it before hydrating, and the
 * server and the client then render exactly the same tree from exactly the
 * same data, so the markup matches.
 *
 * Contents:
 * - `page`: the model of the page (the same object the page template rendered);
 *   for the homepage `{ type: 'home', model: HomeResponse }`.
 * - `knownCollectionSlugs`: the render-time collection list the templates use
 *   to decide whether a collection mention is a link or plain text (see
 *   pages/render-context.ts). Without it the client would render different
 *   markup for collections that are not published.
 *
 * Internal identifiers are not published (Requirement 5.1 / the "no internal
 * ids in the output" property): `pseudonymizeIds` replaces every `id` and
 * `*Id` value with a neutral token (`i1`, `i2`, ...). The templates only use
 * ids as React keys, and equal ids keep equal tokens, so rendering is
 * unchanged. The server renders from the same pseudonymized payload it
 * embeds, so both sides see identical data.
 *
 * Custom image resolvers (pages/image-sources.ts) are functions and cannot be
 * embedded: the client always uses the default resolver. A custom resolver on
 * the server therefore needs a matching one in the client entry.
 */
import { createContext, useContext } from 'react';
import type { SitePageModel } from '../build/page-model';

export const PAGE_DATA_ELEMENT_ID = '__PAGE_DATA__';
export const HYDRATION_VERSION = 1;

export interface HydrationPayload {
  version: typeof HYDRATION_VERSION;
  page: SitePageModel;
  knownCollectionSlugs: string[] | null;
  /**
   * Homepage only: slugs of the built movies and characters, so a featured
   * movie or character that is not built renders as plain text on the client
   * exactly as on the server. Absent on entity pages (they do not link to
   * movies or characters through this mechanism).
   */
  knownMovieSlugs?: string[] | null;
  knownCharacterSlugs?: string[] | null;
}

const ID_KEY = /^(id|[a-z]+Id)$/;

/**
 * Returns a deep copy of `value` in which every string under an `id` / `*Id`
 * key is replaced by a token that is stable per distinct id within this call
 * (first-seen order, so the result is deterministic).
 */
export function pseudonymizeIds<T>(value: T): T {
  const tokens = new Map<string, string>();
  const token = (id: string): string => {
    let t = tokens.get(id);
    if (t === undefined) {
      t = `i${tokens.size + 1}`;
      tokens.set(id, t);
    }
    return t;
  };
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.entries(v).map(([k, x]) => [k, ID_KEY.test(k) && typeof x === 'string' ? token(x) : walk(x)]),
      );
    }
    return v;
  };
  return walk(value) as T;
}

const PAGE_TYPES = new Set(['home', 'collection', 'movie', 'character', 'product']);

/** Parses and sanity-checks embedded page data. Throws a clear error on anything unexpected. */
export function parseHydrationPayload(text: string): HydrationPayload {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`Embedded page data is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const v = value as Partial<HydrationPayload> | null;
  const page = v?.page as { type?: unknown; model?: { slug?: unknown; featuredCollections?: unknown } } | undefined;
  // The homepage model has no slug; it has the featured collections list instead.
  const modelOk = page?.type === 'home' ? Array.isArray(page.model?.featuredCollections) : typeof page?.model?.slug === 'string';
  if (
    !v || v.version !== HYDRATION_VERSION || !page || typeof page.type !== 'string' || !PAGE_TYPES.has(page.type) ||
    !modelOk ||
    !(v.knownCollectionSlugs === null || Array.isArray(v.knownCollectionSlugs))
  ) {
    throw new Error(`Embedded page data has an unexpected shape (expected version ${HYDRATION_VERSION})`);
  }
  return v as HydrationPayload;
}

/** The embedded page data of `doc`, or null when the document has none (dev server, client-only). */
export function readHydrationPayload(doc: Document): HydrationPayload | null {
  const el = doc.getElementById(PAGE_DATA_ELEMENT_ID);
  return el ? parseHydrationPayload(el.textContent ?? '') : null;
}

/** The data of the current page, or null when the app runs client-only without embedded data. */
export const PageDataContext = createContext<HydrationPayload | null>(null);
export const usePageData = (): HydrationPayload | null => useContext(PageDataContext);
