// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { serializeJsonForScript } from '../build/safe-json';
import { HYDRATION_VERSION, parseHydrationPayload, pseudonymizeIds } from './page-data';
import { emptyHome, movie, product } from '../build/test-fixtures';

describe('serializeJsonForScript (hydration data and JSON-LD)', () => {
  const HOSTILE = `</script><script>alert(1)</script><!-- & > < \u2028 \u2029 "quotes" \\ end`;

  it('never emits <, >, & or line separators, and parses back to the same value', () => {
    const value = { text: HOSTILE, nested: [{ k: HOSTILE }], n: 1, nothing: null };
    const out = serializeJsonForScript(value);
    expect(out).not.toMatch(/[<>&\u2028\u2029]/);
    expect(out).not.toContain('</script');
    expect(out).not.toContain('<!--');
    expect(JSON.parse(out)).toEqual(value);
  });

  it('escapes with lowercase \\uXXXX sequences', () => {
    expect(serializeJsonForScript('<>&\u2028\u2029')).toBe('"\\u003c\\u003e\\u0026\\u2028\\u2029"');
  });
});

describe('pseudonymizeIds', () => {
  const model = product({
    id: 'cabcdefghijklmnopqrstuvwx',
    affiliateLinks: [
      { id: 'link-secret-1', provider: 'Amazon', url: 'https://shop.test/a', productId: 'cabcdefghijklmnopqrstuvwx' },
      { id: 'link-secret-2', provider: 'eBay', url: 'https://shop.test/b', productId: 'cabcdefghijklmnopqrstuvwx' },
    ],
  });

  it('replaces every id and *Id value, keeps equal ids equal and distinct ids distinct', () => {
    const out = pseudonymizeIds(model);
    const text = JSON.stringify(out);
    expect(text).not.toContain('cabcdefghijklmnopqrstuvwx');
    expect(text).not.toContain('link-secret');
    expect(out.affiliateLinks[0].productId).toBe(out.id);
    expect(out.affiliateLinks[1].productId).toBe(out.id);
    expect(new Set([out.id, out.affiliateLinks[0].id, out.affiliateLinks[1].id]).size).toBe(3);
  });

  it('is deterministic, does not change other data and does not modify the input', () => {
    const before = JSON.stringify(model);
    const a = pseudonymizeIds(model);
    expect(JSON.stringify(pseudonymizeIds(model))).toBe(JSON.stringify(a));
    expect(JSON.stringify(model)).toBe(before);
    expect(a.name).toBe(model.name);
    expect(a.price).toBe(model.price);
  });

  it('leaves non-string id values and similar keys alone', () => {
    expect(pseudonymizeIds({ id: 5, identity: 'x', slug: 'id' })).toEqual({ id: 5, identity: 'x', slug: 'id' });
  });
});

describe('parseHydrationPayload', () => {
  const good = { version: HYDRATION_VERSION, page: { type: 'movie', model: pseudonymizeIds(movie()) }, knownCollectionSlugs: null };

  it('accepts a valid payload', () => {
    expect(parseHydrationPayload(JSON.stringify(good)).page.type).toBe('movie');
  });

  it('accepts the homepage payload (no slug in its model) and rejects one without the featured collections list', () => {
    const home = { version: HYDRATION_VERSION, page: { type: 'home', model: emptyHome() }, knownCollectionSlugs: ['a'], knownMovieSlugs: [], knownCharacterSlugs: [] };
    expect(parseHydrationPayload(JSON.stringify(home)).page.type).toBe('home');
    expect(() => parseHydrationPayload(JSON.stringify({ ...home, page: { type: 'home', model: {} } }))).toThrow(/Embedded page data/);
  });
  it.each([
    ['not json', '{nope'],
    ['wrong version', JSON.stringify({ ...good, version: 99 })],
    ['unknown page type', JSON.stringify({ ...good, page: { type: 'franchise', model: { slug: 'x' } } })],
    ['no slug', JSON.stringify({ ...good, page: { type: 'movie', model: {} } })],
    ['bad slug list', JSON.stringify({ ...good, knownCollectionSlugs: 'x' })],
    ['null', 'null'],
  ])('rejects %s with a clear error', (_name, text) => {
    expect(() => parseHydrationPayload(text)).toThrow(/Embedded page data/);
  });
});
