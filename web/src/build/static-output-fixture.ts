/**
 * Realistic fixture API for the black-box output test (Task 6.6). Test support
 * only. Builds typed models on top of the Task 6.5 builders in test-fixtures.ts
 * and serves them through an injected fetch that behaves like the real API:
 * `/build/*` lists contain published slugs only, detail routes also answer for
 * DRAFT/ARCHIVED records (the real API would 404 them; serving them here
 * proves the build never asks for them), and one listed slug 404s.
 */
import { createHash } from 'node:crypto';
import type {
  CharacterDetail, CollectionDetail, HomeResponse, MovieDetail, ProductDetail,
} from '../types/api-contracts';
import {
  character, charSummary, colSummary, collection, movie, movieSummary, prodSummary, product,
} from './test-fixtures';

export const API_BASE = 'http://api.fixture.test:4321';
export const SITE = 'https://example.test';

/** Hostile text: tries to close the JSON-LD script, open a new one, and break out of attributes. */
export const HOSTILE = `</script><script>alert("pwn")</script><img src=x onerror=alert(1)> & "dq" 'sq' <!-- c -->`;

export type Kind = 'collections' | 'movies' | 'characters' | 'products';
export interface ListEntry { slug: string; updatedAt?: string }

export interface Fixture {
  published: { collections: CollectionDetail[]; movies: MovieDetail[]; characters: CharacterDetail[]; products: ProductDetail[] };
  /** Served at detail routes but absent from /build (DRAFT / ARCHIVED). */
  unpublished: { collections: CollectionDetail[]; movies: MovieDetail[]; characters: CharacterDetail[]; products: ProductDetail[] };
  /** Slugs in /build lists, slug ascending. Includes `vanished-movie`, which 404s at its detail route. */
  lists: Record<Kind, ListEntry[]>;
  /** Every internal id value in the fixture (published and unpublished). */
  ids: string[];
  /** The /home projection (Task 7.1): editorial order, an unbuilt collection reference, hostile text. */
  home: HomeResponse;
}

/** cuid-looking id derived from any seed: "c" + 24 lowercase hex chars. */
export const cuidLike = (seed: string): string => 'c' + createHash('sha256').update(seed).digest('hex').slice(0, 24);

function remapIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(remapIds);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, (k === 'id' || k === 'productId') && typeof v === 'string' ? cuidLike(v) : remapIds(v)]),
    );
  }
  return value;
}
function collectIds(value: unknown, out: Set<string>): void {
  if (Array.isArray(value)) value.forEach((v) => collectIds(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'id' || k === 'productId') && typeof v === 'string') out.add(v);
      else collectIds(v, out);
    }
  }
}

/** movieSummary with an explicit release year (the builder fixes it at 1984). */
const withYear = (slug: string, title: string, year: number | null) => ({ ...movieSummary(slug, title), releaseYear: year });

const bySlug = <T extends { slug: string }>(a: T, b: T): number => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);

export function makeFixture(): Fixture {
  const franchise = { id: 'f:krampus', slug: 'krampus-franchise', name: 'Krampus Franchise' };
  const tag = { id: 't:winter', slug: 'winter', name: 'Winter' };
  const ghost = colSummary('ghost-collection', 'Ghost Collection'); // never published

  const collections: CollectionDetail[] = [
    collection({
      id: 'col:full', slug: 'full-collection', title: 'Full Collection', type: 'THEME',
      introduction: 'First paragraph.\n\nSecond paragraph & more.',
      curatorNotes: 'Curated with "care".',
      summary: 'A summary of everything.',
      heroImageUrl: 'https://img.test/full.jpg', heroImageAlt: 'A snowy hero',
      seoTitle: '  Full Collection | Our Picks  ', seoDescription: 'The full collection description.',
      featured: true,
      movies: [
        { movie: movieSummary('krampus', 'Krampus'), sortOrder: 1, curatorNote: 'Start here & enjoy' },
        { movie: movieSummary('black-christmas', 'Black Christmas'), sortOrder: 2, curatorNote: null },
        { movie: movieSummary('silent-night', 'Silent Night'), sortOrder: 3, curatorNote: 'The quiet one' },
      ],
      characters: [
        { character: charSummary('krampus-beast', 'The Beast'), sortOrder: 1, curatorNote: 'Horned menace' },
        { character: charSummary('billy', 'Billy'), sortOrder: 2, curatorNote: null },
      ],
      products: [
        { product: prodSummary('santa-mug', 'Santa Mug'), sortOrder: 1, curatorNote: 'Gift idea' },
        { product: prodSummary('hostile-product', `Evil ${HOSTILE}`), sortOrder: 2, curatorNote: HOSTILE },
      ],
      franchises: [{ franchise, sortOrder: 1 }],
      tags: [tag],
      relatedCollections: [
        { collection: colSummary('minimal-collection', 'Minimal Collection'), sortOrder: 1 },
        { collection: ghost, sortOrder: 2 },
      ],
    }),
    collection({
      id: 'col:min', slug: 'minimal-collection', title: 'Minimal Collection', type: 'BEGINNER',
      introduction: 'Short intro.', curatorNotes: 'Short notes.', summary: null,
      heroImageUrl: 'https://img.test/min.jpg', heroImageAlt: 'Min hero',
      seoTitle: 'Minimal', seoDescription: 'Minimal description.',
      movies: [{ movie: movieSummary('black-christmas', 'Black Christmas'), sortOrder: 1, curatorNote: null }],
      characters: [], products: [], franchises: [], tags: [],
      relatedCollections: [{ collection: colSummary('full-collection', 'Full Collection'), sortOrder: 1 }],
    }),
    collection({
      id: 'col:advent', slug: 'advent-challenge', title: 'Advent Challenge', type: 'SEASONAL_CHALLENGE', seasonal: true,
      introduction: 'One film a day.', curatorNotes: 'Watch in order.', summary: 'Twenty-four nights.',
      heroImageUrl: 'https://img.test/advent.jpg', heroImageAlt: 'Advent calendar',
      seoTitle: 'Advent Challenge | Daily Horror', seoDescription: 'A film for every night.',
      movies: [
        { movie: withYear('jack-frost', 'Jack Frost', null), sortOrder: 1, curatorNote: 'Day one' },
        { movie: movieSummary('krampus', 'Krampus'), sortOrder: 2, curatorNote: 'Day two' },
        { movie: movieSummary('black-christmas', 'Black Christmas'), sortOrder: 3, curatorNote: 'Day three' },
        { movie: movieSummary('silent-night', 'Silent Night'), sortOrder: 4, curatorNote: null },
      ],
      characters: [],
      products: [
        { product: prodSummary('santa-mug', 'Santa Mug'), sortOrder: 1, curatorNote: null },
        { product: prodSummary('plain-poster', 'Plain Poster'), sortOrder: 2, curatorNote: 'Wall art' },
      ],
      franchises: [], tags: [],
      relatedCollections: [{ collection: colSummary('full-collection', 'Full Collection'), sortOrder: 1 }],
    }),
  ];

  const movies: MovieDetail[] = [
    movie({
      id: 'mov:bc', slug: 'black-christmas', title: 'Black Christmas', releaseYear: 1974, releaseDate: '1974-10-16T00:00:00.000Z',
      runtime: 98, synopsis: 'A sorority house is terrorized.', posterUrl: 'https://img.test/bc.jpg',
      trailerUrl: 'https://video.test/bc', seoTitle: 'Black Christmas (1974)', seoDescription: 'The original slasher.',
      characters: [{ character: charSummary('billy', 'Billy'), role: 'Caller', sortOrder: 1 }],
      collections: [
        colSummary('full-collection', 'Full Collection'),
        colSummary('minimal-collection', 'Minimal Collection'),
        ghost,
      ],
      relatedProducts: [prodSummary('santa-mug', 'Santa Mug')],
    }),
    movie({
      id: 'mov:kr', slug: 'krampus', title: 'Krampus', releaseYear: 2015, releaseDate: null, runtime: 120,
      synopsis: 'A family faces the Christmas demon.', posterUrl: null, heroImageUrl: 'https://img.test/krampus-hero.jpg',
      seoTitle: 'Krampus (2015)', seoDescription: 'Family vs. demon.',
      characters: [{ character: charSummary('krampus-beast', 'The Beast'), role: null, sortOrder: 1 }],
      collections: [colSummary('full-collection', 'Full Collection'), colSummary('advent-challenge', 'Advent Challenge')],
      relatedProducts: [],
    }),
    movie({
      id: 'mov:sn', slug: 'silent-night', title: 'Silent Night', releaseYear: null, releaseDate: null, runtime: null,
      synopsis: null, posterUrl: null, heroImageUrl: null, trailerUrl: null,
      seoTitle: 'Silent Night', seoDescription: 'A quiet one.',
      characters: [], collections: [colSummary('full-collection', 'Full Collection'), colSummary('advent-challenge', 'Advent Challenge')],
      relatedProducts: [],
    }),
    movie({
      id: 'mov:jf', slug: 'jack-frost', title: 'Jack Frost', mediaType: 'TV_SPECIAL', releaseYear: 1979, releaseDate: null, runtime: 30,
      synopsis: 'A snowman special.', posterUrl: '/uploads/jack-frost.png',
      seoTitle: 'Jack Frost (1979)', seoDescription: 'Snowy special.',
      characters: [], collections: [colSummary('advent-challenge', 'Advent Challenge')], relatedProducts: [],
    }),
  ];

  const characters: CharacterDetail[] = [
    character({
      id: 'chr:billy', slug: 'billy', name: 'Billy', summary: 'The caller.', biography: 'Origin story.',
      imageUrl: 'https://img.test/billy.jpg', seoTitle: 'Billy', seoDescription: 'About Billy.',
      movies: [withYear('black-christmas', 'Black Christmas', 1974)],
      products: [prodSummary('santa-mug', 'Santa Mug')],
      collections: [colSummary('full-collection', 'Full Collection')],
    }),
    character({
      id: 'chr:beast', slug: 'krampus-beast', name: 'The Beast', summary: null, biography: null, imageUrl: null,
      seoTitle: 'The Beast', seoDescription: 'The horned one.',
      movies: [withYear('krampus', 'Krampus', 2015)], products: [],
      collections: [colSummary('full-collection', 'Full Collection')],
    }),
  ];

  const products: ProductDetail[] = [
    product({
      id: 'prd:mug', slug: 'santa-mug', name: 'Santa Mug', description: 'A festive mug.', category: 'Drinkware',
      imageUrl: 'https://img.test/mug.jpg', imageAlt: 'Red mug', price: '24.90', currency: 'USD',
      seoTitle: 'Santa Mug', seoDescription: 'A mug.',
      affiliateLinks: [{ id: 'aff:1', provider: 'ShopCo', url: 'https://shop.test/mug?ref=hc&x=1', productId: 'prd:mug' }],
      characters: [{ character: charSummary('billy', 'Billy'), sortOrder: 1 }],
      collections: [colSummary('full-collection', 'Full Collection'), colSummary('advent-challenge', 'Advent Challenge')],
    }),
    product({
      id: 'prd:poster', slug: 'plain-poster', name: 'Plain Poster', description: 'A poster.', category: null,
      imageUrl: '/uploads/poster.png', imageAlt: null, price: null, currency: null,
      seoTitle: 'Plain Poster', seoDescription: 'A poster for the wall.', affiliateLinks: [],
      characters: [], collections: [colSummary('advent-challenge', 'Advent Challenge')],
    }),
    product({
      id: 'prd:evil', slug: 'hostile-product', name: `Evil ${HOSTILE}`, description: HOSTILE, category: `Gifts <b>&</b>`,
      imageUrl: null, imageAlt: null, price: null, currency: null,
      seoTitle: `Evil </script> title`, seoDescription: HOSTILE,
      affiliateLinks: [
        { id: 'aff:2', provider: 'Evil "Co"', url: 'javascript:alert(1)', productId: 'prd:evil' },
        { id: 'aff:3', provider: 'Quote <Shop>', url: 'https://shop.test/x?a="b"&c=<d>', productId: 'prd:evil' },
      ],
      characters: [], collections: [colSummary('full-collection', 'Full Collection')],
    }),
  ];

  // Records that must never be built: served at detail routes, absent from /build.
  const mark = (s: string) => `UNPUBLISHED-MARKER ${s}`;
  const unpublished = {
    collections: [
      collection({ id: 'col:draft', slug: 'draft-collection', title: mark('draft collection') }),
      collection({ id: 'col:arch', slug: 'archived-collection', title: mark('archived collection') }),
    ],
    movies: [
      movie({ id: 'mov:draft', slug: 'draft-movie', title: mark('draft movie') }),
      movie({ id: 'mov:arch', slug: 'archived-movie', title: mark('archived movie') }),
    ],
    characters: [character({ id: 'chr:draft', slug: 'draft-character', name: mark('draft character') })],
    products: [product({ id: 'prd:arch', slug: 'archived-product', name: mark('archived product') })],
  };

  // /home: featured in editorial (not alphabetical) order; seasonal lists a collection that is not built
  // (rendered as plain text + warning); the gift collection and featured movie/character are built, and the
  // movie and character summaries carry hostile text.
  const home: HomeResponse = {
    featuredCollections: [
      { ...colSummary('minimal-collection', 'Minimal Collection'), featured: true, summary: 'Short & sweet.', heroImageUrl: 'https://img.test/min.jpg' },
      { ...colSummary('full-collection', 'Full Collection'), featured: true, summary: 'A summary of everything.', heroImageUrl: 'https://img.test/full.jpg' },
    ],
    seasonalCollections: [
      { ...colSummary('advent-challenge', 'Advent Challenge'), type: 'SEASONAL_CHALLENGE', seasonal: true, summary: 'Twenty-four nights.', heroImageUrl: null },
      { ...colSummary('ghost-collection', 'Ghost Collection'), seasonal: true },
    ],
    giftCollection: { ...colSummary('full-collection', 'Full Collection'), type: 'GIFT', summary: 'Gifts for fans.' },
    featuredMovie: { ...movieSummary('krampus', `Krampus ${HOSTILE}`), releaseYear: 2015, synopsis: HOSTILE, posterUrl: '/uploads/poster.png' },
    featuredCharacter: { ...charSummary('billy', 'Billy'), summary: 'The caller.', imageUrl: null },
  };

  const raw = {
    home,
    published: {
      collections: collections.sort(bySlug), movies: movies.sort(bySlug),
      characters: characters.sort(bySlug), products: products.sort(bySlug),
    },
    unpublished,
  };
  const { published, unpublished: unpub, home: homeOut } = remapIds(raw) as typeof raw;

  // updatedAt: distinct per slug, plus two awkward values the sitemap must handle.
  const stamp = (i: number) => new Date(Date.UTC(2025, 0, 1 + i, 10, 15, 30)).toISOString();
  const listFor = (kind: Kind): ListEntry[] => {
    const entries = published[kind].map((m, i): ListEntry => ({ slug: m.slug, updatedAt: stamp(i) }));
    if (kind === 'movies') {
      entries.push({ slug: 'vanished-movie', updatedAt: stamp(40) });
      const sn = entries.find((e) => e.slug === 'silent-night');
      if (sn) sn.updatedAt = 'not-a-date';
    }
    if (kind === 'characters') {
      const beast = entries.find((e) => e.slug === 'krampus-beast');
      if (beast) beast.updatedAt = '2025-03-04T10:00:00+02:00';
    }
    return entries.sort(bySlug);
  };
  const ids = new Set<string>();
  collectIds(published, ids);
  collectIds(unpub, ids);
  collectIds(homeOut, ids);
  return {
    published, unpublished: unpub, ids: [...ids], home: homeOut,
    lists: { collections: listFor('collections'), movies: listFor('movies'), characters: listFor('characters'), products: listFor('products') },
  };
}

export interface FakeApi {
  fetch: typeof fetch;
  /** Every requested path (after the base URL), in request order. */
  requested: string[];
}

export interface FakeApiOptions {
  /** Serve /build lists in reverse order (the real API sorts ascending). */
  reverseLists?: boolean;
  /** Random per-request delay up to this many ms, to shuffle completion order. */
  jitterMs?: number;
}

export function createFakeApi(fx: Fixture, opts: FakeApiOptions = {}): FakeApi {
  const requested: string[] = [];
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const detail = (kind: Kind, slug: string): unknown => {
    const all = [...fx.published[kind], ...fx.unpublished[kind]] as Array<{ slug: string }>;
    return all.find((m) => m.slug === slug);
  };
  const impl = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    if (!url.startsWith(API_BASE)) throw new TypeError(`unexpected host in ${url}`);
    const p = url.slice(API_BASE.length);
    requested.push(p);
    if (opts.jitterMs) await new Promise((r) => setTimeout(r, Math.random() * opts.jitterMs!));
    if (p === '/home') return json(fx.home);
    const list = /^\/build\/(collections|movies|characters|products)$/.exec(p);
    if (list) {
      const entries = fx.lists[list[1] as Kind];
      return json(opts.reverseLists ? [...entries].reverse() : entries);
    }
    const m = /^\/(collections|movies|characters|products)\/([^/]+)$/.exec(p);
    const body = m ? detail(m[1] as Kind, decodeURIComponent(m[2])) : undefined;
    return body ? json(body) : json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404);
  };
  return { fetch: impl as typeof fetch, requested };
}
