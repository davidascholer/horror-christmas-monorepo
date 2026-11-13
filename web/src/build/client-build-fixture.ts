/**
 * Writes a fake Vite client build (manifest plus the files it names) into an
 * output directory, so the generator's real manifest-reading path can be
 * tested without running Vite. Test support only.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CLIENT_ENTRY_KEY, MANIFEST_PATH } from './client-assets';

export const FAKE_BUILD_FILES = [
  'assets/entry-client-FAKE.js',
  'assets/entry-client-FAKE.css',
  'assets/vendor-FAKE.js',
] as const;

export function fakeManifest(): Record<string, unknown> {
  return {
    '_vendor-FAKE.js': { file: 'assets/vendor-FAKE.js', name: 'vendor' },
    [CLIENT_ENTRY_KEY]: {
      file: 'assets/entry-client-FAKE.js',
      name: 'entry-client',
      src: CLIENT_ENTRY_KEY,
      isEntry: true,
      imports: ['_vendor-FAKE.js'],
      css: ['assets/entry-client-FAKE.css'],
    },
  };
}

/** Returns the files written, relative to `outDir`. */
export async function writeFakeClientBuild(outDir: string): Promise<string[]> {
  const root = path.resolve(outDir);
  for (const f of FAKE_BUILD_FILES) {
    await mkdir(path.dirname(path.join(root, f)), { recursive: true });
    await writeFile(path.join(root, f), `/* fake ${f} */\n`, 'utf8');
  }
  await mkdir(path.dirname(path.join(root, MANIFEST_PATH)), { recursive: true });
  await writeFile(path.join(root, MANIFEST_PATH), JSON.stringify(fakeManifest(), null, 2), 'utf8');
  return [...FAKE_BUILD_FILES, MANIFEST_PATH];
}
