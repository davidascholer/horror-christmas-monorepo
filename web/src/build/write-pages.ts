/**
 * Writes rendered pages to disk (Task 6.2). Kept apart from rendering.
 *
 * Only the four page-type directories under `outDir` are cleared before
 * writing, so pages for content that is no longer published cannot linger.
 * Nothing else in `outDir` is touched (in particular not `/assets` or
 * `/.vite`, which belong to the Vite client build). With zero pages nothing is
 * cleared or written.
 */
import { copyFile, lstat, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROUTE_SEGMENTS } from '../routes';
import { ASSETS_DIR } from './client-assets';
import { FALLBACK_IMAGE_PATH } from '../pages/image-sources';
import type { RenderedPage } from './render-site';
import { ROBOTS_FILE, SITEMAP_FILE, type OutputFile } from './sitemap';

/**
 * Writes sitemap.xml / robots.txt at the root of `outDir` (Task 6.4). Exactly
 * these two files are removed first, so a sitemap from an earlier run cannot
 * outlive the content (for example when nothing is published now). Nothing
 * else in or outside `outDir` is touched.
 */
export async function writeSeoFiles(files: readonly OutputFile[], outDir: string): Promise<void> {
  const root = path.resolve(outDir);
  const allowed = new Set([SITEMAP_FILE, ROBOTS_FILE]);
  for (const file of files) {
    if (!allowed.has(file.path)) throw new Error(`Refusing to write ${file.path}: not a root SEO file`);
  }
  await mkdir(root, { recursive: true });
  for (const name of allowed) await rm(path.join(root, name), { force: true });
  for (const file of files) await writeFile(path.join(root, file.path), file.content, 'utf8');
}

// A page-type directory must never be able to name the client asset directory:
// writePages deletes those directories. Checked when the module loads.
if (ROUTE_SEGMENTS.some((segment) => segment === ASSETS_DIR || segment.startsWith('.'))) {
  throw new Error(`Route segment collides with the reserved output entries "${ASSETS_DIR}" / ".vite"`);
}

export async function writePages(pages: readonly RenderedPage[], outDir: string): Promise<number> {
  if (pages.length === 0) return 0;
  const root = path.resolve(outDir);
  for (const segment of ROUTE_SEGMENTS) {
    await rm(path.join(root, segment), { recursive: true, force: true });
  }
  for (const page of pages) {
    const file = path.resolve(root, page.outputPath);
    // Defense in depth: a page must never land outside the output directory.
    if (!file.startsWith(root + path.sep)) {
      throw new Error(`Refusing to write ${page.outputPath}: outside ${root}`);
    }
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, page.html, 'utf8');
  }
  return pages.length;
}

/** Default static-asset directory, relative to web/ (like DEFAULT_OUT_DIR). */
export const DEFAULT_PUBLIC_DIR = 'public';

/** Throws unless the fallback image exists in `publicDir`. Pages and og:image refer to it. */
export async function assertFallbackImageExists(publicDir: string): Promise<void> {
  const file = path.join(path.resolve(publicDir), FALLBACK_IMAGE_PATH);
  const ok = await stat(file).then((s) => s.isFile(), () => false);
  if (!ok) {
    throw new Error(
      `Fallback image not found: expected ${file}. Pages and og:image refer to ${FALLBACK_IMAGE_PATH}; ` +
        'restore web/public/images/fallback.svg',
    );
  }
}

/**
 * Copies the contents of `publicDir` into `outDir` (Task 6.5), keeping relative
 * paths, so `public/images/fallback.svg` is served as `/images/fallback.svg`.
 * Returns the copied files (relative, forward slashes, sorted).
 *
 * - This is the only place `public/` is copied: Vite's own public-dir copy is
 *   switched off for builds (vite.config.ts), so there is exactly one mechanism.
 * - Existing files with the same path are overwritten; nothing is deleted.
 * - A top-level `assets` entry is refused: that directory belongs to the Vite
 *   client build and must not be overwritten.
 * - Only regular files and directories are copied. Symlinks and other special
 *   entries are skipped, so a link inside `public/` cannot pull in files from
 *   elsewhere. Names starting with "." (for example .DS_Store) are skipped.
 * - Every destination is checked to be inside `outDir`.
 * - A missing `publicDir` copies nothing (callers that need the fallback image
 *   call assertFallbackImageExists first).
 */
export async function copyPublicAssets(publicDir: string, outDir: string): Promise<string[]> {
  const source = path.resolve(publicDir);
  const root = path.resolve(outDir);
  const exists = await stat(source).then((s) => s.isDirectory(), () => false);
  if (!exists) return [];
  const copied: string[] = [];

  async function walk(relative: string): Promise<void> {
    const entries = await readdir(path.join(source, relative), { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const rel = path.join(relative, entry.name);
      if (relative === '' && entry.name === ASSETS_DIR) {
        throw new Error(`public/${ASSETS_DIR} is reserved for the client build output; rename it`);
      }
      const from = path.join(source, rel);
      // lstat, not the dirent alone: be certain it is not a symlink.
      const info = await lstat(from);
      if (info.isSymbolicLink()) continue;
      if (info.isDirectory()) {
        await walk(rel);
      } else if (info.isFile()) {
        const to = path.resolve(root, rel);
        if (!to.startsWith(root + path.sep)) throw new Error(`Refusing to copy ${rel}: outside ${root}`);
        await mkdir(path.dirname(to), { recursive: true });
        await copyFile(from, to);
        copied.push(rel.split(path.sep).join('/'));
      }
    }
  }

  await walk('');
  return copied.sort();
}
