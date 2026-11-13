// @vitest-environment node
/**
 * Page metadata tests (Task 6.3): title, description fallback and excerpt,
 * canonical URL, Open Graph, JSON-LD, escaping, warnings, and full-page output.
 * Requirements 9.4, 9.5, 9.7, 15.3, 18.3.
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createExcerpt, pageTitle, resolveDescription, EXCERPT_MAX_LENGTH } from './seo';
import { canonicalUrl, normalizeSiteUrl, readSiteUrl, resolveImageUrl, SiteUrlError } from './site-url';
import { buildSocialTags } from './open-graph';
import { buildJsonLd, isoDuration, serializeJsonLd } from './json-ld';
import { buildPageHead, resolvePageMetadata, type PageModel } from './page-head';
import { renderSite } from './render-site';
import { generateStatic, formatSummary } from './generate-static';
import type { BuildWarning } from './fetch-build-data';
import type {
  CharacterDetail, CollectionDetail, MovieDetail, ProductDetail,
} from '../types/api-contracts';

import { TEST_ASSETS, homeFeaturing } from './test-fixtures';
const SITE = 'https://example.test';
const TS = '2026-01-01T00:00:00.000Z';

function collection(over: Partial<CollectionDetail> = {}): CollectionDetail {
  return {
    id: 'c1', slug: 'cozy-slashers', title: 'Cozy Slashers', type: 'THEME',
    introduction: 'Intro text.', curatorNotes: '', summary: null,
    heroImageUrl: 'https://img.test/hero.jpg', heroImageAlt: 'Hero',
    seoTitle: null, seoDescription: null, featured: false, seasonal: false,
    publishedAt: TS, createdAt: TS, updatedAt: TS,
    movies: [
      { movie: { id: 'm1', slug: 'black-christmas', title: 'Black Christmas', releaseYear: 1974, mediaType: 'FILM', posterUrl: null, synopsis: null }, sortOrder: 1, curatorNote: null },
      { movie: { id: 'm2', slug: 'silent-night', title: 'Silent Night', releaseYear: 1984, mediaType: 'FILM', posterUrl: null, synopsis: null }, sortOrder: 2, curatorNote: null },
    ],
    characters: [{ character: { id: 'ch1', slug: 'billy', name: 'Billy', summary: null, imageUrl: null }, sortOrder: 1, curatorNote: null }],
    products: [{ product: { id: 'p1', slug: 'mug', name: 'Mug', description: null, imageUrl: null, price: null, currency: null, category: null }, sortOrder: 1, curatorNote: null }],
    franchises: [], tags: [], relatedCollections: [],
    ...over,
  };
}
function movie(over: Partial<MovieDetail> = {}): MovieDetail {
  return {
    id: 'm1', slug: 'black-christmas', title: 'Black Christmas', originalTitle: null, mediaType: 'FILM',
    releaseYear: 1974, releaseDate: '1974-10-16', runtime: 98, synopsis: 'Sorority house, phone calls.',
    posterUrl: 'https://img.test/p.jpg', heroImageUrl: null, trailerUrl: 'https://video.test/t',
    seoTitle: null, seoDescription: null, featured: false, franchise: null,
    publishedAt: TS, createdAt: TS, updatedAt: TS,
    characters: [], collections: [], tags: [], relatedProducts: [],
    ...over,
  };
}
function character(over: Partial<CharacterDetail> = {}): CharacterDetail {
  return {
    id: 'ch1', slug: 'billy', name: 'Billy', summary: 'Menacing.', biography: 'Origin story.',
    imageUrl: 'https://img.test/billy.jpg', seoTitle: null, seoDescription: null, featured: false, franchise: null,
    publishedAt: TS, createdAt: TS, updatedAt: TS,
    movies: [], products: [], collections: [], tags: [],
    ...over,
  };
}
function product(over: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: 'p1', slug: 'mug', name: 'Slay Bells Mug', description: 'A mug.', category: 'Kitchen',
    imageUrl: 'https://img.test/mug.jpg', imageAlt: 'A red mug', price: '24.90', currency: 'USD',
    seoTitle: null, seoDescription: null, featured: false, franchise: null,
    affiliateLinks: [
      { id: 'a0', provider: 'Bad', url: 'javascript:alert(1)', productId: 'p1' },
      { id: 'a1', provider: 'Amazon', url: 'https://amazon.test/mug', productId: 'p1' },
      { id: 'a2', provider: 'Other', url: 'https://other.test/mug', productId: 'p1' },
    ],
    publishedAt: TS, createdAt: TS, updatedAt: TS,
    characters: [], collections: [], tags: [],
    ...over,
  };
}

const pc = (over: Partial<CollectionDetail> = {}): PageModel => ({ type: 'collection', model: collection(over) });
const pm = (over: Partial<MovieDetail> = {}): PageModel => ({ type: 'movie', model: movie(over) });
const pch = (over: Partial<CharacterDetail> = {}): PageModel => ({ type: 'character', model: character(over) });
const pp = (over: Partial<ProductDetail> = {}): PageModel => ({ type: 'product', model: product(over) });

const headHtml = (page: PageModel, warnings?: BuildWarning[]) =>
  renderToStaticMarkup(<head>{buildPageHead(page, { siteUrl: SITE, warnings })}</head>);

function ldOf(html: string): Record<string, unknown> {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('no json-ld');
  return JSON.parse(m[1]);
}

describe('pageTitle', () => {
  it('appends the site suffix to the entity name', () => {
    expect(pageTitle('Black Christmas', null)).toBe('Black Christmas | Horror Christmas');
  });
  it('uses a supplied SEO title as given, without the suffix', () => {
    expect(pageTitle('Black Christmas', '  Best Holiday Slasher  ')).toBe('Best Holiday Slasher');
  });
  it('treats blank SEO titles as missing', () => {
    expect(pageTitle('Billy', '')).toBe('Billy | Horror Christmas');
    expect(pageTitle('Billy', '   \n')).toBe('Billy | Horror Christmas');
  });
});

describe('createExcerpt', () => {
  it('returns null for missing or blank text', () => {
    expect(createExcerpt(null)).toBeNull();
    expect(createExcerpt('  \n\t ')).toBeNull();
  });
  it('collapses whitespace and keeps short text whole, without ellipsis', () => {
    expect(createExcerpt('  one \n\n two\t three ')).toBe('one two three');
  });
  it('keeps text of exactly the limit', () => {
    const t = 'a'.repeat(EXCERPT_MAX_LENGTH);
    expect(createExcerpt(t)).toBe(t);
  });
  it('truncates at a word boundary within the length bound and adds an ellipsis', () => {
    const words = Array.from({ length: 80 }, (_, i) => `word${i}`);
    const text = words.join(' ');
    const out = createExcerpt(text)!;
    expect(out.length).toBeLessThanOrEqual(EXCERPT_MAX_LENGTH);
    expect(out.endsWith('\u2026')).toBe(true);
    const body = out.slice(0, -1);
    expect(text.startsWith(body)).toBe(true);
    expect(text[body.length]).toBe(' '); // cut at a boundary, not inside a word
    expect(createExcerpt(text)).toBe(out); // deterministic
  });
  it('drops trailing punctuation before the ellipsis', () => {
    const text = 'x'.repeat(150) + ', ' + 'y'.repeat(30);
    expect(createExcerpt(text)).toBe('x'.repeat(150) + '\u2026');
  });
  it('never leaves half an HTML entity when a single word must be cut', () => {
    const text = 'a'.repeat(157) + '&amp;' + 'b'.repeat(40);
    const out = createExcerpt(text)!;
    expect(out.length).toBeLessThanOrEqual(EXCERPT_MAX_LENGTH);
    expect(out).toBe('a'.repeat(157) + '\u2026');
    expect(out).not.toMatch(/&[#A-Za-z0-9]*\u2026$/);
  });
  it('keeps whole entities that sit before the cut intact', () => {
    const text = 'Tom &amp; Jerry '.repeat(20);
    const out = createExcerpt(text)!;
    expect(out).not.toMatch(/&(?!amp;)/);
  });
});

describe('resolveDescription fallback order', () => {
  it('prefers seoDescription, then summary, then the excerpt', () => {
    expect(resolveDescription({ seoDescription: 'seo', summary: 'sum', longText: 'long' })).toEqual({ text: 'seo', source: 'seoDescription' });
    expect(resolveDescription({ seoDescription: null, summary: 'sum', longText: 'long' })).toEqual({ text: 'sum', source: 'summary' });
    expect(resolveDescription({ seoDescription: null, summary: null, longText: 'long' })).toEqual({ text: 'long', source: 'excerpt' });
  });
  it('returns null when nothing is usable', () => {
    expect(resolveDescription({ seoDescription: null, summary: null, longText: null })).toBeNull();
  });
  it('treats blank and whitespace-only values as missing at every step', () => {
    expect(resolveDescription({ seoDescription: '', summary: '   ', longText: 'long' })?.source).toBe('excerpt');
    expect(resolveDescription({ seoDescription: ' \n ', summary: 'sum', longText: ' ' })?.source).toBe('summary');
    expect(resolveDescription({ seoDescription: ' ', summary: '\t', longText: '\n' })).toBeNull();
  });
  it('uses a supplied description whole even when long', () => {
    const long = 'word '.repeat(100).trim();
    expect(resolveDescription({ seoDescription: long })?.text).toBe(long);
  });
});

describe('site URL and canonical URL', () => {
  it('normalizes trailing slashes, case of host, and keeps a path prefix', () => {
    expect(normalizeSiteUrl('https://Example.test/')).toBe('https://example.test');
    expect(normalizeSiteUrl('https://example.test///')).toBe('https://example.test');
    expect(normalizeSiteUrl('  http://example.test/base/ ')).toBe('http://example.test/base');
  });
  it.each([
    [undefined, /SITE_URL is not set/],
    ['', /SITE_URL is not set/],
    ['   ', /SITE_URL is not set/],
    ['example.test', /invalid/],
    ['/relative', /invalid/],
    ['ftp://example.test', /http or https/],
    ['javascript:alert(1)', /http or https/],
    ['https://user:pw@example.test', /credentials/],
    ['https://example.test/?a=1', /query string or fragment/],
    ['https://example.test/#x', /query string or fragment/],
  ])('rejects %j', (value, message) => {
    expect(() => normalizeSiteUrl(value as string | undefined)).toThrow(SiteUrlError);
    expect(() => normalizeSiteUrl(value as string | undefined)).toThrow(message);
  });
  it('reads SITE_URL from the environment', () => {
    expect(readSiteUrl({ SITE_URL: 'https://example.test/' })).toBe('https://example.test');
    expect(() => readSiteUrl({})).toThrow(/SITE_URL/);
  });
  it('builds absolute canonical URLs with a trailing slash from route paths', () => {
    expect(canonicalUrl('https://example.test/', '/movies/black-christmas/')).toBe('https://example.test/movies/black-christmas/');
    expect(canonicalUrl('https://example.test/base', '/products/mug/')).toBe('https://example.test/base/products/mug/');
  });
  it('resolves images: absolute kept, root-relative resolved, others rejected', () => {
    expect(resolveImageUrl('https://img.test/a.jpg', SITE)).toBe('https://img.test/a.jpg');
    expect(resolveImageUrl('/img/a.jpg', SITE)).toBe('https://example.test/img/a.jpg');
    for (const bad of [null, '', '  ', '//cdn.test/a.jpg', 'javascript:alert(1)', 'data:image/png;base64,AA', 'img/a.jpg', 'https://', 'https://a b.test/x.jpg']) {
      expect(resolveImageUrl(bad, SITE)).toBeNull();
    }
  });
});

describe('Open Graph tags', () => {
  const tagMap = (page: PageModel) => {
    const meta = resolvePageMetadata(page, SITE);
    return { meta, map: Object.fromEntries(meta.socialTags.map((t) => [t.key, t.content])) };
  };

  it.each([
    ['collection', pc(), 'website', '/collections/cozy-slashers/'],
    ['movie', pm(), 'website', '/movies/black-christmas/'],
    ['character', pch(), 'article', '/characters/billy/'],
    ['product', pp(), 'product', '/products/mug/'],
  ] as const)('%s: full tag set with og:url equal to the canonical URL', (_n, page, ogType, route) => {
    const { meta, map } = tagMap(page);
    expect(map['og:site_name']).toBe('Horror Christmas');
    expect(map['og:type']).toBe(ogType);
    expect(map['og:title']).toBe(meta.title);
    expect(map['og:description']).toBe(meta.description!.text);
    expect(map['og:url']).toBe(`${SITE}${route}`);
    expect(map['og:url']).toBe(meta.canonicalUrl);
    expect(map['og:image']).toMatch(/^https:\/\/img\.test\//);
    expect(map['twitter:card']).toBe('summary_large_image');
  });

  it('uses the site fallback image as og:image (and the small card) when there is no image', () => {
    for (const page of [pc({ heroImageUrl: null }), pm({ posterUrl: null }), pch({ imageUrl: null }), pp({ imageUrl: null })]) {
      const { meta, map } = tagMap(page);
      expect(map['og:image']).toBe(`${SITE}/images/image-unavailable.svg`);
      expect(meta.usedFallbackImage).toBe(true);
      expect(meta.image).toBeNull(); // the entity has no image of its own (JSON-LD omits it)
      expect(JSON.stringify(meta.jsonLd)).not.toContain('image-unavailable.svg');
      expect(map['twitter:card']).toBe('summary');
      expect(meta.warnings.some((w) => /no usable image; using fallback image \/images\/image-unavailable\.svg/.test(w.message))).toBe(true);
    }
  });

  it('keeps summary_large_image for a real image and does not warn', () => {
    const { meta, map } = tagMap(pm());
    expect(meta.usedFallbackImage).toBe(false);
    expect(map['twitter:card']).toBe('summary_large_image');
    expect(meta.warnings.some((w) => /image/.test(w.message))).toBe(false);
  });

  it('applies the fallback under a SITE_URL path prefix', () => {
    const meta = resolvePageMetadata(pm({ posterUrl: null }), 'https://example.test/base/');
    expect(meta.ogImage).toBe('https://example.test/base/images/image-unavailable.svg');
  });

  it('treats an invalid image URL as no image and falls back', () => {
    for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AA', '//cdn.test/a.jpg', '/\\evil.test/a.jpg', 'img/a.jpg']) {
      const { meta, map } = tagMap(pc({ heroImageUrl: bad }));
      expect(map['og:image']).toBe(`${SITE}/images/image-unavailable.svg`);
      expect(meta.usedFallbackImage).toBe(true);
    }
  });

  it('resolves a root-relative image against SITE_URL', () => {
    expect(tagMap(pch({ imageUrl: '/img/billy.jpg' })).map['og:image']).toBe('https://example.test/img/billy.jpg');
  });

  it('movie falls back from poster to hero image', () => {
    expect(tagMap(pm({ posterUrl: null, heroImageUrl: 'https://img.test/hero.jpg' })).map['og:image']).toBe('https://img.test/hero.jpg');
  });

  it('og:description equals the resolved description, and is omitted when none exists', () => {
    const { meta, map } = tagMap(pm({ seoDescription: 'Custom.' }));
    expect(map['og:description']).toBe('Custom.');
    expect(meta.description?.text).toBe('Custom.');
    expect(buildSocialTags({ type: 'movie', title: 't', description: null, url: SITE + '/', image: null }).some((t) => t.key === 'og:description')).toBe(false);
  });
});

describe('JSON-LD', () => {
  const ctx = { siteUrl: SITE, url: `${SITE}/x/`, description: 'Desc.', image: 'https://img.test/i.jpg' };

  it('collection: CollectionPage with ItemList in order, positions from 1, absolute URLs', () => {
    const ld = buildJsonLd(pc(), ctx) as any;
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('CollectionPage');
    expect(ld.mainEntity['@type']).toBe('ItemList');
    expect(ld.mainEntity.numberOfItems).toBe(4);
    expect(ld.mainEntity.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Black Christmas', url: `${SITE}/movies/black-christmas/` },
      { '@type': 'ListItem', position: 2, name: 'Silent Night', url: `${SITE}/movies/silent-night/` },
      { '@type': 'ListItem', position: 3, name: 'Billy', url: `${SITE}/characters/billy/` },
      { '@type': 'ListItem', position: 4, name: 'Mug', url: `${SITE}/products/mug/` },
    ]);
  });

  it('collection: omits the ItemList when there are no items', () => {
    const ld = buildJsonLd(pc({ movies: [], characters: [], products: [] }), ctx);
    expect(ld).not.toHaveProperty('mainEntity');
  });

  it('movie: Movie with date, ISO duration, and no trailer', () => {
    const ld = buildJsonLd(pm(), ctx) as any;
    expect(ld['@type']).toBe('Movie');
    expect(ld).toMatchObject({ name: 'Black Christmas', datePublished: '1974-10-16', duration: 'PT1H38M', image: ctx.image, description: 'Desc.' });
    expect(ld).not.toHaveProperty('trailer');
  });

  it('movie: a full ISO timestamp release date becomes a date-only value', () => {
    expect((buildJsonLd(pm({ releaseDate: '1974-10-16T00:00:00.000Z' }), ctx) as any).datePublished).toBe('1974-10-16');
  });

  it('movie: falls back to the release year, and omits date and duration when unknown', () => {
    expect((buildJsonLd(pm({ releaseDate: null }), ctx) as any).datePublished).toBe('1974');
    const ld = buildJsonLd(pm({ releaseDate: null, releaseYear: null, runtime: null }), ctx);
    expect(ld).not.toHaveProperty('datePublished');
    expect(ld).not.toHaveProperty('duration');
  });

  it('isoDuration formats minutes', () => {
    expect(isoDuration(98)).toBe('PT1H38M');
    expect(isoDuration(120)).toBe('PT2H');
    expect(isoDuration(45)).toBe('PT45M');
    expect([0, -5, 1.5, null, undefined, NaN].map((v) => isoDuration(v as number))).toEqual([undefined, undefined, undefined, undefined, undefined, undefined]);
  });

  it('character: generic Thing (no Person), with name, description, image, url', () => {
    const ld = buildJsonLd(pch(), ctx);
    expect(ld).toEqual({
      '@context': 'https://schema.org', '@type': 'Thing', name: 'Billy',
      description: 'Desc.', url: ctx.url, image: ctx.image,
    });
  });

  it('product: Offer with exact price string, currency and first valid affiliate link', () => {
    const ld = buildJsonLd(pp(), ctx) as any;
    expect(ld['@type']).toBe('Product');
    expect(ld.category).toBe('Kitchen');
    expect(ld.offers).toEqual({ '@type': 'Offer', price: '24.90', priceCurrency: 'USD', url: 'https://amazon.test/mug' });
    expect(typeof ld.offers.price).toBe('string');
    expect(serializeJsonLd(ld)).toContain('"price":"24.90"');
    expect(ld.offers).not.toHaveProperty('availability');
  });

  it('product: offers omitted unless both price and currency are known and well-formed', () => {
    for (const over of [{ price: null }, { currency: null }, { price: '' }, { price: 'free' }, { currency: 'usd' }, { price: '  ', currency: 'USD' }]) {
      expect(buildJsonLd(pp(over), ctx)).not.toHaveProperty('offers');
    }
  });

  it('product: Offer without url when no usable affiliate link exists', () => {
    const ld = buildJsonLd(pp({ affiliateLinks: [] }), ctx) as any;
    expect(ld.offers).toEqual({ '@type': 'Offer', price: '24.90', priceCurrency: 'USD' });
  });

  it('never includes ratings, reviews, null, undefined, or empty strings', () => {
    const pages = [
      pc({ introduction: '', movies: [], characters: [], products: [] }),
      pm({ synopsis: null, releaseDate: null, releaseYear: null, runtime: null }),
      pch({ summary: null, biography: null, imageUrl: null }),
      pp({ description: null, category: ' ', price: null, imageUrl: null, affiliateLinks: [] }),
    ];
    for (const page of pages) {
      const text = JSON.stringify(resolvePageMetadata(page, SITE).jsonLd);
      expect(text).not.toMatch(/aggregateRating|review|null|undefined|""/);
      expect(text).not.toMatch(/:\s*""/);
    }
  });

  it('serializes hostile strings so they cannot break out of the script, and round-trips', () => {
    const hostile = '</script><script>alert(1)</script><!-- & \u2028 \u2029 "q"';
    const ld = buildJsonLd(pm({ title: hostile }), ctx);
    const text = serializeJsonLd(ld);
    expect(text).not.toMatch(/[<>&\u2028\u2029]/);
    expect(text.toLowerCase()).not.toContain('</script');
    expect(JSON.parse(text)).toEqual(ld);
    expect((JSON.parse(text) as any).name).toBe(hostile);
  });
});

describe('page head output', () => {
  it.each([
    ['collection', pc(), 'CollectionPage'],
    ['movie', pm(), 'Movie'],
    ['character', pch(), 'Thing'],
    ['product', pp(), 'Product'],
  ] as const)('%s: title, description, canonical, OG, twitter and parseable JSON-LD', (_n, page, ldType) => {
    const html = headHtml(page);
    expect(html).toMatch(/<title>[^<]+ \| Horror Christmas<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]+"\/>/);
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/example\.test\/[a-z]+\/[a-z-]+\/"\/>/);
    for (const key of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name']) {
      expect(html).toContain(`<meta property="${key}"`);
    }
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"/>');
    expect(ldOf(html)['@type']).toBe(ldType);
    expect(html).not.toMatch(/\b(null|undefined)\b/);
  });

  it('uses the SEO title as given', () => {
    expect(headHtml(pm({ seoTitle: 'Custom Title' }))).toContain('<title>Custom Title</title>');
  });

  it('omits the description tags entirely when no text exists, and warns', () => {
    const warnings: BuildWarning[] = [];
    const html = headHtml(pm({ synopsis: '   ', seoDescription: ' ' }), warnings);
    expect(html).not.toContain('name="description"');
    expect(html).not.toContain('og:description');
    expect(html).not.toMatch(/"description"/);
    expect(warnings.map((w) => w.message)).toContain(
      'movie "black-christmas": no meta description (no seoDescription, summary or long text); description tags omitted',
    );
    expect(warnings.every((w) => w.entityType === 'movie' && w.slug === 'black-christmas')).toBe(true);
  });

  it('uses the summary and the excerpt in the fallback order', () => {
    expect(headHtml(pch({ seoDescription: null, summary: 'Sum.', biography: 'Bio.' }))).toContain('content="Sum."');
    expect(headHtml(pch({ seoDescription: null, summary: null, biography: 'Bio.' }))).toContain('content="Bio."');
    expect(headHtml(pc({ summary: ' ', introduction: 'Intro.' }))).toContain('<meta name="description" content="Intro."/>');
  });

  it('escapes hostile text in attributes and the title', () => {
    const evil = `"><script>alert(1)</script> & 'x'`;
    const html = headHtml(pp({ name: evil, seoDescription: evil, imageUrl: 'https://img.test/a.jpg?x="y"&z=1' }));
    expect(html.toLowerCase().split('<script').length - 1).toBe(1); // only the JSON-LD block
    expect(html).toContain('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt; &amp; &#x27;x&#x27;');
    expect(html).toContain('content="https://img.test/a.jpg?x=&quot;y&quot;&amp;z=1"');
  });

  it('a hostile string inside JSON-LD cannot end the script element', () => {
    const html = headHtml(pp({ name: '</script><b>x</b>' }));
    expect(html.match(/<\/script>/gi)).toHaveLength(1);
    expect(ldOf(html).name).toBe('</script><b>x</b>');
  });

  it('collects a fallback-image warning naming type and slug', () => {
    const warnings: BuildWarning[] = [];
    headHtml(pp({ imageUrl: null }), warnings);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ entityType: 'product', slug: 'mug' });
    expect(warnings[0].message).toMatch(/^product "mug": no usable image/);
  });
});

describe('full page render and generator', () => {
  const data = {
    collections: [collection()], movies: [movie()], characters: [character()], products: [product()],
  };

  it('every page type has the complete head, charset, viewport and lang', () => {
    const pages = renderSite(data, { assets: TEST_ASSETS, siteUrl: SITE + '/' });
    expect(pages).toHaveLength(4);
    for (const p of pages) {
      expect(p.html).toContain('<html lang="en">');
      expect(p.html).toMatch(/<meta charset="utf-8"\/>/i);
      expect(p.html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1"/>');
      const head = p.html.slice(p.html.indexOf('<head>'), p.html.indexOf('</head>'));
      expect(head).toContain('<title>');
      expect(head).toContain(`<link rel="canonical" href="${SITE}${p.path}"/>`);
      expect(head).toContain(`<meta property="og:url" content="${SITE}${p.path}"/>`);
      expect(ldOf(head)['@context']).toBe('https://schema.org');
      expect(head).not.toMatch(/\b(null|undefined)\b/);
    }
  });

  it('fails with a clear message on a missing or invalid site URL', () => {
    expect(() => renderSite(data, { assets: TEST_ASSETS, siteUrl: '' })).toThrow(/SITE_URL is not set/);
    expect(() => renderSite(data, { assets: TEST_ASSETS, siteUrl: 'not a url' })).toThrow(/SITE_URL .* is invalid/);
  });

  it('appends metadata warnings to the generator summary without failing the build', async () => {
    // SEO fields are required for the pipeline (Task 6.5 validation), so the only metadata warning left is the image.
    const bare = movie({ synopsis: null, posterUrl: null, seoTitle: 'Black Christmas (1974)', seoDescription: 'A classic.' });
    const fetchStub = (async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const [, first, second] = url.pathname.split('/');
      if (first === 'home') return new Response(JSON.stringify(homeFeaturing([])), { status: 200 });
      if (first === 'build') {
        return new Response(JSON.stringify(second === 'movies' ? [{ slug: bare.slug, updatedAt: TS }] : []), { status: 200 });
      }
      return new Response(JSON.stringify(bare), { status: 200 });
    }) as typeof fetch;
    const { mkdtemp, rm } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const path = await import('node:path');
    const dir = await mkdtemp(path.join(tmpdir(), 'meta-'));
    try {
      const summary = await generateStatic({ assets: TEST_ASSETS, env: { API_BASE_URL: 'http://api.test', SITE_URL: SITE }, outDir: dir, fetch: fetchStub });
      expect(summary.counts.total).toBe(2); // the lone movie and the homepage
      expect(summary.warnings.map((w) => w.message)).toEqual([
        expect.stringMatching(/^NO PUBLISHED COLLECTIONS/), // this fixture builds a lone movie
        // The homepage (Task 7.1) has no brand image yet: the same fallback-image warning policy as an entity.
        expect.stringMatching(/^home "\/": no usable image; using fallback image \/images\/image-unavailable\.svg/),
        expect.stringMatching(/^movie "black-christmas": no usable image; using fallback image \/images\/image-unavailable\.svg/),
      ]);
      expect(formatSummary(summary)).toContain('warnings:    3');

      await expect(
        generateStatic({ assets: TEST_ASSETS, env: { API_BASE_URL: 'http://api.test' }, outDir: dir, fetch: fetchStub }),
      ).rejects.toThrow(/SITE_URL is not set/);
      await expect(
        generateStatic({ assets: TEST_ASSETS, env: { API_BASE_URL: 'http://api.test', SITE_URL: 'ftp://x.test' }, outDir: dir, fetch: fetchStub }),
      ).rejects.toThrow(/http or https/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
