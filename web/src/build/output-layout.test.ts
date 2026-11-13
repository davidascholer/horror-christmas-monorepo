// @vitest-environment node
/**
 * Output layout: dist-static is one deployable artifact holding the Vite
 * client build (/assets, /.vite) and the generated pages. The generator must
 * be able to run repeatedly without ever touching the client build.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSETS_DIR } from './client-assets';
import { writeFakeClientBuild } from './client-build-fixture';
import { generateStatic } from './generate-static';
import { copyPublicAssets, writePages } from './write-pages';
import { ROUTE_SEGMENTS } from '../routes';
import { renderSite } from './render-site';
import { SITE, TEST_ASSETS, validData } from './test-fixtures';
import { API_BASE, createFakeApi, makeFixture } from './static-output-fixture';

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));
const dirs: string[] = [];
const tmp = async () => {
  const d = await mkdtemp(path.join(tmpdir(), 'hc-layout-'));
  dirs.push(d);
  return d;
};
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});
const list = async (root: string) => (await readdir(root, { recursive: true, withFileTypes: true }))
  .filter((e) => e.isFile())
  .map((e) => path.relative(root, path.join(e.parentPath, e.name)).split(path.sep).join('/'))
  .sort();

describe('output layout', () => {
  it('no page-type directory can be the client asset directory or a dot directory', () => {
    expect(ROUTE_SEGMENTS).not.toContain(ASSETS_DIR);
    expect(ROUTE_SEGMENTS.some((s) => s.startsWith('.'))).toBe(false);
  });

  it('writePages clears old pages but never touches /assets or /.vite', async () => {
    const out = await tmp();
    const client = await writeFakeClientBuild(out);
    await writeFile(path.join(out, 'assets/extra-from-vite.woff2'), 'font');
    await mkdir(path.join(out, 'movies/gone'), { recursive: true });
    await writeFile(path.join(out, 'movies/gone/index.html'), 'old page');
    await writePages(renderSite(validData(), { siteUrl: SITE, assets: TEST_ASSETS }), out);
    const files = await list(out);
    for (const f of [...client, 'assets/extra-from-vite.woff2']) expect(files, f).toContain(f);
    expect(files).not.toContain('movies/gone/index.html');
    expect(files.some((f) => f.endsWith('/index.html'))).toBe(true);
  });

  it('a full generator run leaves the client build byte-identical and adds pages, SEO files and public files', async () => {
    const out = await tmp();
    const client = await writeFakeClientBuild(out);
    const before = await Promise.all(client.map((f) => readFile(path.join(out, f), 'utf8')));
    const api = createFakeApi(makeFixture());
    for (let run = 0; run < 2; run++) {
      await generateStatic({ env: { API_BASE_URL: API_BASE, SITE_URL: SITE }, outDir: out, publicDir: PUBLIC_DIR, fetch: api.fetch });
      const after = await Promise.all(client.map((f) => readFile(path.join(out, f), 'utf8')));
      expect(after, `run ${run + 1}`).toEqual(before);
    }
    const files = await list(out);
    expect(files).toEqual(expect.arrayContaining([...client, 'sitemap.xml', 'robots.txt', 'images/fallback.svg']));
    expect(files.filter((f) => f.endsWith('/index.html')).length).toBe(12);
    // Nothing else: the artifact is pages + the homepage (index.html, Task 7.1) + SEO files + public files + client build.
    expect(files.filter((f) => !f.endsWith('/index.html') && !client.includes(f)).sort()).toEqual(
      ['images/fallback.svg', 'index.html', 'robots.txt', 'sitemap.xml'],
    );
  });

  it('refuses a public/assets directory, which would overwrite the client build', async () => {
    const pub = await tmp();
    await mkdir(path.join(pub, 'assets'));
    await writeFile(path.join(pub, 'assets/x.js'), 'x');
    const out = await tmp();
    await expect(copyPublicAssets(pub, out)).rejects.toThrow(/public\/assets is reserved/);
    expect(await list(out)).toEqual([]);
  });
});
