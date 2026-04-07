import { Request, Response } from "express";
import { matchCandidatesByQuery } from "../../domain/skill/serivce/match-query.service";
import { createSuccessResponse, createErrorResponse } from "@ats/shared/utils";

export const matchQueryController = {
  matchCandidatesByQuery: async (req: Request, res: Response) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== "string") {
        return res.status(400).json(createErrorResponse("Query is required"));
      }

      const result = await matchCandidatesByQuery(query);
      return res.json(createSuccessResponse("Match candidates successfully", result));
    } catch (error) {
      console.error("Error matching candidates:", error);
      return res.status(500).json(createErrorResponse("Internal server error"));
    }
  },
};
