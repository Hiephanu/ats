import * as skillRepository from "../../data-access/skill.repository";

export const textNormalization = (text: string) => {
    if (!text) return '';

    return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ''); 
};

export const getMatchSkillExactSerivice = async (key: string) => {
    return await skillRepository.getMatchSkillByNormalizedCanonical(key);
}

export const createSkill = (skill: string) => {
    const normalizedSkill = textNormalization(skill);

    const skillDb = skillRepository.getMatchSkillByNormalizedCanonical(skill);

    if (skillDb) {
        return skillDb;
    }

    
}