/**
 * The one route table. The static generator (server render, StaticRouter) and
 * the browser (BrowserRouter) both render `<AppRoutes />`, so the two sides
 * cannot disagree about which URL shows which page.
 *
 * URL patterns come from src/routes.ts, the single source for paths.
 * No /search or /watchlists routes yet (Tasks 7.4 and 8.3).
 */
import { useRoutes, type RouteObject } from 'react-router';
import { HOME_PATH, ROUTE_PATTERNS } from '../routes';
import { EntityRoute, HomeRoute, NotFoundRoute } from './route-elements';

export const appRoutes: RouteObject[] = [
  { path: HOME_PATH, element: <HomeRoute /> },
  { path: ROUTE_PATTERNS.collection, element: <EntityRoute type="collection" /> },
  { path: ROUTE_PATTERNS.movie, element: <EntityRoute type="movie" /> },
  { path: ROUTE_PATTERNS.character, element: <EntityRoute type="character" /> },
  { path: ROUTE_PATTERNS.product, element: <EntityRoute type="product" /> },
  { path: '*', element: <NotFoundRoute /> },
];

/** Must be rendered inside a router (StaticRouter on the server, BrowserRouter in the browser). */
export function AppRoutes() {
  return useRoutes(appRoutes);
}
