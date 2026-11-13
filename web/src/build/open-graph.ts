/**
 * Open Graph and Twitter card tags (Task 6.3, Requirement 9.4). Pure data; the
 * page head turns each entry into a <meta> element, and React escapes values.
 */
import type { PageType } from '../routes';
import { SITE_NAME } from './seo';

export interface MetaTag {
  /** Open Graph uses `property`; Twitter and the plain description use `name`. */
  attribute: 'property' | 'name';
  key: string;
  content: string;
}

/**
 * og:type per page type. Only the basic vocabulary is used on purpose.
 * - home:       `website`  (the site's root)
 * - collection: `website`  (a curated hub page, not a single article)
 * - movie:      `website`  (`video.movie` exists but needs extra properties
 *                           such as video:duration; not used in the MVP)
 * - character:  `article`  (editorial write-up about one character; `profile`
 *                           is for real people)
 * - product:    `product`  (the type commerce pages use)
 */
export const OG_TYPE: Record<PageType | 'home', 'website' | 'article' | 'product'> = {
  home: 'website',
  collection: 'website',
  movie: 'website',
  character: 'article',
  product: 'product',
};

export interface OpenGraphInput {
  type: PageType | 'home';
  title: string;
  /** Resolved meta description, or null when none exists (then og:description is omitted). */
  description: string | null;
  /** Canonical URL; og:url always equals it. */
  url: string;
  /** Absolute image URL, or null. */
  image: string | null;
  /**
   * True when `image` is the site fallback image rather than the entity's own.
   * The card then stays `summary` (a small card): a generic placeholder should
   * not be shown as a large image.
   */
  imageIsFallback?: boolean;
}

/**
 * Open Graph set plus the Twitter card. Order is stable. Tags whose value is
 * missing are omitted, never emitted empty.
 *
 * Task 6.5: the caller passes the site fallback image (absolute) when the
 * entity has no usable image, with `imageIsFallback: true`. og:image is only
 * omitted if the caller passes null. twitter:card is `summary_large_image`
 * for an entity's own image, `summary` for the fallback or no image.
 */
export function buildSocialTags(input: OpenGraphInput): MetaTag[] {
  const tags: MetaTag[] = [
    { attribute: 'property', key: 'og:site_name', content: SITE_NAME },
    { attribute: 'property', key: 'og:type', content: OG_TYPE[input.type] },
    { attribute: 'property', key: 'og:title', content: input.title },
  ];
  if (input.description) tags.push({ attribute: 'property', key: 'og:description', content: input.description });
  tags.push({ attribute: 'property', key: 'og:url', content: input.url });
  if (input.image) tags.push({ attribute: 'property', key: 'og:image', content: input.image });
  tags.push({
    attribute: 'name',
    key: 'twitter:card',
    content: input.image && !input.imageIsFallback ? 'summary_large_image' : 'summary',
  });
  return tags;
}
