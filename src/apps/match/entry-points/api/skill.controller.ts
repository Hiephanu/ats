import { NextFunction, Request, Response } from "express";
import { createSuccessResponse } from "@/libs/utils/custon-response";
import * as skillService from "../../domain/skill/serivce/skill.service";
import * as importService from "../../domain/skill/serivce/import.service";

export const expandSkillController = async (req: Request, res: Response, next: NextFunction) => {
  const skillId: string = req.params.skillId;
  const relatedSkills = await skillService.expandSkill(skillId);
  return res.json(createSuccessResponse("Expand skill successfully", relatedSkills));
}

export const getAllSkillPathController = async (req: Request, res: Response, next: NextFunction) => {
  const skillId: string = req.params.skillId;
  const skillPath = await skillService.getFullSkillPath(skillId);
  return res.json(createSuccessResponse("Get skill path successfully", skillPath));
}

export const importSkillController = async (req: Request, res: Response, next: NextFunction) => {
  await importService.importEsco();
  return res.json(createSuccessResponse("Import Esco skill successfully", null));
}

export const importSkillRelationController = async (req: Request, res: Response, next: NextFunction) => {
  await importService.importSkillRelationEsco();
  return res.json(createSuccessResponse("Import Esco skill relations successfully", null));
}