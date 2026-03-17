import { EscoSkillAdapter, SkillSourceAdapter } from "./skill-adapter.service";

export const adapterRegistry: Record<string, SkillSourceAdapter> = {
    ESCO: new EscoSkillAdapter(),
}