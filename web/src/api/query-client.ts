/**
 * TanStack Query defaults for the browser's API calls. Created in the client
 * entry only; the static generator never uses it.
 *
 * - staleTime 5 min: the public content changes at most when the site is
 *   republished, so data fetched a moment ago is fresh enough and navigation
 *   or remounting does not refetch.
 * - gcTime 30 min: unused results stay cached for a while (back/forward).
 * - retry: network errors and 5xx are retried twice; 4xx answers (404, 400)
 *   are final and never retried.
 * - refetchOnWindowFocus off: public data does not need a refetch each time the
 *   tab regains focus. Reconnect refetch stays on (default), since a dropped
 *   connection may have left failed queries behind.
 */
import { QueryClient } from '@tanstack/react-query';
import { ApiRequestError } from './client';

export const QUERY_STALE_TIME_MS = 5 * 60 * 1000;
export const QUERY_GC_TIME_MS = 30 * 60 * 1000;
export const QUERY_MAX_RETRIES = 2;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiRequestError && error.status !== null && error.status >= 400 && error.status < 500) return false;
  return failureCount < QUERY_MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  });
}
