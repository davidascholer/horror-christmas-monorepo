/**
 * Typed model builders shared by the Task 6.5 tests. All models are complete
 * and pass publication validation unless overridden. Test support only.
 */
import type {
  CharacterDetail, CharacterSummary, CollectionDetail, CollectionSummary, HomeResponse,
  MovieDetail, MovieSummary, ProductDetail, ProductSummary,
} from '../types/api-contracts';
import type { BuildData } from './fetch-build-data';
import type { ClientAssets } from './client-assets';

export const TS = '2026-01-01T00:00:00.000Z';
export const SITE = 'https://example.test';

export const colSummary = (slug: string, title = slug): CollectionSummary => ({
  id: `id-${slug}`, slug, title, summary: null, type: 'THEME', heroImageUrl: null, featured: false, seasonal: false,
});
export const movieSummary = (slug: string, title = slug): MovieSummary => ({
  id: `id-${slug}`, slug, title, releaseYear: 1984, mediaType: 'FILM', posterUrl: null, synopsis: null,
});
export const charSummary = (slug: string, name = slug): CharacterSummary => ({
  id: `id-${slug}`, slug, name, summary: null, imageUrl: null,
});
export const prodSummary = (slug: string, name = slug): ProductSummary => ({
  id: `id-${slug}`, slug, name, description: null, imageUrl: null, price: null, currency: null, category: null,
});

export function collection(over: Partial<CollectionDetail> = {}): CollectionDetail {
  return {
    id: 'c1', slug: 'cozy-slashers', title: 'Cozy Slashers', type: 'THEME',
    introduction: 'Intro.', curatorNotes: 'Notes.', summary: 'Summary.',
    heroImageUrl: 'https://img.test/hero.jpg', heroImageAlt: 'Snowy house',
    seoTitle: 'Cozy Slashers | Picks', seoDescription: 'Cozy slashers for winter.', featured: false, seasonal: false,
    publishedAt: TS, createdAt: TS, updatedAt: TS,
    movies: [
      { movie: movieSummary('zeta-movie', 'Zeta'), sortOrder: 1, curatorNote: null },
      { movie: movieSummary('alpha-movie', 'Alpha'), sortOrder: 2, curatorNote: null },
    ],
    characters: [{ character: charSummary('billy', 'Billy'), sortOrder: 1, curatorNote: null }],
    products: [{ product: prodSummary('mug', 'Mug'), sortOrder: 1, curatorNote: null }],
    franchises: [], tags: [],
    relatedCollections: [{ collection: colSummary('gift-guide', 'Gift Guide'), sortOrder: 1 }],
    ...over,
  };
}

export function movie(over: Partial<MovieDetail> = {}): MovieDetail {
  return {
    id: 'm1', slug: 'black-christmas', title: 'Black Christmas', originalTitle: null, mediaType: 'FILM',
    releaseYear: 1974, releaseDate: '1974-10-16', runtime: 98, synopsis: 'Sorority house.',
    posterUrl: 'https://img.test/poster.jpg', heroImageUrl: null, trailerUrl: null,
    seoTitle: 'Black Christmas (1974)', seoDescription: 'A classic.', featured: false, franchise: null,
    publishedAt: TS, createdAt: TS, updatedAt: TS,
    characters: [{ character: charSummary('billy', 'Billy'), role: null, sortOrder: 1 }],
    collections: [colSummary('cozy-slashers', 'Cozy Slashers')],
    tags: [], relatedProducts: [prodSummary('mug', 'Mug')],
    ...over,
  };
}

export function character(over: Partial<CharacterDetail> = {}): CharacterDetail {
  return {
    id: 'ch1', slug: 'billy', name: 'Billy', summary: 'Menacing.', biography: 'Origin.',
    imageUrl: 'https://img.test/billy.jpg', seoTitle: 'Billy the character', seoDescription: 'About Billy.',
    featured: false, franchise: null, publishedAt: TS, createdAt: TS, updatedAt: TS,
    movies: [movieSummary('black-christmas', 'Black Christmas')],
    products: [prodSummary('mug', 'Mug')],
    collections: [colSummary('cozy-slashers', 'Cozy Slashers')],
    tags: [],
    ...over,
  };
}

export function product(over: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: 'p1', slug: 'mug', name: 'Mug', description: 'A mug.', category: null,
    imageUrl: 'https://img.test/mug.jpg', imageAlt: 'A red mug', price: null, currency: null,
    seoTitle: 'Mug | Gifts', seoDescription: 'A festive mug.', featured: false, franchise: null,
    affiliateLinks: [], publishedAt: TS, createdAt: TS, updatedAt: TS,
    characters: [{ character: charSummary('billy', 'Billy'), sortOrder: 1 }],
    collections: [colSummary('cozy-slashers', 'Cozy Slashers')],
    tags: [],
    ...over,
  };
}

/**
 * Build data without the mandatory `home` projection. renderSite renders the
 * homepage only when `home` is given, so tests of the entity pages use this
 * and tests of the homepage add `home` explicitly.
 */
export type EntityBuildData = Omit<BuildData, 'home'> & { home?: HomeResponse };

/** A /home response with nothing in it: every optional section absent. */
export const emptyHome = (): HomeResponse => ({
  featuredCollections: [], seasonalCollections: [], featuredMovie: null, featuredCharacter: null, giftCollection: null,
});

/** A /home response that features the given collections (by slug, in order) and nothing else. */
export const homeFeaturing = (slugs: readonly string[]): HomeResponse => ({
  ...emptyHome(),
  featuredCollections: slugs.map((slug) => ({ ...colSummary(slug, slug), featured: true })),
});

/** A complete data set that passes validation: two collections that relate to each other. */
export function validData(over: Partial<EntityBuildData> = {}): EntityBuildData {
  return {
    collections: [
      collection(),
      collection({ id: 'c2', slug: 'gift-guide', title: 'Gift Guide', relatedCollections: [{ collection: colSummary('cozy-slashers', 'Cozy Slashers'), sortOrder: 1 }] }),
    ],
    movies: [movie()], characters: [character()], products: [product()], warnings: [],
    updatedAt: { collections: new Map(), movies: new Map(), characters: new Map(), products: new Map() },
    ...over,
  };
}

/** Client bundle files as the Vite manifest would give them. Test support only. */
export const TEST_ASSETS: ClientAssets = {
  entry: '/assets/entry-client-TEST.js',
  css: ['/assets/entry-client-TEST.css'],
  modulePreload: [],
};

/**
 * The markup a visitor's page is made of, for string assertions on page content:
 * data script blocks (JSON-LD, hydration data, entry script) and React's inert
 * text separators (`<!-- -->`, written by renderToString so the browser can
 * hydrate) are removed. Test support only.
 */
export function visibleHtml(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<!-- -->/g, '');
}
