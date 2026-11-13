/**
 * Render-time context shared by the page components (Task 6.5).
 *
 * Provided by renderSite; the defaults make the components usable on their
 * own (no collection check, original images only). React context works with
 * renderToStaticMarkup, so no props need to be threaded through the templates.
 */
import { createContext } from 'react';
import { defaultImageSourceResolver, type ImageSourceResolver } from './image-sources';

export interface RenderContextValue {
  /**
   * Slugs of the published collections that are being built. A collection link
   * whose slug is not in the set is rendered as plain text. `null` means
   * "unknown": every collection link is rendered as a link.
   */
  knownCollectionSlugs: ReadonlySet<string> | null;
  /**
   * Homepage only (Task 7.1): slugs of the built movies and characters. A card
   * for a movie or character not in the set is plain text. `null`: unknown,
   * every card is a link.
   */
  knownMovieSlugs: ReadonlySet<string> | null;
  knownCharacterSlugs: ReadonlySet<string> | null;
  imageResolver: ImageSourceResolver;
}

export const DEFAULT_RENDER_CONTEXT: RenderContextValue = {
  knownCollectionSlugs: null,
  knownMovieSlugs: null,
  knownCharacterSlugs: null,
  imageResolver: defaultImageSourceResolver,
};

export const RenderContext = createContext<RenderContextValue>(DEFAULT_RENDER_CONTEXT);
