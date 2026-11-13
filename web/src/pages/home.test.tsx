/**
 * Homepage template (Task 7.1, Part B): rendered on its own from a HomeResponse.
 * The end-to-end behavior (build, files, sitemap, crawl) is in build/static-output.test.ts.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';
import { HOME_LINK_GROUP_ORDER, LINK_GROUP_ORDER } from './link-priority';
import { DEFAULT_RENDER_CONTEXT, RenderContext, type RenderContextValue } from './render-context';
import { HOME_DESCRIPTION, HOME_TITLE } from './home-content';
import { charSummary, colSummary, emptyHome, movieSummary } from '../build/test-fixtures';
import type { HomeResponse } from '../types/api-contracts';

const full = (): HomeResponse => ({
  featuredCollections: [colSummary('zeta', 'Zeta'), colSummary('alpha', 'Alpha')],
  seasonalCollections: [colSummary('advent', 'Advent')],
  giftCollection: { ...colSummary('gifts', 'Gifts'), type: 'GIFT' },
  featuredCharacter: charSummary('billy', 'Billy'),
  featuredMovie: movieSummary('gremlins', 'Gremlins'),
});

const render = (home: HomeResponse, ctx: Partial<RenderContextValue> = {}) =>
  renderToStaticMarkup(
    <RenderContext.Provider value={{ ...DEFAULT_RENDER_CONTEXT, ...ctx }}>
      <HomePage home={home} />
    </RenderContext.Provider>,
  );
const tags = (html: string, tag: string) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => m[1].replace(/<[^>]+>/g, ''));
const hrefs = (html: string) => [...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]);

describe('HomePage', () => {
  it('renders all sections with one h1, an h2 per section and the cards in API order', () => {
    const html = render(full());
    expect(tags(html, 'h1')).toEqual(['Everything Christmas Horror. One Home.']);
    expect(tags(html, 'h2')).toEqual(['Featured collections', 'Seasonal collections', 'Gift ideas', 'Featured character', 'Featured movie']);
    expect(tags(html, 'h3')).toEqual(['Zeta', 'Alpha', 'Advent', 'Gifts', 'Billy', 'Gremlins']); // Zeta before Alpha: API order, not sorted
    expect(hrefs(html)).toEqual([
      '#featured-collections', '/collections/zeta/', '/collections/alpha/', '/collections/advent/', '/collections/gifts/', '/characters/billy/', '/movies/gremlins/',
    ]);
  });

  it('omits every optional section cleanly when absent: no heading, no placeholder text', () => {
    const html = render(emptyHome());
    expect(tags(html, 'h2')).toEqual([]);
    expect(html).not.toMatch(/\b(null|undefined)\b|<li\b/);
    expect(hrefs(html)).toEqual([]); // no call to action without a section to jump to
    const variants: Array<[string, HomeResponse]> = [
      ['seasonal', { ...full(), seasonalCollections: [] }],
      ['gift', { ...full(), giftCollection: null }],
      ['character', { ...full(), featuredCharacter: null }],
      ['movie', { ...full(), featuredMovie: null }],
    ];
    for (const [name, home] of variants) {
      const h = render(home);
      expect(tags(h, 'h2'), name).toHaveLength(4);
      expect(h, name).not.toMatch(/\b(null|undefined)\b/);
    }
  });

  it('uses the homepage link-group definition, in order, on the sections', () => {
    expect([...HOME_LINK_GROUP_ORDER]).toEqual(['featured-collections', 'seasonal-collections', 'gift-collection', 'characters', 'movies']);
    // Shared mechanism: the page definitions stay separate and the entity definition is unchanged.
    expect([...LINK_GROUP_ORDER]).toEqual(['related-collections', 'collection-items', 'characters', 'movies', 'products']);
    const groups = [...render(full()).matchAll(/data-link-group="([^"]+)"/g)].map((m) => m[1]);
    expect(groups).toEqual([...HOME_LINK_GROUP_ORDER]);
  });

  it('shows only summary fields: type label, summary, media type and year; an empty summary renders no paragraph', () => {
    const home = { ...emptyHome(), featuredMovie: { ...movieSummary('m', 'M'), synopsis: '   ', releaseYear: null, mediaType: 'TV_SPECIAL' as const } };
    const html = render(home);
    expect(html).toContain('TV special');
    expect(html).not.toContain('TV special,');
    expect(html).not.toMatch(/line-clamp/);
  });

  it('escapes hostile text', () => {
    const evil = '</h3><script>alert(1)</script><img src=x onerror=alert(1)>';
    const html = render({ ...emptyHome(), featuredCollections: [{ ...colSummary('c', evil), summary: evil }] });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders a reference to something not built as plain text, never a link', () => {
    const html = render(full(), {
      knownCollectionSlugs: new Set(['zeta']),
      knownMovieSlugs: new Set<string>(),
      knownCharacterSlugs: new Set(['billy']),
    });
    expect(hrefs(html)).toEqual(['#featured-collections', '/collections/zeta/', '/characters/billy/']);
    expect(tags(html, 'h3')).toEqual(['Zeta', 'Alpha', 'Advent', 'Gifts', 'Billy', 'Gremlins']); // titles stay
    expect(html).not.toContain('/movies/');
  });

  it('loads every image lazily; the hero has none; no image is high priority', () => {
    const html = render({ ...full(), featuredCollections: [{ ...colSummary('c', 'C'), heroImageUrl: 'https://img.test/c.jpg' }] });
    const imgs = html.match(/<img\b[^>]*>/g)!;
    expect(imgs.length).toBe(5); // one per card: 1 featured + seasonal + gift + character + movie
    expect(imgs.every((i) => i.includes('loading="lazy"') && /alt="[^"]*"/.test(i) && !/fetchPriority/i.test(i))).toBe(true);
    const hero = html.slice(0, html.indexOf('id="featured-collections"'));
    expect(hero).not.toContain('<img');
  });

  it('every animation class is behind motion-safe (disabled under prefers-reduced-motion)', () => {
    const classes = [...render(full()).matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/));
    const animated = classes.filter((c) => /(^|:)animate-/.test(c));
    expect(animated.length).toBeGreaterThan(0);
    for (const c of animated) expect(c, c).toMatch(/^motion-safe:/);
    // Transitions and hover movement too.
    for (const c of classes.filter((c) => /(^|:)(transition|duration-|-translate-y)/.test(c))) expect(c, c).toMatch(/motion-safe:/);
  });

  it('touch targets: the call to action is at least 44px tall', () => {
    expect(render(full())).toMatch(/<a href="#featured-collections" class="[^"]*\bmin-h-12\b/);
  });
});

describe('homepage copy', () => {
  it('title and description are on brand and the description fits 160 characters', () => {
    expect(HOME_TITLE).toContain('Everything Christmas Horror. One Home.');
    expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(HOME_DESCRIPTION.length).toBeGreaterThan(50);
  });
});
