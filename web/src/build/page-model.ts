/**
 * Page descriptor and the per-type facts the metadata functions need
 * (Task 6.3). Only fields from api-contracts.ts are read.
 */
import type { CollectionDetail, MovieDetail, CharacterDetail, ProductDetail, HomeResponse } from '../types/api-contracts';
import { characterPath, collectionPath, moviePath, productPath, type PageType } from '../routes';

export type PageModel =
  | { type: 'collection'; model: CollectionDetail }
  | { type: 'movie'; model: MovieDetail }
  | { type: 'character'; model: CharacterDetail }
  | { type: 'product'; model: ProductDetail };

/**
 * The homepage (Task 7.1). Not an entity: it has no slug, name or SEO fields
 * in the data (its title and description are constants in pages/home-content.ts),
 * so it is kept out of `PageModel` and `entityFacts`.
 */
export interface HomePageModel {
  type: 'home';
  model: HomeResponse;
}

/** Every kind of generated page: the four entity pages and the homepage. */
export type SitePageModel = PageModel | HomePageModel;

export interface EntityFacts {
  type: PageType;
  slug: string;
  /** Route path with trailing slash, e.g. `/movies/the-slug/`. Throws on an unusable slug. */
  route: string;
  name: string;
  seoTitle: string | null;
  seoDescription: string | null;
  /** Only collections and characters have a `summary` in the contract. */
  summary: string | null;
  /**
   * The best long text for the generated excerpt: collection introduction,
   * movie synopsis, character biography, product description.
   */
  longText: string | null;
  /** Image URLs in order of preference; the first valid one is used. */
  imageCandidates: Array<string | null>;
}

export function entityFacts(page: PageModel): EntityFacts {
  switch (page.type) {
    case 'collection': {
      const m = page.model;
      return {
        type: 'collection', slug: m.slug, route: collectionPath(m.slug), name: m.title,
        seoTitle: m.seoTitle, seoDescription: m.seoDescription, summary: m.summary,
        longText: m.introduction, imageCandidates: [m.heroImageUrl],
      };
    }
    case 'movie': {
      const m = page.model;
      return {
        type: 'movie', slug: m.slug, route: moviePath(m.slug), name: m.title,
        seoTitle: m.seoTitle, seoDescription: m.seoDescription, summary: null,
        longText: m.synopsis, imageCandidates: [m.posterUrl, m.heroImageUrl],
      };
    }
    case 'character': {
      const m = page.model;
      return {
        type: 'character', slug: m.slug, route: characterPath(m.slug), name: m.name,
        seoTitle: m.seoTitle, seoDescription: m.seoDescription, summary: m.summary,
        longText: m.biography, imageCandidates: [m.imageUrl],
      };
    }
    case 'product': {
      const m = page.model;
      return {
        type: 'product', slug: m.slug, route: productPath(m.slug), name: m.name,
        seoTitle: m.seoTitle, seoDescription: m.seoDescription, summary: null,
        longText: m.description, imageCandidates: [m.imageUrl],
      };
    }
  }
}
