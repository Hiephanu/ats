import { prisma } from "../../../libs/prisma";

export const getMatchSkillByNormalizedCanonical = async (key: string) => {
  return await prisma.skill.findMany({
    where: {
      normalizedCanonical: {
        contains: key
      }
    }
  })
}