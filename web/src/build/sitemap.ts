/**
 * sitemap.xml and robots.txt (Task 6.4, Design 6.3, Requirements 9.6, 3.8, 11.6).
 *
 * Pure functions, no I/O. Plain string building with XML escaping; no sitemap
 * library. The URLs come from `canonicalUrl` (site-url.ts), the same function
 * that produces the canonical tags, so sitemap and canonical cannot disagree.
 *
 * Decisions (also in web/README.md and OPEN-DECISIONS.md):
 *  - `<lastmod>` is the full ISO-8601 timestamp (UTC, `...Z`) of the /build
 *    `updatedAt`. It is valid W3C Datetime and keeps the precision the API has.
 *    Omitted if missing or not a valid date.
 *  - `<priority>` and `<changefreq>` are NOT emitted: Google ignores both and
 *    wrong values are worse than none.
 *  - Order: the homepage `/` first, then collections, movies, characters, products (collections are the
 *    highest SEO priority, Design 6.3), each by slug in code-unit order.
 *  - Limits: more than 50,000 URLs or more than 50 MB (uncompressed) throws
 *    SitemapError; nothing is truncated. A sitemap index is then needed.
 *  - Zero URLs: no sitemap is produced (the sitemaps.org schema requires at
 *    least one `<url>`), and robots.txt then has no `Sitemap:` line.
 *  - Non-ASCII characters in a slug are emitted as in the canonical tag
 *    (not percent-encoded), so the two stay equal; slugs are expected to be ASCII.
 */
import type { BuildData } from './fetch-build-data';
import { canonicalUrl, normalizeSiteUrl } from './site-url';
import { HOME_PATH, characterPath, collectionPath, moviePath, productPath } from '../routes';

export const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
export const SITEMAP_FILE = 'sitemap.xml';
export const ROBOTS_FILE = 'robots.txt';
export const MAX_SITEMAP_URLS = 50_000;
export const MAX_SITEMAP_BYTES = 50 * 1024 * 1024;

/**
 * Static routes (with trailing slash) that belong in the sitemap but are not
 * generated per content slug. Today: the homepage `/` (Task 7.1), emitted
 * first, without `lastmod` (the /home projection carries no date). They are
 * only emitted when at least one content page is built: with nothing published
 * the homepage is not generated either, and the sitemap must not list a page
 * that does not exist.
 */
export const STATIC_SITEMAP_ROUTES: readonly string[] = [HOME_PATH];

/**
 * Administrative routes disallowed in robots.txt. `/admin` does not exist yet
 * (the CMS/admin approach is an open decision); this is a precaution.
 */
export const DISALLOWED_PATHS: readonly string[] = ['/admin'];

export class SitemapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SitemapError';
  }
}

export interface SitemapEntry {
  /** Absolute canonical URL. */
  url: string;
  /** Raw timestamp from the API; normalized by buildSitemapXml. */
  lastmod?: string | null;
}

/** Escapes the five XML special characters. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Full ISO-8601 UTC timestamp for a parsable date string, otherwise null. */
export function formatLastmod(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

/** Serializes entries to a sitemaps.org `urlset`. Throws SitemapError over the limits or when empty. */
export function buildSitemapXml(entries: readonly SitemapEntry[]): string {
  if (entries.length === 0) throw new SitemapError('Cannot build a sitemap with no URLs');
  if (entries.length > MAX_SITEMAP_URLS) {
    throw new SitemapError(
      `Sitemap would contain ${entries.length} URLs, over the limit of ${MAX_SITEMAP_URLS} per file. A sitemap index with several sitemap files is needed; nothing was truncated.`,
    );
  }
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${SITEMAP_NAMESPACE}">`,
  ];
  for (const entry of entries) {
    lines.push('  <url>', `    <loc>${escapeXml(entry.url)}</loc>`);
    const lastmod = formatLastmod(entry.lastmod);
    if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push('  </url>');
  }
  lines.push('</urlset>', '');
  const xml = lines.join('\n');
  const bytes = Buffer.byteLength(xml, 'utf8');
  if (bytes > MAX_SITEMAP_BYTES) {
    throw new SitemapError(
      `Sitemap would be ${bytes} bytes, over the limit of ${MAX_SITEMAP_BYTES} (50 MB) per file. A sitemap index with several sitemap files is needed; nothing was truncated.`,
    );
  }
  return xml;
}

const bySlug = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Sitemap entries for published content: static routes (the homepage, only if
 * any content exists), then collections,
 * movies, characters, products, each by slug. Throws on an unusable slug (the
 * route helpers validate it) or an invalid siteUrl.
 */
export function collectSitemapEntries(
  data: Pick<BuildData, 'collections' | 'movies' | 'characters' | 'products'> & Partial<Pick<BuildData, 'updatedAt'>>,
  siteUrl: string,
  staticRoutes: readonly string[] = STATIC_SITEMAP_ROUTES,
): SitemapEntry[] {
  const site = normalizeSiteUrl(siteUrl);
  const group = (
    models: ReadonlyArray<{ slug: string }>,
    route: (slug: string) => string,
    key: keyof NonNullable<BuildData['updatedAt']>,
  ): SitemapEntry[] =>
    models
      .map((m) => m.slug)
      .sort(bySlug)
      .map((slug) => ({ url: canonicalUrl(site, route(slug)), lastmod: data.updatedAt?.[key].get(slug) ?? null }));
  const hasContent = data.collections.length + data.movies.length + data.characters.length + data.products.length > 0;
  return [
    ...(hasContent ? staticRoutes : []).map((route) => ({ url: canonicalUrl(site, route), lastmod: null })),
    ...group(data.collections, collectionPath, 'collections'),
    ...group(data.movies, moviePath, 'movies'),
    ...group(data.characters, characterPath, 'characters'),
    ...group(data.products, productPath, 'products'),
  ];
}

/**
 * robots.txt. `Disallow: /admin` comes before `Allow: /`; major crawlers apply
 * the most specific (longest) matching rule, so `/admin` stays blocked, and
 * `Allow: /` only states the default explicitly. The `Sitemap:` line (absolute
 * URL) is included only when a sitemap exists. robots.txt is a crawler hint,
 * not an access control: it does not protect anything.
 */
export function buildRobotsTxt(siteUrl: string, options: { hasSitemap?: boolean } = {}): string {
  const lines = ['User-agent: *', ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`), 'Allow: /'];
  if (options.hasSitemap ?? true) lines.push('', `Sitemap: ${normalizeSiteUrl(siteUrl)}/${SITEMAP_FILE}`);
  return lines.join('\n') + '\n';
}

export interface OutputFile {
  /** Path relative to the output directory. */
  path: string;
  content: string;
}

/**
 * Pure SEO file step: BuildData + siteUrl in, files out. robots.txt is always
 * returned; sitemap.xml only when there is at least one URL.
 */
export function renderSeoFiles(
  data: Parameters<typeof collectSitemapEntries>[0],
  siteUrl: string,
  staticRoutes: readonly string[] = STATIC_SITEMAP_ROUTES,
): { files: OutputFile[]; urlCount: number } {
  const entries = collectSitemapEntries(data, siteUrl, staticRoutes);
  const files: OutputFile[] = [];
  if (entries.length > 0) files.push({ path: SITEMAP_FILE, content: buildSitemapXml(entries) });
  files.push({ path: ROBOTS_FILE, content: buildRobotsTxt(siteUrl, { hasSitemap: entries.length > 0 }) });
  return { files, urlCount: entries.length };
}
