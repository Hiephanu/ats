-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "canonical" TEXT NOT NULL,
    "normalizedCanonical" TEXT NOT NULL,
    "skillType" TEXT,
    "reuseLevel" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillAlias" (
    "id" SERIAL NOT NULL,
    "skillId" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "SkillAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_normalizedCanonical_key" ON "Skill"("normalizedCanonical");

-- CreateIndex
CREATE INDEX "SkillAlias_normalized_idx" ON "SkillAlias"("normalized");

-- CreateIndex
CREATE INDEX "SkillAlias_skillId_idx" ON "SkillAlias"("skillId");

-- AddForeignKey
ALTER TABLE "SkillAlias" ADD CONSTRAINT "SkillAlias_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
