export interface ExactMatchSkillDto {
    id: string;
    normalizedCanonical: string;
  }
  
  export interface ExactMatchSkillAliasDto {
    id: string;
    normalized: string;
    skillId: string;
  }
  
  export interface ResolveResult {
    input: string
    normalized: string
    skillId?: string
  }

  export interface BatchResolveSkillDto {
    exactMatches: ExactMatchSkillDto[];
    exactMatchAliases: ExactMatchSkillAliasDto[];
  }

  export interface SaveCandidateSkillsResponse {
    candidateId: string
    skills: {
      input: string
      normalized: string
      skillId: string
      created: boolean
    }[]
  }