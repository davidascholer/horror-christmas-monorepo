/**
 * Real-stack proof that generated pages need no API (Task 6.6, manual check).
 * Not part of `npm test`. Run from web/:
 *
 *   npm run verify:static-offline
 *
 * Needs PostgreSQL reachable the way server/.env says (Docker, port 5433) and
 * port 3000 free. Steps (each prints a line; any failure exits 1):
 *   1. Insert a small PUBLISHED fixture set under the slug prefix `zz-offline-check`
 *      by running server's helper `npm run fixture:static-offline -- seed <prefix>`
 *      (a child process in server/; this script imports nothing from server/).
 *   2. Start `npm run dev:http` in server/ (127.0.0.1:API_PORT, default 3000).
 *   3. Build the client bundle into a fresh temp directory (`vite build --outDir <tmp>`), then
 *      run `npm run build:static` against the API with SITE_URL=https://example.test, writing to
 *      the same directory (web/dist-static is left alone).
 *   4. STOP the API (kill its process group) and verify the port refuses connections.
 *   5. Serve the output with node:http, fetch every generated route, sitemap.xml and
 *      robots.txt, and assert status, content type and content - with the API down.
 *   6. Always, even on failure: stop the static server and the API, delete the output,
 *      remove the fixture rows (`... -- clean <prefix>`) and verify none are left.
 *
 * Environment: API_PORT (default 3000), FIXTURE_PREFIX (default zz-offline-check;
 * must start with `zz-`). Never touches seed data: only rows whose slug starts with
 * the prefix are inserted or deleted.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_TYPES, startStaticServer, type StaticServer } from '../src/build/static-server';

const WEB_DIR = fileURLToPath(new URL('..', import.meta.url));
const SERVER_DIR = path.resolve(WEB_DIR, '../server');
const PREFIX = process.env.FIXTURE_PREFIX ?? 'zz-offline-check';
const PORT = Number(process.env.API_PORT ?? 3000);
const API = `http://127.0.0.1:${PORT}`;
const SITE = 'https://example.test';
const KINDS = ['collections', 'movies', 'characters', 'products'] as const;

const log = (msg: string) => console.log(msg);
function check(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`CHECK FAILED: ${msg}`);
  log(`  ok  ${msg}`);
}

interface RunResult { code: number | null; stdout: string; stderr: string }
function run(cmd: string, args: string[], cwd: string, env: Record<string, string | undefined> = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

const fixtureCmd = (command: 'seed' | 'count' | 'clean') =>
  run('npm', ['run', '--silent', 'fixture:static-offline', '--', command, PREFIX], SERVER_DIR);

function portState(): Promise<'open' | 'refused'> {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port: PORT });
    socket.once('connect', () => { socket.destroy(); resolve('open'); });
    socket.once('error', () => resolve('refused'));
  });
}

async function waitFor(fn: () => Promise<boolean>, what: string, timeoutMs: number): Promise<void> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${what}`);
}

/** Kills the API's whole process group (npm -> sh -> tsx -> node) and waits for the port to close. */
async function stopApi(api: ChildProcess | null): Promise<void> {
  if (api?.pid && api.exitCode === null) {
    try { process.kill(-api.pid, 'SIGTERM'); } catch { /* already gone */ }
    await waitFor(async () => api.exitCode !== null || api.signalCode !== null, 'API process exit', 10_000).catch(() => {
      try { process.kill(-(api.pid as number), 'SIGKILL'); } catch { /* already gone */ }
    });
  }
  await waitFor(async () => (await portState()) === 'refused', `port ${PORT} to refuse connections`, 10_000);
}

async function main(): Promise<void> {
  if (!/^zz-[a-z0-9-]{6,}$/.test(PREFIX)) throw new Error(`FIXTURE_PREFIX ${PREFIX} must look like zz-offline-check`);
  let api: ChildProcess | null = null;
  let staticServer: StaticServer | null = null;
  let outDir: string | null = null;
  let failure: unknown = null;
  try {
    log('1. fixture rows');
    check((await portState()) === 'refused', `port ${PORT} is free (no API running)`);
    const seeded = await fixtureCmd('seed');
    check(seeded.code === 0, `fixture seeded: ${seeded.stdout.trim() || seeded.stderr.trim()}`);

    log('2. start API');
    api = spawn('npm', ['run', 'dev:http'], { cwd: SERVER_DIR, env: { ...process.env, PORT: String(PORT) }, detached: true, stdio: 'ignore' });
    await waitFor(async () => fetch(`${API}/build/collections`).then((r) => r.ok, () => false), 'API to answer /build/collections', 45_000);
    check(true, `API answers on ${API}`);
    const expected: string[] = [];
    for (const kind of KINDS) {
      const list = (await (await fetch(`${API}/build/${kind}`)).json()) as Array<{ slug: string }>;
      for (const e of list) expected.push(`/${kind}/${e.slug}/`);
      if (list.some((e) => !e.slug.startsWith(PREFIX))) log(`  note: ${kind} has published content outside the fixture prefix`);
    }
    for (const r of ['collections/collection-one', 'collections/collection-two', 'movies/movie-a', 'movies/movie-b', 'characters/character', 'products/product']) {
      const [kind, name] = r.split('/');
      check(expected.includes(`/${kind}/${PREFIX}-${name}/`), `/build lists ${kind} ${PREFIX}-${name}`);
    }

    log('3. client build, then build:static against the live API');
    outDir = await mkdtemp(path.join(tmpdir(), 'hc-offline-check-'));
    const client = await run('npm', ['run', '--silent', 'build:client', '--', '--outDir', outDir], WEB_DIR);
    check(client.code === 0, `build:client exited 0 ${client.code === 0 ? '' : client.stderr + client.stdout}`);
    const build = await run('npm', ['run', '--silent', 'build:static', '--', '--out', outDir], WEB_DIR, { API_BASE_URL: API, SITE_URL: SITE });
    log(build.stdout.trimEnd());
    check(build.code === 0, `build:static exited 0 ${build.code === 0 ? '' : build.stderr}`);
    const onDisk = (await readdir(outDir, { recursive: true })).map(String).filter((f) => f.endsWith('/index.html')).sort();
    check(JSON.stringify(onDisk) === JSON.stringify(expected.map((r) => `${r.slice(1)}index.html`).sort()), `output has exactly the ${expected.length} listed pages`);

    log('4. stop the API');
    await stopApi(api);
    check((await portState()) === 'refused', `port ${PORT} refuses connections`);
    const apiFetch = await fetch(`${API}/build/collections`).then(() => 'answered', () => 'failed');
    check(apiFetch === 'failed', 'a request to the API now fails');

    log('5. serve the output and fetch everything, API down');
    staticServer = await startStaticServer(outDir);
    const get = async (url: string) => {
      const res = await fetch(staticServer!.origin + url);
      return { res, text: await res.text() };
    };
    for (const route of expected) {
      const { res, text } = await get(route);
      check(res.status === 200 && res.headers.get('content-type') === CONTENT_TYPES['.html'], `200 text/html ${route}`);
      check(text.startsWith('<!doctype html>') && /<h1>[^<]+<\/h1>/.test(text), `${route} is a complete document with an h1`);
      check(text.includes(`<link rel="canonical" href="${SITE}${route}"/>`), `${route} has its canonical URL`);
      check(!text.includes(`127.0.0.1:${PORT}`) && !text.includes('localhost:'), `${route} has no reference to the API`);
      check(/<link rel="stylesheet" href="\/assets\/[^"]+\.css"\/>/.test(text) && /<script type="module" src="\/assets\/[^"]+\.js"><\/script>/.test(text), `${route} links the built stylesheet and entry script`);
      check(/<script type="application\/json" id="__PAGE_DATA__">/.test(text), `${route} embeds its page data`);
    }
    const sitemap = await get('/sitemap.xml');
    check(sitemap.res.status === 200 && sitemap.res.headers.get('content-type') === CONTENT_TYPES['.xml'], '200 application/xml /sitemap.xml');
    for (const route of expected) check(sitemap.text.includes(`<loc>${SITE}${route}</loc>`), `sitemap lists ${route}`);
    // The homepage (Task 7.1) is built from GET /home and served from index.html like any page.
    check(sitemap.text.includes(`<loc>${SITE}/</loc>`), 'sitemap lists the homepage /');
    const homePage = await get('/');
    check(homePage.res.status === 200 && homePage.res.headers.get('content-type') === CONTENT_TYPES['.html'], '200 text/html /');
    check(/<h1[^>]*>Everything Christmas Horror\./.test(homePage.text), 'the homepage has the brand promise as its h1');
    check(homePage.text.includes(`<link rel="canonical" href="${SITE}/"/>`), 'the homepage has its canonical URL');
    check(homePage.text.includes('id="featured-collections"'), 'the homepage has its featured collections section');
    check(!homePage.text.includes(`127.0.0.1:${PORT}`), 'the homepage has no reference to the API');
    const robots = await get('/robots.txt');
    check(robots.res.status === 200 && robots.res.headers.get('content-type') === CONTENT_TYPES['.txt'], '200 text/plain /robots.txt');
    check(robots.text === `User-agent: *\nDisallow: /admin\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`, 'robots.txt has the expected content');
    const home = await get(`${expected[0]}`);
    for (const m of home.text.matchAll(/(?:href|src)="(\/assets\/[^"]+\.(css|js))"/g)) {
      const asset = await fetch(staticServer.origin + m[1]);
      const body = await asset.text();
      const type = m[2] === 'css' ? CONTENT_TYPES['.css'] : CONTENT_TYPES['.js'];
      check(asset.status === 200 && asset.headers.get('content-type') === type && body.length > 100, `200 ${type} ${m[1]} (${body.length} bytes)`);
    }
    const fallback = await fetch(`${staticServer.origin}/images/image-unavailable.svg`);
    check(fallback.status === 200, '200 /images/image-unavailable.svg');
    const one = await get(`/collections/${PREFIX}-collection-one/`);
    check(one.text.indexOf('Offline Movie B') < one.text.indexOf('Offline Movie A'), 'collection items keep their sortOrder (B before A)');
    check(one.text.includes('Watch me first'), 'curator note is rendered');
    const prod = await get(`/products/${PREFIX}-product/`);
    check(prod.text.includes('24.90'), 'product price rendered as the exact decimal string');
    check(JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/s.exec(prod.text)![1]).offers.price === '24.90', 'product JSON-LD offer price is "24.90"');
    check((await portState()) === 'refused', `API port still refuses connections after serving everything`);
    log(`RESULT: PASS (${expected.length} pages + sitemap.xml + robots.txt served with the API stopped)`);
  } catch (error) {
    failure = error;
  } finally {
    log('6. cleanup');
    await staticServer?.close().catch(() => undefined);
    await stopApi(api).catch((e) => log(`  could not confirm API stopped: ${e}`));
    if (outDir) await rm(outDir, { recursive: true, force: true });
    const cleaned = await fixtureCmd('clean');
    const rows = cleaned.stdout.trim();
    log(`  fixture clean: ${rows || cleaned.stderr.trim()}`);
    const left = cleaned.code === 0 ? JSON.parse(rows).rows : null;
    const gone = left && Object.values(left as Record<string, number>).every((n) => n === 0);
    if (!gone) failure ??= new Error('fixture rows may be left behind; run: cd server && npm run fixture:static-offline -- clean ' + PREFIX);
    log(gone ? '  no fixture rows left, output removed, API stopped' : '  CLEANUP INCOMPLETE');
  }
  if (failure) throw failure;
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(`RESULT: FAIL - ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  },
);
