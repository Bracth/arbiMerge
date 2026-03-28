/*
  Warnings:

  - The `expectedClosingDate` column on the `Merger` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Merger" DROP COLUMN "expectedClosingDate",
ADD COLUMN     "expectedClosingDate" TIMESTAMP(3);
