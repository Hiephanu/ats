/*
  Warnings:

  - The values [PARENT,CHILD] on the enum `RelationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RelationType_new" AS ENUM ('RELATED', 'ESSENTIAL');
ALTER TABLE "skill_relation" ALTER COLUMN "type" TYPE "RelationType_new" USING ("type"::text::"RelationType_new");
ALTER TYPE "RelationType" RENAME TO "RelationType_old";
ALTER TYPE "RelationType_new" RENAME TO "RelationType";
DROP TYPE "public"."RelationType_old";
COMMIT;

-- CreateTable
CREATE TABLE "skill_hierarchy" (
    "id" TEXT NOT NULL,
    "parent_skill_id" TEXT NOT NULL,
    "child_skill_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_hierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skill_hierarchy_parent_skill_id_idx" ON "skill_hierarchy"("parent_skill_id");

-- CreateIndex
CREATE INDEX "skill_hierarchy_child_skill_id_idx" ON "skill_hierarchy"("child_skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_hierarchy_parent_skill_id_child_skill_id_key" ON "skill_hierarchy"("parent_skill_id", "child_skill_id");

-- AddForeignKey
ALTER TABLE "skill_hierarchy" ADD CONSTRAINT "skill_hierarchy_parent_skill_id_fkey" FOREIGN KEY ("parent_skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_hierarchy" ADD CONSTRAINT "skill_hierarchy_child_skill_id_fkey" FOREIGN KEY ("child_skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
