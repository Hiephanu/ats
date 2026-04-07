/*
  Warnings:

  - You are about to drop the `Skill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `occupation_aliases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `occupation_skills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `occupations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skill_aliases` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Skill" DROP CONSTRAINT "Skill_mergeIntoId_fkey";

-- DropForeignKey
ALTER TABLE "occupation_aliases" DROP CONSTRAINT "occupation_aliases_occupation_id_fkey";

-- DropForeignKey
ALTER TABLE "occupation_skills" DROP CONSTRAINT "occupation_skills_occupation_id_fkey";

-- DropForeignKey
ALTER TABLE "occupation_skills" DROP CONSTRAINT "occupation_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "occupations" DROP CONSTRAINT "occupations_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "skill_aliases" DROP CONSTRAINT "skill_aliases_skill_id_fkey";

-- DropTable
DROP TABLE "Skill";

-- DropTable
DROP TABLE "occupation_aliases";

-- DropTable
DROP TABLE "occupation_skills";

-- DropTable
DROP TABLE "occupations";

-- DropTable
DROP TABLE "skill_aliases";

-- CreateTable
CREATE TABLE "skill" (
    "id" TEXT NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "normalized_canonical" TEXT NOT NULL,
    "description" TEXT,
    "skill_type" TEXT,
    "reuse_level" TEXT,
    "status" "SkillStatus" NOT NULL DEFAULT 'PENDING',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "source_id" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "merge_into_id" TEXT,
    "created_by_id" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_alias" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "source" TEXT,
    "confidence" DOUBLE PRECISION,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_alias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation_skill" (
    "occupation_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "occupation_skill_pkey" PRIMARY KEY ("occupation_id","skill_id")
);

-- CreateTable
CREATE TABLE "candidate" (
    "id" TEXT NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_skill" (
    "candidate_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "level" TEXT,
    "years" DOUBLE PRECISION,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_skill_pkey" PRIMARY KEY ("candidate_id","skill_id")
);

-- CreateTable
CREATE TABLE "skill_merge_log" (
    "id" TEXT NOT NULL,
    "from_skill_id" TEXT NOT NULL,
    "to_skill_id" TEXT NOT NULL,
    "merged_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_merge_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_normalized_canonical_key" ON "skill"("normalized_canonical");

-- CreateIndex
CREATE INDEX "skill_normalized_canonical_idx" ON "skill"("normalized_canonical");

-- CreateIndex
CREATE INDEX "skill_status_idx" ON "skill"("status");

-- CreateIndex
CREATE INDEX "skill_usage_count_idx" ON "skill"("usage_count");

-- CreateIndex
CREATE INDEX "skill_alias_normalized_idx" ON "skill_alias"("normalized");

-- CreateIndex
CREATE INDEX "skill_alias_skill_id_idx" ON "skill_alias"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_alias_skill_id_normalized_key" ON "skill_alias"("skill_id", "normalized");

-- CreateIndex
CREATE INDEX "occupation_skill_skill_id_idx" ON "occupation_skill"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_email_key" ON "candidate"("email");

-- CreateIndex
CREATE INDEX "candidate_skill_skill_id_idx" ON "candidate_skill"("skill_id");

-- CreateIndex
CREATE INDEX "skill_merge_log_from_skill_id_idx" ON "skill_merge_log"("from_skill_id");

-- CreateIndex
CREATE INDEX "skill_merge_log_to_skill_id_idx" ON "skill_merge_log"("to_skill_id");

-- AddForeignKey
ALTER TABLE "skill" ADD CONSTRAINT "skill_merge_into_id_fkey" FOREIGN KEY ("merge_into_id") REFERENCES "skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_alias" ADD CONSTRAINT "skill_alias_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_skill" ADD CONSTRAINT "occupation_skill_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_skill" ADD CONSTRAINT "occupation_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_skill" ADD CONSTRAINT "candidate_skill_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_skill" ADD CONSTRAINT "candidate_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_merge_log" ADD CONSTRAINT "skill_merge_log_from_skill_id_fkey" FOREIGN KEY ("from_skill_id") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_merge_log" ADD CONSTRAINT "skill_merge_log_to_skill_id_fkey" FOREIGN KEY ("to_skill_id") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
