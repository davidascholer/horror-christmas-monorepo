/**
 * Editorial copy of the homepage that is NOT catalog data (Task 7.1, Part B).
 *
 * Everything that comes from the catalog (collections, the featured movie and
 * character, the gift collection) is read from `GET /home` at build time and
 * is never written here (Requirement 9.2). Only fixed site text lives in this
 * file: the hero, the section headings and the metadata copy.
 *
 * PROVISIONAL: the wording is a working draft for the owner to rewrite
 * (OPEN-DECISIONS.md, "Homepage brand copy"). To change it, edit this file and
 * rebuild; nothing else needs to change. Keep HOME_DESCRIPTION at 160
 * characters or fewer (a test enforces it).
 */

/** The brand promise. It is the hero headline (the page's only h1), so keep it one short sentence pair. */
export const HOME_HEADLINE_LEAD = 'Everything Christmas Horror.';
export const HOME_HEADLINE_TAIL = 'One Home.';

/** Small line above the headline. */
export const HOME_EYEBROW = 'Christmas horror, curated';

/** Collection-first introduction: sends visitors into the collections. */
export const HOME_INTRO =
  'Start with a collection. Each one is hand-picked and put in order, so you can find the film to watch, ' +
  'the character to meet and the gift to give without digging.';

/** Label of the hero call to action. It jumps to the featured collections on this page. */
export const HOME_CTA_LABEL = 'Explore featured collections';

/** <title> of the homepage. The brand comes first here; entity pages put it last. */
export const HOME_TITLE = 'Horror Christmas | Everything Christmas Horror. One Home.';

/** Meta description (also og:description and the WebSite description). At most 160 characters. */
export const HOME_DESCRIPTION =
  'Hand-picked Christmas horror collections of films, characters and gifts. Find your next festive fright. ' +
  'Everything Christmas Horror. One Home.';

/** Section headings (h2). */
export const HOME_HEADINGS = {
  featuredCollections: 'Featured collections',
  seasonalCollections: 'Seasonal collections',
  gift: 'Gift ideas',
  character: 'Featured character',
  movie: 'Featured movie',
} as const;

/** Name of the homepage's ItemList in the structured data. */
export const HOME_ITEM_LIST_NAME = HOME_HEADINGS.featuredCollections;
