import { NextFunction, Request, Response } from "express";
import { createSuccessResponse, createErrorResponse } from "@ats/shared/utils";
import * as importService from "../../domain/skill/serivce/import.service";
import * as skillMatcherTest from "../../domain/skill/core/skill-matcher.test";

export const importCvDataController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json(createErrorResponse("No file uploaded"));
    }

    const candidateId = req.body.candidateId || "default";
    const result = await importService.importCvData(candidateId, file.buffer, file.originalname);
    
    return res.json(createSuccessResponse("CV uploaded and queued for processing", result));
  } catch (error) {
    next(error);
  }
}

export const matchCandidateSkillController = async (req: Request, res: Response, next: NextFunction) => {
  await skillMatcherTest.runExamples();
  return res.json(createSuccessResponse("Run skill matcher examples successfully", null));
}