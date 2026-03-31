/*
  Warnings:

  - The `level` column on the `candidate_skill` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER');

-- AlterTable
ALTER TABLE "candidate_skill" ADD COLUMN     "confidence" DOUBLE PRECISION,
DROP COLUMN "level",
ADD COLUMN     "level" "SkillLevel";
