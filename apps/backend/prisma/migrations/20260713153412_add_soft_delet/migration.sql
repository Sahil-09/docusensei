-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "chats_deletedAt_idx" ON "chats"("deletedAt");
