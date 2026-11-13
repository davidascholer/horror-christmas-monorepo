/**
 * Image URL rules and the image source resolver (Task 6.5; Requirements 15.2, 18.2).
 *
 * Pure module: no React, no I/O.
 *
 * EXTENSION POINT for a future image pipeline: implement `ImageSourceResolver`
 * and hand it to `renderSite({ imageResolver })`. For one original image URL
 * it may return responsive widths (`srcset`, `sizes`) and a WebP alternative
 * (`webp`). Nothing here guesses URL conventions for variants: the default
 * resolver returns the original URL and nothing else. How variants are
 * produced and where they are stored (R2 or S3, image CDN) is an open decision.
 */

/**
 * Site-relative path of THE "Image unavailable" placeholder (web/public/images/image-unavailable.svg).
 * It is the only placeholder asset: it is shown (and used as og:image) when an
 * entity has no image URL, an unusable URL, or a root-relative URL whose file
 * does not exist under public/ (substituted at build time, see missing-images.ts).
 */
export const FALLBACK_IMAGE_PATH = '/images/image-unavailable.svg';

/** True when `value` is the placeholder's own path (what the build substitutes for a missing file). */
export function isPlaceholderImageUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim() === FALLBACK_IMAGE_PATH;
}

export interface ImageSources {
  /** URL used for the `<img src>`; always the original (or an equivalent) so every browser has a working image. */
  src: string;
  /** Responsive candidates for the `<img>` itself, e.g. `"a-480.jpg 480w, a-960.jpg 960w"`. */
  srcset?: string;
  /** `sizes` attribute; only rendered together with a `srcset`. */
  sizes?: string;
  /** WebP alternative. When present the image is wrapped in `<picture>` with a `<source type="image/webp">`. */
  webp?: { srcset: string; sizes?: string };
}

/** Maps an original, already validated image URL to its delivery sources. Must be pure. */
export type ImageSourceResolver = (url: string) => ImageSources;

/** Default: the original URL only. No variants are invented. */
export const defaultImageSourceResolver: ImageSourceResolver = (url) => ({ src: url });

/**
 * The (trimmed) URL if it is usable as an image source: an absolute http(s)
 * URL with a host, or a root-relative path. Everything else (blank, spaces,
 * `javascript:`, `data:`, protocol-relative `//x` or `/\x`, relative paths,
 * unparsable) is null. The placeholder's own path is also null: an image that
 * the build replaced by the placeholder is "no image" for every consumer (the
 * page markup renders the placeholder with its decorative alt, og:image uses the
 * placeholder with the summary card, a movie falls through to its next image).
 */
export function usableImageUrl(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw || /\s/.test(raw)) return null;
  if (raw === FALLBACK_IMAGE_PATH) return null;
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).hostname ? raw : null;
    } catch {
      return null;
    }
  }
  return /^\/(?![/\\])/.test(raw) ? raw : null;
}

/** First usable URL of the candidates, in order, or null. */
export function firstUsableImageUrl(candidates: ReadonlyArray<string | null | undefined>): string | null {
  for (const c of candidates) {
    const url = usableImageUrl(c);
    if (url) return url;
  }
  return null;
}

/** Alt text rules. Whitespace-only counts as missing. */
export function resolveAlt(alt: string | null | undefined, fallbackAlt: string): string {
  if (typeof alt === 'string' && alt.trim()) return alt.trim();
  return fallbackAlt.trim();
}
