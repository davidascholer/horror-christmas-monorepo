/**
 * Entry point for `npm run build:static`.
 *
 *   API_BASE_URL=http://127.0.0.1:3000 SITE_URL=https://example.com npm run build:static [-- --out <dir>]
 *
 * Needs the client build (`npm run build:client`, which writes dist-static/assets and
 * dist-static/.vite/manifest.json); `npm run build:site` runs both in order. A missing
 * manifest is a fatal error.
 *
 * Exits 1 on any fatal error (including a missing or invalid SITE_URL).
 */
import { DEFAULT_OUT_DIR, formatSummary, generateStatic } from '../src/build/generate-static';

function readOutDir(argv: readonly string[]): string {
  const i = argv.indexOf('--out');
  if (i === -1) return DEFAULT_OUT_DIR;
  const value = argv[i + 1];
  if (!value || value.startsWith('--')) throw new Error('--out requires a directory');
  return value;
}

async function main(): Promise<void> {
  try {
    const summary = await generateStatic({ env: process.env, outDir: readOutDir(process.argv.slice(2)) });
    console.log(formatSummary(summary));
  } catch (error) {
    console.error(`Static generation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

void main();
