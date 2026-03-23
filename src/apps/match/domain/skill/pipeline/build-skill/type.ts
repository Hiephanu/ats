export interface PipelineStep<I, O> {
    process(input: I): Promise<O>;
}

export interface CvStructured {
    experience: string[];
    skills: string[];
    education: string[];
}

export interface Skill {
    name: string;
    normalized: string;
}

export interface ScoredSkill extends Skill {
    score: number;
}