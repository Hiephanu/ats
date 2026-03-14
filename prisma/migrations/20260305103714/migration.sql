/*
  Warnings:

  - The primary key for the `skill_aliases` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "skill_aliases" DROP CONSTRAINT "skill_aliases_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "skill_aliases_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "skill_aliases_id_seq";
