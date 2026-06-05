import { Request, Response } from "express";
import { prisma } from "../../libs/prisma";
import { createStorageService } from "@ats/shared";
import { produce } from "@ats/shared";
import { createSuccessResponse, createErrorResponse } from "@ats/shared/utils";
import { v4 as uuidv4 } from "uuid";

const storage = createStorageService();
const CV_TOPIC = process.env.KAFKA_CV_TOPIC || "cv-processing";

export const cvController = {
  /**
   * POST /api/cv/upload
   * Upload CV file → Supabase Storage → DB → Kafka
   */
  upload: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json(createErrorResponse("No file uploaded"));
      }

      const fileKey = `cvs/${uuidv4()}-${req.file.originalname}`;
      const contentType = req.file.mimetype;

      // 1. Upload to Supabase Storage
      const fileUrl = await storage.upload(fileKey, req.file.buffer, contentType);

      // 2. Create candidate record in DB
      const candidate = await prisma.candidate.create({
        data: {
          fullName: req.body.fullName || null,
          email: req.body.email || null,
          cvFileUrl: fileUrl,
          cvStatus: "PENDING",
          source: "CV_UPLOAD",
        },
      });

      // 3. Send message to Kafka
      await produce(
        CV_TOPIC,
        JSON.stringify({
          candidateId: candidate.id,
          fileKey,
          originalFileName: req.file.originalname,
          contentType,
        })
      );

      console.log(`[CV Upload] Candidate ${candidate.id} → Kafka topic: ${CV_TOPIC}`);

      return res.status(201).json(
        createSuccessResponse("CV uploaded successfully", {
          candidateId: candidate.id,
          status: candidate.cvStatus,
          fileUrl,
        })
      );
    } catch (error) {
      console.error("CV upload error:", error);
      return res.status(500).json(createErrorResponse("Failed to upload CV"));
    }
  },

  /**
   * GET /api/cv/candidates
   * List all candidates with their CV processing status
   */
  list: async (_req: Request, res: Response) => {
    try {
      const candidates = await prisma.candidate.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          cvStatus: true,
          cvFileUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json(createSuccessResponse("Candidates fetched", candidates));
    } catch (error) {
      console.error("Error fetching candidates:", error);
      return res.status(500).json(createErrorResponse("Internal server error"));
    }
  },

  /**
   * GET /api/cv/candidates/:id
   * Get a single candidate with full parsed CV data
   */
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const candidate = await prisma.candidate.findUnique({
        where: { id },
        include: {
          candidateSkills: {
            include: { skill: true },
          },
          experiences: true,
          educations: true,
          projects: true,
        },
      });

      if (!candidate) {
        return res.status(404).json(createErrorResponse("Candidate not found"));
      }

      return res.json(createSuccessResponse("Candidate fetched", candidate));
    } catch (error) {
      console.error("Error fetching candidate:", error);
      return res.status(500).json(createErrorResponse("Internal server error"));
    }
  },
};
