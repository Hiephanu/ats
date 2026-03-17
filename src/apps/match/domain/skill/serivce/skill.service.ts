import * as skillRepository from "../../../data-access/skill.repository";
import * as skillAliasRepository from "../../../data-access/skill-alias.repository";
import * as normalizeService from "../../normalize/normalize.service";
import { ResolveResult, SaveCandidateSkillsResponse } from "../dto/batch-skill.dto";
import { prisma } from "@/libs/prisma";
import { Prisma } from "@/generated/prisma/client";
import { SourceSkill } from "../enums/skill.enum";

export const batchResolveSkill = async (
  skills: string[]
): Promise<ResolveResult[]> => {

  if (!skills.length) return []

  const results: ResolveResult[] = skills.map(input => ({
    input,
    normalized: normalizeService.normalizeSkill(input)
  }))

  const uniqueNormalized = [...new Set(results.map(r => r.normalized))]
  const exactSkills =
    await skillRepository.getListMatchSkillByNormalizedCanonical(
      uniqueNormalized
    )
  const skillMap = new Map(
    exactSkills.map(s => [s.normalizedCanonical, s.id])
  )
  for (const r of results) {
    const skillId = skillMap.get(r.normalized)
    if (skillId) r.skillId = skillId
  }

  const remainAfterExact = results.filter(r => !r.skillId)
  if (remainAfterExact.length) {
    const aliasList =
      await skillAliasRepository.getListMatchSkillAliasByNormalizedCanonical(
        [...new Set(remainAfterExact.map(r => r.normalized))]
      )
    const aliasMap = new Map(
      aliasList.map(a => [a.normalized, a.skillId])
    )
    for (const r of remainAfterExact) {
      const skillId = aliasMap.get(r.normalized)
      if (skillId) r.skillId = skillId
    }
  }

  return results
}

export const saveCandidateSkills = async (
  candidateId: string,
  skills: string[]
): Promise<SaveCandidateSkillsResponse> => {

  const resolved = await batchResolveSkill(skills)

  const responseSkills: SaveCandidateSkillsResponse["skills"] = []

  await prisma.$transaction(async (tx) => {

    const skillIds: string[] = []

    for (const r of resolved) {
      let skillId = r.skillId
      let created = false
      if (!skillId) {
        const skill = await createSkill(tx, r.input, r.normalized, candidateId, SourceSkill.RESUME)
        skillId = skill.id
        created = true
      }
      skillIds.push(skillId)
      responseSkills.push({
        input: r.input,
        normalized: r.normalized,
        skillId,
        created
      })
    }

    const uniqueSkillIds = [...new Set(skillIds)]
    await tx.candidateSkill.createMany({
      data: uniqueSkillIds.map(skillId => ({
        candidateId,
        skillId
      })),
      skipDuplicates: true
    })

    const countMap = new Map<string, number>()

    for (const id of skillIds) {
      countMap.set(id, (countMap.get(id) || 0) + 1)
    }
    for (const [skillId, count] of countMap) {
      await tx.skill.update({
        where: { id: skillId },
        data: {
          usageCount: {
            increment: count
          }
        }
      })
    }
  })

  return {
    candidateId,
    skills: responseSkills
  }

}

export const createSkill = async (
  tx: Prisma.TransactionClient,
  rawSkill: string,
  normalized: string,
  createdById?: string,
  sourceId?: string
) => {
  return tx.skill.upsert({
    where: {
      normalizedCanonical: normalized
    },
    update: {},
    create: {
      canonicalName: rawSkill,
      normalizedCanonical: normalized,
      description: null,
      skillType: null,
      reuseLevel: null,
      status: "PENDING",
      usageCount: 0,
      isSystem: false,
      sourceId: sourceId ?? null,
      mergeIntoId: null,
      createdById: createdById ?? null
    }
  })
}