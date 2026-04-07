export const structuredSkillPrompt = (text: string) => {
    return `
  Role: Senior ATS Architect & Skill Extraction Engineer.
  
  Task:
  Extract only technical, real-world professional skills from the input text.
  
  Guidelines:
  1. Only extract technical skills: programming languages, frameworks, libraries, tools, platforms, databases, protocols, or other industry-recognized technical skills.
  2. Ignore soft skills, behaviors, or vague terms like "teamwork", "communication", "leadership".
  3. Only include skills that exist and can be verified. Do NOT invent skills.
  4. Normalize skill names to standard industry notation (e.g., "reactjs" → "React.js", "nodejs" → "Node.js").
  5. Infer parent skills only if clearly implied.
  6. Assign confidence score (0–1) for each skill.
  7. Identify year if can be inferred from context (e.g., "3 years of experience in Java" → year: 3). Otherwise, set year to null.
  8. Only include skills with high confidence; omit uncertain items.
  9. Output: Return ONLY a JSON array. No preamble, no markdown.
  
  Schema:
  [
    {
      name: string,
      confidence: number,
      level: BEGINNER | INTERMEDIATE | ADVANCED | EXPERT | MASTER,
      year: number | null,
    }
  ]
  
  Input Text:
  ---
  ${text}
  ---
  `;
  }

export const extractUserSkillsPrompt = (text: string) => {
    return `
  Role: Senior ATS Architect & Skill Extraction Engineer.
  
  Task:
  Extract all technical skills, years of experience, and desired level from the user's input. Normalize skill names to canonical forms (e.g., "javaaa" -> "Java", "nodejs" -> "Node.js") and levels to JUNIOR | MID | SENIOR | LEAD | EXPERT.
  
  Guidelines:
  1. Extract all skills mentioned by the user.
  2. Extract the number of years of experience associated with each skill if specified; otherwise, return null.
  3. Extract desired level/position if mentioned; otherwise, return null.
  4. Ignore irrelevant words and focus on actionable skill-related info.
  5. Output ONLY a JSON array with objects for each skill. No preamble, no markdown.
  
  Schema:
  [
    {
      "skill": string,
      "years": number | null,
      "level": BEGINNER | INTERMEDIATE | ADVANCED | EXPERT | MASTER,
    }
  ]
  
  Input Text:
  ---
  ${text}
  ---
  `;
}

export const extractQuerySkillsPrompt = (text: string) => {
    return `
  Role: Senior ATS Architect & Skill Query Parser.
  
  Task:
  Parse natural language query about candidate skills into structured requirements.
  
  Guidelines:
  1. Extract each skill mentioned with its required years of experience.
  2. Extract required level if mentioned (BEGINNER | INTERMEDIATE | ADVANCED | EXPERT | MASTER).
  3. Normalize skill names: lowercase, trim spaces, remove special characters except alphanumeric, +, # (e.g., "Node.js" -> "nodejs", "C++" -> "c++", "React JS" -> "reactjs").
  4. If years not specified for a skill, set years to null.
  5. If level not specified, infer from context or set null.
  6. Output ONLY a JSON array. No preamble, no markdown.
  
  Schema:
  [
    {
      "skill": string,
      "normalizedSkill": string,
      "years": number | null,
      "minimumLevel": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | "MASTER" | null,
      "isMandatory": boolean
    }
  ]
  
  Input Text:
  ---
  ${text}
  ---
  `;
}