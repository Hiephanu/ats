export const structuredCvPrompt = (text: string) => {
    return `
            Role: Senior ATS Architect & Skill Extraction Engineer.
            
            Task:
            Extract structured CV data and detect professional skills with context awareness.
            
            Constraints:
            1. Do NOT hallucinate. Only extract what is explicitly or strongly implied.
            2. Clean malformed text (PDF artifacts, encoding issues).
            3. Preserve original descriptions.
            4. Extract granular, real-world skills (e.g., "Spring Boot", "PostgreSQL").
            5. Infer related higher-level skills when strongly implied.
            
            Skill Rules:
            - Normalize skill names (e.g., "reactjs" → "React.js").
            - Add inferred parent skills if applicable.
            - Assign confidence score (0–1).
            - Identify source context: "experience" | "skills" | "other".
            
            Schema:
            {
            fullName: string,
            email: string,
            phone: string,
            
            skills: [
                {
                name: string,
                normalized: string,
                confidence: number,
                source: "experience" | "skills" | "other"
                }
            ],
            
            experience: [
                {
                company: string,
                role: string,
                duration: string,
                description: string[]
                }
            ]
            }
            
            Input Raw Text:
            ---
            ${text}
            ---
            `;
}