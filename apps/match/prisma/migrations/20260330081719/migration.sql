/*
  Warnings:

  - The primary key for the `candidate_skill` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[candidate_id,skill_id]` on the table `candidate_skill` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `candidate_skill` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "candidate_skill" DROP CONSTRAINT "candidate_skill_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "candidate_skill_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_skill_candidate_id_skill_id_key" ON "candidate_skill"("candidate_id", "skill_id");
