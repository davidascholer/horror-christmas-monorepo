/**
 * Base Repository
 * 
 * Provides shared query utilities for published-only content filtering
 * and common serialization patterns.
 */

import { ContentStatus, MediaType as PrismaMediaType } from '@prisma/client';
import type { MediaType } from '../types/api-contracts.js';

/**
 * Map Prisma MediaType enum values to API contract MediaType values.
 * The database uses TELEVISION_* names; the public contract uses TV_*.
 */
const MEDIA_TYPE_MAP: Record<PrismaMediaType, MediaType> = {
  FILM: 'FILM',
  TELEVISION_SPECIAL: 'TV_SPECIAL',
  TELEVISION_EPISODE: 'TV_EPISODE',
};

export function serializeMediaType(mediaType: PrismaMediaType): MediaType {
  return MEDIA_TYPE_MAP[mediaType];
}

/**
 * Deterministic ordering for unordered tag joins (tags have no sortOrder).
 */
export const TAG_ORDER = { tag: { name: 'asc' } } as const;

/**
 * Standard filter for published content only
 * Used across all public-facing repository queries
 */
export const PUBLISHED_ONLY_FILTER = {
  status: ContentStatus.PUBLISHED,
} as const;

/**
 * Serialize Date objects to ISO-8601 strings
 * Ensures consistent timestamp formatting across all API responses
 */
export function serializeTimestamp(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

/**
 * Serialize Decimal to string for JSON serialization
 * Preserves fixed-precision decimal values for monetary amounts
 */
export function serializeDecimal(
  decimal: { toFixed(dp: number): string } | null | undefined,
): string | null {
  if (decimal === null || decimal === undefined) {
    return null;
  }
  // Product.price is Decimal(10, 2); always emit two fraction digits (e.g. "12.50")
  return decimal.toFixed(2);
}
