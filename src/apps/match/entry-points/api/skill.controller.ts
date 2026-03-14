import { NextFunction, Request, Response } from "express";
import { createSuccessResponse } from "@/libs/utils/custon-response";
import * as skillService from "../../domain/normalize/skill.service"

export const resolveSkillController = async (req: Request, res: Response, next: NextFunction) => {
  const skills = ['nodejs'];
  const result = await skillService.saveCandidateSkills("test", skills);
  return res.json(createSuccessResponse("", result));
}