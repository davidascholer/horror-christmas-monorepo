// @vitest-environment node
/**
 * Homepage build logic (Task 7.1, Part B): validation warnings, metadata,
 * structured data and rendering through renderSite. Template tests are in
 * pages/home.test.tsx; the on-disk result is in static-output.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { homeWarnings } from './home-refs';
import { resolvePageMetadata } from './page-head';
import { renderSite } from './render-site';
import { SITE, TEST_ASSETS, character, colSummary, collection, emptyHome, movie, movieSummary, charSummary, validData } from './test-fixtures';
import type { HomeResponse } from '../types/api-contracts';
import { HOME_DESCRIPTION } from '../pages/home-content';

const built = { collections: [collection(), collection({ id: 'c2', slug: 'gift-guide' })], movies: [movie()], characters: [character()] };

describe('homeWarnings', () => {
  it('has nothing to say when /home only references built pages', () => {
    const home: HomeResponse = {
      ...emptyHome(),
      featuredCollections: [colSummary('cozy-slashers')], seasonalCollections: [],
      giftCollection: colSummary('gift-guide'), featuredMovie: movieSummary('black-christmas'), featuredCharacter: charSummary('billy'),
    };
    expect(homeWarnings(home, built)).toEqual([]);
  });

  it('warns (does not throw) when collections are published but none is featured', () => {
    const w = homeWarnings(emptyHome(), built);
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ entityType: 'home', slug: '/' });
    expect(w[0].message).toMatch(/^home "\/": NO FEATURED COLLECTIONS: 2 collections are published/);
    // No collections published at all: nothing to feature, no warning of this kind.
    expect(homeWarnings(emptyHome(), { ...built, collections: [] })).toEqual([]);
  });

  it('names every unbuilt reference once, with where it was listed', () => {
    const home: HomeResponse = {
      ...emptyHome(),
      featuredCollections: [colSummary('cozy-slashers'), colSummary('ghost')],
      seasonalCollections: [colSummary('ghost')], // same slug again: reported once
      giftCollection: colSummary('ghost-gift'),
      featuredMovie: movieSummary('no-movie'),
      featuredCharacter: charSummary('no-char'),
    };
    const messages = homeWarnings(home, built).map((w) => w.message);
    // The repeated seasonal 'ghost' is removed first (owner rule: shown once), with ONE informational line.
    expect(messages).toEqual([
      expect.stringContaining('removed 1 duplicate collection entries (0 from featured, 1 from seasonal)'),
      expect.stringContaining('references collection "ghost" (featured collections)'),
      expect.stringContaining('references collection "ghost-gift" (gift collection)'),
      expect.stringContaining('references character "no-char" (featured character)'),
      expect.stringContaining('references movie "no-movie" (featured movie)'),
    ]);
    for (const m of messages.slice(1)) expect(m).toContain('plain text');
  });
});

describe('homepage metadata', () => {
  const home: HomeResponse = { ...emptyHome(), featuredCollections: [colSummary('b', 'B'), colSummary('a', 'A'), colSummary('ghost', 'Ghost')] };

  it('resolves title, description, canonical, Open Graph and a summary card with the fallback image', () => {
    const m = resolvePageMetadata({ type: 'home', model: home }, SITE);
    expect(m.title).toBe('Horror Christmas | Everything Christmas Horror. One Home.');
    expect(m.description?.text).toBe(HOME_DESCRIPTION);
    expect(m.canonicalUrl).toBe(`${SITE}/`);
    const tag = (key: string) => m.socialTags.find((t) => t.key === key)?.content;
    expect(tag('og:type')).toBe('website');
    expect(tag('og:url')).toBe(`${SITE}/`);
    expect(tag('og:image')).toBe(`${SITE}/images/image-unavailable.svg`);
    expect(tag('twitter:card')).toBe('summary');
    expect(m.warnings.map((w) => w.message)).toEqual([expect.stringMatching(/^home "\/": no usable image; using fallback image/)]);
  });

  it('keeps a SITE_URL path prefix in the canonical URL and the list URLs', () => {
    const m = resolvePageMetadata({ type: 'home', model: home }, 'https://example.test/base/');
    expect(m.canonicalUrl).toBe('https://example.test/base/');
    expect(JSON.stringify(m.jsonLd)).toContain('https://example.test/base/collections/a/');
  });

  it('JSON-LD: WebSite plus an ItemList in API order with positions from 1; unbuilt collections are left out; no SearchAction', () => {
    const m = resolvePageMetadata({ type: 'home', model: home }, SITE, { knownCollectionSlugs: new Set(['a', 'b']) });
    const [site, list] = (m.jsonLd as { '@graph': Array<Record<string, unknown>> })['@graph'];
    expect(site).toMatchObject({ '@type': 'WebSite', name: 'Horror Christmas', url: `${SITE}/` });
    expect(list.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'B', url: `${SITE}/collections/b/` },
      { '@type': 'ListItem', position: 2, name: 'A', url: `${SITE}/collections/a/` },
    ]);
    expect(list.numberOfItems).toBe(2);
    expect(JSON.stringify(m.jsonLd)).not.toMatch(/SearchAction|potentialAction/);
  });

  it('JSON-LD has no ItemList when nothing is featured', () => {
    const m = resolvePageMetadata({ type: 'home', model: emptyHome() }, SITE);
    expect((m.jsonLd as { '@graph': unknown[] })['@graph']).toHaveLength(1);
  });
});

describe('renderSite with a homepage', () => {
  const data = (home?: HomeResponse) => ({ ...validData(), home });
  const home: HomeResponse = { ...emptyHome(), featuredCollections: [colSummary('gift-guide', 'Gift Guide')] };

  it('renders the homepage first, to index.html, then the entity pages', () => {
    const pages = renderSite(data(home), { siteUrl: SITE, assets: TEST_ASSETS });
    expect(pages.map((p) => p.type)).toEqual(['home', 'collection', 'collection', 'movie', 'character', 'product']);
    expect(pages[0]).toMatchObject({ path: '/', outputPath: 'index.html', slug: '' });
    expect(pages[0].html).toContain('<link rel="canonical" href="https://example.test/"/>');
  });

  it('renders no homepage without /home data, and none when nothing else is published', () => {
    expect(renderSite(data(undefined), { siteUrl: SITE, assets: TEST_ASSETS }).some((p) => p.type === 'home')).toBe(false);
    const none = renderSite({ ...validData(), collections: [], movies: [], characters: [], products: [], home }, { siteUrl: SITE, assets: TEST_ASSETS });
    expect(none).toEqual([]);
  });

  it('is deterministic: the same data renders byte-identical homepages', () => {
    const a = renderSite(data(home), { siteUrl: SITE, assets: TEST_ASSETS })[0].html;
    const b = renderSite(data(structuredClone(home)), { siteUrl: SITE, assets: TEST_ASSETS })[0].html;
    expect(b).toBe(a);
  });

  it('adds the home warnings to the build warnings', () => {
    const warnings: Array<{ message: string }> = [];
    renderSite(data({ ...emptyHome(), featuredCollections: [colSummary('ghost')] }), { siteUrl: SITE, assets: TEST_ASSETS, warnings: warnings as never });
    expect(warnings.map((w) => w.message)).toEqual(
      expect.arrayContaining([expect.stringContaining('references collection "ghost" (featured collections)')]),
    );
  });
});
