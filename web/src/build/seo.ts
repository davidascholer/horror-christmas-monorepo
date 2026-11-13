/**
 * Page title and meta description rules (Task 6.3, Requirements 9.5, 18.3).
 * Pure functions, no I/O.
 */

export const SITE_NAME = 'Horror Christmas';
export const TITLE_SUFFIX = ` | ${SITE_NAME}`;
/** Maximum length of a generated excerpt, ellipsis included. */
export const EXCERPT_MAX_LENGTH = 160;
const ELLIPSIS = '\u2026';

/** True for a string with at least one non-whitespace character. Blank values count as missing. */
export function isPresent(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Collapses every whitespace run (spaces, tabs, newlines, NBSP) to one space and trims. */
export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Page title.
 *
 * Requirement 9.5: "entity name followed by `| Horror Christmas` unless an SEO
 * title is provided". Reading used here: a supplied SEO title REPLACES the whole
 * title and is used as given (only leading/trailing whitespace is trimmed); the
 * suffix is not appended to it. An editor who wants the brand in the title
 * writes it into the SEO title. A blank SEO title counts as not supplied.
 */
export function pageTitle(name: string, seoTitle: string | null | undefined): string {
  if (isPresent(seoTitle)) return seoTitle.trim();
  return collapseWhitespace(name) + TITLE_SUFFIX;
}

/**
 * Deterministic excerpt of free text for a meta description.
 *
 * 1. Whitespace runs become one space; the text is trimmed. Empty means no excerpt (null).
 * 2. Text of at most `max` characters is returned whole, without an ellipsis.
 * 3. Longer text is cut at the last word boundary so that result + "…" is at
 *    most `max` characters (the ellipsis is one character). Trailing spaces and
 *    the punctuation `, ; : -` are removed before the ellipsis.
 * 4. Exception: if the first word alone does not fit, there is no boundary, so
 *    the text is cut at the limit (never inside a surrogate pair, and a
 *    dangling `&...` that looks like half an HTML entity is dropped).
 *
 * "Characters" are UTF-16 code units, which matches how string length is
 * counted in the output.
 */
export function createExcerpt(text: string | null | undefined, max: number = EXCERPT_MAX_LENGTH): string | null {
  if (!isPresent(text)) return null;
  const normalized = collapseWhitespace(text);
  if (normalized.length <= max) return normalized;

  const budget = max - ELLIPSIS.length;
  let head: string;
  if (normalized[budget] === ' ') {
    head = normalized.slice(0, budget);
  } else {
    const lastSpace = normalized.lastIndexOf(' ', budget - 1);
    if (lastSpace > 0) {
      head = normalized.slice(0, lastSpace);
    } else {
      head = normalized.slice(0, budget);
      // Do not split a surrogate pair.
      if (/[\uD800-\uDBFF]$/.test(head)) head = head.slice(0, -1);
      // Do not leave half an HTML entity such as "&amp" or "&#82".
      head = head.replace(/&#?[A-Za-z0-9]*$/, '');
    }
  }
  head = head.replace(/[\s,;:-]+$/, '');
  return head ? head + ELLIPSIS : null;
}

export type DescriptionSource = 'seoDescription' | 'summary' | 'excerpt';

export interface ResolvedDescription {
  text: string;
  source: DescriptionSource;
}

/**
 * Meta description fallback order (Requirements 9.5, 18.3):
 * `seoDescription`, then `summary`, then a generated excerpt of `longText`.
 * Blank or whitespace-only values are missing at every step. A supplied
 * description or summary is used whole (whitespace collapsed), never truncated.
 * Returns null when nothing usable exists; the caller then omits the tag.
 */
export function resolveDescription(input: {
  seoDescription?: string | null;
  summary?: string | null;
  longText?: string | null;
}): ResolvedDescription | null {
  if (isPresent(input.seoDescription)) return { text: collapseWhitespace(input.seoDescription), source: 'seoDescription' };
  if (isPresent(input.summary)) return { text: collapseWhitespace(input.summary), source: 'summary' };
  const excerpt = createExcerpt(input.longText);
  return excerpt ? { text: excerpt, source: 'excerpt' } : null;
}
