// @vitest-environment node
/**
 * Manual integration check against a live API (Task 6.1). NOT part of the
 * default test run: the filename does not match vitest's default include
 * (*.test.ts) and it is only picked up by vitest.integration.config.ts.
 *
 * Run (from web/), with the API listening:
 *   API_BASE_URL=http://localhost:3000 npm run test:integration
 *
 * Asserts structure only, so it passes against an empty catalogue (all seed
 * content is DRAFT, so the /build lists are empty until content is published).
 */
import { describe, it, expect } from 'vitest';
import { fetchBuildData, readApiBaseUrl } from './fetch-build-data';

describe('fetchBuildData (live API)', () => {
  it('discovers published slugs and retrieves their page models', async () => {
    // web/ has no @types/node, so reach process.env through globalThis.
    const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
    const apiBaseUrl = readApiBaseUrl(env);
    const data = await fetchBuildData({ apiBaseUrl });

    const counts = {
      collections: data.collections.length,
      movies: data.movies.length,
      characters: data.characters.length,
      products: data.products.length,
      warnings: data.warnings.length,
    };
    console.log(`[integration] ${apiBaseUrl}`, JSON.stringify(counts));
    for (const w of data.warnings) console.warn(`[integration] warning: ${w.message}`);

    for (const list of [data.collections, data.movies, data.characters, data.products]) {
      for (const model of list) expect(typeof model.slug).toBe('string');
    }
    expect(Array.isArray(data.warnings)).toBe(true);
  });
});
