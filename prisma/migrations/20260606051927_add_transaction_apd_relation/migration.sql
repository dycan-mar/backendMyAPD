-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "apdId" INTEGER;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_apdId_fkey" FOREIGN KEY ("apdId") REFERENCES "Apd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
