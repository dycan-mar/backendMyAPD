DELETE FROM "Transaction" WHERE "apdId" IS NULL;
/*
  Warnings:

  - Made the column `apdId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "apdId" SET NOT NULL;
