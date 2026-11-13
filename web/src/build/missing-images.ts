/**
 * Missing image files (owner review of Task 7.1). Build time only; the one
 * module in the page pipeline that touches the file system for images.
 *
 * Seed and CMS data give root-relative image URLs (`/images/movies/x.jpg`).
 * A URL whose file is not under `public/` would render as a broken image, so
 * the generator replaces it, in the DATA, with the placeholder path
 * (FALLBACK_IMAGE_PATH, "Image unavailable") before anything is rendered:
 *
 *   fetch -> validate -> substituteMissingImages -> renderSite -> write
 *
 * Because the model is changed before render, the embedded `#__PAGE_DATA__`
 * already holds the substituted values and the browser renders from them; the
 * browser never recomputes anything, so server markup and hydration agree.
 * When real files are added to `public/images/...`, the next build finds them
 * and leaves the URL alone: no code change.
 *
 * Rules
 * - Only root-relative URLs (`/x`) are checked. Absolute http(s) URLs pass
 *   through unchanged (they cannot be verified offline; no network requests).
 *   Null, blank and unusable values are not touched here: the page layer
 *   already shows the placeholder for them (and warns per entity).
 * - A root-relative URL resolves against `publicDir` and counts as present only
 *   if every path segment is a real entry inside `public/` (exact name match,
 *   case-sensitive, so a build on a case-insensitive disk cannot hide a 404 on
 *   the host), all parent segments are real directories, and the last one is a
 *   regular file. Symlinks (file or directory), dotfiles and dot-directories
 *   count as missing: copyPublicAssets skips them, so they would not be served.
 * - Query string and fragment are ignored for the lookup. The path is
 *   percent-decoded once; a bad escape, NUL, backslash, an empty segment or a
 *   `.` / `..` segment (also when encoded) is "missing". Nothing outside
 *   `publicDir` is ever listed or opened: directories are read only after the
 *   previous segment was found to be a real directory inside it, and file
 *   contents are never read.
 */
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { Dirent } from 'node:fs';
import type { BuildData, BuildWarning } from './fetch-build-data';
import { FALLBACK_IMAGE_PATH, usableImageUrl } from '../pages/image-sources';

/** Model keys that hold an image URL (contract fields: collection hero, movie poster and hero, character and product image). */
export const IMAGE_URL_KEYS: ReadonlySet<string> = new Set(['heroImageUrl', 'posterUrl', 'imageUrl']);

/** The data parts that hold page models (and so image URLs). Maps and warnings in BuildData are left alone. */
type ModelData = Pick<BuildData, 'collections' | 'movies' | 'characters' | 'products' | 'home'>;

/** Root-relative URL: starts with exactly one `/` (usableImageUrl has already rejected `//x` and `/\x`). */
const isRootRelative = (url: string): boolean => url.startsWith('/');

/** The decoded path segments of a root-relative URL, or null when it can never name a file inside public/. */
export function publicPathSegments(url: string): string[] | null {
  const raw = url.trim();
  if (!isRootRelative(raw) || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  const pathname = raw.split(/[?#]/, 1)[0];
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f]/.test(decoded)) return null;
  const segments = decoded.slice(1).split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..' || s.startsWith('.'))) return null;
  return segments;
}

/** Resolves paths against one public directory; caches directory listings for the run. */
export class PublicFileIndex {
  private readonly root: string;
  private readonly listings = new Map<string, Promise<Dirent[]>>();

  constructor(publicDir: string) {
    this.root = path.resolve(publicDir);
  }

  private list(dir: string): Promise<Dirent[]> {
    let entry = this.listings.get(dir);
    if (!entry) {
      entry = readdir(dir, { withFileTypes: true }).catch(() => []);
      this.listings.set(dir, entry);
    }
    return entry;
  }

  /** True only for a regular file inside public/ reached through real directories (see the file header). */
  async fileExists(url: string): Promise<boolean> {
    const segments = publicPathSegments(url);
    if (!segments) return false;
    let dir = this.root;
    for (let i = 0; i < segments.length; i++) {
      const wanted = segments[i].normalize('NFC');
      const entry = (await this.list(dir)).find((e) => e.name.normalize('NFC') === wanted);
      if (!entry) return false;
      const last = i === segments.length - 1;
      // Dirent.isFile()/isDirectory() are false for a symlink, so links are never followed.
      if (last) return entry.isFile();
      if (!entry.isDirectory()) return false;
      dir = path.join(dir, entry.name);
    }
    return false;
  }
}

export interface MissingImagesResult<T> {
  /** A copy of the input with every missing root-relative image URL replaced by FALLBACK_IMAGE_PATH. */
  data: T;
  /** Distinct replaced URLs (as they appeared in the data), sorted. */
  missing: string[];
  /** Number of replaced occurrences (the same file is often used by several cards and pages). */
  references: number;
}

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && Object.getPrototypeOf(v) === Object.prototype;

/** Root-relative image URLs under image keys, anywhere in `value`. */
function collectCandidates(value: unknown, into: Set<string>): void {
  if (Array.isArray(value)) value.forEach((v) => collectCandidates(v, into));
  else if (isPlain(value)) {
    for (const [key, v] of Object.entries(value)) {
      if (IMAGE_URL_KEYS.has(key) && typeof v === 'string') {
        const url = usableImageUrl(v);
        if (url && isRootRelative(url)) into.add(v);
      } else collectCandidates(v, into);
    }
  }
}

/**
 * Replaces, throughout the page models, every root-relative image URL whose file
 * is not present in `publicDir` by the placeholder path. Pure with respect to
 * its input (returns copies); reads the directory listings of `publicDir` only.
 */
export async function substituteMissingImages<T extends Partial<ModelData>>(
  data: T,
  publicDir: string,
): Promise<MissingImagesResult<T>> {
  const candidates = new Set<string>();
  collectCandidates(data, candidates);
  const index = new PublicFileIndex(publicDir);
  const missingUrls = new Set<string>();
  for (const url of [...candidates].sort()) {
    if (!(await index.fileExists(url))) missingUrls.add(url);
  }
  let references = 0;
  const rewrite = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(rewrite);
    if (!isPlain(value)) return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => {
        if (IMAGE_URL_KEYS.has(key) && typeof v === 'string' && missingUrls.has(v)) {
          references++;
          return [key, FALLBACK_IMAGE_PATH];
        }
        return [key, rewrite(v)];
      }),
    );
  };
  const out: Record<string, unknown> = { ...data };
  for (const key of ['collections', 'movies', 'characters', 'products', 'home'] as const) {
    if (key in out) out[key] = rewrite(out[key]);
  }
  return { data: out as T, missing: [...missingUrls].sort(), references };
}

/** How many example URLs the summary line names. */
export const MISSING_IMAGES_EXAMPLES = 5;

/**
 * ONE summary warning instead of one line per image; null when nothing was
 * replaced. Deterministic: the examples are the first URLs in sorted order.
 */
export function missingImagesWarning(result: Pick<MissingImagesResult<unknown>, 'missing' | 'references'>): BuildWarning | null {
  if (result.missing.length === 0) return null;
  const first = result.missing.slice(0, MISSING_IMAGES_EXAMPLES).join(', ');
  const more = result.missing.length > MISSING_IMAGES_EXAMPLES ? ', ...' : '';
  return {
    entityType: 'home',
    slug: '(images)',
    message:
      `images: ${result.missing.length} image files were not found under public/ and use the placeholder ` +
      `${FALLBACK_IMAGE_PATH} (${result.references} references; first ${Math.min(MISSING_IMAGES_EXAMPLES, result.missing.length)}: ${first}${more})`,
  };
}
