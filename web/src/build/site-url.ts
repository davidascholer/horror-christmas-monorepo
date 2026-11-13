/**
 * Site base URL handling (Task 6.3, Requirements 9.4, 9.5).
 *
 * The public domain is not decided (domain and hosting are open decisions), so
 * nothing is hardcoded: the build reads SITE_URL. It is PROVISIONAL, like the
 * rest of the environment-variable approach (see OPEN-DECISIONS.md).
 *
 * Pure functions only; the environment object is passed in.
 */
export const SITE_URL_ENV = 'SITE_URL';

export class SiteUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SiteUrlError';
  }
}

const EXAMPLE = `${SITE_URL_ENV}=https://example.com`;

/**
 * Validates and normalizes a site base URL.
 *
 * Accepts an absolute http(s) URL with a host. Rejects credentials, query
 * strings and fragments (they would corrupt every canonical URL). Trailing
 * slashes are removed, so `https://a.test/` and `https://a.test` are equal and
 * `https://a.test/base/` becomes `https://a.test/base`. Scheme and host are
 * lower-cased by URL parsing.
 *
 * @throws SiteUrlError with an actionable message.
 */
export function normalizeSiteUrl(value: string | null | undefined): string {
  const raw = value?.trim();
  if (!raw) {
    throw new SiteUrlError(
      `${SITE_URL_ENV} is not set. Canonical URLs need the public site origin, e.g. ${EXAMPLE}`,
    );
  }
  const invalid = (reason: string) =>
    new SiteUrlError(`${SITE_URL_ENV} ${JSON.stringify(raw)} is invalid: ${reason}. Use an absolute http(s) URL, e.g. ${EXAMPLE}`);

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw invalid('it is not an absolute URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw invalid('the scheme must be http or https');
  if (!url.hostname) throw invalid('it has no host');
  if (url.username || url.password) throw invalid('it must not contain credentials');
  if (url.search || url.hash) throw invalid('it must not contain a query string or fragment');
  return url.origin + url.pathname.replace(/\/+$/, '');
}

/** Reads SITE_URL from an environment object; throws SiteUrlError if missing or invalid. */
export function readSiteUrl(env: Record<string, string | undefined>): string {
  return normalizeSiteUrl(env[SITE_URL_ENV]);
}

/**
 * Absolute URL for a route path such as `/movies/the-slug/`. The route's
 * trailing slash is preserved (routes.ts defines routes with a trailing slash).
 */
export function canonicalUrl(siteUrl: string, routePath: string): string {
  if (!routePath.startsWith('/')) {
    throw new Error(`Route path must start with "/": ${JSON.stringify(routePath)}`);
  }
  return normalizeSiteUrl(siteUrl) + routePath;
}

/**
 * Resolves an image URL for metadata. Returns an absolute http(s) URL or null.
 *
 * - absolute http(s) URL: returned as given (trimmed) if it parses and has no whitespace
 * - root-relative path (`/img/a.jpg`): resolved against the site URL
 * - anything else (blank, protocol-relative `//x` or `/\x`, javascript:, data:, garbage): null
 * Task 6.5: `usableImageUrl` (pages/image-sources.ts) applies the same rules; a test keeps them equal.
 */
export function resolveImageUrl(value: string | null | undefined, siteUrl: string): string | null {
  const raw = value?.trim();
  if (!raw || /\s/.test(raw)) return null;
  const absolute = absoluteHttpUrl(raw);
  if (absolute) return absolute;
  if (/^\/(?![/\\])/.test(raw)) return normalizeSiteUrl(siteUrl) + raw;
  return null;
}

/** The value (trimmed) if it is an absolute http(s) URL with a host and no whitespace; otherwise null. */
export function absoluteHttpUrl(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw || /\s/.test(raw) || !/^https?:\/\//i.test(raw)) return null;
  try {
    return new URL(raw).hostname ? raw : null;
  } catch {
    return null;
  }
}
