/*
  Warnings:

  - You are about to drop the `Skill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SkillAlias` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SkillAlias" DROP CONSTRAINT "SkillAlias_skillId_fkey";

-- DropTable
DROP TABLE "Skill";

-- DropTable
DROP TABLE "SkillAlias";

-- CreateTable
CREATE TABLE "occupations" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "canonicalName" TEXT NOT NULL,
    "normalizedCanonical" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "canonicalName" TEXT NOT NULL,
    "normalizedCanonical" TEXT NOT NULL,
    "skillType" TEXT,
    "reuseLevel" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation_aliases" (
    "id" SERIAL NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "occupation_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_aliases" (
    "id" SERIAL NOT NULL,
    "skill_id" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,

    CONSTRAINT "skill_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation_skills" (
    "occupation_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "isEssential" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "occupation_skills_pkey" PRIMARY KEY ("occupation_id","skill_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "occupations_normalizedCanonical_key" ON "occupations"("normalizedCanonical");

-- CreateIndex
CREATE UNIQUE INDEX "skills_normalizedCanonical_key" ON "skills"("normalizedCanonical");

-- CreateIndex
CREATE INDEX "occupation_aliases_normalized_idx" ON "occupation_aliases"("normalized");

-- CreateIndex
CREATE INDEX "skill_aliases_normalized_idx" ON "skill_aliases"("normalized");

-- AddForeignKey
ALTER TABLE "occupations" ADD CONSTRAINT "occupations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "occupations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_aliases" ADD CONSTRAINT "occupation_aliases_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_aliases" ADD CONSTRAINT "skill_aliases_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_skills" ADD CONSTRAINT "occupation_skills_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_skills" ADD CONSTRAINT "occupation_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
