import { NextFunction, Request, Response } from "express";
import { createSuccessResponse } from "@/libs/utils/custon-response";
import * as importService from "../../domain/skill/serivce/import.service";
import * as skillMatcherTest from "../../domain/skill/core/skill-matcher.test";

export const importSkillController = async (req: Request, res: Response, next: NextFunction) => {
  await importService.importEsco();
  return res.json(createSuccessResponse("Import Esco skill successfully", null));
}

export const importSkillRelationController = async (req: Request, res: Response, next: NextFunction) => {
  await importService.importSkillRelationEsco();
  return res.json(createSuccessResponse("Import Esco skill relations successfully", null));
}

export const importCvDataController = async (req: Request, res: Response, next: NextFunction) => {
  await importService.importCvData("test");
  return res.json(createSuccessResponse("Import CV data successfully", null));
}

export const matchCandidateSkillController = async (req: Request, res: Response, next: NextFunction) => {
  await skillMatcherTest.runExamples();
  return res.json(createSuccessResponse("Run skill matcher examples successfully", null));
}