import { getMatchSkillExactSerivice } from "../../domain/normalize/skill.service"

export const getMatchSkillExactController = async (req, res, next) => {
    try {
      const { key } = req.query;
  
      const result = await getMatchSkillExactSerivice(key as string);
  
      res.json(result);
    } catch (err) {
      next(err);
    }
  };