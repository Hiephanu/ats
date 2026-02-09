import { Request, Response, NextFunction } from "express";
import { searchCvEmbeddings } from "./search-service.js";

export async function searchCv(req: Request, res: Response, next: NextFunction) {
  try {
    const { query, limit } = req.body as { query?: string; limit?: number };

    if (!query) {
      res.status(400).json({ message: "Missing search query" });
      return;
    }

    const results = await searchCvEmbeddings(query, limit ?? 5);

    res.status(200).json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
}
