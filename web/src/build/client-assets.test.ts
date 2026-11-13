// @vitest-environment node
/**
 * Wiring between the Vite client build and the generator: manifest -> asset
 * URLs -> tags in every page, and clear failures when the build is missing.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CLIENT_ENTRY_KEY, ClientAssetsError, MANIFEST_PATH, readClientAssets, resolveClientAssets } from './client-assets';
import { fakeManifest, writeFakeClientBuild } from './client-build-fixture';
import { generateStatic } from './generate-static';
import { renderSite } from './render-site';
import { SITE, validData } from './test-fixtures';
import { API_BASE, createFakeApi, makeFixture } from './static-output-fixture';

const dirs: string[] = [];
const tmp = async () => {
  const d = await mkdtemp(path.join(tmpdir(), 'hc-assets-'));
  dirs.push(d);
  return d;
};
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe('resolveClientAssets', () => {
  it('maps the manifest to entry script, stylesheet and modulepreload URLs', () => {
    expect(resolveClientAssets(fakeManifest())).toEqual({
      entry: '/assets/entry-client-FAKE.js',
      css: ['/assets/entry-client-FAKE.css'],
      modulePreload: ['/assets/vendor-FAKE.js'],
    });
  });

  it('collects css of imported chunks first, once each, and follows nested imports', () => {
    const manifest = {
      '_a.js': { file: 'assets/a.js', css: ['assets/a.css'], imports: ['_b.js'] },
      '_b.js': { file: 'assets/b.js', css: ['assets/b.css', 'assets/shared.css'] },
      [CLIENT_ENTRY_KEY]: {
        file: 'assets/e.js', isEntry: true, imports: ['_a.js', '_b.js'], css: ['assets/shared.css', 'assets/e.css'],
      },
    };
    const assets = resolveClientAssets(manifest);
    expect(assets.css).toEqual(['/assets/b.css', '/assets/shared.css', '/assets/a.css', '/assets/e.css']);
    expect(assets.modulePreload).toEqual(['/assets/b.js', '/assets/a.js']);
  });

  it('honors a base path', () => {
    expect(resolveClientAssets(fakeManifest(), '/site').entry).toBe('/site/assets/entry-client-FAKE.js');
  });

  it.each([
    ['not an object', 'x'],
    ['an array', []],
    ['no entry', { 'other.ts': { file: 'assets/o.js', isEntry: true } }],
    ['entry not flagged', { [CLIENT_ENTRY_KEY]: { file: 'assets/e.js' } }],
    ['entry without file', { [CLIENT_ENTRY_KEY]: { isEntry: true } }],
    ['path traversal', { [CLIENT_ENTRY_KEY]: { file: '../evil.js', isEntry: true } }],
    ['absolute file', { [CLIENT_ENTRY_KEY]: { file: '/etc/passwd', isEntry: true } }],
    ['unknown import', { [CLIENT_ENTRY_KEY]: { file: 'assets/e.js', isEntry: true, imports: ['_gone.js'] } }],
    ['unsafe css file', { [CLIENT_ENTRY_KEY]: { file: 'assets/e.js', isEntry: true, css: ['a b.css'] } }],
  ])('rejects a manifest that is %s with ClientAssetsError', (_n, manifest) => {
    expect(() => resolveClientAssets(manifest)).toThrow(ClientAssetsError);
  });
});

describe('readClientAssets', () => {
  it('reads the manifest Vite wrote and checks the files exist', async () => {
    const out = await tmp();
    await writeFakeClientBuild(out);
    expect((await readClientAssets(out)).entry).toBe('/assets/entry-client-FAKE.js');
  });

  it('fails with a clear message when the manifest is missing', async () => {
    const out = await tmp();
    await expect(readClientAssets(out)).rejects.toThrow(/manifest not found.*npm run build:client/s);
  });

  it('fails when the manifest is not JSON', async () => {
    const out = await tmp();
    await mkdir(path.join(out, '.vite'));
    await writeFile(path.join(out, MANIFEST_PATH), '{oops');
    await expect(readClientAssets(out)).rejects.toThrow(/not valid JSON/);
  });

  it('fails when a file named by the manifest is missing', async () => {
    const out = await tmp();
    await writeFakeClientBuild(out);
    await rm(path.join(out, 'assets/entry-client-FAKE.css'));
    await expect(readClientAssets(out)).rejects.toThrow(/entry-client-FAKE\.css.*does not exist/s);
  });
});

describe('assets in the generated pages', () => {
  it('generateStatic without a client build is a clear build error and writes nothing', async () => {
    const out = path.join(await tmp(), 'out');
    const api = createFakeApi(makeFixture());
    await expect(
      generateStatic({ env: { API_BASE_URL: API_BASE, SITE_URL: SITE }, outDir: out, fetch: api.fetch }),
    ).rejects.toThrow(/Client build manifest not found/);
    expect(api.requested).toEqual([]); // failed before any network work
    await expect(readFile(out)).rejects.toThrow(); // output directory was not even created
  });

  it('tags come from the manifest: another manifest gives other links, the same manifest gives identical output', () => {
    const data = validData();
    const a = { entry: '/assets/e-1.js', css: ['/assets/e-1.css'], modulePreload: ['/assets/v-1.js'] };
    const b = { entry: '/assets/e-2.js', css: ['/assets/e-2.css'], modulePreload: [] };
    const first = renderSite(data, { siteUrl: SITE, assets: a });
    expect(renderSite(data, { siteUrl: SITE, assets: a }).map((p) => p.html)).toEqual(first.map((p) => p.html));
    const html = first[0].html;
    expect(html).toContain('<link rel="stylesheet" href="/assets/e-1.css"/>');
    expect(html).toContain('<link rel="modulepreload" href="/assets/v-1.js"/>');
    expect(html).toContain('<script type="module" src="/assets/e-1.js"></script>');
    const other = renderSite(data, { siteUrl: SITE, assets: b })[0].html;
    expect(other).toContain('/assets/e-2.css');
    expect(other).not.toContain('/assets/e-1.');
    expect(other).not.toContain('modulepreload');
  });
});
