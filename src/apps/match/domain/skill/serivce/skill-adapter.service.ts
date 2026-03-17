import { CanonicalSkill } from "../dto/skill-input.dto";

export interface SkillSourceAdapter {
    parse(row: any): CanonicalSkill
}

function parseLabels(labels?: string): string[] {
    if (!labels) return [];
  
    return labels
      .split("\n")
      .map(v => v.trim())
      .filter(Boolean);
}

export class EscoSkillAdapter implements SkillSourceAdapter {

    parse(row: any): CanonicalSkill {
  
      const alt = parseLabels(row.altLabels)
      const hidden = parseLabels(row.hiddenLabels)
  
      return {
        canonicalName: row.preferredLabel,
        aliases: [...alt, ...hidden],
        description: row.description,
        skillType: row.skillType,
        reuseLevel: row.reuseLevel,
        source: "ESCO",
        sourceId: row.conceptUri,
        metadata: {
          conceptType: row.conceptType
        }
      }
  
    }
  
  }

