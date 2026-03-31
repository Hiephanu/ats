import * as normalizeService from "../../normalize/normalize.service";
import * as skillRepository from "@/apps/match/data-access/skill.repository";
import * as skillAliasRepository from "@/apps/match/data-access/skill-alias.repository";
import { Prisma, SkillLevel } from "@/generated/prisma/client";
import { z } from "zod";


export type ExtractedQuery = {
  skill: string;
  years: number | null;
  level: SkillLevel | null;
}

export const createOrUpdateSkillCandidate = async (
  tx: Prisma.TransactionClient,
  candidateId: string,
  skillId: string,
  level: SkillLevel,
  year: number,
  confidence: number
) => {
  return tx.candidateSkill.upsert({
    where: {
      candidateId_skillId: {
        candidateId,
        skillId,
      },
    },
    update: {
      level,
      years: year,
      confidence,
    },
    create: {
      candidateId,
      skillId,
      level,
      years: year,
      confidence,
      source: "LLM Parser",
    },
  });
};

export const createSkill = async (tx: Prisma.TransactionClient, canonicalName: string) => {
  const normalizedCanonicalName = normalizeService.normalizeSkill(canonicalName);

  const exsitingSkill = await skillRepository.getMatchSkillByNormalizedCanonical(normalizedCanonicalName);
  if (exsitingSkill) {
    return exsitingSkill.id;
  }

  const skillAlias = await skillAliasRepository.getSkillAliasByNormalize(normalizedCanonicalName);
  if (skillAlias) {
    return skillAlias.skillId;
  }

  const newSkill = await tx.skill.create({
    data: {
      canonicalName,
      normalizedCanonical: normalizedCanonicalName,
      status: "PENDING"
    }
  });

  return newSkill.id;
}