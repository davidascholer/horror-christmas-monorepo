-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CollectionType" AS ENUM ('CHARACTER', 'THEME', 'BEGINNER', 'GIFT', 'SEASONAL_CHALLENGE', 'TRADITION');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('FILM', 'TELEVISION_SPECIAL', 'TELEVISION_EPISODE');

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "CollectionType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "introduction" TEXT NOT NULL,
    "curatorNotes" TEXT NOT NULL,
    "summary" TEXT,
    "heroImage" TEXT,
    "heroImageAlt" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "seasonal" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL DEFAULT 'FILM',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "synopsis" TEXT,
    "originalTitle" TEXT,
    "releaseYear" INTEGER,
    "releaseDate" TIMESTAMP(3),
    "runtime" INTEGER,
    "poster" TEXT,
    "hero" TEXT,
    "trailerUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "franchiseId" TEXT,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "biography" TEXT,
    "origin" TEXT,
    "image" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "franchiseId" TEXT,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "category" TEXT,
    "image" TEXT,
    "imageAlt" TEXT,
    "price" DECIMAL(10,2),
    "currency" CHAR(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "franchiseId" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Franchise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "AffiliateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistMovie" (
    "watchlistId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WatchlistMovie_pkey" PRIMARY KEY ("watchlistId","movieId")
);

-- CreateTable
CREATE TABLE "CollectionMovie" (
    "collectionId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "curatorNote" TEXT,

    CONSTRAINT "CollectionMovie_pkey" PRIMARY KEY ("collectionId","movieId")
);

-- CreateTable
CREATE TABLE "CollectionCharacter" (
    "collectionId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "curatorNote" TEXT,

    CONSTRAINT "CollectionCharacter_pkey" PRIMARY KEY ("collectionId","characterId")
);

-- CreateTable
CREATE TABLE "CollectionProduct" (
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "curatorNote" TEXT,

    CONSTRAINT "CollectionProduct_pkey" PRIMARY KEY ("collectionId","productId")
);

-- CreateTable
CREATE TABLE "CollectionFranchise" (
    "collectionId" TEXT NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "CollectionFranchise_pkey" PRIMARY KEY ("collectionId","franchiseId")
);

-- CreateTable
CREATE TABLE "CollectionTag" (
    "collectionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CollectionTag_pkey" PRIMARY KEY ("collectionId","tagId")
);

-- CreateTable
CREATE TABLE "MovieCharacter" (
    "movieId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "role" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "MovieCharacter_pkey" PRIMARY KEY ("movieId","characterId")
);

-- CreateTable
CREATE TABLE "MovieTag" (
    "movieId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "MovieTag_pkey" PRIMARY KEY ("movieId","tagId")
);

-- CreateTable
CREATE TABLE "CharacterTag" (
    "characterId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CharacterTag_pkey" PRIMARY KEY ("characterId","tagId")
);

-- CreateTable
CREATE TABLE "ProductTag" (
    "productId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("productId","tagId")
);

-- CreateTable
CREATE TABLE "ProductCharacter" (
    "productId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ProductCharacter_pkey" PRIMARY KEY ("productId","characterId")
);

-- CreateTable
CREATE TABLE "CollectionRelated" (
    "sourceCollectionId" TEXT NOT NULL,
    "targetCollectionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "CollectionRelated_pkey" PRIMARY KEY ("sourceCollectionId","targetCollectionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_status_idx" ON "Collection"("status");

-- CreateIndex
CREATE INDEX "Collection_featured_idx" ON "Collection"("featured");

-- CreateIndex
CREATE INDEX "Collection_seasonal_idx" ON "Collection"("seasonal");

-- CreateIndex
CREATE INDEX "Collection_type_idx" ON "Collection"("type");

-- CreateIndex
CREATE INDEX "Collection_slug_idx" ON "Collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_slug_key" ON "Movie"("slug");

-- CreateIndex
CREATE INDEX "Movie_status_idx" ON "Movie"("status");

-- CreateIndex
CREATE INDEX "Movie_featured_idx" ON "Movie"("featured");

-- CreateIndex
CREATE INDEX "Movie_franchiseId_idx" ON "Movie"("franchiseId");

-- CreateIndex
CREATE INDEX "Movie_slug_idx" ON "Movie"("slug");

-- CreateIndex
CREATE INDEX "Movie_releaseYear_idx" ON "Movie"("releaseYear");

-- CreateIndex
CREATE UNIQUE INDEX "Character_slug_key" ON "Character"("slug");

-- CreateIndex
CREATE INDEX "Character_status_idx" ON "Character"("status");

-- CreateIndex
CREATE INDEX "Character_featured_idx" ON "Character"("featured");

-- CreateIndex
CREATE INDEX "Character_franchiseId_idx" ON "Character"("franchiseId");

-- CreateIndex
CREATE INDEX "Character_slug_idx" ON "Character"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- CreateIndex
CREATE INDEX "Product_franchiseId_idx" ON "Product"("franchiseId");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_slug_key" ON "Franchise"("slug");

-- CreateIndex
CREATE INDEX "Franchise_slug_idx" ON "Franchise"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_slug_idx" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "AffiliateLink_productId_idx" ON "AffiliateLink"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_shareToken_key" ON "Watchlist"("shareToken");

-- CreateIndex
CREATE INDEX "Watchlist_shareToken_idx" ON "Watchlist"("shareToken");

-- CreateIndex
CREATE INDEX "WatchlistMovie_watchlistId_idx" ON "WatchlistMovie"("watchlistId");

-- CreateIndex
CREATE INDEX "WatchlistMovie_movieId_idx" ON "WatchlistMovie"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistMovie_watchlistId_sortOrder_key" ON "WatchlistMovie"("watchlistId", "sortOrder");

-- CreateIndex
CREATE INDEX "CollectionMovie_collectionId_idx" ON "CollectionMovie"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionMovie_movieId_idx" ON "CollectionMovie"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionMovie_collectionId_sortOrder_key" ON "CollectionMovie"("collectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "CollectionCharacter_collectionId_idx" ON "CollectionCharacter"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionCharacter_characterId_idx" ON "CollectionCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionCharacter_collectionId_sortOrder_key" ON "CollectionCharacter"("collectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "CollectionProduct_collectionId_idx" ON "CollectionProduct"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionProduct_productId_idx" ON "CollectionProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionProduct_collectionId_sortOrder_key" ON "CollectionProduct"("collectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "CollectionFranchise_collectionId_idx" ON "CollectionFranchise"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionFranchise_franchiseId_idx" ON "CollectionFranchise"("franchiseId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionFranchise_collectionId_sortOrder_key" ON "CollectionFranchise"("collectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "CollectionTag_collectionId_idx" ON "CollectionTag"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionTag_tagId_idx" ON "CollectionTag"("tagId");

-- CreateIndex
CREATE INDEX "MovieCharacter_movieId_idx" ON "MovieCharacter"("movieId");

-- CreateIndex
CREATE INDEX "MovieCharacter_characterId_idx" ON "MovieCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "MovieCharacter_movieId_sortOrder_key" ON "MovieCharacter"("movieId", "sortOrder");

-- CreateIndex
CREATE INDEX "MovieTag_movieId_idx" ON "MovieTag"("movieId");

-- CreateIndex
CREATE INDEX "MovieTag_tagId_idx" ON "MovieTag"("tagId");

-- CreateIndex
CREATE INDEX "CharacterTag_characterId_idx" ON "CharacterTag"("characterId");

-- CreateIndex
CREATE INDEX "CharacterTag_tagId_idx" ON "CharacterTag"("tagId");

-- CreateIndex
CREATE INDEX "ProductTag_productId_idx" ON "ProductTag"("productId");

-- CreateIndex
CREATE INDEX "ProductTag_tagId_idx" ON "ProductTag"("tagId");

-- CreateIndex
CREATE INDEX "ProductCharacter_productId_idx" ON "ProductCharacter"("productId");

-- CreateIndex
CREATE INDEX "ProductCharacter_characterId_idx" ON "ProductCharacter"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCharacter_productId_sortOrder_key" ON "ProductCharacter"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "CollectionRelated_sourceCollectionId_idx" ON "CollectionRelated"("sourceCollectionId");

-- CreateIndex
CREATE INDEX "CollectionRelated_targetCollectionId_idx" ON "CollectionRelated"("targetCollectionId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionRelated_sourceCollectionId_sortOrder_key" ON "CollectionRelated"("sourceCollectionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Movie" ADD CONSTRAINT "Movie_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateLink" ADD CONSTRAINT "AffiliateLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistMovie" ADD CONSTRAINT "WatchlistMovie_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistMovie" ADD CONSTRAINT "WatchlistMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMovie" ADD CONSTRAINT "CollectionMovie_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMovie" ADD CONSTRAINT "CollectionMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionCharacter" ADD CONSTRAINT "CollectionCharacter_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionCharacter" ADD CONSTRAINT "CollectionCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionProduct" ADD CONSTRAINT "CollectionProduct_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionProduct" ADD CONSTRAINT "CollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionFranchise" ADD CONSTRAINT "CollectionFranchise_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionFranchise" ADD CONSTRAINT "CollectionFranchise_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTag" ADD CONSTRAINT "CollectionTag_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTag" ADD CONSTRAINT "CollectionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieCharacter" ADD CONSTRAINT "MovieCharacter_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieCharacter" ADD CONSTRAINT "MovieCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieTag" ADD CONSTRAINT "MovieTag_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieTag" ADD CONSTRAINT "MovieTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterTag" ADD CONSTRAINT "CharacterTag_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterTag" ADD CONSTRAINT "CharacterTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCharacter" ADD CONSTRAINT "ProductCharacter_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCharacter" ADD CONSTRAINT "ProductCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRelated" ADD CONSTRAINT "CollectionRelated_sourceCollectionId_fkey" FOREIGN KEY ("sourceCollectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRelated" ADD CONSTRAINT "CollectionRelated_targetCollectionId_fkey" FOREIGN KEY ("targetCollectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
