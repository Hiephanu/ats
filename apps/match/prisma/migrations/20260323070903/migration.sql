/*
  Warnings:

  - The values [MERGED] on the enum `SkillStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `reviewed_by_id` on the `skill` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('PARENT', 'CHILD', 'RELATED', 'ESSENTIAL');

-- CreateEnum
CREATE TYPE "SkillReviewAction" AS ENUM ('UPDATE', 'APPROVE', 'REJECT', 'ACTIVATE', 'DEACTIVATE');

-- AlterEnum
BEGIN;
CREATE TYPE "SkillStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE');
ALTER TABLE "public"."skill" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "skill" ALTER COLUMN "status" TYPE "SkillStatus_new" USING ("status"::text::"SkillStatus_new");
ALTER TYPE "SkillStatus" RENAME TO "SkillStatus_old";
ALTER TYPE "SkillStatus_new" RENAME TO "SkillStatus";
DROP TYPE "public"."SkillStatus_old";
ALTER TABLE "skill" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "skill" DROP COLUMN "reviewed_by_id";

-- CreateTable
CREATE TABLE "skill_relation" (
    "id" TEXT NOT NULL,
    "from_skill_id" TEXT NOT NULL,
    "to_skill_id" TEXT NOT NULL,
    "type" "RelationType" NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillReviewLog" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "action" "SkillReviewAction" NOT NULL DEFAULT 'UPDATE',
    "comment" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skill_relation_from_skill_id_idx" ON "skill_relation"("from_skill_id");

-- CreateIndex
CREATE INDEX "skill_relation_to_skill_id_idx" ON "skill_relation"("to_skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_relation_from_skill_id_to_skill_id_type_key" ON "skill_relation"("from_skill_id", "to_skill_id", "type");

-- CreateIndex
CREATE INDEX "SkillReviewLog_skillId_idx" ON "SkillReviewLog"("skillId");

-- AddForeignKey
ALTER TABLE "skill_relation" ADD CONSTRAINT "skill_relation_from_skill_id_fkey" FOREIGN KEY ("from_skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_relation" ADD CONSTRAINT "skill_relation_to_skill_id_fkey" FOREIGN KEY ("to_skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillReviewLog" ADD CONSTRAINT "SkillReviewLog_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
