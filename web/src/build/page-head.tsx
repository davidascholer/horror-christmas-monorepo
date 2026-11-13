/**
 * Per-page <head> contents (Task 6.3; Requirements 9.4, 9.5, 9.7, 18.3).
 *
 * How the head is produced: React 19's built-in document metadata support.
 * `<title>`, `<meta>` and `<link>` are ordinary JSX elements returned from
 * here and placed directly inside `<head>` by Layout, so no hoisting is relied
 * on and no head library is needed. React escapes every attribute value and
 * text node. The one exception is the JSON-LD `<script>`: React would
 * HTML-escape its text and corrupt the JSON, so its body is set with
 * dangerouslySetInnerHTML from `serializeJsonLd`, which escapes `<`, `>`, `&`,
 * U+2028 and U+2029. That script is data (`application/ld+json`), not code.
 *
 * `resolvePageMetadata` is pure and returns plain data (easy to test);
 * `buildPageHead` only turns that data into elements.
 *
 * `<meta charset>`, the viewport meta and `<html lang="en">` (Req 15.3) are in Layout.
 * Task 6.5: an entity without a usable image gets the site fallback image as
 * og:image and a build warning. Image preload links are not added here: React
 * adds one for the primary image only (see README, "Image delivery").
 */
import type { ReactNode } from 'react';
import type { BuildWarning } from './fetch-build-data';
import { entityFacts, type SitePageModel } from './page-model';
import { buildSocialTags, type MetaTag } from './open-graph';
import { buildJsonLd, serializeJsonLd, type JsonLd } from './json-ld';
import { pageTitle, resolveDescription, type ResolvedDescription } from './seo';
import { FALLBACK_IMAGE_PATH, firstUsableImageUrl, isPlaceholderImageUrl } from '../pages/image-sources';
import { canonicalUrl, normalizeSiteUrl, resolveImageUrl } from './site-url';
import { HOME_PATH } from '../routes';
import { HOME_DESCRIPTION, HOME_TITLE } from '../pages/home-content';

export type { PageModel, HomePageModel, SitePageModel } from './page-model';

export interface PageMetadata {
  title: string;
  /** Null when no description text exists anywhere; the tag is then omitted. */
  description: ResolvedDescription | null;
  canonicalUrl: string;
  /** Absolute URL of the entity's own image, or null (then the fallback is used). */
  image: string | null;
  /** Absolute og:image URL: `image`, or the site fallback image when there is none. */
  ogImage: string;
  /** True when the entity has no usable image and the fallback image is used. */
  usedFallbackImage: boolean;
  /** Open Graph and Twitter tags, in output order. */
  socialTags: MetaTag[];
  jsonLd: JsonLd;
  /** Metadata warnings for this page. They never fail the build. */
  warnings: BuildWarning[];
}

export interface MetadataOptions {
  /** Slugs of the built collections. The homepage ItemList lists only these. Null or absent: all. */
  knownCollectionSlugs?: ReadonlySet<string> | null;
}

/**
 * The homepage's metadata. Title and description are constants (pages/home-content.ts);
 * the image is the site fallback (no suitable brand image exists yet), which
 * follows the entity policy: one build warning, `twitter:card` is `summary`.
 */
function resolveHomeMetadata(page: SitePageModel & { type: 'home' }, site: string, options: MetadataOptions): PageMetadata {
  const url = canonicalUrl(site, HOME_PATH);
  const text = HOME_DESCRIPTION;
  const ogImage = site + FALLBACK_IMAGE_PATH;
  const socialTags = buildSocialTags({
    type: 'home', title: HOME_TITLE, description: text, url, image: ogImage, imageIsFallback: true,
  });
  const jsonLd = buildJsonLd(page, { siteUrl: site, url, description: text, image: null, knownCollectionSlugs: options.knownCollectionSlugs });
  return {
    title: HOME_TITLE,
    description: { text, source: 'seoDescription' },
    canonicalUrl: url, image: null, ogImage, usedFallbackImage: true, socialTags, jsonLd,
    warnings: [{
      entityType: 'home', slug: HOME_PATH,
      message: `home "${HOME_PATH}": no usable image; using fallback image ${FALLBACK_IMAGE_PATH} (og:image is ${ogImage}, twitter:card is "summary")`,
    }],
  };
}

/** Resolves all metadata for a page. @throws SiteUrlError if `siteUrl` is missing or invalid. */
export function resolvePageMetadata(page: SitePageModel, siteUrl: string, options: MetadataOptions = {}): PageMetadata {
  const site = normalizeSiteUrl(siteUrl);
  if (page.type === 'home') return resolveHomeMetadata(page, site, options);
  const facts = entityFacts(page);
  const warnings: BuildWarning[] = [];
  const warn = (message: string) =>
    warnings.push({ entityType: facts.type, slug: facts.slug, message: `${facts.type} "${facts.slug}": ${message}` });

  const title = pageTitle(facts.name, facts.seoTitle);
  const description = resolveDescription({
    seoDescription: facts.seoDescription,
    summary: facts.summary,
    longText: facts.longText,
  });
  if (!description) warn('no meta description (no seoDescription, summary or long text); description tags omitted');

  const url = canonicalUrl(site, facts.route);

  // The page template picks its image with the same candidates and rules (usableImageUrl).
  const own = firstUsableImageUrl(facts.imageCandidates);
  const image = own ? resolveImageUrl(own, site) : null;
  const usedFallbackImage = image === null;
  const ogImage = image ?? site + FALLBACK_IMAGE_PATH;
  // A candidate that is the placeholder path was substituted by the build because its file
  // is missing; the summary warning (missing-images.ts) counts it, so no per-entity line here.
  const substituted = facts.imageCandidates.some(isPlaceholderImageUrl);
  if (usedFallbackImage && !substituted) {
    warn(`no usable image; using fallback image ${FALLBACK_IMAGE_PATH} (og:image is ${ogImage}, twitter:card is "summary")`);
  }

  const socialTags = buildSocialTags({
    type: facts.type, title, description: description?.text ?? null, url, image: ogImage, imageIsFallback: usedFallbackImage,
  });
  const jsonLd = buildJsonLd(page, { siteUrl: site, url, description: description?.text ?? null, image });

  return { title, description, canonicalUrl: url, image, ogImage, usedFallbackImage, socialTags, jsonLd, warnings };
}

export interface HeadOptions {
  /** Public site base URL (SITE_URL). Required: canonical output is always requested. */
  siteUrl: string;
  /** Receives this page's metadata warnings, if given. */
  warnings?: BuildWarning[];
  /** Slugs of the built collections (homepage ItemList). Null or absent: all. */
  knownCollectionSlugs?: ReadonlySet<string> | null;
}

export function buildPageHead(page: SitePageModel, options: HeadOptions): ReactNode {
  const meta = resolvePageMetadata(page, options.siteUrl, { knownCollectionSlugs: options.knownCollectionSlugs });
  options.warnings?.push(...meta.warnings);
  return (
    <>
      <title>{meta.title}</title>
      {meta.description ? <meta name="description" content={meta.description.text} /> : null}
      <link rel="canonical" href={meta.canonicalUrl} />
      {meta.socialTags.map((t) =>
        t.attribute === 'property'
          ? <meta key={t.key} property={t.key} content={t.content} />
          : <meta key={t.key} name={t.key} content={t.content} />,
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(meta.jsonLd) }}
      />
    </>
  );
}
