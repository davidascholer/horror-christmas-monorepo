// @vitest-environment node
/**
 * Image delivery hooks and fallback (Task 6.5; Requirements 15.2, 18.2):
 * the shared PageImage component, the image source resolver, URL rules.
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { PageImage } from './shared';
import { RenderContext, DEFAULT_RENDER_CONTEXT } from './render-context';
import {
  FALLBACK_IMAGE_PATH, defaultImageSourceResolver, firstUsableImageUrl, resolveAlt, usableImageUrl,
  type ImageSourceResolver,
} from './image-sources';
import { resolveImageUrl } from '../build/site-url';
import { renderSite } from '../build/render-site';
import { SITE, TEST_ASSETS, character, collection, movie, product, validData } from '../build/test-fixtures';

const render = (node: ReactNode, imageResolver?: ImageSourceResolver) =>
  renderToStaticMarkup(
    <RenderContext.Provider value={{ ...DEFAULT_RENDER_CONTEXT, ...(imageResolver ? { imageResolver } : {}) }}>
      {node}
    </RenderContext.Provider>,
  );
/** React prints camelCase attribute names (fetchPriority, srcSet); HTML attribute names are case-insensitive. */
const lower = (html: string) => html.replace(/\s(fetchPriority|srcSet)=/g, (_m, a: string) => ` ${a.toLowerCase()}=`);
const imgTags = (html: string) => html.match(/<img\b[^>]*>/g) ?? [];

describe('usableImageUrl', () => {
  it('accepts absolute http(s) and root-relative URLs', () => {
    expect(usableImageUrl('https://img.test/a.jpg')).toBe('https://img.test/a.jpg');
    expect(usableImageUrl('  http://img.test/a.jpg ')).toBe('http://img.test/a.jpg');
    expect(usableImageUrl('/images/a.jpg')).toBe('/images/a.jpg');
  });

  it.each([
    null, undefined, '', '   ', 'javascript:alert(1)', 'data:image/png;base64,AAAA', 'vbscript:x', 'file:///etc/passwd',
    '//cdn.test/a.jpg', '/\\evil.test/a.jpg', 'img/a.jpg', './a.jpg', 'https://', 'https://a b.test/x.jpg', 'ftp://x.test/a.jpg',
  ])('rejects %j', (value) => {
    expect(usableImageUrl(value as string | null | undefined)).toBeNull();
  });

  it('agrees with the metadata URL rules (resolveImageUrl) so page and og:image cannot disagree', () => {
    const samples = ['https://img.test/a.jpg', '/a.jpg', '//x.test/a.jpg', '/\\x.test', 'javascript:1', 'data:x', '', ' ', 'a.jpg', 'https://', 'http://h/p q'];
    for (const s of samples) {
      expect(usableImageUrl(s) !== null).toBe(resolveImageUrl(s, SITE) !== null);
    }
  });

  it('firstUsableImageUrl returns the first usable candidate', () => {
    expect(firstUsableImageUrl([null, 'javascript:x', 'https://a.test/1.jpg', 'https://a.test/2.jpg'])).toBe('https://a.test/1.jpg');
    expect(firstUsableImageUrl([null, ''])).toBeNull();
  });

  it('resolveAlt uses the model alt, else the fallback; whitespace counts as missing', () => {
    expect(resolveAlt('  A cat ', 'Name')).toBe('A cat');
    expect(resolveAlt(null, ' Name ')).toBe('Name');
    expect(resolveAlt('   ', 'Name')).toBe('Name');
  });
});

describe('PageImage: plain <img> branch (default resolver)', () => {
  it('always has alt: the model alt when present', () => {
    expect(render(<PageImage src="https://i.test/a.jpg" alt="A snowy house" fallbackAlt="Title" />)).toContain('alt="A snowy house"');
  });

  it('uses the deterministic fallback alt (entity name) when the model has none', () => {
    for (const alt of [null, undefined, '', '  ']) {
      const html = render(<PageImage src="https://i.test/a.jpg" alt={alt} fallbackAlt="Black Christmas" />);
      expect(html).toContain('alt="Black Christmas"');
    }
  });

  it('never emits an <img> without an alt attribute, whatever the input', () => {
    const inputs: Array<[string | null, string | null]> = [
      ['https://i.test/a.jpg', null], [null, null], ['javascript:alert(1)', 'x'], ['/a.jpg', ''], ['data:x', null],
    ];
    for (const [src, alt] of inputs) {
      for (const priority of [true, false]) {
        const [tag] = imgTags(render(<PageImage src={src} alt={alt} fallbackAlt="Name" priority={priority} />));
        expect(tag).toMatch(/\salt="[^"]*"/);
      }
    }
  });

  it('non-primary image is lazy, async-decoded, with no fetchpriority', () => {
    const html = lower(render(<PageImage src="https://i.test/a.jpg" fallbackAlt="N" />));
    expect(html).toBe('<img src="https://i.test/a.jpg" alt="N" decoding="async" loading="lazy"/>');
  });

  it('primary image is eager with fetchpriority=high', () => {
    // React may add a preload <link> before the element; only the <img> is compared here.
    const html = imgTags(lower(render(<PageImage src="https://i.test/a.jpg" fallbackAlt="N" priority />)))[0];
    expect(html).toBe('<img src="https://i.test/a.jpg" alt="N" decoding="async" loading="eager" fetchpriority="high"/>');
  });

  it('does not invent width/height; renders them only when both are positive integers', () => {
    expect(render(<PageImage src="https://i.test/a.jpg" fallbackAlt="N" />)).not.toMatch(/\b(width|height)=/);
    expect(render(<PageImage src="https://i.test/a.jpg" fallbackAlt="N" width={640} />)).not.toMatch(/\b(width|height)=/);
    expect(render(<PageImage src="https://i.test/a.jpg" fallbackAlt="N" width={0} height={10} />)).not.toMatch(/\b(width|height)=/);
    expect(render(<PageImage src="https://i.test/a.jpg" fallbackAlt="N" width={640} height={480} />)).toContain('width="640" height="480"');
  });

  it('escapes hostile alt text and URLs', () => {
    const html = render(<PageImage src={'https://i.test/a.jpg?x="><script>'} alt={'"><script>alert(1)</script>'} fallbackAlt="N" />);
    expect(html.toLowerCase()).not.toContain('<script');
  });
});

describe('PageImage: fallback image', () => {
  it.each([null, undefined, '', '   ', 'javascript:alert(1)', 'data:image/png;base64,AA', '//cdn.test/a.jpg', 'relative.jpg'])(
    'renders the fallback for %j',
    (src) => {
      const html = lower(render(<PageImage src={src as string | null} alt="ignored" fallbackAlt="Name" />));
      expect(html).toBe(`<img src="${FALLBACK_IMAGE_PATH}" alt="" role="presentation" decoding="async" loading="lazy"/>`);
      expect(html).not.toContain('javascript:');
      expect(html).not.toContain('data:');
    },
  );

  it('the fallback keeps the primary-image loading attributes when it is the primary image', () => {
    expect(lower(render(<PageImage src={null} fallbackAlt="Name" priority />))).toContain('loading="eager" fetchpriority="high"');
  });

  it('the resolver is not asked for variants of the fallback', () => {
    const resolver: ImageSourceResolver = () => {
      throw new Error('must not be called');
    };
    expect(render(<PageImage src={null} fallbackAlt="N" />, resolver)).toContain(FALLBACK_IMAGE_PATH);
  });
});

describe('image source resolver hook', () => {
  it('default resolver returns only the original URL (no invented variants)', () => {
    expect(defaultImageSourceResolver('https://i.test/a.jpg')).toEqual({ src: 'https://i.test/a.jpg' });
    const html = render(<PageImage src="https://i.test/a.jpg" fallbackAlt="N" priority />);
    expect(html).not.toContain('<picture');
    expect(html).not.toContain('<source');
    expect(html).not.toMatch(/srcset/i);
  });

  // A fake pipeline with made-up URLs; the real URL convention is an open decision.
  const fake: ImageSourceResolver = (url) => ({
    src: url,
    srcset: `${url}?w=480 480w, ${url}?w=960 960w`,
    sizes: '(max-width: 600px) 480px, 960px',
    webp: { srcset: `${url}?w=480&f=webp 480w, ${url}?w=960&f=webp 960w`, sizes: '(max-width: 600px) 480px, 960px' },
  });

  it('renders <picture> with a WebP <source> and the original as the fallback <img>', () => {
    const html = lower(render(<PageImage src="https://i.test/a.jpg" alt="A" fallbackAlt="N" priority />, fake));
    expect(html).toBe(
      '<picture>' +
        '<source type="image/webp" srcset="https://i.test/a.jpg?w=480&amp;f=webp 480w, https://i.test/a.jpg?w=960&amp;f=webp 960w" sizes="(max-width: 600px) 480px, 960px"/>' +
        '<img src="https://i.test/a.jpg" srcset="https://i.test/a.jpg?w=480 480w, https://i.test/a.jpg?w=960 960w" sizes="(max-width: 600px) 480px, 960px" alt="A" decoding="async" loading="eager" fetchpriority="high"/>' +
        '</picture>',
    );
  });

  it('responsive widths without WebP: a plain <img> with srcset and sizes', () => {
    const html = lower(render(<PageImage src="https://i.test/a.jpg" fallbackAlt="N" />, (u) => ({ src: u, srcset: `${u} 1x`, sizes: '100vw' })));
    expect(html).not.toContain('<picture');
    expect(html).toContain('srcset="https://i.test/a.jpg 1x" sizes="100vw"');
  });

  it('sizes without srcset is dropped (it would have no meaning)', () => {
    expect(render(<PageImage src="https://i.test/a.jpg" fallbackAlt="N" />, (u) => ({ src: u, sizes: '100vw' }))).not.toContain('sizes');
  });

  it('an unusable src from the resolver falls back to the original URL', () => {
    expect(render(<PageImage src="https://i.test/a.jpg" fallbackAlt="N" />, () => ({ src: 'javascript:alert(1)' }))).toContain('src="https://i.test/a.jpg"');
  });

  it('renderSite passes the resolver to every page type', () => {
    const pages = renderSite(validData(), { assets: TEST_ASSETS, siteUrl: SITE, imageResolver: fake });
    for (const p of pages) {
      expect(p.html).toContain('<picture>');
      expect(p.html).toContain('type="image/webp"');
    }
  });
});

describe('images on the four page types', () => {
  const pages = renderSite(validData(), { assets: TEST_ASSETS, siteUrl: SITE });
  const get = (type: string) => pages.find((p) => p.type === type)!.html;

  it('each page has exactly one image, and it is the single eager/high-priority one', () => {
    for (const p of pages) {
      const tags = imgTags(lower(p.html));
      expect(tags).toHaveLength(1);
      expect(tags.filter((t) => t.includes('loading="eager"') && t.includes('fetchpriority="high"'))).toHaveLength(1);
      expect(tags.filter((t) => t.includes('loading="lazy"'))).toHaveLength(0);
      expect(tags[0]).toMatch(/\salt="[^"]*"/);
    }
  });

  it('movie poster and character image are now rendered, with the entity name as alt', () => {
    expect(get('movie')).toContain('<img src="https://img.test/poster.jpg" alt="Black Christmas"');
    expect(get('character')).toContain('<img src="https://img.test/billy.jpg" alt="Billy"');
  });

  it('collection and product use the model alt text', () => {
    expect(get('collection')).toContain('alt="Snowy house"');
    expect(get('product')).toContain('alt="A red mug"');
  });

  it('a movie without a poster uses the hero image, then the fallback', () => {
    const viaHero = renderSite(validData({ movies: [movie({ posterUrl: null, heroImageUrl: 'https://img.test/hero.jpg' })] }), { assets: TEST_ASSETS, siteUrl: SITE });
    expect(viaHero.find((p) => p.type === 'movie')!.html).toContain('<img src="https://img.test/hero.jpg"');
    const none = renderSite(validData({ movies: [movie({ posterUrl: null, heroImageUrl: null })] }), { assets: TEST_ASSETS, siteUrl: SITE });
    expect(lower(none.find((p) => p.type === 'movie')!.html)).toContain(`<img src="${FALLBACK_IMAGE_PATH}" alt="" role="presentation"`);
  });

  it('invalid image URLs render the fallback on every page type', () => {
    const out = renderSite(
      validData({
        movies: [movie({ posterUrl: 'javascript:alert(1)' })],
        characters: [character({ imageUrl: 'data:image/png;base64,AA' })],
        products: [product({ imageUrl: '//cdn.test/a.jpg' })],
      }),
      { assets: TEST_ASSETS, siteUrl: SITE },
    );
    for (const type of ['movie', 'character', 'product']) {
      const html = out.find((p) => p.type === type)!.html;
      expect(imgTags(html)).toHaveLength(1);
      expect(html).toContain(`<img src="${FALLBACK_IMAGE_PATH}"`);
      expect(html).not.toMatch(/<img[^>]*(javascript:|data:)/);
    }
  });

  it('a collection hero with a non-usable URL still renders the fallback (the validator reports it separately)', () => {
    const out = renderSite(validData({ collections: [collection({ heroImageUrl: 'javascript:x' })] }), { assets: TEST_ASSETS, siteUrl: SITE });
    expect(out[0].html).toContain(`<img src="${FALLBACK_IMAGE_PATH}"`);
  });

  it('no page ever gets width/height (the models carry no dimensions)', () => {
    for (const p of pages) expect(imgTags(p.html).join('')).not.toMatch(/\s(width|height)=/);
  });
});

describe('React image preload links', () => {
  const preloads = (html: string) => html.match(/<link rel="preload" as="image"[^>]*>/g) ?? [];

  it('exactly one preload per page: the primary image, with high priority', () => {
    for (const p of renderSite(validData(), { assets: TEST_ASSETS, siteUrl: SITE })) {
      const links = preloads(p.html);
      expect(links).toHaveLength(1);
      const link = links[0]!;
      expect(lower(link)).toContain('fetchpriority="high"');
      expect(p.html.indexOf(link)).toBeLessThan(p.html.indexOf('</head>'));
    }
  });

  it('lazy images are not preloaded (React skips loading="lazy")', () => {
    const html = render(
      <html>
        <head />
        <body>
          <PageImage src="https://i.test/a.jpg" fallbackAlt="A" priority />
          <PageImage src="https://i.test/lazy.jpg" fallbackAlt="B" />
        </body>
      </html>,
    );
    expect(preloads(html)).toHaveLength(1);
    expect(html).toContain('href="https://i.test/a.jpg"');
    expect(html).not.toContain('href="https://i.test/lazy.jpg"');
    expect(html).toContain('src="https://i.test/lazy.jpg"');
  });

  it('images inside <picture> are not preloaded (the browser picks the source)', () => {
    const fake: ImageSourceResolver = (u) => ({ src: u, webp: { srcset: `${u}.webp 1x` } });
    const html = render(
      <html>
        <head />
        <body>
          <PageImage src="https://i.test/a.jpg" fallbackAlt="A" priority />
        </body>
      </html>,
      fake,
    );
    expect(preloads(html)).toHaveLength(0);
  });
});
