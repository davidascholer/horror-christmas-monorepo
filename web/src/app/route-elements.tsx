/**
 * Route elements. Each entity route reuses the existing page template
 * (src/pages) unchanged; this module only picks the template and hands it the
 * page model from the embedded page data.
 *
 * If the data does not belong to the URL (client-only dev server, or a future
 * client-side navigation that has no data yet), the route renders a notice
 * instead of guessing. Fetching page data in the browser is not built yet.
 */
import { useParams } from 'react-router';
import type { PageType } from '../routes';
import { CollectionPage } from '../pages/CollectionPage';
import { MoviePage } from '../pages/MoviePage';
import { CharacterPage } from '../pages/CharacterPage';
import { ProductPage } from '../pages/ProductPage';
import { HomePage } from '../pages/HomePage';
import { usePageData } from './page-data';

export function EntityRoute({ type }: { type: PageType }) {
  const { slug } = useParams();
  const page = usePageData()?.page;
  if (!page || page.type === 'home' || page.type !== type || page.model.slug !== slug) return <PageDataUnavailable />;
  switch (page.type) {
    case 'collection':
      return <CollectionPage collection={page.model} />;
    case 'movie':
      return <MoviePage movie={page.model} />;
    case 'character':
      return <CharacterPage character={page.model} />;
    case 'product':
      return <ProductPage product={page.model} />;
  }
}

function PageDataUnavailable() {
  return (
    <section aria-labelledby="unavailable-heading">
      <h1 id="unavailable-heading">Page data not available</h1>
      <p>
        This page is built ahead of time with its content. Open it from the generated site, or build the site
        with <code>npm run build:site</code>.
      </p>
    </section>
  );
}

/**
 * The homepage. Renders from the embedded `/home` projection; without it
 * (client-only dev server) a notice is shown, like the entity routes.
 */
export function HomeRoute() {
  const page = usePageData()?.page;
  if (!page || page.type !== 'home') return <PageDataUnavailable />;
  return <HomePage home={page.model} />;
}

export function NotFoundRoute() {
  return (
    <section aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">Page not found</h1>
      <p>
        There is nothing at this address. <a href="/">Back to the start</a>.
      </p>
    </section>
  );
}
