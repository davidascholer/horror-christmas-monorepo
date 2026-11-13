/**
 * Bridge between the Vite client build and the static generator.
 *
 * `vite build` writes the client bundle to the output directory (default
 * `dist-static/assets/`) together with a manifest (`.vite/manifest.json`)
 * that maps the entry to its hashed JS and CSS files. The generator is a
 * separate tsx script that knows nothing about Vite, so it reads that
 * manifest and puts the right `<link>` / `<script>` tags into every page.
 *
 * Same manifest in, same tags out: the output stays deterministic.
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

/** Rollup input of the client build (vite.config.ts) and therefore the manifest key of the entry. */
export const CLIENT_ENTRY_KEY = 'src/entry-client.tsx';
/** Where Vite 6 writes the manifest, relative to the output directory. */
export const MANIFEST_PATH = '.vite/manifest.json';
/** Directory of the Vite client assets, relative to the output directory. The generator never deletes it. */
export const ASSETS_DIR = 'assets';

export interface ClientAssets {
  /** URL of the entry module script, e.g. `/assets/entry-client-abc.js`. */
  entry: string;
  /** Stylesheet URLs, in load order. */
  css: string[];
  /** Static imports of the entry (excluding the entry itself), for modulepreload. */
  modulePreload: string[];
}

export class ClientAssetsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientAssetsError';
  }
}

interface ManifestChunk {
  file?: unknown;
  isEntry?: unknown;
  imports?: unknown;
  css?: unknown;
}

const BUILD_HINT = 'Run `npm run build:client` (or `npm run build:site`) first.';

/** A manifest file value must be a plain relative path inside the output directory. */
function checkFile(file: unknown, where: string): string {
  if (typeof file !== 'string' || file === '' || file.startsWith('/') || /(^|\/)\.\.(\/|$)|[\\:?#\s]/.test(file)) {
    throw new ClientAssetsError(`Client build manifest: ${where} has an unusable file ${JSON.stringify(file)}`);
  }
  return file;
}

/** Turns a parsed Vite manifest into the asset URLs. `base` is Vite's `base` (default `/`). */
export function resolveClientAssets(manifest: unknown, base = '/'): ClientAssets {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new ClientAssetsError('Client build manifest is not an object. ' + BUILD_HINT);
  }
  const chunks = manifest as Record<string, ManifestChunk>;
  const entry = chunks[CLIENT_ENTRY_KEY];
  if (!entry || entry.isEntry !== true) {
    throw new ClientAssetsError(`Client build manifest has no entry "${CLIENT_ENTRY_KEY}". ` + BUILD_HINT);
  }
  const url = (file: string) => base.replace(/\/?$/, '/') + file;
  const css: string[] = [];
  const preload: string[] = [];
  const seen = new Set<string>();
  // Imports first (depth first), then the entry's own files, like Vite's own HTML output.
  const visit = (key: string, chunk: ManifestChunk, isRoot: boolean): void => {
    if (seen.has(key)) return;
    seen.add(key);
    const imports = Array.isArray(chunk.imports) ? (chunk.imports as unknown[]) : [];
    for (const imp of imports) {
      const child = typeof imp === 'string' ? chunks[imp] : undefined;
      if (!child) throw new ClientAssetsError(`Client build manifest: "${key}" imports unknown chunk ${JSON.stringify(imp)}`);
      visit(imp as string, child, false);
    }
    const styles = Array.isArray(chunk.css) ? (chunk.css as unknown[]) : [];
    for (const c of styles) {
      const u = url(checkFile(c, `css of "${key}"`));
      if (!css.includes(u)) css.push(u);
    }
    if (!isRoot) preload.push(url(checkFile(chunk.file, `chunk "${key}"`)));
  };
  visit(CLIENT_ENTRY_KEY, entry, true);
  return { entry: url(checkFile(entry.file, `entry "${CLIENT_ENTRY_KEY}"`)), css, modulePreload: preload };
}

/**
 * Reads `<outDir>/.vite/manifest.json` and checks that every referenced file
 * exists. A missing manifest is a clear build error, never a silent page
 * without styles or script.
 */
export async function readClientAssets(outDir: string): Promise<ClientAssets> {
  const root = path.resolve(outDir);
  const manifestFile = path.join(root, MANIFEST_PATH);
  let text: string;
  try {
    text = await readFile(manifestFile, 'utf8');
  } catch {
    throw new ClientAssetsError(`Client build manifest not found: ${manifestFile}. ` + BUILD_HINT);
  }
  let manifest: unknown;
  try {
    manifest = JSON.parse(text);
  } catch (error) {
    throw new ClientAssetsError(`Client build manifest is not valid JSON (${manifestFile}): ${error instanceof Error ? error.message : String(error)}`);
  }
  const assets = resolveClientAssets(manifest);
  for (const url of [assets.entry, ...assets.css, ...assets.modulePreload]) {
    const file = path.join(root, url.slice(1));
    if (!(await stat(file).then((s) => s.isFile(), () => false))) {
      throw new ClientAssetsError(`Client build manifest refers to ${url}, but ${file} does not exist. ` + BUILD_HINT);
    }
  }
  return assets;
}
