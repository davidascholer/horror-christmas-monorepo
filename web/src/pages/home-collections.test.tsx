// @vitest-environment node
/**
 * Homepage: each collection is shown at most once (owner review of Task 7.1).
 * Gift collection > featured > seasonal; API order kept; emptied sections omitted.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { dedupeHomeCollections, dedupeMessage } from './home-collections';
import { HomePage } from './HomePage';
import { RenderContext } from './render-context';
import { colSummary, emptyHome } from '../build/test-fixtures';
import { resolvePageMetadata } from '../build/page-head';
import type { HomeResponse } from '../types/api-contracts';

const slugs = (l: Array<{ slug: string }>) => l.map((c) => c.slug);
const home = (over: Partial<HomeResponse>): HomeResponse => ({ ...emptyHome(), ...over });
const known = new Set(['a', 'b', 'c', 'd', 'g']);
const html = (h: HomeResponse) =>
  renderToStaticMarkup(
    <RenderContext.Provider value={{ knownCollectionSlugs: known, knownMovieSlugs: new Set(), knownCharacterSlugs: new Set(), imageResolver: undefined } as never}>
      <HomePage home={h} />
    </RenderContext.Provider>,
  );

describe('dedupeHomeCollections', () => {
  it('featured + seasonal: shown in featured only; order preserved', () => {
    const r = dedupeHomeCollections(home({ featuredCollections: [colSummary('b'), colSummary('a')], seasonalCollections: [colSummary('c'), colSummary('a'), colSummary('d')] }));
    expect(slugs(r.home.featuredCollections)).toEqual(['b', 'a']);
    expect(slugs(r.home.seasonalCollections)).toEqual(['c', 'd']);
    expect(r).toMatchObject({ removed: 1, removedFromFeatured: 0, removedFromSeasonal: 1 });
  });

  it('gift wins over featured and seasonal', () => {
    const r = dedupeHomeCollections(home({ featuredCollections: [colSummary('g'), colSummary('a')], seasonalCollections: [colSummary('g'), colSummary('c')], giftCollection: colSummary('g') }));
    expect(slugs(r.home.featuredCollections)).toEqual(['a']);
    expect(slugs(r.home.seasonalCollections)).toEqual(['c']);
    expect(r.home.giftCollection?.slug).toBe('g');
    expect(r.removed).toBe(2);
  });

  it('is idempotent, returns the same object when nothing is removed, and reports nothing', () => {
    const h = home({ featuredCollections: [colSummary('a')], seasonalCollections: [colSummary('b')], giftCollection: colSummary('c') });
    const r = dedupeHomeCollections(h);
    expect(r.home).toBe(h);
    expect(dedupeMessage(r)).toBeNull();
    const dirty = dedupeHomeCollections(home({ featuredCollections: [colSummary('a'), colSummary('a')], seasonalCollections: [colSummary('a')] }));
    expect(dedupeHomeCollections(dirty.home).removed).toBe(0);
    expect(dedupeMessage(dirty)).toContain('removed 2 duplicate collection entries');
  });

  it('a section emptied by deduplication is omitted from the page (and its ItemList)', () => {
    const h = home({ featuredCollections: [colSummary('g')], seasonalCollections: [colSummary('g')], giftCollection: colSummary('g') });
    const out = html(h);
    expect(out).not.toContain('id="featured-collections"');
    expect(out).not.toContain('id="seasonal-collections"');
    expect(out).toContain('Gift ideas');
    const m = resolvePageMetadata({ type: 'home', model: dedupeHomeCollections(h).home }, 'https://example.test');
    expect((m.jsonLd as { '@graph': unknown[] })['@graph']).toHaveLength(1);
  });

  it('every collection link inside the section cards appears exactly once', () => {
    const h = home({
      featuredCollections: [colSummary('a'), colSummary('g'), colSummary('b')],
      seasonalCollections: [colSummary('b'), colSummary('c'), colSummary('g'), colSummary('a')],
      giftCollection: colSummary('g'),
    });
    // Section cards = anchors inside <li> of the three collection sections (hero CTA, nav and footer are outside them).
    const sections = [...html(h).matchAll(/<section[^>]*data-link-group="(?:featured|seasonal|gift)[^"]*"[\s\S]*?<\/section>/g)].map((m) => m[0]);
    expect(sections.length).toBe(3);
    const links = sections.flatMap((sec) => [...sec.matchAll(/href="(\/collections\/[^"]+)"/g)].map((m) => m[1]));
    expect(links.length).toBeGreaterThan(0);
    expect(new Set(links).size).toBe(links.length);
    expect(links.sort()).toEqual(['/collections/a/', '/collections/b/', '/collections/c/', '/collections/g/']);
  });
});
