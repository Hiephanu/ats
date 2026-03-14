import { prisma } from "@/libs/prisma"
import { SkillReviewAction, SkillStatus } from "@/generated/prisma/client"

import * as skillRepository from "../../data-access/skill.repository"
import * as skillReviewRepository from "../../data-access/skill-review.repository"

export const updateSkill = async (
    skillId: string,
    updateData: any,
    reviewerId: string,
    comment?: string
) => {

    const skill = await skillRepository.getSkillById(skillId)

    if (!skill) {
        throw new Error("Skill not found")
    }

    return prisma.$transaction(async (tx) => {

        const updated = await skillRepository.updateSkill(tx, skillId, updateData)

        await skillReviewRepository.createReviewLog(tx, {
            skillId,
            action: SkillReviewAction.UPDATE,
            comment,
            oldValue: skill,
            newValue: updated,
            reviewedById: reviewerId
        })

        return updated

    })

}

export const approveSkill = async (
    skillId: string,
    reviewerId: string,
    comment?: string
) => {

    const skill = await skillRepository.getSkillById(skillId)

    if (!skill) {
        throw new Error("Skill not found")
    }

    if (skill.status !== SkillStatus.PENDING) {
        throw new Error("Skill must be PENDING to approve")
    }

    return prisma.$transaction(async (tx) => {

        const updated = await skillRepository.updateSkillStatus(
            tx,
            skillId,
            SkillStatus.APPROVED
        )

        await skillReviewRepository.createReviewLog(tx, {
            skillId,
            action: SkillReviewAction.APPROVE,
            comment,
            oldValue: { status: skill.status },
            newValue: { status: SkillStatus.APPROVED },
            reviewedById: reviewerId
        })

        return updated

    })

}

export const rejectSkill = async (
    skillId: string,
    reviewerId: string,
    comment?: string
) => {

    const skill = await skillRepository.getSkillById(skillId)

    if (!skill) {
        throw new Error("Skill not found")
    }

    return prisma.$transaction(async (tx) => {

        const updated = await skillRepository.updateSkillStatus(
            tx,
            skillId,
            SkillStatus.REJECTED
        )

        await skillReviewRepository.createReviewLog(tx, {
            skillId,
            action: SkillReviewAction.REJECT,
            comment,
            oldValue: { status: skill.status },
            newValue: { status: SkillStatus.REJECTED },
            reviewedById: reviewerId
        })

        return updated

    })

}


export const activateSkill = async (
    skillId: string,
    reviewerId: string,
    comment?: string
) => {

    const skill = await skillRepository.getSkillById(skillId)

    if (!skill) {
        throw new Error("Skill not found")
    }

    if (skill.status !== SkillStatus.APPROVED) {
        throw new Error("Skill must be APPROVED before activation")
    }

    return prisma.$transaction(async (tx) => {

        const updated = await skillRepository.updateSkillStatus(
            tx,
            skillId,
            SkillStatus.ACTIVE
        )

        await skillReviewRepository.createReviewLog(tx, {
            skillId,
            action: SkillReviewAction.ACTIVATE,
            comment,
            oldValue: { status: skill.status },
            newValue: { status: SkillStatus.ACTIVE },
            reviewedById: reviewerId
        })

        return updated

    })

}