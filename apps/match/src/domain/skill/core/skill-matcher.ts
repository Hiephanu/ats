// ============================================================
// skill-matcher.ts
// Skill Matching Algorithm — Candidate vs Occupation/Profile
// Handles: level scoring, years weighting, alias resolution,
//          related-skill partial credit, gap analysis
// ============================================================

// ── Enums (mirror Prisma schema) ────────────────────────────

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
  MASTER = 'MASTER',
}

// Ordinal mapping for arithmetic comparisons
const LEVEL_ORDINAL: Record<SkillLevel, number> = {
  [SkillLevel.BEGINNER]: 1,
  [SkillLevel.INTERMEDIATE]: 2,
  [SkillLevel.ADVANCED]: 3,
  [SkillLevel.EXPERT]: 4,
  [SkillLevel.MASTER]: 5,
};

// ── Input Types ──────────────────────────────────────────────

/**
 * One skill entry from CandidateSkill (what the candidate has).
 */
export interface CandidateSkillInput {
  skillId: string;
  canonicalName: string;           // denormalized for readability
  normalizedCanonical: string;
  level: SkillLevel | null;
  years: number | null;            // Float in schema
  confidence: number | null;       // 0–1, pipeline-assigned
  aliases?: string[];              // from SkillAlias[]
  relatedSkillIds?: string[];      // from SkillRelation (outgoing)
}

/**
 * One skill requirement from an Occupation or Job profile.
 */
export interface RequiredSkillInput {
  skillId: string;
  canonicalName: string;
  normalizedCanonical: string;
  minimumLevel: SkillLevel;        // minimum acceptable level
  preferredLevel?: SkillLevel;     // bonus target level
  minimumYears?: number;           // optional years gate
  weight: number;                  // 0–1, importance to the role
  mandatory: boolean;              // if true, absence = hard penalty
  aliases?: string[];
  relatedSkillIds?: string[];
}

// ── Output Types ─────────────────────────────────────────────

export interface SkillMatchDetail {
  requiredSkillId: string;
  requiredCanonicalName: string;
  matchType: 'exact' | 'alias' | 'related' | 'none';

  // The candidate skill that satisfied this requirement (if any)
  matchedCandidateSkillId: string | null;
  matchedCanonicalName: string | null;

  // Scores
  levelScore: number;              // 0–1: how well level matches
  yearsScore: number;              // 0–1: how well years matches
  confidenceScore: number;         // 0–1: pipeline confidence in extraction
  rawScore: number;                // weighted composite before role weight
  weightedScore: number;           // rawScore × requirement.weight

  // Deltas
  levelDelta: number;              // candidate level ordinal − minimum ordinal
  yearsDelta: number | null;       // candidate years − minimum years (null if no req)

  // Flags
  mandatory: boolean;
  meetsMinimum: boolean;           // true if levelDelta >= 0 AND years gate passed
  exceedsPreferred: boolean;
  isGap: boolean;                  // true if matchType === 'none' or not meetsMinimum
}

export interface MatchReport {
  // Overall
  totalScore: number;              // 0–1, final weighted average
  mandatoryScore: number;          // score across mandatory-only skills
  optionalScore: number;           // score across optional skills

  // Breakdown
  details: SkillMatchDetail[];
  gaps: SkillMatchDetail[];        // details where isGap === true
  strengths: SkillMatchDetail[];   // details where matchedScore > 0.8
  overqualifications: SkillMatchDetail[]; // levelDelta >= 2

  // Counts
  totalRequired: number;
  totalMatched: number;
  totalMandatoryRequired: number;
  totalMandatoryMet: number;

  // Readiness
  readinessGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  passedMandatory: boolean;        // false = hard disqualification
}

// ── Config ───────────────────────────────────────────────────

export interface MatcherConfig {
  /**
   * Weight distribution for rawScore calculation.
   * Must sum to 1.0.
   */
  weights: {
    level: number;       // default 0.50
    years: number;       // default 0.30
    confidence: number;  // default 0.20
  };

  /**
   * Multiplier applied when the match is via alias (not exact canonical).
   * Slight penalty since aliases can be imprecise. Default 0.90.
   */
  aliasPenalty: number;

  /**
   * Multiplier for related-skill partial credit.
   * e.g. candidate has Node.js, job requires NestJS → partial credit.
   * Default 0.50.
   */
  relatedSkillCredit: number;

  /**
   * Years scoring strategy.
   * - 'linear'   : score = min(candidate / required, 1)
   * - 'capped'   : linear but capped at 1.0 (no bonus for over-experience)
   * - 'sigmoid'  : smooth S-curve, rewards meeting target, tapers beyond 2×
   */
  yearsStrategy: 'linear' | 'capped' | 'sigmoid';

  /**
   * If candidate years data is missing, what fallback score to use (0–1).
   * Default 0.5 (neutral).
   */
  missingYearsFallback: number;

  /**
   * Grade thresholds for totalScore.
   */
  gradeThresholds: {
    A: number;   // >= this → A  (default 0.85)
    B: number;   // >= this → B  (default 0.70)
    C: number;   // >= this → C  (default 0.55)
    D: number;   // >= this → D  (default 0.40)
    // else → F
  };
}

export const DEFAULT_CONFIG: MatcherConfig = {
  weights: { level: 0.50, years: 0.30, confidence: 0.20 },
  aliasPenalty: 0.90,
  relatedSkillCredit: 0.50,
  yearsStrategy: 'capped',
  missingYearsFallback: 0.5,
  gradeThresholds: { A: 0.85, B: 0.70, C: 0.55, D: 0.40 },
};

// ── Core Scorer Helpers ───────────────────────────────────────

/**
 * Score how well the candidate's level satisfies the requirement.
 *
 * - Below minimum  → proportional penalty  (never 0; floor at 0.1 for near misses)
 * - At minimum     → 0.7 base
 * - At preferred   → 1.0
 * - Between        → linear interpolation
 * - Above minimum with no preferred → bonus up to 1.0, diminishing beyond +2
 */
function scoreLevelMatch(
  candidateLevel: SkillLevel | null,
  minimumLevel: SkillLevel,
  preferredLevel?: SkillLevel,
): number {
  if (!candidateLevel) return 0.3; // unknown level → low but not zero

  const candidateOrd = LEVEL_ORDINAL[candidateLevel];
  const minOrd = LEVEL_ORDINAL[minimumLevel];
  const prefOrd = preferredLevel ? LEVEL_ORDINAL[preferredLevel] : minOrd + 1;

  if (candidateOrd < minOrd) {
    // Below minimum: score = 0.1 + 0.6 × (candidateOrd / minOrd)
    // approaches 0.7 as candidate approaches minimum
    return Math.max(0.05, 0.1 + 0.6 * (candidateOrd / minOrd));
  }

  if (candidateOrd >= prefOrd) {
    return 1.0;
  }

  // Between min and preferred: linear 0.7 → 1.0
  const span = prefOrd - minOrd;
  const progress = candidateOrd - minOrd;
  return 0.7 + 0.3 * (progress / span);
}

/**
 * Score how well candidate's years satisfy the requirement.
 */
function scoreYears(
  candidateYears: number | null,
  requiredYears: number | undefined,
  strategy: MatcherConfig['yearsStrategy'],
  fallback: number,
): number {
  if (!requiredYears || requiredYears <= 0) return 1.0; // no years gate
  if (candidateYears === null || candidateYears === undefined) return fallback;

  const ratio = candidateYears / requiredYears;

  switch (strategy) {
    case 'linear':
      return Math.min(ratio, 1.5) / 1.5; // allow 50% bonus beyond requirement

    case 'capped':
      return Math.min(ratio, 1.0);

    case 'sigmoid': {
      // S-curve: 0.5 at 0 years, 0.9 at requirement, tapers to 1.0
      // f(x) = 1 / (1 + e^(-k*(x - x0)))  where x = ratio, x0 = 1, k = 4
      const k = 4;
      const x0 = 1;
      return 1 / (1 + Math.exp(-k * (ratio - x0)));
    }
  }
}

// ── Lookup / Resolution ────────────────────────────────────────

type MatchResult =
  | { type: 'exact' | 'alias'; skill: CandidateSkillInput }
  | { type: 'related'; skill: CandidateSkillInput }
  | { type: 'none' };

/**
 * Find the best candidate skill that satisfies a required skill.
 * Priority: exact canonical → alias → related skill
 */
function resolveMatch(
  required: RequiredSkillInput,
  candidateMap: Map<string, CandidateSkillInput>,       // keyed by normalizedCanonical
  candidateAliasMaps: Map<string, CandidateSkillInput>, // keyed by normalised alias
  candidateById: Map<string, CandidateSkillInput>,      // keyed by skillId
): MatchResult {
  // 1. Exact canonical match
  const exact = candidateMap.get(required.normalizedCanonical);
  if (exact) return { type: 'exact', skill: exact };

  // 2. Alias match — candidate has an alias that equals required canonical
  //    OR required has an alias that equals candidate canonical
  for (const alias of required.aliases ?? []) {
    const normalized = alias.toLowerCase().trim();
    const found = candidateMap.get(normalized) ?? candidateAliasMaps.get(normalized);
    if (found) return { type: 'alias', skill: found };
  }
  // Also check if any candidate alias matches required canonical
  const byAlias = candidateAliasMaps.get(required.normalizedCanonical);
  if (byAlias) return { type: 'alias', skill: byAlias };

  // 3. Related skill match — candidate has a skill listed in required's relatedSkillIds
  for (const relId of required.relatedSkillIds ?? []) {
    const rel = candidateById.get(relId);
    if (rel) return { type: 'related', skill: rel };
  }
  // Also: required skill is in a candidate's relatedSkillIds
  for (const [, candidate] of candidateById) {
    if (candidate.relatedSkillIds?.includes(required.skillId)) {
      return { type: 'related', skill: candidate };
    }
  }

  return { type: 'none' };
}

// ── Main Matcher ───────────────────────────────────────────────

export class SkillMatcher {
  private config: MatcherConfig;

  constructor(config: Partial<MatcherConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      weights: { ...DEFAULT_CONFIG.weights, ...config.weights },
      gradeThresholds: { ...DEFAULT_CONFIG.gradeThresholds, ...config.gradeThresholds },
    };

    const { level, years, confidence } = this.config.weights;
    if (Math.abs(level + years + confidence - 1.0) > 0.001) {
      throw new Error(
        `MatcherConfig.weights must sum to 1.0 (got ${level + years + confidence})`,
      );
    }
  }

  /**
   * Match a candidate's skill set against a list of required skills.
   *
   * @param candidateSkills  - Skills from CandidateSkill[] for one candidate
   * @param requiredSkills   - Required skills from an Occupation/Job profile
   * @returns                  Full MatchReport
   */
  match(
    candidateSkills: CandidateSkillInput[],
    requiredSkills: RequiredSkillInput[],
  ): MatchReport {
    // ── Build lookup maps ──────────────────────────────────
    const candidateMap = new Map<string, CandidateSkillInput>();
    const candidateAliasMaps = new Map<string, CandidateSkillInput>();
    const candidateById = new Map<string, CandidateSkillInput>();

    for (const cs of candidateSkills) {
      candidateMap.set(cs.normalizedCanonical, cs);
      candidateById.set(cs.skillId, cs);
      for (const alias of cs.aliases ?? []) {
        candidateAliasMaps.set(alias.toLowerCase().trim(), cs);
      }
    }

    // ── Score each required skill ──────────────────────────
    const details: SkillMatchDetail[] = [];
    const { weights, aliasPenalty, relatedSkillCredit, yearsStrategy, missingYearsFallback } =
      this.config;

    for (const req of requiredSkills) {
      const matchResult = resolveMatch(req, candidateMap, candidateAliasMaps, candidateById);

      if (matchResult.type === 'none') {
        // No match found
        details.push({
          requiredSkillId: req.skillId,
          requiredCanonicalName: req.canonicalName,
          matchType: 'none',
          matchedCandidateSkillId: null,
          matchedCanonicalName: null,
          levelScore: 0,
          yearsScore: 0,
          confidenceScore: 0,
          rawScore: 0,
          weightedScore: 0,
          levelDelta: -(LEVEL_ORDINAL[req.minimumLevel]),
          yearsDelta: req.minimumYears != null ? -(req.minimumYears) : null,
          mandatory: req.mandatory,
          meetsMinimum: false,
          exceedsPreferred: false,
          isGap: true,
        });
        continue;
      }

      const { skill, type } = matchResult;

      // ── Sub-scores ───────────────────────────────────────
      const levelScore = scoreLevelMatch(skill.level, req.minimumLevel, req.preferredLevel);

      const yearsScore = scoreYears(
        skill.years,
        req.minimumYears,
        yearsStrategy,
        missingYearsFallback,
      );

      const confidenceScore = skill.confidence ?? 1.0; // if no pipeline confidence, trust fully

      // ── Composite raw score ──────────────────────────────
      let rawScore =
        levelScore * weights.level +
        yearsScore * weights.years +
        confidenceScore * weights.confidence;

      // Apply match-type multiplier
      if (type === 'alias') rawScore *= aliasPenalty;
      if (type === 'related') rawScore *= relatedSkillCredit;

      rawScore = Math.min(rawScore, 1.0);

      const weightedScore = rawScore * req.weight;

      // ── Deltas ────────────────────────────────────────────
      const candidateOrd = skill.level ? LEVEL_ORDINAL[skill.level] : 0;
      const minOrd = LEVEL_ORDINAL[req.minimumLevel];
      const levelDelta = candidateOrd - minOrd;

      const yearsDelta =
        req.minimumYears != null
          ? (skill.years ?? 0) - req.minimumYears
          : null;

      // ── Gate checks ───────────────────────────────────────
      const meetsMinimum =
        levelDelta >= 0 && (req.minimumYears == null || (skill.years ?? 0) >= req.minimumYears);

      const prefOrd = req.preferredLevel ? LEVEL_ORDINAL[req.preferredLevel] : minOrd;
      const exceedsPreferred = candidateOrd >= prefOrd && meetsMinimum;

      details.push({
        requiredSkillId: req.skillId,
        requiredCanonicalName: req.canonicalName,
        matchType: type,
        matchedCandidateSkillId: skill.skillId,
        matchedCanonicalName: skill.canonicalName,
        levelScore,
        yearsScore,
        confidenceScore,
        rawScore,
        weightedScore,
        levelDelta,
        yearsDelta,
        mandatory: req.mandatory,
        meetsMinimum,
        exceedsPreferred,
        isGap: !meetsMinimum,
      });
    }

    // ── Aggregate ─────────────────────────────────────────
    return this.aggregate(details, requiredSkills);
  }

  private aggregate(
    details: SkillMatchDetail[],
    required: RequiredSkillInput[],
  ): MatchReport {
    const totalWeightSum = required.reduce((s, r) => s + r.weight, 0) || 1;

    // Weighted average score
    const totalScore =
      details.reduce((s, d) => s + d.weightedScore, 0) / totalWeightSum;

    // Mandatory sub-score
    const mandatoryDetails = details.filter((d) => d.mandatory);
    const mandatoryWeightSum =
      required.filter((r) => r.mandatory).reduce((s, r) => s + r.weight, 0) || 1;
    const mandatoryScore =
      mandatoryDetails.reduce((s, d) => s + d.weightedScore, 0) / mandatoryWeightSum;

    // Optional sub-score
    const optionalDetails = details.filter((d) => !d.mandatory);
    const optionalWeightSum =
      required.filter((r) => !r.mandatory).reduce((s, r) => s + r.weight, 0) || 1;
    const optionalScore =
      optionalDetails.reduce((s, d) => s + d.weightedScore, 0) / optionalWeightSum;

    const gaps = details.filter((d) => d.isGap);
    const strengths = details.filter((d) => d.rawScore >= 0.8 && !d.isGap);
    const overqualifications = details.filter((d) => d.levelDelta >= 2);

    const passedMandatory = mandatoryDetails.every((d) => d.meetsMinimum);

    const { gradeThresholds: g } = this.config;
    const readinessGrade = !passedMandatory
      ? 'F'
      : totalScore >= g.A
        ? 'A'
        : totalScore >= g.B
          ? 'B'
          : totalScore >= g.C
            ? 'C'
            : totalScore >= g.D
              ? 'D'
              : 'F';

    return {
      totalScore: round(totalScore),
      mandatoryScore: round(mandatoryScore),
      optionalScore: round(optionalScore),
      details,
      gaps,
      strengths,
      overqualifications,
      totalRequired: required.length,
      totalMatched: details.filter((d) => d.matchType !== 'none').length,
      totalMandatoryRequired: required.filter((r) => r.mandatory).length,
      totalMandatoryMet: mandatoryDetails.filter((d) => d.meetsMinimum).length,
      readinessGrade,
      passedMandatory,
    };
  }
}

// ── Batch Matcher (rank multiple candidates) ───────────────────

export interface RankedCandidate {
  candidateId: string;
  report: MatchReport;
  rank: number;
}

/**
 * Rank multiple candidates against the same occupation/job profile.
 * Returns sorted list, best match first.
 */
export function rankCandidates(
  candidates: Array<{ candidateId: string; skills: CandidateSkillInput[] }>,
  requiredSkills: RequiredSkillInput[],
  config?: Partial<MatcherConfig>,
): RankedCandidate[] {
  const matcher = new SkillMatcher(config);

  const ranked = candidates
    .map(({ candidateId, skills }) => ({
      candidateId,
      report: matcher.match(skills, requiredSkills),
    }))
    // Sort: passedMandatory first, then by totalScore desc
    .sort((a, b) => {
      if (a.report.passedMandatory !== b.report.passedMandatory) {
        return a.report.passedMandatory ? -1 : 1;
      }
      return b.report.totalScore - a.report.totalScore;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return ranked;
}

// ── Utilities ─────────────────────────────────────────────────

function round(n: number, decimals = 4): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}

/**
 * Quick summary string for logging / debugging.
 */
export function formatReport(report: MatchReport): string {
  const lines: string[] = [
    `─────────────────────────────────────────`,
    `  Grade        : ${report.readinessGrade}`,
    `  Total Score  : ${(report.totalScore * 100).toFixed(1)}%`,
    `  Mandatory    : ${report.totalMandatoryMet}/${report.totalMandatoryRequired} met  (score: ${(report.mandatoryScore * 100).toFixed(1)}%)`,
    `  Matched      : ${report.totalMatched}/${report.totalRequired} skills`,
    `  Passed Hard Gate: ${report.passedMandatory ? '✓' : '✗ DISQUALIFIED'}`,
    ``,
    `  GAPS (${report.gaps.length}):`,
    ...report.gaps.map(
      (g) =>
        `    ✗ ${g.requiredCanonicalName}${g.mandatory ? ' [MANDATORY]' : ''} — levelDelta: ${g.levelDelta}`,
    ),
    ``,
    `  STRENGTHS (${report.strengths.length}):`,
    ...report.strengths.map(
      (s) => `    ✓ ${s.matchedCanonicalName} → ${s.requiredCanonicalName} (${(s.rawScore * 100).toFixed(0)}%)`,
    ),
    `─────────────────────────────────────────`,
  ];
  return lines.join('\n');
}