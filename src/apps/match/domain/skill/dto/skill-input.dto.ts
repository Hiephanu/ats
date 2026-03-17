type SkillInput = {
  canonicalName: string
  aliases?: string[]
  description?: string
  source?: string
}

export type CanonicalSkill = {
    canonicalName: string
  
    aliases: string[]
  
    description?: string
  
    skillType?: string
  
    reuseLevel?: string
  
    source: string
  
    sourceId?: string
  
    metadata?: Record<string, any>
  }