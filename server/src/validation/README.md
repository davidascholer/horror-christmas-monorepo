# Publication Validation

This module provides validation functions to ensure content meets publication requirements before it can be marked as PUBLISHED.

## Overview

The validation module implements Requirements 3.5, 3.8, 12.1-12.3 from the Collection-First MVP specification.

## Functions

### `validateCollectionForPublication(collectionId, prisma)`

Validates that a collection meets all publication requirements:
- Required fields: `introduction`, `curatorNotes`
- Required: hero image URL with alt text (`heroImage`, `heroImageAlt`)
- Required: SEO metadata (`seoTitle`, `seoDescription`)
- Required: at least one movie relationship
- Required: at least one related collection

**Parameters:**
- `collectionId` (string): The ID of the collection to validate
- `prisma` (PrismaClient): Prisma client instance

**Returns:** `Promise<ValidationResult>`

**Example:**
```typescript
import { PrismaClient } from '@prisma/client';
import { validateCollectionForPublication } from './validation/publication-validation.js';

const prisma = new PrismaClient();

const result = await validateCollectionForPublication('collection-id', prisma);

if (!result.valid) {
  console.error('Validation failed:', result.errors);
  // Handle validation errors
} else {
  // Proceed with publication
  await prisma.collection.update({
    where: { id: 'collection-id' },
    data: { status: 'PUBLISHED', publishedAt: new Date() }
  });
}
```

### `validateMovieForPublication(movieId, prisma)`

Validates that a movie has required SEO metadata.

**Required:**
- `seoTitle`
- `seoDescription`

### `validateCharacterForPublication(characterId, prisma)`

Validates that a character has required SEO metadata.

**Required:**
- `seoTitle`
- `seoDescription`

### `validateProductForPublication(productId, prisma)`

Validates that a product has required SEO metadata.

**Required:**
- `seoTitle`
- `seoDescription`

### `validateEntityForPublication(entityId, entityType, prisma)`

Generic validation function that delegates to the appropriate entity-specific validator.

**Parameters:**
- `entityId` (string): The ID of the entity to validate
- `entityType` ('collection' | 'movie' | 'character' | 'product'): The type of entity
- `prisma` (PrismaClient): Prisma client instance

**Example:**
```typescript
const result = await validateEntityForPublication(
  entityId, 
  'collection', 
  prisma
);
```

## Validation Result

All validation functions return a `ValidationResult` object:

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

## Usage in Editorial Workflow

These validation functions should be called **before** changing an entity's status to `PUBLISHED`. The validation ensures that:

1. All required content is present
2. SEO metadata is complete for all public entities
3. Collections have sufficient relationships for discovery

If validation fails, the status change should be prevented and the errors should be communicated to the editor.

## Testing

Comprehensive tests are available in `publication-validation.test.ts`. Run tests with:

```bash
npm test -- publication-validation.test.ts
```

All 28 tests verify:
- Successful validation for complete entities
- Failure detection for each missing required field
- Error handling for non-existent entities
- Multiple validation error reporting
- Generic validation function routing
