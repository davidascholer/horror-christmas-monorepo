/**
 * Build-time publication validation (Task 6.5; Requirements 12.1, 12.2, 18.3).
 *
 * The API only serves PUBLISHED records, but the build is the last gate before
 * pages go live, so every retrieved model is checked for the required
 * publication metadata. A missing REQUIRED field is a hard error that fails
 * the build, with every problem of every entity listed (not just the first).
 *
 * Rules mirror server/src/validation/publication-validation.ts. The logic is
 * deliberately duplicated: web/ and server/ are independently deployable and
 * web/ must not import from server/. If the server rules change, update this
 * file too (the tests here pin the current rules).
 *
 *   collection: introduction, curatorNotes, heroImageUrl, heroImageAlt,
 *               seoTitle, seoDescription, at least one movie,
 *               at least one related collection
 *   movie / character / product: seoTitle, seoDescription
 *
 * Blank and whitespace-only strings count as missing.
 *
 * Required vs optional:
 *   - Required publication metadata missing  -> error (this module).
 *   - Optional data missing (images on movies/characters/products, summaries,
 *     descriptions beyond the SEO ones, alt text on non-collection images)
 *     -> a documented fallback plus a build warning, never an error.
 *   - A fallback must never hide a publication error: a collection whose hero
 *     image URL is present but unusable (not http(s) or root-relative) is
 *     reported here instead of silently getting the fallback image.
 *
 * Tension with Task 6.3 (flagged): metadata still falls back from
 * seoDescription to summary to an excerpt (Req 18.3: "when a missing
 * description CAN BE rendered"). Because seoDescription is required for
 * launch (Req 12.2), a build with an empty seoDescription now fails here
 * before that fallback is reached. The fallback stays in the pure metadata
 * functions for renderSite callers and unit tests; in `npm run build:static` it
 * is effectively unreachable for SEO descriptions.
 *
 * Fields the build cannot verify because the API does not expose them: the
 * publication status itself (the API serves published records only and the
 * models carry no `status`; `publishedAt` is nullable and not checked) and
 * any rule about relationships that the page models do not include.
 */
import type { BuildData, BuildEntityType } from './fetch-build-data';
import { isPresent } from './seo';
import { usableImageUrl } from '../pages/image-sources';

export interface PublicationProblem {
  entityType: BuildEntityType;
  slug: string;
  /** Contract field name, e.g. `heroImageAlt`, `movies`, `relatedCollections`. */
  field: string;
  /** Short reason: "missing" (blank or absent), "no items", or "not a valid image URL". */
  problem: string;
}

type Models = Pick<BuildData, 'collections' | 'movies' | 'characters' | 'products'>;

function seoProblems(
  entityType: BuildEntityType,
  m: { slug: string; seoTitle: string | null; seoDescription: string | null },
): PublicationProblem[] {
  const out: PublicationProblem[] = [];
  if (!isPresent(m.seoTitle)) out.push({ entityType, slug: m.slug, field: 'seoTitle', problem: 'missing' });
  if (!isPresent(m.seoDescription)) out.push({ entityType, slug: m.slug, field: 'seoDescription', problem: 'missing' });
  return out;
}

/** All publication problems in `data`, in entity order (collections, movies, characters, products). */
export function findPublicationProblems(data: Models): PublicationProblem[] {
  const problems: PublicationProblem[] = [];

  for (const c of data.collections) {
    const add = (field: string, problem = 'missing') =>
      problems.push({ entityType: 'collection', slug: c.slug, field, problem });
    if (!isPresent(c.introduction)) add('introduction');
    if (!isPresent(c.curatorNotes)) add('curatorNotes');
    if (!isPresent(c.heroImageUrl)) add('heroImageUrl');
    else if (!usableImageUrl(c.heroImageUrl)) add('heroImageUrl', 'not a valid image URL (http(s) or root-relative)');
    if (!isPresent(c.heroImageAlt)) add('heroImageAlt');
    problems.push(...seoProblems('collection', c));
    if (!Array.isArray(c.movies) || c.movies.length === 0) add('movies', 'no items (at least one movie is required)');
    if (!Array.isArray(c.relatedCollections) || c.relatedCollections.length === 0) {
      add('relatedCollections', 'no items (at least one related collection is required)');
    }
  }
  for (const m of data.movies) problems.push(...seoProblems('movie', m));
  for (const ch of data.characters) problems.push(...seoProblems('character', ch));
  for (const p of data.products) problems.push(...seoProblems('product', p));
  return problems;
}

export class PublicationValidationError extends Error {
  readonly problems: readonly PublicationProblem[];
  constructor(problems: readonly PublicationProblem[]) {
    super(formatPublicationProblems(problems));
    this.name = 'PublicationValidationError';
    this.problems = problems;
  }
}

/**
 * One line per entity, listing all of its fields:
 *   collection "slug": heroImageAlt (missing), movies (no items ...)
 */
export function formatPublicationProblems(problems: readonly PublicationProblem[]): string {
  const byEntity = new Map<string, PublicationProblem[]>();
  for (const p of problems) {
    const key = `${p.entityType} ${JSON.stringify(p.slug)}`;
    byEntity.set(key, [...(byEntity.get(key) ?? []), p]);
  }
  const lines = [...byEntity].map(([key, list]) => `  - ${key}: ${list.map((p) => `${p.field} (${p.problem})`).join(', ')}`);
  return (
    `Publication validation failed: ${problems.length} problem${problems.length === 1 ? '' : 's'} in ` +
    `${byEntity.size} published ${byEntity.size === 1 ? 'entity' : 'entities'}. Nothing was written.\n` +
    lines.join('\n') +
    '\nFix the content (or unpublish the entity) and run the build again.'
  );
}

/** Throws PublicationValidationError listing every problem; returns normally when all models are valid. */
export function assertPublishable(data: Models): void {
  const problems = findPublicationProblems(data);
  if (problems.length > 0) throw new PublicationValidationError(problems);
}
