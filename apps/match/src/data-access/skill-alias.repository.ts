import { ExactMatchSkillAliasDto } from "../domain/skill/dto/batch-skill.dto";
import { SkillAlias } from "../../generated/prisma/client";
import { prisma } from "src/libs/prisma";

export const getSkillAliasByNormalize = async (normalized: string): Promise<SkillAlias | null> => {
   return prisma.skillAlias.findFirst({
     where: {
      normalized
     },
   })
}

export const getListMatchSkillAliasByNormalizedCanonical = async (
  keys: string[]
): Promise<ExactMatchSkillAliasDto[]> => {
  if (!keys.length) return [];

  return prisma.skillAlias.findMany({
    where: {
      normalized: {
        in: keys,
      },
    },
    select: {
      id: true,
      normalized: true,
      skillId: true,
    },
  });
};