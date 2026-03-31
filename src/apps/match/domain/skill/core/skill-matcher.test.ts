// ============================================================
// skill-matcher.example.ts
// Full usage examples: single candidate, batch ranking,
// alias resolution, related-skill partial credit, gap analysis
// ============================================================

import {
    SkillMatcher,
    rankCandidates,
    formatReport,
    SkillLevel,
    CandidateSkillInput,
    RequiredSkillInput,
    DEFAULT_CONFIG,
} from './skill-matcher';

// ── Example 1: Single Candidate Match ─────────────────────────

const seniorBackendJobRequirements: RequiredSkillInput[] = [
    {
        skillId: 'skill-nestjs',
        canonicalName: 'NestJS',
        normalizedCanonical: 'nestjs',
        minimumLevel: SkillLevel.INTERMEDIATE,
        preferredLevel: SkillLevel.ADVANCED,
        minimumYears: 2,
        weight: 0.25,
        mandatory: true,
        aliases: ['nest.js', 'nest js'],
        relatedSkillIds: ['skill-nodejs', 'skill-express'],  // partial credit if has Node.js/Express
    },
    {
        skillId: 'skill-postgres',
        canonicalName: 'PostgreSQL',
        normalizedCanonical: 'postgresql',
        minimumLevel: SkillLevel.INTERMEDIATE,
        minimumYears: 2,
        weight: 0.20,
        mandatory: true,
        aliases: ['postgres', 'pg'],
    },
    {
        skillId: 'skill-docker',
        canonicalName: 'Docker',
        normalizedCanonical: 'docker',
        minimumLevel: SkillLevel.INTERMEDIATE,
        weight: 0.15,
        mandatory: true,
    },
    {
        skillId: 'skill-typescript',
        canonicalName: 'TypeScript',
        normalizedCanonical: 'typescript',
        minimumLevel: SkillLevel.ADVANCED,
        preferredLevel: SkillLevel.EXPERT,
        minimumYears: 3,
        weight: 0.20,
        mandatory: true,
        aliases: ['ts'],
    },
    {
        skillId: 'skill-kafka',
        canonicalName: 'Apache Kafka',
        normalizedCanonical: 'apache kafka',
        minimumLevel: SkillLevel.INTERMEDIATE,
        weight: 0.10,
        mandatory: false,
        aliases: ['kafka'],
    },
    {
        skillId: 'skill-kubernetes',
        canonicalName: 'Kubernetes',
        normalizedCanonical: 'kubernetes',
        minimumLevel: SkillLevel.BEGINNER,
        weight: 0.10,
        mandatory: false,
        aliases: ['k8s'],
    },
];

// Candidate A: Strong match
const candidateA_Skills: CandidateSkillInput[] = [
    {
        skillId: 'skill-nestjs',
        canonicalName: 'NestJS',
        normalizedCanonical: 'nestjs',
        level: SkillLevel.ADVANCED,
        years: 3,
        confidence: 0.95,
    },
    {
        skillId: 'skill-postgres',
        canonicalName: 'PostgreSQL',
        normalizedCanonical: 'postgresql',
        level: SkillLevel.EXPERT,
        years: 5,
        confidence: 0.9,
    },
    {
        skillId: 'skill-docker',
        canonicalName: 'Docker',
        normalizedCanonical: 'docker',
        level: SkillLevel.ADVANCED,
        years: 4,
        confidence: 0.92,
    },
    {
        skillId: 'skill-typescript',
        canonicalName: 'TypeScript',
        normalizedCanonical: 'typescript',
        level: SkillLevel.EXPERT,
        years: 4,
        confidence: 0.98,
    },
    // Does NOT have Kafka or Kubernetes (gaps in optional skills)
];

// Candidate B: Partial match — has Node.js (related to NestJS), uses alias "postgres"
const candidateB_Skills: CandidateSkillInput[] = [
    {
        skillId: 'skill-nodejs',       // related to NestJS requirement
        canonicalName: 'Node.js',
        normalizedCanonical: 'node.js',
        level: SkillLevel.EXPERT,
        years: 6,
        confidence: 0.9,
        relatedSkillIds: ['skill-nestjs', 'skill-express'],
    },
    {
        skillId: 'skill-postgres',
        canonicalName: 'PostgreSQL',
        normalizedCanonical: 'postgresql',
        level: SkillLevel.INTERMEDIATE,
        years: 2,
        confidence: 0.85,
        aliases: ['postgres', 'pg'],   // alias match test
    },
    {
        skillId: 'skill-docker',
        canonicalName: 'Docker',
        normalizedCanonical: 'docker',
        level: SkillLevel.BEGINNER,    // below INTERMEDIATE minimum → gap
        years: 0.5,
        confidence: 0.7,
    },
    {
        skillId: 'skill-typescript',
        canonicalName: 'TypeScript',
        normalizedCanonical: 'typescript',
        level: SkillLevel.INTERMEDIATE, // below ADVANCED minimum
        years: 1.5,                     // below 3yr minimum
        confidence: 0.8,
    },
    {
        skillId: 'skill-kafka',
        canonicalName: 'Apache Kafka',
        normalizedCanonical: 'apache kafka',
        level: SkillLevel.ADVANCED,
        years: 3,
        confidence: 0.88,
    },
];

// Candidate C: Does not meet mandatory requirements
const candidateC_Skills: CandidateSkillInput[] = [
    {
        skillId: 'skill-vue',
        canonicalName: 'Vue.js',
        normalizedCanonical: 'vue.js',
        level: SkillLevel.EXPERT,
        years: 5,
        confidence: 0.95,
    },
    {
        skillId: 'skill-php',
        canonicalName: 'PHP',
        normalizedCanonical: 'php',
        level: SkillLevel.MASTER,
        years: 8,
        confidence: 0.92,
    },
];

// ── Run Examples ────────────────────────────────────────────

export function runExamples() {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║     SKILL MATCHING ALGORITHM — EXAMPLES      ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // ── Example 1: Single match ────────────────────────────
    console.log('▶  Example 1: Candidate A (Strong Match)\n');
    const matcher = new SkillMatcher();
    const reportA = matcher.match(candidateA_Skills, seniorBackendJobRequirements);
    console.log(formatReport(reportA));

    console.log('\n▶  Example 2: Candidate B (Partial / Alias / Related)\n');
    const reportB = matcher.match(candidateB_Skills, seniorBackendJobRequirements);
    console.log(formatReport(reportB));

    console.log('\n▶  Example 3: Candidate C (Mostly Missing Skills)\n');
    const reportC = matcher.match(candidateC_Skills, seniorBackendJobRequirements);
    console.log(formatReport(reportC));

    // ── Example 4: Batch ranking ───────────────────────────
    console.log('\n▶  Example 4: Batch Candidate Ranking\n');
    const ranked = rankCandidates(
        [
            { candidateId: 'candidate-A', skills: candidateA_Skills },
            { candidateId: 'candidate-B', skills: candidateB_Skills },
            { candidateId: 'candidate-C', skills: candidateC_Skills },
        ],
        seniorBackendJobRequirements,
    );

    console.log('  Rank | Candidate     | Score  | Grade | Passed Mandatory');
    console.log('  -----|---------------|--------|-------|------------------');
    for (const r of ranked) {
        console.log(
            `  #${r.rank}   | ${r.candidateId.padEnd(13)} | ${(r.report.totalScore * 100).toFixed(1).padStart(5)}% | ${r.report.readinessGrade}     | ${r.report.passedMandatory ? '✓' : '✗'}`,
        );
    }

    // ── Example 5: Custom config (sigmoid years) ──────────
    console.log('\n▶  Example 5: Custom Config — Sigmoid Years Scoring\n');
    const sigMatcher = new SkillMatcher({
        yearsStrategy: 'sigmoid',
        weights: { level: 0.60, years: 0.25, confidence: 0.15 },
        aliasPenalty: 0.85,
        relatedSkillCredit: 0.40,
    });
    const reportASigmoid = sigMatcher.match(candidateA_Skills, seniorBackendJobRequirements);
    console.log(`  Candidate A score with sigmoid: ${(reportASigmoid.totalScore * 100).toFixed(1)}%`);
    console.log(`  Candidate A score with capped:  ${(reportA.totalScore * 100).toFixed(1)}%`);

    // ── Detailed breakdown for Candidate B ────────────────
    console.log('\n▶  Detailed skill-by-skill breakdown — Candidate B:\n');
    for (const d of reportB.details) {
        const status = d.matchType === 'none' ? '✗ MISSING' : d.meetsMinimum ? '✓ MET' : '⚠ BELOW MIN';
        console.log(
            `  ${status.padEnd(11)} ${d.requiredCanonicalName.padEnd(18)}` +
            ` via=${d.matchType.padEnd(8)}` +
            ` level=${d.levelScore.toFixed(2)}` +
            ` years=${d.yearsScore.toFixed(2)}` +
            ` raw=${d.rawScore.toFixed(2)}` +
            (d.mandatory ? ' [MANDATORY]' : ''),
        );
    }

    console.log('\n✅  All examples complete.\n');
}
