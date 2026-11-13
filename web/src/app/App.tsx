/**
 * Router-agnostic application tree, rendered identically by the static
 * generator (inside StaticRouter) and the browser (inside BrowserRouter).
 *
 * `payload` is the embedded page data (see page-data.ts); null means "no data"
 * (client-only dev server).
 */
import { useMemo } from 'react';
import { AppShell } from './AppShell';
import { AppRoutes } from './routes';
import { PageDataContext, type HydrationPayload } from './page-data';
import { RenderContext, type RenderContextValue } from '../pages/render-context';
import { defaultImageSourceResolver, type ImageSourceResolver } from '../pages/image-sources';

export interface AppProps {
  payload: HydrationPayload | null;
  /** Server only (Task 6.5 hook). The browser always uses the default; see page-data.ts. */
  imageResolver?: ImageSourceResolver;
}

export function App({ payload, imageResolver = defaultImageSourceResolver }: AppProps) {
  const render = useMemo<RenderContextValue>(
    () => ({
      knownCollectionSlugs: payload?.knownCollectionSlugs ? new Set(payload.knownCollectionSlugs) : null,
      knownMovieSlugs: payload?.knownMovieSlugs ? new Set(payload.knownMovieSlugs) : null,
      knownCharacterSlugs: payload?.knownCharacterSlugs ? new Set(payload.knownCharacterSlugs) : null,
      imageResolver,
    }),
    [payload, imageResolver],
  );
  return (
    <PageDataContext.Provider value={payload}>
      <RenderContext.Provider value={render}>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </RenderContext.Provider>
    </PageDataContext.Provider>
  );
}
