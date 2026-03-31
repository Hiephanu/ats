import instance from "@/libs/gemini.client";
import { extractQuerySkillsPrompt } from "@/libs/utils/prompt";
import { normalizeSkill } from "../../normalize/normalize.service";
import {
  findCandidatesBySkills,
  findSkillsByNormalizedNames,
  getSkillAliases,
  getSkillRelations,
} from "../../../data-access/match-query.repository";
import {
  CandidateSkillInput,
  RequiredSkillInput,
  SkillMatcher,
  RankedCandidate,
  SkillLevel,
} from "../core/skill-matcher";

const LEVEL_MAP: Record<string, SkillLevel> = {
  BEGINNER: SkillLevel.BEGINNER,
  INTERMEDIATE: SkillLevel.INTERMEDIATE,
  ADVANCED: SkillLevel.ADVANCED,
  EXPERT: SkillLevel.EXPERT,
  MASTER: SkillLevel.MASTER,
};

interface ExtractedSkillQuery {
  skill: string;
  normalizedSkill: string;
  years: number | null;
  minimumLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | "MASTER" | null;
  isMandatory: boolean;
}

interface LocalRequirement {
  skillId: string;
  normalizedCanonical: string;
  years: number | null;
  minimumLevel: SkillLevel | null;
  isMandatory: boolean;
}

export interface MatchQueryResult {
  query: string;
  extractedRequirements: ExtractedSkillQuery[];
  candidates: RankedCandidate[];
  totalFound: number;
  matchedCount: number;
}

export const matchCandidatesByQuery = async (query: string): Promise<MatchQueryResult> => {
  const extractedRequirements = await instance.generateJSON<ExtractedSkillQuery[]>(
    extractQuerySkillsPrompt(query)
  );

  const normalizedNames = extractedRequirements.map((r) => normalizeSkill(r.normalizedSkill));
  const dbSkills = await findSkillsByNormalizedNames(normalizedNames);

  const skillIdMap = new Map(dbSkills.map((s) => [s.normalizedCanonical.toLowerCase(), s]));
  const requirements: LocalRequirement[] = [];

  for (const req of extractedRequirements) {
    const normalized = normalizeSkill(req.normalizedSkill);
    const dbSkill = skillIdMap.get(normalized);
    if (dbSkill) {
      requirements.push({
        skillId: dbSkill.id,
        normalizedCanonical: dbSkill.normalizedCanonical,
        years: req.years,
        minimumLevel: req.minimumLevel ? LEVEL_MAP[req.minimumLevel] : null,
        isMandatory: req.isMandatory,
      });
    }
  }

  if (!requirements.length) {
    return {
      query,
      extractedRequirements,
      candidates: [],
      totalFound: 0,
      matchedCount: 0,
    };
  }

  const candidateSkillData = await findCandidatesBySkills(requirements);

  const skillIds = [...new Set(requirements.map((r) => r.skillId))];
  const aliases = await getSkillAliases(skillIds);
  const relations = await getSkillRelations(skillIds);

  const aliasMap = new Map<string, string[]>();
  for (const a of aliases) {
    const list = aliasMap.get(a.skillId) || [];
    list.push(a.normalized);
    aliasMap.set(a.skillId, list);
  }

  const relatedMap = new Map<string, string[]>();
  for (const r of relations) {
    if (r.type === "RELATED" || r.type === "PARENT" || r.type === "CHILD") {
      const list = relatedMap.get(r.fromSkillId) || [];
      list.push(r.toSkillId);
      relatedMap.set(r.fromSkillId, list);
    }
  }

  const candidateMap = new Map<string, CandidateSkillInput[]>();
  for (const cs of candidateSkillData) {
    const list = candidateMap.get(cs.candidateId) || [];
    const levelValue = cs.level ? LEVEL_MAP[cs.level] : null;
    list.push({
      skillId: cs.skillId,
      canonicalName: cs.skillName,
      normalizedCanonical: cs.normalizedCanonical,
      level: levelValue,
      years: cs.years,
      confidence: cs.confidence,
      aliases: aliasMap.get(cs.skillId) || [],
      relatedSkillIds: relatedMap.get(cs.skillId) || [],
    });
    candidateMap.set(cs.candidateId, list);
  }

  const requiredSkills: RequiredSkillInput[] = requirements.map((r) => ({
    skillId: r.skillId,
    canonicalName: r.normalizedCanonical,
    normalizedCanonical: r.normalizedCanonical,
    minimumLevel: r.minimumLevel || SkillLevel.INTERMEDIATE,
    minimumYears: r.years,
    weight: 1,
    mandatory: r.isMandatory,
    aliases: aliasMap.get(r.skillId) || [],
    relatedSkillIds: relatedMap.get(r.skillId) || [],
  }));

  const candidates = Array.from(candidateMap.entries()).map(([candidateId, skills]) => ({
    candidateId,
    skills,
  }));

  const ranked: RankedCandidate[] = candidates.map((c) => {
    const matcher = new SkillMatcher();
    const report = matcher.match(c.skills, requiredSkills);
    return { candidateId: c.candidateId, report, rank: 0 };
  });

  ranked.sort((a, b) => {
    if (a.report.passedMandatory !== b.report.passedMandatory) {
      return a.report.passedMandatory ? -1 : 1;
    }
    return b.report.totalScore - a.report.totalScore;
  });

  const rankedWithRank = ranked.map((r, i) => ({ ...r, rank: i + 1 }));

  return {
    query,
    extractedRequirements,
    candidates: rankedWithRank,
    totalFound: candidateMap.size,
    matchedCount: rankedWithRank.filter((r) => r.report.passedMandatory).length,
  };
};
