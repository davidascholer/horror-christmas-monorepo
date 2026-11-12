/**
 * API Contracts - Horror Christmas
 * 
 * This file is the SOURCE OF TRUTH for all API contracts.
 * 
 * SYNCHRONIZATION REQUIREMENT:
 * When updating types here, you MUST also update web/src/types/api-contracts.ts
 * See .kiro/steering/shared-types.md for synchronization process.
 * 
 * DESIGN REFERENCE:
 * These types implement the API contracts defined in design.md sections 4.2-4.5.
 * All fields are explicitly defined per the design document - no speculative additions.
 * 
 * SERVICE MODULE BOUNDARIES:
 * - Collections: Published collection lists/detail, ordered composition, related collections
 * - Movies: Movie retrieval and relationships to characters/collections/products
 * - Characters: Character retrieval and relationships
 * - Products: Product retrieval and affiliate destinations
 * - Search: Cross-catalog full-text search with collection-first ranking
 * - Watchlists: Anonymous token-protected creation, retrieval, membership, ordering, completion
 */

// ============================================================================
// Content Status
// ============================================================================

/**
 * Content publication status
 * - DRAFT: Incomplete or not yet public
 * - PUBLISHED: Eligible for public APIs and static generation
 * - ARCHIVED: Retained for history but excluded from public discovery
 */
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Media type for movies and TV content
 */
export type MediaType = 'FILM' | 'TV_SPECIAL' | 'TV_EPISODE';

/**
 * Collection type for editorial categorization
 */
export type CollectionType = 
  | 'CHARACTER'
  | 'THEME'
  | 'BEGINNER'
  | 'GIFT'
  | 'SEASONAL_CHALLENGE'
  | 'TRADITION';

// ============================================================================
// Summary Types (for lists and related content)
// ============================================================================

export interface CollectionSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  type: CollectionType;
  heroImageUrl: string | null;
  featured: boolean;
  seasonal: boolean;
}

export interface MovieSummary {
  id: string;
  slug: string;
  title: string;
  releaseYear: number | null;
  mediaType: MediaType;
  posterUrl: string | null;
  synopsis: string | null;
}

export interface CharacterSummary {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  imageUrl: string | null;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string | null; // Fixed-precision decimal as string
  currency: string | null; // Three-character currency code (e.g., "USD")
  category: string | null;
}

// ============================================================================
// Homepage API
// ============================================================================

/**
 * GET /home
 * Homepage content projection
 */
export interface HomeResponse {
  featuredCollections: CollectionSummary[];
  seasonalCollections: CollectionSummary[];
  featuredMovie: MovieSummary | null;
  featuredCharacter: CharacterSummary | null;
  giftCollection: CollectionSummary | null;
}

// ============================================================================
// Collection API
// ============================================================================

/**
 * Collection item with curator notes and ordering
 */
export interface CollectionMovie {
  movie: MovieSummary;
  sortOrder: number;
  curatorNote: string | null;
}

export interface CollectionCharacter {
  character: CharacterSummary;
  sortOrder: number;
  curatorNote: string | null;
}

export interface CollectionProduct {
  product: ProductSummary;
  sortOrder: number;
  curatorNote: string | null;
}

export interface CollectionFranchise {
  franchise: FranchiseSummary;
  sortOrder: number;
}

export interface FranchiseSummary {
  id: string;
  slug: string;
  name: string;
}

export interface TagSummary {
  id: string;
  slug: string;
  name: string;
}

export interface RelatedCollection {
  collection: CollectionSummary;
  sortOrder: number;
}

/**
 * GET /collections/:slug
 * Full collection detail with all relationships
 * Design section 4.3: Ordered relationships to movies, characters, products, franchises, tags, and related collections
 */
export interface Collection {
  id: string;
  slug: string;
  title: string;
  type: CollectionType;
  introduction: string;
  curatorNotes: string;
  summary: string | null;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featured: boolean;
  seasonal: boolean;
  publishedAt: string | null; // ISO-8601 timestamp
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * GET /collections/:slug/movies
 * Ordered movies in a collection with curator notes
 */
export interface CollectionMoviesResponse {
  movies: CollectionMovie[];
}

/**
 * GET /collections/:slug/characters
 * Ordered characters in a collection with curator notes
 */
export interface CollectionCharactersResponse {
  characters: CollectionCharacter[];
}

/**
 * GET /collections/:slug/products
 * Ordered products in a collection with curator notes
 */
export interface CollectionProductsResponse {
  products: CollectionProduct[];
}

/**
 * GET /collections/:slug/related
 * Related collections with ordering
 */
export interface CollectionRelatedResponse {
  related: RelatedCollection[];
}

/**
 * Full collection detail with all relationships included
 * Used when all relationships are needed in a single response
 */
export interface CollectionDetail extends Collection {
  movies: CollectionMovie[];
  characters: CollectionCharacter[];
  products: CollectionProduct[];
  franchises: CollectionFranchise[];
  tags: TagSummary[];
  relatedCollections: RelatedCollection[];
}

// ============================================================================
// Movie API
// ============================================================================

/**
 * GET /movies/:slug
 * Full movie detail
 * Design section 4.3: Includes characters, collections, tags, and related products
 */
export interface Movie {
  id: string;
  slug: string;
  title: string;
  originalTitle: string | null;
  mediaType: MediaType;
  releaseYear: number | null;
  releaseDate: string | null; // ISO-8601 date
  runtime: number | null; // Minutes
  synopsis: string | null;
  posterUrl: string | null;
  heroImageUrl: string | null;
  trailerUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featured: boolean;
  franchise: FranchiseSummary | null;
  publishedAt: string | null; // ISO-8601 timestamp
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

export interface MovieCharacter {
  character: CharacterSummary;
  role: string | null;
  sortOrder: number;
}

/**
 * GET /movies/:slug/collections
 * Collections that include this movie
 */
export interface MovieCollectionsResponse {
  collections: CollectionSummary[];
}

/**
 * Full movie detail with all relationships included
 * Used when all relationships are needed in a single response
 */
export interface MovieDetail extends Movie {
  characters: MovieCharacter[];
  collections: CollectionSummary[];
  tags: TagSummary[];
  relatedProducts: ProductSummary[];
}

// ============================================================================
// Character API
// ============================================================================

/**
 * GET /characters/:slug
 * Full character detail
 * Design section 4.3: Includes movies, products, collections, franchise, and tags
 */
export interface Character {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  biography: string | null;
  imageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featured: boolean;
  franchise: FranchiseSummary | null;
  publishedAt: string | null; // ISO-8601 timestamp
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * Full character detail with all relationships included
 * Used when all relationships are needed in a single response
 */
export interface CharacterDetail extends Character {
  movies: MovieSummary[];
  products: ProductSummary[];
  collections: CollectionSummary[];
  tags: TagSummary[];
}

// ============================================================================
// Product API
// ============================================================================

export interface AffiliateLink {
  id: string;
  provider: string; // e.g., "Amazon", "eBay"
  url: string;
  productId: string;
}

/**
 * Product-Character relationship with ordering
 */
export interface ProductCharacter {
  character: CharacterSummary;
  sortOrder: number;
}

/**
 * GET /products/:slug
 * Full product detail
 * Design section 4.3: Includes affiliate links, related characters, and collections
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  price: string | null; // Fixed-precision decimal as string
  currency: string | null; // Three-character currency code
  seoTitle: string | null;
  seoDescription: string | null;
  featured: boolean;
  franchise: FranchiseSummary | null;
  affiliateLinks: AffiliateLink[];
  publishedAt: string | null; // ISO-8601 timestamp
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * Full product detail with all relationships included
 * Used when all relationships are needed in a single response
 */
export interface ProductDetail extends Product {
  characters: ProductCharacter[];
  collections: CollectionSummary[];
  tags: TagSummary[];
}

// ============================================================================
// Search API
// ============================================================================

/**
 * GET /search?q={query}
 * Unified search across all content types
 */
export interface SearchResult {
  type: 'collection' | 'movie' | 'character' | 'product';
  id: string;
  slug: string;
  title: string;
  summary: string;
}

// ============================================================================
// Watchlist API
// ============================================================================

export interface WatchlistMovie {
  movie: MovieSummary;
  sortOrder: number;
  addedAt: string; // ISO-8601 timestamp
  completedAt: string | null; // ISO-8601 timestamp
}

/**
 * POST /watchlists
 * GET /watchlists/:shareToken
 * Watchlist with ordered movies
 */
export interface Watchlist {
  id: string;
  shareToken: string; // Random unguessable token (NOT the database ID)
  title: string | null;
  movies: WatchlistMovie[];
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
}

/**
 * POST /watchlists
 * Create watchlist request
 */
export interface CreateWatchlistRequest {
  title?: string;
}

/**
 * POST /watchlists/:shareToken/movies
 * Add movie to watchlist request
 */
export interface AddMovieToWatchlistRequest {
  movieId: string;
}

/**
 * PATCH /watchlists/:shareToken/movies/:movieId
 * Update movie completion status
 */
export interface UpdateWatchlistMovieRequest {
  completed: boolean;
}

// ============================================================================
// Query Parameters and Filters
// ============================================================================

/**
 * GET /collections query parameters
 */
export interface CollectionListQuery {
  featured?: boolean;
  seasonal?: boolean;
  type?: CollectionType;
}

/**
 * GET /movies query parameters
 */
export interface MovieListQuery {
  q?: string; // Search query
  year?: number;
  genre?: string;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Service Interface (Design section 4.5)
// ============================================================================

/**
 * Complete service interface for the Horror Christmas API
 * This interface defines all available operations across service module boundaries
 */
export interface HorrorChristmasApi {
  // Homepage
  getHome(): Promise<HomeResponse>;
  
  // Collections
  listCollections(query?: CollectionListQuery): Promise<CollectionSummary[]>;
  getCollection(slug: string): Promise<Collection | null>;
  
  // Movies
  listMovies(query?: MovieListQuery): Promise<MovieSummary[]>;
  getMovie(slug: string): Promise<Movie | null>;
  
  // Characters
  listCharacters(): Promise<CharacterSummary[]>;
  getCharacter(slug: string): Promise<Character | null>;
  
  // Products
  listProducts(): Promise<ProductSummary[]>;
  getProduct(slug: string): Promise<Product | null>;
  
  // Search
  search(query: string): Promise<SearchResult[]>;
  
  // Watchlists
  createWatchlist(title?: string): Promise<Watchlist>;
  getWatchlist(shareToken: string): Promise<Watchlist | null>;
  addMovieToWatchlist(shareToken: string, movieId: string): Promise<Watchlist>;
  removeMovieFromWatchlist(shareToken: string, movieId: string): Promise<Watchlist>;
  setWatchlistMovieCompleted(
    shareToken: string,
    movieId: string,
    completed: boolean,
  ): Promise<Watchlist>;
}
