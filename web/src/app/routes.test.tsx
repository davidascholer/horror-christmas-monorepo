/**
 * The route table is one module used by the server render and the browser.
 * These tests render it through both router flavors (StaticRouter as the
 * generator does, MemoryRouter standing in for BrowserRouter) and check that
 * every generated URL maps to the right route.
 */
import { renderToString } from 'react-dom/server';
import { MemoryRouter, StaticRouter, matchRoutes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { appRoutes } from './routes';
import { HYDRATION_VERSION, pseudonymizeIds, type HydrationPayload } from './page-data';
import { characterPath, collectionPath, HOME_PATH, moviePath, productPath, ROUTE_PATTERNS } from '../routes';
import { character, colSummary, collection, emptyHome, movie, movieSummary, product } from '../build/test-fixtures';

const payloadFor = (page: HydrationPayload['page']): HydrationPayload => ({
  version: HYDRATION_VERSION,
  page: pseudonymizeIds(page),
  knownCollectionSlugs: ['cozy-slashers'],
});

describe('route table', () => {
  it('has exactly the home, four entity routes and a catch-all (no /search or /watchlists yet)', () => {
    expect(appRoutes.map((r) => r.path)).toEqual([
      HOME_PATH,
      ROUTE_PATTERNS.collection,
      ROUTE_PATTERNS.movie,
      ROUTE_PATTERNS.character,
      ROUTE_PATTERNS.product,
      '*',
    ]);
    expect(ROUTE_PATTERNS).toEqual({
      collection: '/collections/:slug',
      movie: '/movies/:slug',
      character: '/characters/:slug',
      product: '/products/:slug',
    });
  });

  it('matches every generated URL (trailing slash included) to its route with the slug param', () => {
    const cases: Array<[string, string]> = [
      [collectionPath('cozy-slashers'), ROUTE_PATTERNS.collection],
      [moviePath('black-christmas'), ROUTE_PATTERNS.movie],
      [characterPath('billy'), ROUTE_PATTERNS.character],
      [productPath('mug'), ROUTE_PATTERNS.product],
    ];
    for (const [url, pattern] of cases) {
      const match = matchRoutes(appRoutes, url);
      expect(match?.at(-1)?.route.path, url).toBe(pattern);
      expect(match?.at(-1)?.params.slug, url).toBe(url.split('/')[2]);
    }
    expect(matchRoutes(appRoutes, HOME_PATH)?.at(-1)?.route.path).toBe(HOME_PATH);
  });

  it('sends everything else, including future routes, to the catch-all', () => {
    for (const url of ['/search', '/watchlists/abc', '/nope', '/movies', '/movies/a/b/']) {
      expect(matchRoutes(appRoutes, url)?.at(-1)?.route.path, url).toBe('*');
    }
  });
});

describe('server and client render the same routes', () => {
  const pages: Array<[string, HydrationPayload | null]> = [
    [collectionPath('cozy-slashers'), payloadFor({ type: 'collection', model: collection() })],
    [moviePath('black-christmas'), payloadFor({ type: 'movie', model: movie() })],
    [characterPath('billy'), payloadFor({ type: 'character', model: character() })],
    [productPath('mug'), payloadFor({ type: 'product', model: product() })],
    [HOME_PATH, null],
    [HOME_PATH, { ...payloadFor({ type: 'home', model: { ...emptyHome(), featuredCollections: [colSummary('cozy-slashers', 'Cozy Slashers')], featuredMovie: movieSummary('black-christmas', 'Black Christmas') } }), knownMovieSlugs: [], knownCharacterSlugs: [] }],
    ['/unknown/', null],
    [moviePath('some-other-movie'), null],
  ];

  it.each(pages)('%s renders identically through StaticRouter and MemoryRouter', (url, payload) => {
    const server = renderToString(
      <StaticRouter location={url}>
        <App payload={payload} />
      </StaticRouter>,
    );
    const client = renderToString(
      <MemoryRouter initialEntries={[url]}>
        <App payload={payload} />
      </MemoryRouter>,
    );
    expect(client).toBe(server);
  });

  it('renders the existing page template for the matching data, a notice for data that does not match, and not-found', () => {
    const render = (url: string, payload: HydrationPayload | null) =>
      renderToString(
        <StaticRouter location={url}>
          <App payload={payload} />
        </StaticRouter>,
      );
    const m = payloadFor({ type: 'movie', model: movie() });
    expect(render(moviePath('black-christmas'), m)).toContain('<h1>Black Christmas</h1>');
    expect(render(moviePath('another'), m)).toContain('Page data not available');
    expect(render(collectionPath('black-christmas'), m)).toContain('Page data not available');
    expect(render('/unknown/', null)).toContain('Page not found');
    // The homepage is no longer a placeholder (Task 7.1): without embedded data it shows the same notice as the entity routes.
    expect(render(HOME_PATH, null)).toContain('Page data not available');
    expect(render(HOME_PATH, null)).not.toContain('coming soon');
    // With the /home projection it renders the homepage.
    const h = payloadFor({ type: 'home', model: { ...emptyHome(), featuredCollections: [colSummary('cozy-slashers', 'Cozy Slashers')] } });
    const homeHtml = render(HOME_PATH, h);
    expect(homeHtml).toContain('Everything Christmas Horror.');
    expect(homeHtml).toContain('href="/collections/cozy-slashers/"');
    // A homepage payload does not belong to an entity URL.
    expect(render(moviePath('black-christmas'), h)).toContain('Page data not available');
  });

  it('the shell lays out the homepage full width and every other route in the narrow page column', () => {
    const render = (url: string, payload: HydrationPayload | null) =>
      renderToString(
        <StaticRouter location={url}>
          <App payload={payload} />
        </StaticRouter>,
      );
    const h = payloadFor({ type: 'home', model: emptyHome() });
    expect(render(HOME_PATH, h)).toMatch(/<main id="main"[^>]*class="w-full flex-1 outline-none"/);
    expect(render('/unknown/', null)).toMatch(/<main id="main"[^>]*class="page-content w-full flex-1 outline-none"/);
  });

  it('the Collections link in the nav jumps to the featured collections section of the homepage', () => {
    const html = renderToString(
      <StaticRouter location="/unknown/">
        <App payload={null} />
      </StaticRouter>,
    );
    expect(html).toMatch(/<a href="\/#featured-collections"[^>]*>Collections<\/a>/);
    expect(html).toMatch(/<a href="\/"[^>]*>Horror Christmas<\/a>/);
  });

  it('wraps every route in the shell: skip link, one nav, main landmark, footer', () => {
    const html = renderToString(
      <StaticRouter location="/unknown/">
        <App payload={null} />
      </StaticRouter>,
    );
    expect(html).toContain('<a href="#main"');
    expect(html.match(/<nav\b/g)).toHaveLength(1);
    expect(html).toContain('<main id="main"');
    expect(html).toContain('<footer');
  });
});
