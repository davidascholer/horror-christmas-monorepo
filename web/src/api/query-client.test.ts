// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ApiRequestError } from './client';
import { createQueryClient, QUERY_GC_TIME_MS, QUERY_MAX_RETRIES, QUERY_STALE_TIME_MS, shouldRetry } from './query-client';

describe('createQueryClient defaults', () => {
  const queries = createQueryClient().getDefaultOptions().queries!;

  it('uses documented staleTime and gcTime, and does not refetch on window focus', () => {
    expect(queries.staleTime).toBe(QUERY_STALE_TIME_MS);
    expect(queries.gcTime).toBe(QUERY_GC_TIME_MS);
    expect(QUERY_STALE_TIME_MS).toBe(5 * 60_000);
    expect(QUERY_GC_TIME_MS).toBeGreaterThan(QUERY_STALE_TIME_MS);
    expect(queries.refetchOnWindowFocus).toBe(false);
    expect(queries.retry).toBe(shouldRetry);
  });

  it('gives each caller its own client', () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});

describe('shouldRetry', () => {
  const http = (status: number) => new ApiRequestError('http', 'x', { url: 'u', status });

  it('never retries 4xx answers', () => {
    for (const status of [400, 404, 429]) expect(shouldRetry(0, http(status)), String(status)).toBe(false);
  });

  it('retries 5xx, network and unknown errors up to the limit', () => {
    const network = new ApiRequestError('network', 'x', { url: 'u' });
    for (const error of [http(500), http(503), network, new Error('boom')]) {
      expect(shouldRetry(0, error)).toBe(true);
      expect(shouldRetry(QUERY_MAX_RETRIES - 1, error)).toBe(true);
      expect(shouldRetry(QUERY_MAX_RETRIES, error)).toBe(false);
    }
  });
});
