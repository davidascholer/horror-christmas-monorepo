/**
 * Typed API client for the BROWSER (search and watchlists use it; the static
 * generator has its own fetcher in src/build/fetch-build-data.ts).
 *
 * - Base URL: `VITE_API_BASE_URL` (a Vite env var, inlined at build time).
 *   The wider environment-variable approach is still an open decision
 *   (OPEN-DECISIONS.md). A missing or invalid value is an error, never a
 *   silent fallback.
 * - Response types come from src/types/api-contracts.ts.
 * - Errors are never swallowed: every failure is thrown as ApiRequestError
 *   with a `kind` ('network' | 'http' | 'invalid-response'), the HTTP status
 *   and the API's error code and message when it sent them.
 */
import type { HomeResponse } from '../types/api-contracts';

export const API_BASE_URL_ENV = 'VITE_API_BASE_URL';

export type ApiErrorKind = 'network' | 'http' | 'invalid-response';

export class ApiRequestError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status, or null when no response arrived. */
  readonly status: number | null;
  /** The API's error code (for example NOT_FOUND), when the body carried one. */
  readonly code: string | null;
  readonly url: string;

  constructor(
    kind: ApiErrorKind,
    message: string,
    details: { url: string; status?: number | null; code?: string | null; cause?: unknown },
  ) {
    super(message, details.cause === undefined ? undefined : { cause: details.cause });
    this.name = 'ApiRequestError';
    this.kind = kind;
    this.status = details.status ?? null;
    this.code = details.code ?? null;
    this.url = details.url;
  }
}

export class ApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiConfigError';
  }
}

/** Validates the API base URL: absolute http(s), no query or fragment. Returns it without a trailing slash. */
export function normalizeApiBaseUrl(value: string | undefined): string {
  const raw = value?.trim();
  if (!raw) {
    throw new ApiConfigError(`${API_BASE_URL_ENV} is not set. Set it to the API origin, e.g. ${API_BASE_URL_ENV}=http://127.0.0.1:3000`);
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ApiConfigError(`${API_BASE_URL_ENV} ${JSON.stringify(raw)} is not a valid URL`);
  }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.search || url.hash) {
    throw new ApiConfigError(`${API_BASE_URL_ENV} ${JSON.stringify(raw)} must be an absolute http(s) URL without query or fragment`);
  }
  return raw.replace(/\/+$/, '');
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface ApiClient {
  /** GET /home */
  getHome(options?: RequestOptions): Promise<HomeResponse>;
}

export interface ApiClientConfig {
  baseUrl: string;
  /** Replaceable for tests. Default: the global fetch. */
  fetch?: typeof fetch;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const baseUrl = normalizeApiBaseUrl(config.baseUrl);
  // Called through a wrapper so `this` is never the client object (illegal invocation in browsers).
  const doFetch: typeof fetch = config.fetch ?? ((input, init) => fetch(input, init));

  async function getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = baseUrl + path;
    let response: Response;
    try {
      response = await doFetch(url, { headers: { Accept: 'application/json' }, signal: options.signal });
    } catch (error) {
      // Aborts are the caller's decision, not an API failure: rethrow unchanged.
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new ApiRequestError('network', `Request to ${url} failed: ${error instanceof Error ? error.message : String(error)}`, {
        url,
        cause: error,
      });
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { code?: unknown; message?: unknown } } | null;
      const code = typeof body?.error?.code === 'string' ? body.error.code : null;
      const detail = typeof body?.error?.message === 'string' ? `: ${body.error.message}` : '';
      throw new ApiRequestError('http', `GET ${url} failed with ${response.status}${detail}`, { url, status: response.status, code });
    }
    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      throw new ApiRequestError('invalid-response', `GET ${url} returned a body that is not valid JSON`, {
        url,
        status: response.status,
        cause: error,
      });
    }
    if (data === null || typeof data !== 'object') {
      throw new ApiRequestError('invalid-response', `GET ${url} returned JSON that is not an object or array`, {
        url,
        status: response.status,
      });
    }
    return data as T;
  }

  return {
    getHome: (options) => getJson<HomeResponse>('/home', options),
  };
}

let defaultClient: ApiClient | null = null;

/** The client for the configured `VITE_API_BASE_URL` (created on first use). Throws ApiConfigError if unset. */
export function getDefaultApiClient(): ApiClient {
  defaultClient ??= createApiClient({ baseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL) });
  return defaultClient;
}
