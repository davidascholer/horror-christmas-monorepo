// @vitest-environment node
/**
 * Missing-collection warnings and rendering (Task 6.5; Requirements 15.4, 18.2).
 */
import { describe, it, expect } from 'vitest';
import { missingCollectionSlugs, missingCollectionWarnings, noCollectionsWarning, referencedCollectionSlugs } from './collection-refs';
import { renderSite } from './render-site';
import type { BuildData, BuildWarning } from './fetch-build-data';
import { SITE, TEST_ASSETS, character, collection, colSummary, movie, product, validData } from './test-fixtures';

const run = (data: ReturnType<typeof validData>) => {
  const warnings: BuildWarning[] = [];
  const pages = renderSite(data, { assets: TEST_ASSETS, siteUrl: SITE, warnings });
  return { pages, warnings, html: (type: string, slug?: string) => pages.find((p) => p.type === type && (!slug || p.slug === slug))!.html };
};

describe('collection references', () => {
  it('lists the referenced slugs per page type', () => {
    expect(referencedCollectionSlugs({ type: 'movie', model: movie() })).toEqual(['cozy-slashers']);
    expect(referencedCollectionSlugs({ type: 'collection', model: collection() })).toEqual(['gift-guide']);
  });

  it('missingCollectionSlugs deduplicates', () => {
    const m = movie({ collections: [colSummary('a'), colSummary('a'), colSummary('b')] });
    expect(missingCollectionSlugs({ type: 'movie', model: m }, new Set(['b']))).toEqual(['a']);
  });
});

describe('missing collection warning and rendering', () => {
  it('complete data: no collection warnings and every reference is a link', () => {
    const { warnings, html } = run(validData());
    expect(warnings.filter((w) => /collection/.test(w.message) && /references/.test(w.message))).toEqual([]);
    expect(html('movie')).toContain('<a href="/collections/cozy-slashers/">Cozy Slashers</a>');
  });

  it.each([
    ['movie', { movies: [movie({ collections: [colSummary('ghost', 'Ghost Collection'), colSummary('cozy-slashers', 'Cozy Slashers')] })] }, 'movie "black-christmas"'],
    ['character', { characters: [character({ collections: [colSummary('ghost', 'Ghost Collection'), colSummary('cozy-slashers', 'Cozy Slashers')] })] }, 'character "billy"'],
    ['product', { products: [product({ collections: [colSummary('ghost', 'Ghost Collection'), colSummary('cozy-slashers', 'Cozy Slashers')] })] }, 'product "mug"'],
  ] as Array<['movie' | 'character' | 'product', Partial<BuildData>, string]>)('%s referencing an absent collection: warning names page and collection, text not a link', (type, over, who) => {
    const { warnings, html } = run(validData(over));
    const w = warnings.filter((x) => x.message.includes('"ghost"'));
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ entityType: type });
    expect(w[0].message).toContain(`${who}: references collection "ghost"`);
    const page = html(type);
    expect(page).not.toContain('/collections/ghost/');
    expect(page).toContain('<li>Ghost Collection</li>'); // plain text, title kept, no dead link
    expect(page).toContain('<a href="/collections/cozy-slashers/">Cozy Slashers</a>'); // the other reference still renders (built collection)
  });

  it('collection whose related collection is absent: warning, plain text', () => {
    const { warnings, html } = run(validData({ collections: [collection({ relatedCollections: [{ collection: colSummary('ghost', 'Ghost'), sortOrder: 1 }] })] }));
    const w = warnings.filter((x) => x.message.includes('"ghost"'));
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ entityType: 'collection', slug: 'cozy-slashers' });
    expect(html('collection')).not.toContain('/collections/ghost/');
    expect(html('collection')).toContain('<li>Ghost</li>');
  });

  it('one warning per page and missing collection, even if listed twice', () => {
    const { warnings } = run(validData({ movies: [movie({ collections: [colSummary('ghost'), colSummary('ghost')] })] }));
    expect(warnings.filter((x) => x.message.includes('"ghost"'))).toHaveLength(1);
  });

  it('the warning does not stop rendering (all pages are produced)', () => {
    const { pages } = run(validData({ movies: [movie({ collections: [colSummary('ghost')] })] }));
    expect(pages).toHaveLength(5);
  });
});

describe('zero published collections', () => {
  it('emits one prominent warning when other content is published', () => {
    const data = validData({ collections: [], movies: [movie({ collections: [] })], characters: [character({ collections: [] })], products: [product({ collections: [] })] });
    const w = noCollectionsWarning(data)!;
    expect(w.message).toMatch(/^NO PUBLISHED COLLECTIONS: 1 movies, 1 characters and 1 products/);
    expect(w.message).toContain('collection-first');
    const { warnings, pages } = run(data);
    expect(warnings.filter((x) => x.message.startsWith('NO PUBLISHED COLLECTIONS'))).toHaveLength(1);
    expect(pages).toHaveLength(3); // it is a warning, not a failure
  });

  it('is not emitted when a collection exists, or when nothing is published', () => {
    expect(noCollectionsWarning(validData())).toBeNull();
    expect(noCollectionsWarning({ collections: [], movies: [], characters: [], products: [] })).toBeNull();
  });
});

describe('missingCollectionWarnings', () => {
  it('is empty when every reference is built', () => {
    expect(missingCollectionWarnings({ type: 'movie', model: movie() }, new Set(['cozy-slashers']))).toEqual([]);
  });
});
