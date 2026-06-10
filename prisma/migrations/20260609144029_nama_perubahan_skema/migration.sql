/*
  Warnings:

  - Added the required column `stock` to the `Apd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Apd` ADD COLUMN `stock` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `username` VARCHAR(191) NOT NULL;
