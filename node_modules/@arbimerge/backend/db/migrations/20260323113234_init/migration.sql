-- CreateEnum
CREATE TYPE "MergerStatus" AS ENUM ('ANNOUNCED', 'PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Merger" (
    "id" TEXT NOT NULL,
    "targetTicker" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerTicker" TEXT,
    "offerPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "MergerStatus" NOT NULL DEFAULT 'PENDING',
    "announcedDate" TIMESTAMP(3) NOT NULL,
    "expectedClosingDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Merger_targetTicker_key" ON "Merger"("targetTicker");

-- CreateIndex
CREATE INDEX "Merger_status_idx" ON "Merger"("status");
