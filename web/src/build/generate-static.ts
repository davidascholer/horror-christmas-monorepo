/**
 * Static generation run (Task 6.2): fetch build data, render, write, summarize.
 * Invoked by scripts/generate-static.ts (`npm run build:static`).
 *
 * Output layout: `outDir` (default dist-static) is the single deployable
 * artifact. `vite build` (npm run build:client) writes /assets and
 * /.vite/manifest.json there first; this run adds the pages, sitemap.xml,
 * robots.txt and the copy of public/. It reads the manifest, so the client
 * build must have run before. It never deletes /assets.
 */
import { fetchBuildData, readApiBaseUrl, type BuildData } from './fetch-build-data';
import { renderSite } from './render-site';
import { readClientAssets, type ClientAssets } from './client-assets';
import { readSiteUrl } from './site-url';
import { ROBOTS_FILE, SITEMAP_FILE, renderSeoFiles } from './sitemap';
import { DEFAULT_PUBLIC_DIR, assertFallbackImageExists, copyPublicAssets, writePages, writeSeoFiles } from './write-pages';
import { missingImagesWarning, substituteMissingImages } from './missing-images';
import { assertPublishable } from './validate-publication';
import path from 'node:path';

/** Default output directory, relative to web/. Separate from Vite's own `dist/`. */
export const DEFAULT_OUT_DIR = 'dist-static';

export interface GenerateOptions {
  env: Record<string, string | undefined>;
  outDir?: string;
  /** Static assets copied into the output (default: `public`, relative to web/). Must contain images/image-unavailable.svg. */
  publicDir?: string;
  fetch?: typeof fetch;
  /**
   * Client bundle files for the pages. Default: read from `<outDir>/.vite/manifest.json`
   * (written by `vite build`); a missing manifest is a build error. Tests inject this.
   */
  assets?: ClientAssets;
}

export interface GenerateSummary {
  outDir: string;
  /** `home` is 1 when the homepage was generated; `total` includes it. */
  counts: { home: number; collections: number; movies: number; characters: number; products: number; total: number };
  /** Number of URLs in sitemap.xml (0 means no sitemap was written). */
  sitemapUrls: number;
  warnings: BuildData['warnings'];
}

export function formatSummary(summary: GenerateSummary): string {
  const { counts, outDir, warnings, sitemapUrls } = summary;
  const lines = [
    counts.total === 0
      ? 'No published content found: 0 pages generated; existing pages were left untouched.'
      : `Generated ${counts.total} pages in ${outDir}`,
    `  homepage:    ${counts.home}`,
    `  collections: ${counts.collections}`,
    `  movies:      ${counts.movies}`,
    `  characters:  ${counts.characters}`,
    `  products:    ${counts.products}`,
    sitemapUrls === 0
      ? `  sitemap:     none (no URLs); stale ${SITEMAP_FILE} removed`
      : `  sitemap:     ${sitemapUrls} URLs -> ${path.join(outDir, SITEMAP_FILE)}`,
    `  robots:      ${path.join(outDir, ROBOTS_FILE)}`,
    `  warnings:    ${warnings.length}`,
    ...warnings.map((w) => `    - ${w.message}`),
  ];
  return lines.join('\n');
}

/** Throws on any fatal error (missing API_BASE_URL, API failure, bad slug, write failure). */
export async function generateStatic(options: GenerateOptions): Promise<GenerateSummary> {
  const outDir = options.outDir ?? DEFAULT_OUT_DIR;
  const apiBaseUrl = readApiBaseUrl(options.env);
  // Fail before any network work: canonical URLs are always generated.
  const siteUrl = readSiteUrl(options.env);
  // Also before any network work: pages without the client bundle must never be written.
  const assets = options.assets ?? (await readClientAssets(outDir));
  const data = await fetchBuildData({ apiBaseUrl, fetch: options.fetch });
  // Publication gate (Req 12.1, 12.2, 18.3): throws with every problem listed.
  // Runs before rendering and before any file is written, so a failure leaves the output untouched.
  assertPublishable(data);
  const publicDir = options.publicDir ?? DEFAULT_PUBLIC_DIR;
  await assertFallbackImageExists(publicDir);
  // Root-relative image URLs whose file is not in public/ become the placeholder, in the DATA, before
  // rendering: the embedded hydration data then holds the same values the server rendered (after validation,
  // so a present-but-missing file is not a publication error). One summary warning, not one per image.
  const images = await substituteMissingImages(data, publicDir);
  const rendered: BuildData = images.data;
  const imagesWarning = missingImagesWarning(images);
  if (imagesWarning) data.warnings.push(imagesWarning);
  // Metadata and reference warnings (fallback image, missing collection, ...) are appended after the fetch warnings.
  const pages = renderSite(rendered, { siteUrl, warnings: data.warnings, assets });
  // Built before anything is written so a sitemap limit error leaves the output untouched.
  const seo = renderSeoFiles(data, siteUrl);
  await writePages(pages, outDir);
  await writeSeoFiles(seo.files, outDir);
  await copyPublicAssets(publicDir, outDir);
  return {
    outDir,
    counts: {
      home: pages.filter((p) => p.type === 'home').length,
      collections: data.collections.length,
      movies: data.movies.length,
      characters: data.characters.length,
      products: data.products.length,
      total: pages.length,
    },
    sitemapUrls: seo.urlCount,
    warnings: data.warnings,
  };
}
