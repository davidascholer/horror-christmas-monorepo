/**
 * Services Index
 * 
 * Exports all service modules for the Horror Christmas API.
 */

export { HomeService } from './home.service.js';
export { CollectionService } from './collection.service.js';
export { MovieService, DEFAULT_MOVIE_PAGE_SIZE, MAX_MOVIE_PAGE_SIZE } from './movie.service.js';
export { CharacterService } from './character.service.js';
export { BuildService } from './build.service.js';
export { ProductService } from './product.service.js';
export {
  SearchService,
  SEARCH_CATEGORY_ORDER,
  MAX_SEARCH_QUERY_LENGTH,
  MAX_SEARCH_RESULTS,
  normalizeSearchQuery,
} from './search.service.js';
