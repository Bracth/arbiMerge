-- CreateEnum
CREATE TYPE "AcquisitionType" AS ENUM ('CASH', 'STOCK', 'MIXED');

-- AlterTable
ALTER TABLE "Merger" ADD COLUMN     "acquisitionType" "AcquisitionType" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "cashAmount" DOUBLE PRECISION,
ADD COLUMN     "exchangeRatio" DOUBLE PRECISION;
