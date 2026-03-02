import { prisma } from "@/libs/prisma"

export const getSkillByAlias = (key: string) => {
    return prisma.skillAlias.findMany({
        where: {
            normalized: key
        }
    })
}