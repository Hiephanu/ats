/*
  Warnings:

  - You are about to drop the `skills` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE', 'MERGED');

-- DropForeignKey
ALTER TABLE "occupation_skills" DROP CONSTRAINT "occupation_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "skill_aliases" DROP CONSTRAINT "skill_aliases_skill_id_fkey";

-- DropTable
DROP TABLE "skills";

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "normalizedCanonical" TEXT NOT NULL,
    "description" TEXT,
    "skillType" TEXT,
    "reuseLevel" TEXT,
    "status" "SkillStatus" NOT NULL DEFAULT 'PENDING',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "mergeIntoId" TEXT,
    "createdById" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_normalizedCanonical_key" ON "Skill"("normalizedCanonical");

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_mergeIntoId_fkey" FOREIGN KEY ("mergeIntoId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_aliases" ADD CONSTRAINT "skill_aliases_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_skills" ADD CONSTRAINT "occupation_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
