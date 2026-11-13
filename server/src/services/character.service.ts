/**
 * Character Service
 * 
 * Implements all character-related routes and business logic:
 * - GET /characters (list)
 * - GET /characters/:slug (detail)
 * 
 * All operations return published content only.
 */

import { PrismaClient } from '@prisma/client';
import {
  CharacterSummary,
  Character,
  CharacterDetail,
} from '../types/api-contracts.js';
import { CharacterRepository } from '../repositories/character.repository.js';

export class CharacterService {
  private repository: CharacterRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new CharacterRepository(prisma);
  }

  /**
   * GET /characters
   * List all published characters
   */
  async listCharacters(): Promise<CharacterSummary[]> {
    return this.repository.list();
  }

  /**
   * GET /characters/:slug
   * Get character detail by slug
   * Returns null if not found or not published
   */
  async getCharacter(slug: string): Promise<Character | null> {
    return this.repository.findBySlug(slug);
  }

  /**
   * Get complete character detail with all relationships
   * Useful for detail pages that need everything in one call
   */
  async getCharacterDetail(slug: string): Promise<CharacterDetail | null> {
    return this.repository.getDetail(slug);
  }
}
