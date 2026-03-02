/*
  Warnings:

  - You are about to drop the column `isEssential` on the `occupation_skills` table. All the data in the column will be lost.
  - You are about to drop the column `canonicalName` on the `occupations` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `occupations` table. All the data in the column will be lost.
  - You are about to drop the column `normalizedCanonical` on the `occupations` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `occupations` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `occupations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `occupations` table. All the data in the column will be lost.
  - You are about to drop the column `canonicalName` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `normalizedCanonical` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `reuseLevel` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `skillType` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `skills` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[normalized_canonical]` on the table `occupations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[normalized_canonical]` on the table `skills` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `canonical_name` to the `occupations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `normalized_canonical` to the `occupations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `occupations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canonical_name` to the `skills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `normalized_canonical` to the `skills` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "occupations" DROP CONSTRAINT "occupations_parentId_fkey";

-- DropIndex
DROP INDEX "occupations_normalizedCanonical_key";

-- DropIndex
DROP INDEX "skills_normalizedCanonical_key";

-- AlterTable
ALTER TABLE "occupation_skills" DROP COLUMN "isEssential",
ADD COLUMN     "is_essential" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "occupations" DROP COLUMN "canonicalName",
DROP COLUMN "createdAt",
DROP COLUMN "normalizedCanonical",
DROP COLUMN "parentId",
DROP COLUMN "sourceId",
DROP COLUMN "updatedAt",
ADD COLUMN     "canonical_name" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "normalized_canonical" TEXT NOT NULL,
ADD COLUMN     "parent_id" TEXT,
ADD COLUMN     "source_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "skills" DROP COLUMN "canonicalName",
DROP COLUMN "createdAt",
DROP COLUMN "normalizedCanonical",
DROP COLUMN "reuseLevel",
DROP COLUMN "skillType",
DROP COLUMN "sourceId",
ADD COLUMN     "canonical_name" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "normalized_canonical" TEXT NOT NULL,
ADD COLUMN     "reuse_level" TEXT,
ADD COLUMN     "skill_type" TEXT,
ADD COLUMN     "source_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "occupations_normalized_canonical_key" ON "occupations"("normalized_canonical");

-- CreateIndex
CREATE UNIQUE INDEX "skills_normalized_canonical_key" ON "skills"("normalized_canonical");

-- AddForeignKey
ALTER TABLE "occupations" ADD CONSTRAINT "occupations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "occupations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
