import { prisma } from "@ats/shared/prisma"
import { Prisma, SkillReviewAction } from "../../generated/prisma/client"

export const createReviewLog = async (
  tx: Prisma.TransactionClient,
  data: {
    skillId: string
    action: SkillReviewAction
    comment?: string
    oldValue?: Prisma.InputJsonValue
    newValue?: Prisma.InputJsonValue
    reviewedById?: string
  }
) => {

  return tx.skillReviewLog.create({
    data: {
      skillId: data.skillId,
      action: data.action,
      comment: data.comment,
      oldValue: data.oldValue,
      newValue: data.newValue,
      reviewedById: data.reviewedById
    }
  })

}

export const getReviewLogsBySkillId = async (skillId: string) => {

  return prisma.skillReviewLog.findMany({
    where: {
      skillId
    },
    orderBy: {
      createdAt: "desc"
    }
  })

}