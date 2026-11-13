/**
 * Self-contained catalog fixture for service tests (Task 4.3).
 *
 * Every record uses a unique slug prefix so tests never depend on seed data
 * and cleanup only removes what the fixture created. Join rows and affiliate
 * links are removed through onDelete: Cascade.
 *
 * Join sortOrder values are deliberately inserted out of order and include
 * draft/archived entities so ordering and the published-only boundary are
 * actually exercised.
 */

import { PrismaClient, Prisma } from '@prisma/client';

export interface CatalogFixture {
  prefix: string;
  /** Unique token embedded in fixture movie titles, for scoping list queries */
  token: string;
  slugs: {
    collection: string;
    collectionGift: string;
    collectionCharacter: string;
    collectionDraft: string;
    collectionEmpty: string;
    movieOld: string;
    movieSpecial: string;
    movieDraft: string;
    movieArchived: string;
    characterA: string;
    characterB: string;
    characterDraft: string;
    productPriced: string;
    productUnpriced: string;
    productDraft: string;
    franchise: string;
    tagAlpha: string;
    tagBeta: string;
  };
  cleanup(): Promise<void>;
}

const PUBLISHED = 'PUBLISHED' as const;

export async function createCatalogFixture(
  prisma: PrismaClient,
  label: string,
): Promise<CatalogFixture> {
  const token = `t43${label}${Math.random().toString(36).slice(2, 8)}`;
  const prefix = `${token}-`;
  const s = (name: string) => `${prefix}${name}`;
  const publishedAt = new Date('2026-11-01T12:00:00.000Z');

  const slugs: CatalogFixture['slugs'] = {
    collection: s('collection'),
    collectionGift: s('collection-gift'),
    collectionCharacter: s('collection-character'),
    collectionDraft: s('collection-draft'),
    collectionEmpty: s('collection-empty'),
    movieOld: s('movie-old'),
    movieSpecial: s('movie-special'),
    movieDraft: s('movie-draft'),
    movieArchived: s('movie-archived'),
    characterA: s('character-a'),
    characterB: s('character-b'),
    characterDraft: s('character-draft'),
    productPriced: s('product-priced'),
    productUnpriced: s('product-unpriced'),
    productDraft: s('product-draft'),
    franchise: s('franchise'),
    tagAlpha: s('alpha'),
    tagBeta: s('beta'),
  };

  const franchise = await prisma.franchise.create({
    data: { slug: slugs.franchise, name: `${token} Franchise` },
  });
  const tagBeta = await prisma.tag.create({ data: { slug: slugs.tagBeta, name: `${token} Beta` } });
  const tagAlpha = await prisma.tag.create({ data: { slug: slugs.tagAlpha, name: `${token} Alpha` } });

  const collection = (slug: string, data: Partial<Prisma.CollectionCreateInput>) =>
    prisma.collection.create({
      data: {
        slug,
        title: `${token} ${slug}`,
        type: 'THEME',
        introduction: 'Intro',
        curatorNotes: 'Notes',
        status: PUBLISHED,
        ...data,
      },
    });

  const main = await collection(slugs.collection, {
    summary: 'Main summary',
    heroImage: 'https://example.com/hero.jpg',
    heroImageAlt: 'Hero alt',
    featured: true,
    publishedAt,
  });
  const gift = await collection(slugs.collectionGift, { type: 'GIFT', seasonal: true, publishedAt });
  const charCol = await collection(slugs.collectionCharacter, { type: 'CHARACTER', publishedAt });
  const draftCol = await collection(slugs.collectionDraft, { status: 'DRAFT', featured: true });
  await collection(slugs.collectionEmpty, {});

  const movieOld = await prisma.movie.create({
    data: {
      slug: slugs.movieOld,
      title: `${token} Old Movie`,
      originalTitle: `${token} Original`,
      mediaType: 'FILM',
      status: PUBLISHED,
      releaseYear: 1984,
      releaseDate: new Date('1984-12-07T00:00:00.000Z'),
      runtime: 106,
      franchiseId: franchise.id,
      publishedAt,
    },
  });
  const movieSpecial = await prisma.movie.create({
    data: {
      slug: slugs.movieSpecial,
      title: `${token} Special`,
      mediaType: 'TELEVISION_SPECIAL',
      status: PUBLISHED,
      releaseYear: 2015,
    },
  });
  const movieDraft = await prisma.movie.create({
    data: { slug: slugs.movieDraft, title: `${token} Draft Movie`, status: 'DRAFT', releaseYear: 1984 },
  });
  await prisma.movie.create({
    data: { slug: slugs.movieArchived, title: `${token} Archived Movie`, status: 'ARCHIVED' },
  });

  const charA = await prisma.character.create({
    data: {
      slug: slugs.characterA,
      name: `${token} Alpha Character`,
      summary: 'A summary',
      biography: 'Bio',
      status: PUBLISHED,
      franchiseId: franchise.id,
      publishedAt,
    },
  });
  const charB = await prisma.character.create({
    data: { slug: slugs.characterB, name: `${token} Beta Character`, status: PUBLISHED },
  });
  const charDraft = await prisma.character.create({
    data: { slug: slugs.characterDraft, name: `${token} Draft Character`, status: 'DRAFT' },
  });

  const productPriced = await prisma.product.create({
    data: {
      slug: slugs.productPriced,
      name: `${token} Priced Product`,
      status: PUBLISHED,
      price: new Prisma.Decimal('12.50'),
      currency: 'USD',
      category: 'Figure',
      franchiseId: franchise.id,
      publishedAt,
    },
  });
  const productUnpriced = await prisma.product.create({
    data: { slug: slugs.productUnpriced, name: `${token} Unpriced Product`, status: PUBLISHED },
  });
  const productDraft = await prisma.product.create({
    data: { slug: slugs.productDraft, name: `${token} Draft Product`, status: 'DRAFT' },
  });

  await prisma.affiliateLink.create({
    data: { provider: 'ShopOne', url: 'https://example.com/one', productId: productPriced.id },
  });
  await prisma.affiliateLink.create({
    data: { provider: 'ShopTwo', url: 'https://example.com/two', productId: productPriced.id },
  });

  // Collection composition (inserted out of sortOrder sequence; drafts included)
  await prisma.collectionMovie.createMany({
    data: [
      { collectionId: main.id, movieId: movieOld.id, sortOrder: 20, curatorNote: null },
      { collectionId: main.id, movieId: movieSpecial.id, sortOrder: 10, curatorNote: 'Watch first' },
      { collectionId: main.id, movieId: movieDraft.id, sortOrder: 5 },
      { collectionId: gift.id, movieId: movieOld.id, sortOrder: 1 },
      { collectionId: draftCol.id, movieId: movieOld.id, sortOrder: 1 },
    ],
  });
  await prisma.collectionCharacter.createMany({
    data: [
      { collectionId: main.id, characterId: charA.id, sortOrder: 2 },
      { collectionId: main.id, characterId: charB.id, sortOrder: 1, curatorNote: 'Iconic' },
      { collectionId: main.id, characterId: charDraft.id, sortOrder: 0 },
      { collectionId: charCol.id, characterId: charA.id, sortOrder: 1 },
    ],
  });
  await prisma.collectionProduct.createMany({
    data: [
      { collectionId: main.id, productId: productPriced.id, sortOrder: 2 },
      { collectionId: main.id, productId: productUnpriced.id, sortOrder: 1 },
      { collectionId: main.id, productId: productDraft.id, sortOrder: 0 },
      { collectionId: gift.id, productId: productPriced.id, sortOrder: 1 },
    ],
  });
  await prisma.collectionFranchise.create({
    data: { collectionId: main.id, franchiseId: franchise.id, sortOrder: 1 },
  });
  await prisma.collectionTag.createMany({
    data: [
      { collectionId: main.id, tagId: tagBeta.id },
      { collectionId: main.id, tagId: tagAlpha.id },
    ],
  });
  await prisma.collectionRelated.createMany({
    data: [
      { sourceCollectionId: main.id, targetCollectionId: gift.id, sortOrder: 2 },
      { sourceCollectionId: main.id, targetCollectionId: charCol.id, sortOrder: 1 },
      { sourceCollectionId: main.id, targetCollectionId: draftCol.id, sortOrder: 0 },
    ],
  });

  // Movie, character, product graph
  await prisma.movieCharacter.createMany({
    data: [
      { movieId: movieOld.id, characterId: charA.id, sortOrder: 2, role: null },
      { movieId: movieOld.id, characterId: charB.id, sortOrder: 1, role: 'Villain' },
      { movieId: movieOld.id, characterId: charDraft.id, sortOrder: 0 },
      { movieId: movieSpecial.id, characterId: charA.id, sortOrder: 1 },
      { movieId: movieDraft.id, characterId: charA.id, sortOrder: 1 },
    ],
  });
  await prisma.movieTag.createMany({
    data: [
      { movieId: movieOld.id, tagId: tagBeta.id },
      { movieId: movieOld.id, tagId: tagAlpha.id },
    ],
  });
  await prisma.characterTag.create({ data: { characterId: charA.id, tagId: tagBeta.id } });
  await prisma.productTag.create({ data: { productId: productPriced.id, tagId: tagAlpha.id } });
  await prisma.productCharacter.createMany({
    data: [
      { productId: productPriced.id, characterId: charA.id, sortOrder: 2 },
      { productId: productPriced.id, characterId: charB.id, sortOrder: 1 },
      { productId: productPriced.id, characterId: charDraft.id, sortOrder: 0 },
      { productId: productUnpriced.id, characterId: charA.id, sortOrder: 1 },
      { productId: productDraft.id, characterId: charA.id, sortOrder: 1 },
    ],
  });

  const cleanup = async () => {
    const where = { slug: { startsWith: prefix } };
    await prisma.collection.deleteMany({ where });
    await prisma.movie.deleteMany({ where });
    await prisma.character.deleteMany({ where });
    await prisma.product.deleteMany({ where });
    await prisma.franchise.deleteMany({ where });
    await prisma.tag.deleteMany({ where });
  };

  return { prefix, token, slugs, cleanup };
}

export const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
