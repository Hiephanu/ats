import * as normalizeService from "@/apps/match/domain/normalize/normalize.service"
import { CanonicalSkill } from "../dto/skill-input.dto"
import { adapterRegistry } from "./adapter.registry"

export class SkillIngestService {

    async ingest(tx: any, skill: CanonicalSkill) {
        const normalized = normalizeService.normalizeSkill(skill.canonicalName)
        let dbSkill = await tx.skill.findUnique({
            where: { normalizedCanonical: normalized }
        })
        if (!dbSkill) {
            dbSkill = await tx.skill.create({
                data: {
                    canonicalName: skill.canonicalName,
                    normalizedCanonical: normalized,
                    description: skill.description,
                    skillType: skill.skillType,
                    reuseLevel: skill.reuseLevel,
                    sourceId: skill.sourceId,
                    isSystem: true
                }
            })
        }
        const aliases = [
            skill.canonicalName,
            ...(skill.aliases ?? [])
        ]
        await tx.skillAlias.createMany({
            data: aliases.map(a => ({
                skillId: dbSkill.id,
                raw: a,
                normalized: normalizeService.normalizeSkill(a),
                source: skill.source,
                confidence: 1
            })),
            skipDuplicates: true
        })
        return dbSkill
    }
}

async function runImport(source: string, rows: any[]) {
    const adapter = adapterRegistry[source]
    if (!adapter) {
      throw new Error(`No adapter for source ${source}`)
    }
    for (const row of rows) {
      const canonicalSkill = adapter.parse(row)
    }
}