import { prisma } from "../../../libs/prisma";
import { ExactMatchSkillDto } from "../domain/skill/dto/batch-skill.dto";
import { Skill, SkillStatus } from "@/generated/prisma/client"

export const getSkillById = async (skillId: string) => {
  return prisma.skill.findUnique({
    where: { id: skillId }
  })
}

export const updateSkill = async (
  tx: any,
  skillId: string,
  data: any
) => {
  return tx.skill.update({
    where: { id: skillId },
    data
  })
}

export const updateSkillStatus = async (
  tx: any,
  skillId: string,
  status: SkillStatus
) => {
  return tx.skill.update({
    where: { id: skillId },
    data: { status }
  })
}

export const getMatchSkillByNormalizedCanonical = async (key: string) : Promise<Skill> => {
  return await prisma.skill.findFirst({
    where: {
      normalizedCanonical: {
        equals: key
      }
    }
  })
}

export const getListMatchSkillByNormalizedCanonical = async (
  keys: string[]
): Promise<ExactMatchSkillDto[]> => {
  if (!keys.length) return [];

  return prisma.skill.findMany({
    where: {
      normalizedCanonical: {
        in: keys,
      },
      status: "ACTIVE",
    },
    select: {
      id: true,
      normalizedCanonical: true,
    },
  });
};