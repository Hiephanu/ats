import { SkillLevel } from "@/generated/prisma/enums";
import instance from "@/libs/gemini.client";
import { prisma } from "@/libs/prisma";
import { streamCsv } from "@/libs/utils/csv-util";
import { BATCH_SIZE_IMPORT_SKILL } from "@/libs/utils/instance-util";
import * as processFileUtil from "@/libs/utils/procress-file";
import { structuredSkillPrompt } from "@/libs/utils/prompt";
import * as skillService from "@/apps/match/domain/skill/serivce/skill.service";

export type LlmSkill = {
    name: string; 
    confidence: number;
    year: number | null;             
    level: SkillLevel | null;   
  };

export const importCvData = async (candidateId) => {
    const cvData = await processFileUtil.parseText("/Users/hiepdv/Workspace/own/ats/public/cv/Đoàn Văn Hiệp CV.pdf");
    const structuredData: LlmSkill[] = await instance.generateJSON(structuredSkillPrompt(cvData))
    for (const skill of structuredData) {
        await prisma.$transaction(async (tx) => {
            const skillId = await skillService.createSkill(tx, skill.name);
            await skillService.createOrUpdateSkillCandidate(tx, candidateId, skillId, skill.level, skill.year, skill.confidence);
        })
    }

    return structuredData;
}

export const importEsco = async () => {
    let buffer: any[] = [];

    await streamCsv('/Users/hiepdv/Workspace/own/ats/data/ESCO dataset - v1.2.1 - classification - en - csv/skills_en.csv',
        async (row) => {
            buffer.push(row);
            if (buffer.length >= BATCH_SIZE_IMPORT_SKILL) {
                processBatch(buffer);
                buffer = [];
            }
        }
    )

    if (buffer.length > 0) {
        processBatch(buffer);
    }
}

export const importSkillRelationEsco = async () => {
    const skillMap = await buildSkillMap() // sourceId → skillId

    let buffer: any[] = []

    await streamCsv(
        "/Users/hiepdv/Workspace/own/ats/data/ESCO dataset - v1.2.1 - classification - en - csv/skillSkillRelations_en.csv",
        async (row) => {
            buffer.push(row)

            if (buffer.length >= BATCH_SIZE_IMPORT_SKILL) {
                await processRelationBatch(buffer, skillMap)
                buffer = []
            }
        }
    )

    // flush
    if (buffer.length > 0) {
        await processRelationBatch(buffer, skillMap)
    }

    console.log("Import relations done 🚀")
}

async function processBatch(rows: any[]) {
    const skills: any[] = []
    const aliases: any[] = []

    for (const row of rows) {
        const sourceId = extractId(row.conceptUri)
        const canonicalName = row.preferredLabel

        const normalizedCanonical = normalize(canonicalName)

        skills.push({
            canonicalName,
            normalizedCanonical,
            description: row.description,
            skillType: row.skillType,
            reuseLevel: row.reuseLevel,
            sourceId,
            isSystem: true
        })

        const aliasList = splitAliases(row.altLabels)

        for (const alias of aliasList) {
            aliases.push({
                raw: alias,
                normalized: normalize(alias),
                source: "ESCO",
                sourceId
            })
        }
    }

    await prisma.skill.createMany({
        data: skills,
        skipDuplicates: true
    })

    const insertedSkills = await prisma.skill.findMany({
        where: {
            normalizedCanonical: {
                in: skills.map(s => s.normalizedCanonical)
            }
        },
        select: {
            id: true,
            sourceId: true
        }
    })

    const map = new Map(insertedSkills.map(s => [s.sourceId, s.id]))

    const aliasData = aliases
        .map(a => ({
            skillId: map.get(a.sourceId),
            raw: a.raw,
            normalized: a.normalized,
            source: a.source
        }))
        .filter(a => a.skillId)

    await prisma.skillAlias.createMany({
        data: aliasData,
        skipDuplicates: true
    })
}

async function processRelationBatch(
    rows: any[],
    skillMap: Map<string, string>
) {
    const relations: any[] = []

    for (const row of rows) {
        const fromSourceId = extractId(row.originalSkillUri)
        const toSourceId = extractId(row.relatedSkillUri)

        const fromSkillId = skillMap.get(fromSourceId)
        const toSkillId = skillMap.get(toSourceId)

        if (!fromSkillId || !toSkillId) continue

        if (fromSkillId === toSkillId) continue

        relations.push({
            fromSkillId,
            toSkillId,
            type: mapRelationType(row.relationType),
            source: "ESCO"
        })
    }

    if (relations.length === 0) return

    await prisma.skillRelation.createMany({
        data: relations,
        skipDuplicates: true
    })
}

async function buildSkillMap(): Promise<Map<string, string>> {
    const skills = await prisma.skill.findMany({
        where: {
            sourceId: { not: null }
        },
        select: {
            id: true,
            sourceId: true
        }
    })

    return new Map(skills.map(s => [s.sourceId!, s.id]))
}

function extractId(uri: string): string {
    return uri.split("/").pop()
}

function normalize(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
}

function splitAliases(text?: string): string[] {
    if (!text) return []

    return text
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean)
}

function mapRelationType(type: string) {
    switch (type) {
        case "broader": return "PARENT"
        case "narrower": return "CHILD"
        case "essential": return "ESSENTIAL"
        case "optional": return "RELATED"
        default: return "RELATED"
    }
}