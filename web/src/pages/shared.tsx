/**
 * Small presentational pieces shared by the four page types (Task 6.2).
 *
 * Plain semantic HTML only. All text is rendered through React, which escapes
 * it; dangerouslySetInnerHTML is never used. Optional data that is missing
 * produces no markup at all (no empty headings, no "null").
 */
import { useContext, type ReactNode } from 'react';
import type { CollectionSummary, MediaType, CollectionType, TagSummary } from '../types/api-contracts';
import { collectionPath } from '../routes';
import { FALLBACK_IMAGE_PATH, resolveAlt, usableImageUrl } from './image-sources';
import type { AnyLinkGroup } from './link-priority';
import { RenderContext } from './render-context';

/**
 * Returns the URL only if it is safe to put in href/src: absolute http(s) or a
 * root-relative path. Anything else (javascript:, data:, protocol-relative,
 * garbage) yields null so the element is omitted.
 */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const url = value.trim();
  if (/^https?:\/\/[^\s]+$/i.test(url)) return url;
  if (/^\/(?![/\\])[^\s]*$/.test(url)) return url;
  return null;
}

export const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  FILM: 'Film',
  TV_SPECIAL: 'TV special',
  TV_EPISODE: 'TV episode',
};

export const COLLECTION_TYPE_LABEL: Record<CollectionType, string> = {
  CHARACTER: 'Character collection',
  THEME: 'Theme collection',
  BEGINNER: 'Beginner collection',
  GIFT: 'Gift collection',
  SEASONAL_CHALLENGE: 'Seasonal challenge',
  TRADITION: 'Tradition',
};

/** Text split on blank lines into paragraphs; whitespace-only input renders nothing. */
export function Paragraphs({ text }: { text: string | null | undefined }) {
  if (!text || !text.trim()) return null;
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

/** A titled section. Renders nothing when `show` is false. */
export function Section({
  id,
  heading,
  show = true,
  linkGroup,
  children,
}: {
  id: string;
  heading: string;
  show?: boolean;
  /** Set by PrioritizedLinkSections: the Req 9.8 priority group of the links in this section. */
  linkGroup?: AnyLinkGroup;
  children: ReactNode;
}) {
  if (!show) return null;
  return (
    <section aria-labelledby={`${id}-heading`} data-link-group={linkGroup}>
      <h2 id={`${id}-heading`}>{heading}</h2>
      {children}
    </section>
  );
}

export interface PageImageProps {
  /** Image URL from the model. Missing or unusable (not http(s) or root-relative) renders the fallback image. */
  src: string | null | undefined;
  /** Alt text from the model, when the model has it. */
  alt?: string | null;
  /**
   * Deterministic alt used when the model has none: the entity name (movie
   * title, character name, product name, collection title). Required, so an
   * `<img>` can never be emitted without alt text.
   */
  fallbackAlt: string;
  /**
   * True for the single primary above-the-fold image of the page (hero/main
   * image): `loading="eager"` and `fetchpriority="high"`. Every other image is
   * `loading="lazy"`. Exactly one image per page may be primary.
   */
  priority?: boolean;
  /**
   * Intrinsic size. Only rendered when given as positive integers. The API
   * models carry no image dimensions, so the templates do not pass them; the
   * resulting layout-shift risk is a documented limitation (web/README.md).
   */
  width?: number;
  height?: number;
}

const isDimension = (n: number | undefined): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0;

/**
 * The one component every template uses for every `<img>` (Task 6.5,
 * Requirements 15.2, 18.2).
 *
 * - alt is always present: model alt, else `fallbackAlt`. The fallback image
 *   is a pure placeholder, so it is decorative: `alt=""` and `role="presentation"`.
 * - Missing or unusable `src` (blank, `javascript:`, `data:`, relative, ...)
 *   renders FALLBACK_IMAGE_PATH. The build warning for it is emitted by the
 *   metadata step (page-head.tsx), using the same URL rules.
 * - `decoding="async"` always. `<picture>` with a WebP `<source>` and/or
 *   `srcset` only when the injected ImageSourceResolver supplies them
 *   (default: plain `<img>` with the original URL).
 */
export function PageImage({ src, alt, fallbackAlt, priority = false, width, height }: PageImageProps) {
  const { imageResolver } = useContext(RenderContext);
  const url = usableImageUrl(src);
  const dims = isDimension(width) && isDimension(height) ? { width, height } : {};
  const loading = priority ? ('eager' as const) : ('lazy' as const);
  const common = { decoding: 'async' as const, loading, ...(priority ? { fetchPriority: 'high' as const } : {}), ...dims };

  if (!url) {
    return <img src={FALLBACK_IMAGE_PATH} alt="" role="presentation" {...common} />;
  }

  const sources = imageResolver(url);
  const imgSrc = usableImageUrl(sources.src) ?? url;
  const imgAlt = resolveAlt(alt, fallbackAlt);
  const img = (
    <img
      src={imgSrc}
      srcSet={sources.srcset || undefined}
      sizes={sources.srcset ? sources.sizes || undefined : undefined}
      alt={imgAlt}
      {...common}
    />
  );
  if (!sources.webp?.srcset) return img;
  return (
    <picture>
      <source type="image/webp" srcSet={sources.webp.srcset} sizes={sources.webp.sizes || undefined} />
      {img}
    </picture>
  );
}

/** List of links to entity pages. `describe` adds an optional line of text after the link. */
export function LinkList<T>({
  items,
  keyOf,
  hrefOf,
  labelOf,
  describe,
}: {
  items: readonly T[];
  keyOf: (item: T) => string;
  /** Null renders the label as plain text, not a link. */
  hrefOf: (item: T) => string | null;
  labelOf: (item: T) => string;
  describe?: (item: T) => string | null;
}) {
  return (
    <ul>
      {items.map((item) => {
        const detail = describe?.(item);
        const href = hrefOf(item);
        return (
          <li key={keyOf(item)}>
            {href ? <a href={href}>{labelOf(item)}</a> : labelOf(item)}
            {detail ? <> {detail}</> : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Links to collections, shared by the movie, character and product pages
 * (Req 1.3) and the collection page's related collections. A collection that is
 * not among the built published collections (RenderContext) is shown as plain
 * text so the page has no dead link; renderSite reports it as a build warning.
 */
export function CollectionLinkList({ collections }: { collections: readonly CollectionSummary[] }) {
  const { knownCollectionSlugs } = useContext(RenderContext);
  return (
    <LinkList
      items={collections}
      keyOf={(c) => c.id}
      hrefOf={(c) => (knownCollectionSlugs === null || knownCollectionSlugs.has(c.slug) ? collectionPath(c.slug) : null)}
      labelOf={(c) => c.title}
      describe={(c) => c.summary}
    />
  );
}

/**
 * Tags are shown as plain text: no tag pages exist, so there is nothing to link to.
 */
export function TagList({ tags }: { tags: readonly TagSummary[] }) {
  return (
    <Section id="tags" heading="Tags" show={tags.length > 0}>
      <ul>
        {tags.map((t) => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
    </Section>
  );
}
