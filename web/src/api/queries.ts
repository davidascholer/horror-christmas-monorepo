/**
 * Query hooks over the API client. One example for now (GET /home); search and
 * watchlists add theirs. Query keys live here so invalidation stays in one place.
 */
import { queryOptions, useQuery } from '@tanstack/react-query';
import { getDefaultApiClient, type ApiClient } from './client';

export const queryKeys = {
  home: ['home'] as const,
};

export function homeQueryOptions(api: ApiClient) {
  return queryOptions({
    queryKey: queryKeys.home,
    // TanStack aborts the request when the query is cancelled or unmounted.
    queryFn: ({ signal }) => api.getHome({ signal }),
  });
}

/** GET /home. `api` defaults to the client for VITE_API_BASE_URL. */
export function useHome(api?: ApiClient) {
  return useQuery(homeQueryOptions(api ?? getDefaultApiClient()));
}
