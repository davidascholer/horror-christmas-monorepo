/**
 * Pure page rendering (Task 6.2, Design 2, 3.1, 6.2; Requirements 9.1, 9.2, 15.1).
 *
 * BuildData in, list of pages out. No file system, network or environment
 * access here, so it is trivially testable; writing is in write-pages.ts.
 *
 * Every page is rendered through the same app (src/app/App.tsx) the browser
 * hydrates: Document (html/head/scripts) around `#root`, which holds
 * StaticRouter + App. renderToString is used rather than
 * renderToStaticMarkup because hydrateRoot needs the markup comments that
 * renderToString writes between adjacent text nodes; renderToStaticMarkup
 * omits them and the browser would report a hydration mismatch. The comments
 * are inert (`<!-- -->`).
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import type { BuildData, BuildWarning } from './fetch-build-data';
import type { HomeResponse } from '../types/api-contracts';
import { normalizeSiteUrl } from './site-url';
import { buildPageHead, type PageModel, type SitePageModel } from './page-head';
import { missingCollectionWarnings, noCollectionsWarning } from './collection-refs';
import { homeWarnings } from './home-refs';
import { type RenderContextValue } from '../pages/render-context';
import { defaultImageSourceResolver, type ImageSourceResolver } from '../pages/image-sources';
import { App } from '../app/App';
import { HYDRATION_VERSION, pseudonymizeIds, type HydrationPayload } from '../app/page-data';
import { Document } from './Document';
import type { ClientAssets } from './client-assets';
import { HOME_PATH, characterPath, collectionPath, moviePath, productPath, routeToOutputPath, type PageType } from '../routes';

export interface RenderedPage {
  /** `home` is the homepage (`/`, output `index.html`, empty slug). */
  type: PageType | 'home';
  /** Empty for the homepage. */
  slug: string;
  /** Public route, e.g. `/movies/the-slug/` */
  path: string;
  /** File path relative to the output directory, e.g. `movies/the-slug/index.html` */
  outputPath: string;
  html: string;
}

export interface RenderOptions {
  /** Public site base URL (SITE_URL); validated and normalized. Required for canonical URLs. */
  siteUrl: string;
  /** Client bundle files from the Vite manifest (client-assets.ts). Required: a page without them would have no styles or script. */
  assets: ClientAssets;
  /**
   * Receives metadata and reference warnings (missing description, fallback
   * image, missing collection, no collections at all). They never fail the build.
   */
  warnings?: BuildWarning[];
  /**
   * Image pipeline hook (Task 6.5): maps an image URL to responsive/WebP
   * sources. Default: the original URL only. See pages/image-sources.ts.
   */
  imageResolver?: ImageSourceResolver;
}

function renderPage(page: SitePageModel, options: RenderOptions & { assets: ClientAssets }, context: RenderContextValue): RenderedPage {
  let route: string;
  switch (page.type) {
    case 'home':
      route = HOME_PATH;
      break;
    case 'collection':
      route = collectionPath(page.model.slug);
      break;
    case 'movie':
      route = moviePath(page.model.slug);
      break;
    case 'character':
      route = characterPath(page.model.slug);
      break;
    case 'product':
      route = productPath(page.model.slug);
      break;
  }
  if (context.knownCollectionSlugs && page.type !== 'home') {
    options.warnings?.push(...missingCollectionWarnings(page, context.knownCollectionSlugs));
  }
  const sorted = (set: ReadonlySet<string> | null): string[] | null => (set ? [...set].sort() : null);
  const payload: HydrationPayload = {
    version: HYDRATION_VERSION,
    // Ids are replaced before embedding, and the app renders from this same payload (see page-data.ts).
    page: pseudonymizeIds(page),
    // Sorted: the order of data.collections must not leak into the output (deterministic builds).
    knownCollectionSlugs: sorted(context.knownCollectionSlugs),
    // The homepage links to movies and characters from cards, so the browser needs these too.
    ...(page.type === 'home'
      ? { knownMovieSlugs: sorted(context.knownMovieSlugs), knownCharacterSlugs: sorted(context.knownCharacterSlugs) }
      : {}),
  };
  const html =
    '<!doctype html>' +
    renderToString(
      <Document head={buildPageHead(page, { ...options, knownCollectionSlugs: context.knownCollectionSlugs })} assets={options.assets} payload={payload}>
        <StaticRouter location={route}>
          <App payload={payload} imageResolver={context.imageResolver} />
        </StaticRouter>
      </Document>,
    );
  return { type: page.type, slug: page.type === 'home' ? '' : page.model.slug, path: route, outputPath: routeToOutputPath(route), html };
}

/**
 * Renders every page in `data`: the homepage first (when `data.home` is given and
 * at least one entity page exists), then collections, movies, characters,
 * products, each in the order given. Throws if a slug cannot form a safe single-segment route
 * or if `options.siteUrl` is missing or invalid. Collection links to collections
 * that are not in `data.collections` render as plain text and add a warning.
 */
export function renderSite(
  data: Pick<BuildData, 'collections' | 'movies' | 'characters' | 'products'> & { home?: HomeResponse },
  options: RenderOptions,
): RenderedPage[] {
  const siteUrl = normalizeSiteUrl(options.siteUrl);
  const entityPages: PageModel[] = [
    ...data.collections.map((model): PageModel => ({ type: 'collection', model })),
    ...data.movies.map((model): PageModel => ({ type: 'movie', model })),
    ...data.characters.map((model): PageModel => ({ type: 'character', model })),
    ...data.products.map((model): PageModel => ({ type: 'product', model })),
  ];
  // With nothing published there is nothing to show: the homepage is not generated either
  // (so "no published content" still means "write nothing", as before the homepage existed).
  const pages: SitePageModel[] =
    data.home && entityPages.length > 0 ? [{ type: 'home', model: data.home }, ...entityPages] : entityPages;
  const context: RenderContextValue = {
    knownCollectionSlugs: new Set(data.collections.map((c) => c.slug)),
    knownMovieSlugs: new Set(data.movies.map((m) => m.slug)),
    knownCharacterSlugs: new Set(data.characters.map((c) => c.slug)),
    imageResolver: options.imageResolver ?? defaultImageSourceResolver,
  };
  const none = noCollectionsWarning(data);
  if (none) options.warnings?.push(none);
  if (data.home && entityPages.length > 0) options.warnings?.push(...homeWarnings(data.home, data));
  return pages.map((page) => renderPage(page, { siteUrl, warnings: options.warnings, assets: options.assets }, context));
}
