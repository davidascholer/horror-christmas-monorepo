/**
 * End-to-end proof that the published catalog works through the real HTTP API.
 *
 *   npm run verify:published
 *
 * Uses the dev HTTP adapter (src/dev-http.ts). If something already answers on
 * 127.0.0.1:$PORT (default 3000) it is used as is and left running; otherwise
 * the script starts the adapter, waits for it, and stops it at the end.
 *
 * It reads the live /build/* lists to learn which slugs are published and then
 * exercises every public endpoint for each of them. Nothing is written to the
 * database. Exit code 0 only when every check passes.
 */
import { spawn, type ChildProcess } from 'node:child_process';

const PORT = Number(process.env.PORT ?? 3000);
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = ''): void {
  if (ok) passed++;
  else failures.push(detail ? `${name} -- ${detail}` : name);
}

async function get(path: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`);
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, body };
}

/** GET expecting 200; records one check and returns the body (or null). */
async function ok(path: string): Promise<any> {
  const r = await get(path);
  check(`GET ${path} -> 200`, r.status === 200, `got ${r.status}`);
  return r.status === 200 ? r.body : null;
}

async function isUp(): Promise<boolean> {
  try {
    return (await fetch(`${BASE}/build/collections`)).status === 200;
  } catch {
    return false;
  }
}

async function startServerIfNeeded(): Promise<ChildProcess | null> {
  if (await isUp()) {
    console.log(`Using the API already running at ${BASE}`);
    return null;
  }
  console.log(`Starting the dev API at ${BASE} ...`);
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/dev-http.ts'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) throw new Error(`dev API exited early with code ${child.exitCode}`);
    if (await isUp()) return child;
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill('SIGTERM');
  throw new Error('dev API did not become ready within 30 seconds');
}

const isSlugEntry = (e: any) => typeof e?.slug === 'string' && !Number.isNaN(Date.parse(e?.updatedAt));
const isSorted = (slugs: string[]) => slugs.every((s, i) => i === 0 || slugs[i - 1] < s);

async function run(): Promise<void> {
  // ---- /build/* ----------------------------------------------------------
  const build: Record<string, any[]> = {};
  for (const kind of ['collections', 'movies', 'characters', 'products']) {
    const list = await ok(`/build/${kind}`);
    build[kind] = Array.isArray(list) ? list : [];
    check(`/build/${kind} is a non-empty array of { slug, updatedAt }`, build[kind].length > 0 && build[kind].every(isSlugEntry));
    check(`/build/${kind} sorted by slug`, isSorted(build[kind].map((e) => e.slug)));
  }

  // ---- /home -------------------------------------------------------------
  const home = await ok('/home');
  if (home) {
    check('/home featuredCollections non-empty', Array.isArray(home.featuredCollections) && home.featuredCollections.length > 0);
    check('/home seasonalCollections non-empty', Array.isArray(home.seasonalCollections) && home.seasonalCollections.length > 0);
    check('/home featuredMovie non-null', !!home.featuredMovie?.slug);
    check('/home featuredCharacter non-null', !!home.featuredCharacter?.slug);
    check('/home giftCollection non-null', !!home.giftCollection?.slug);
    check('/home giftCollection is best-gifts-for-krampus-fans', home.giftCollection?.slug === 'best-gifts-for-krampus-fans');
  }

  // ---- /collections ------------------------------------------------------
  const collections = (await ok('/collections')) ?? [];
  check('/collections count equals /build/collections', collections.length === build.collections.length, `${collections.length} vs ${build.collections.length}`);
  const featured = (await ok('/collections?featured=true')) ?? [];
  check('/collections?featured=true non-empty and all featured', featured.length > 0 && featured.every((c: any) => c.featured === true));
  const seasonal = (await ok('/collections?seasonal=true')) ?? [];
  check('/collections?seasonal=true non-empty and all seasonal', seasonal.length > 0 && seasonal.every((c: any) => c.seasonal === true));
  const types = [...new Set(collections.map((c: any) => c.type))] as string[];
  for (const type of types) {
    const list = (await ok(`/collections?type=${type}`)) ?? [];
    check(`/collections?type=${type} matches`, list.length > 0 && list.every((c: any) => c.type === type));
  }
  const bad = await get('/collections?type=NOPE');
  check('/collections?type=NOPE -> 400', bad.status === 400, `got ${bad.status}`);

  const collectionSlugs = new Set(build.collections.map((e) => e.slug));
  for (const slug of collectionSlugs) {
    const detail = await ok(`/collections/${slug}`);
    const movies = await ok(`/collections/${slug}/movies`);
    const characters = await ok(`/collections/${slug}/characters`);
    const products = await ok(`/collections/${slug}/products`);
    const related = await ok(`/collections/${slug}/related`);
    if (!detail) continue;
    check(`${slug}: detail has introduction, curatorNotes, hero + alt, SEO`, !!(detail.introduction && detail.curatorNotes && detail.heroImageUrl && detail.heroImageAlt && detail.seoTitle && detail.seoDescription));
    check(`${slug}: at least one movie`, (detail.movies?.length ?? 0) >= 1);
    check(`${slug}: at least one related collection`, (detail.relatedCollections?.length ?? 0) >= 1);
    check(`${slug}: every related collection is published`, (detail.relatedCollections ?? []).every((r: any) => collectionSlugs.has(r.collection.slug)));
    check(`${slug}: sub-routes agree with detail`,
      movies?.movies?.length === detail.movies.length &&
      characters?.characters?.length === detail.characters.length &&
      products?.products?.length === detail.products.length &&
      related?.related?.length === detail.relatedCollections.length);
  }
  check('/collections/does-not-exist -> 404', (await get('/collections/does-not-exist')).status === 404);

  // ---- /movies (default page size 50) ------------------------------------
  const total = build.movies.length;
  const page1 = (await ok('/movies')) ?? [];
  check('/movies default page holds min(50, total)', page1.length === Math.min(50, total), `${page1.length} of ${total}`);
  const page2 = (await ok('/movies?page=2')) ?? [];
  check('/movies?page=2 holds the remainder', page2.length === Math.max(0, Math.min(50, total - 50)), `${page2.length} of ${total}`);
  const seen = new Set([...page1, ...page2].map((m: any) => m.slug));
  check('/movies page 1 + 2 have no duplicates', seen.size === page1.length + page2.length);
  const explicit = (await ok('/movies?pageSize=200')) ?? [];
  check('/movies?pageSize=200 returns all', explicit.length === total, `${explicit.length} of ${total}`);
  check('/movies?pageSize=201 -> 400', (await get('/movies?pageSize=201')).status === 400);
  for (const { slug } of build.movies) {
    const m = await ok(`/movies/${slug}`);
    if (m) check(`movie ${slug}: seoTitle + seoDescription`, !!(m.seoTitle && m.seoDescription));
    const mc = await ok(`/movies/${slug}/collections`);
    check(`movie ${slug}: collections is a list of published collections`, Array.isArray(mc?.collections) && mc.collections.every((c: any) => collectionSlugs.has(c.slug)));
  }
  check('/movies/does-not-exist -> 404', (await get('/movies/does-not-exist')).status === 404);

  // ---- /characters -------------------------------------------------------
  const chars = (await ok('/characters')) ?? [];
  check('/characters count equals /build/characters', chars.length === build.characters.length);
  for (const { slug } of build.characters) {
    const c = await ok(`/characters/${slug}`);
    if (c) check(`character ${slug}: seoTitle + seoDescription`, !!(c.seoTitle && c.seoDescription));
  }
  check('/characters/does-not-exist -> 404', (await get('/characters/does-not-exist')).status === 404);

  // ---- /products ---------------------------------------------------------
  const prods = (await ok('/products')) ?? [];
  check('/products count equals /build/products', prods.length === build.products.length);
  let withLinks = 0;
  for (const { slug } of build.products) {
    const p = await ok(`/products/${slug}`);
    if (!p) continue;
    check(`product ${slug}: seoTitle + seoDescription`, !!(p.seoTitle && p.seoDescription));
    if (p.price !== null) {
      check(`product ${slug}: price "${p.price}" is a 2-decimal string`, typeof p.price === 'string' && /^\d+\.\d{2}$/.test(p.price));
      check(`product ${slug}: currency is 3 letters`, typeof p.currency === 'string' && /^[A-Z]{3}$/.test(p.currency));
    }
    check(`product ${slug}: affiliateLinks is a list of http(s) links`, Array.isArray(p.affiliateLinks) && p.affiliateLinks.every((l: any) => /^https?:\/\//.test(l.url) && l.provider));
    if (p.affiliateLinks.length > 0) withLinks++;
  }
  check('at least one product has affiliate links', withLinks > 0);
  check('/products/does-not-exist -> 404', (await get('/products/does-not-exist')).status === 404);

  // ---- /search -----------------------------------------------------------
  const found = (await ok('/search?q=krampus')) ?? [];
  check('/search?q=krampus returns results', found.length > 0);
  const order = ['collection', 'movie', 'character', 'product'];
  const ranks = found.map((r: any) => order.indexOf(r.type));
  check('/search?q=krampus lists collections first, in category order', ranks.length > 0 && ranks[0] === 0 && ranks.every((r: number, i: number) => r >= 0 && (i === 0 || ranks[i - 1] <= r)));
  check('/search results are limited to 50', found.length <= 50);
}

async function main(): Promise<void> {
  let child: ChildProcess | null = null;
  try {
    child = await startServerIfNeeded();
    await run();
  } catch (error) {
    failures.push(`script error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (child) {
      child.kill('SIGTERM');
      console.log('Stopped the dev API started by this script.');
    }
  }
  console.log(`\nverify:published  ${passed} checks passed, ${failures.length} failed`);
  for (const f of failures) console.log(`  FAIL ${f}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

void main();
