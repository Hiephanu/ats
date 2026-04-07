/*
  Warnings:

  - You are about to drop the `skill_hierarchy` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RelationType" ADD VALUE 'PARENT';
ALTER TYPE "RelationType" ADD VALUE 'CHILD';

-- DropForeignKey
ALTER TABLE "skill_hierarchy" DROP CONSTRAINT "skill_hierarchy_child_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "skill_hierarchy" DROP CONSTRAINT "skill_hierarchy_parent_skill_id_fkey";

-- DropTable
DROP TABLE "skill_hierarchy";
