import { prisma } from "@ats/shared/prisma";
import { SkillLevel } from "../domain/skill/core/skill-matcher";

export interface CandidateSkillData {
  candidateId: string;
  candidateName: string | null;
  candidateEmail: string | null;
  skillId: string;
  skillName: string;
  normalizedCanonical: string;
  level: string | null;
  years: number | null;
  confidence: number | null;
}

export interface SkillQueryRequirement {
  skillId: string;
  normalizedCanonical: string;
  years: number | null;
  minimumLevel: string | null;
  isMandatory: boolean;
}

export const findCandidatesBySkills = async (
  requirements: SkillQueryRequirement[]
): Promise<CandidateSkillData[]> => {
  if (!requirements.length) return [];

  const skillIds = requirements.map((r) => r.skillId);
  if (!skillIds.length) return [];

  const candidates = await prisma.candidate.findMany({
    where: {
      candidateSkills: {
        some: {
          skillId: { in: skillIds },
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      candidateSkills: {
        select: {
          id: true,
          skillId: true,
          level: true,
          years: true,
          confidence: true,
          skill: {
            select: {
              id: true,
              canonicalName: true,
              normalizedCanonical: true,
              aliases: {
                select: {
                  normalized: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const result: CandidateSkillData[] = [];

  for (const candidate of candidates) {
    for (const cs of candidate.candidateSkills) {
      if (skillIds.includes(cs.skillId)) {
        result.push({
          candidateId: candidate.id,
          candidateName: candidate.fullName,
          candidateEmail: candidate.email,
          skillId: cs.skillId,
          skillName: cs.skill.canonicalName,
          normalizedCanonical: cs.skill.normalizedCanonical,
          level: cs.level,
          years: cs.years,
          confidence: cs.confidence,
        });
      }
    }
  }

  return result;
};

export const findSkillsByNormalizedNames = async (
  normalizedNames: string[]
) => {
  if (!normalizedNames.length) return [];

  return prisma.skill.findMany({
    where: {
      normalizedCanonical: { in: normalizedNames },
      status: "ACTIVE",
    },
    select: {
      id: true,
      canonicalName: true,
      normalizedCanonical: true,
    },
  });
};

export const getSkillAliases = async (skillIds: string[]) => {
  if (!skillIds.length) return [];

  return prisma.skillAlias.findMany({
    where: { skillId: { in: skillIds } },
    select: {
      skillId: true,
      normalized: true,
    },
  });
};

export const getSkillRelations = async (skillIds: string[]) => {
  if (!skillIds.length) return [];

  return prisma.skillRelation.findMany({
    where: {
      OR: [{ fromSkillId: { in: skillIds } }, { toSkillId: { in: skillIds } }],
    },
    select: {
      fromSkillId: true,
      toSkillId: true,
      type: true,
    },
  });
};
