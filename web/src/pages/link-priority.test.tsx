// @vitest-environment node
/**
 * Internal-link priority (Task 6.5, Requirement 9.8): the shared ordering and
 * the DOM order of link groups on every page type. Requirement 1.3 (entity
 * pages still link back to collections) and 1.4 (editorial order kept).
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LINK_GROUP_ORDER, PrioritizedLinkSections, sortLinkGroups, type LinkGroup } from './link-priority';
import { renderSite } from '../build/render-site';
import { SITE, TEST_ASSETS, character, collection, movie, product, validData } from '../build/test-fixtures';

const pages = renderSite(validData(), { assets: TEST_ASSETS, siteUrl: SITE });
const htmlOf = (type: string, slug?: string) => {
  const p = pages.find((x) => x.type === type && (!slug || x.slug === slug));
  if (!p) throw new Error(`no ${type} page`);
  return p.html;
};

/** Link groups in DOM order, one entry per section (data-link-group). */
const groupSequence = (html: string): string[] => [...html.matchAll(/<section[^>]*data-link-group="([^"]+)"/g)].map((m) => m[1]);
/** The same sequence with repeats collapsed. */
const distinct = (seq: string[]) => seq.filter((g, i) => g !== seq[i - 1]);

/** Internal link hrefs inside <main>, in DOM order. */
const mainHrefs = (html: string): string[] => {
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  return [...main.matchAll(/<a href="(\/[^"]*)"/g)].map((m) => m[1]);
};
const kindOf = (href: string) => href.split('/')[1]; // collections | movies | characters | products

describe('LINK_GROUP_ORDER (shared definition)', () => {
  it('is exactly the Requirement 9.8 order', () => {
    expect([...LINK_GROUP_ORDER]).toEqual(['related-collections', 'collection-items', 'characters', 'movies', 'products']);
  });

  it('sortLinkGroups orders any input by priority', () => {
    const shuffled: LinkGroup[] = ['products', 'movies', 'related-collections', 'characters', 'collection-items'];
    expect(sortLinkGroups(shuffled)).toEqual([...LINK_GROUP_ORDER]);
    expect(sortLinkGroups(['movies', 'characters'])).toEqual(['characters', 'movies']);
  });

  it('PrioritizedLinkSections renders in priority order whatever order the template lists them', () => {
    const spec = (id: string) => ({ id, heading: id, children: <p>{id}</p> });
    const html = renderToStaticMarkup(
      <PrioritizedLinkSections
        sections={{
          products: spec('p'),
          movies: spec('m'),
          'collection-items': [spec('i1'), spec('i2')],
          characters: spec('c'),
          'related-collections': spec('r'),
        }}
      />,
    );
    expect(groupSequence(html)).toEqual(['related-collections', 'collection-items', 'collection-items', 'characters', 'movies', 'products']);
    expect(html.indexOf('>i1<')).toBeLessThan(html.indexOf('>i2<')); // sections of one group keep their order
  });

  it('a hidden section (show=false) renders nothing', () => {
    const html = renderToStaticMarkup(
      <PrioritizedLinkSections sections={{ movies: { id: 'm', heading: 'Movies', show: false, children: <p>x</p> } }} />,
    );
    expect(html).toBe('');
  });
});

describe('DOM order of link groups per page type', () => {
  it('collection: related collections, then the collection items', () => {
    const html = htmlOf('collection', 'cozy-slashers');
    expect(groupSequence(html)).toEqual(['related-collections', 'collection-items', 'collection-items', 'collection-items']);
    expect(distinct(groupSequence(html))).toEqual(['related-collections', 'collection-items']);
    // Item sections are movies, characters, products; the first link is the related collection.
    expect(mainHrefs(html).map(kindOf)).toEqual(['collections', 'movies', 'movies', 'characters', 'products']);
  });

  it('collection: items keep editorial order within the section (not alphabetical)', () => {
    const html = htmlOf('collection', 'cozy-slashers');
    expect(html.indexOf('/movies/zeta-movie/')).toBeGreaterThan(-1);
    expect(html.indexOf('/movies/zeta-movie/')).toBeLessThan(html.indexOf('/movies/alpha-movie/'));
  });

  it('movie: collections, characters, products', () => {
    const html = htmlOf('movie');
    expect(groupSequence(html)).toEqual(['related-collections', 'characters', 'products']);
    expect(mainHrefs(html).map(kindOf)).toEqual(['collections', 'characters', 'products']);
  });

  it('character: collections, movies, products', () => {
    const html = htmlOf('character');
    expect(groupSequence(html)).toEqual(['related-collections', 'movies', 'products']);
    expect(mainHrefs(html).map(kindOf)).toEqual(['collections', 'movies', 'products']);
  });

  it('product: collections, characters', () => {
    const html = htmlOf('product');
    expect(groupSequence(html)).toEqual(['related-collections', 'characters']);
    expect(mainHrefs(html).map(kindOf)).toEqual(['collections', 'characters']);
  });

  it('every page type keeps a link back to a relevant collection (Req 1.3)', () => {
    for (const type of ['movie', 'character', 'product']) {
      expect(htmlOf(type)).toContain('<a href="/collections/cozy-slashers/">Cozy Slashers</a>');
    }
  });

  it('on every page the link kinds never go against the priority collections > characters > movies > products', () => {
    const rank: Record<string, number> = { collections: 0, characters: 2, movies: 3, products: 4 };
    for (const type of ['movie', 'character', 'product']) {
      const ranks = mainHrefs(htmlOf(type)).map((h) => rank[kindOf(h)]);
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    }
  });

  it('a page with only some link groups keeps the relative order', () => {
    const only = renderSite(
      validData({ movies: [movie({ collections: [], characters: [] })], characters: [character({ collections: [], products: [] })], products: [product({ collections: [] })] }),
      { assets: TEST_ASSETS, siteUrl: SITE },
    );
    const seq = (type: string) => groupSequence(only.find((p) => p.type === type)!.html);
    expect(seq('movie')).toEqual(['products']);
    expect(seq('character')).toEqual(['movies']);
    expect(seq('product')).toEqual(['characters']);
  });

  it('collection with no related collections and no characters still orders items', () => {
    const out = renderSite(validData({ collections: [collection({ relatedCollections: [], characters: [] })] }), { assets: TEST_ASSETS, siteUrl: SITE });
    expect(distinct(groupSequence(out[0].html))).toEqual(['collection-items']);
  });
});
