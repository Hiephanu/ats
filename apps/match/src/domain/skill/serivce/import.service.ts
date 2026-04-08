import { SkillLevel } from "../../../../generated/prisma/enums";
import { createStorageService } from "@ats/shared/storage";
import { publish, QueueMessage } from "@ats/shared/queue";
import { randomUUID } from "crypto";

const CV_CHANNEL = process.env.CV_QUEUE_CHANNEL || "cv-processing";

export type LlmSkill = {
    name: string; 
    confidence: number;
    year: number | null;             
    level: SkillLevel | null;   
  };

export type CvProcessingMessage = {
    candidateId: string;
    s3Key: string;
    originalFileName: string;
};

export const uploadCvToCloud = async (
    fileBuffer: Buffer,
    candidateId: string,
    originalFileName: string
): Promise<string> => {
    const storage = createStorageService();
    const key = `cvs/${candidateId}/${Date.now()}-${originalFileName}`;
    
    await storage.upload(key, fileBuffer, "application/pdf");

    return key;
};

export const publishCvForProcessing = async (
  candidateId: string,
  s3Key: string,
  originalFileName: string
): Promise<void> => {

  const message: QueueMessage<CvProcessingMessage> = {
    id: randomUUID(),
    payload: {
      candidateId,
      s3Key,
      originalFileName,
    },
    retryCount: 0,
    maxRetries: 3,
    createdAt: Date.now(),
  };

  await publish(CV_CHANNEL, message);
};

export const importCvData = async (candidateId: string, fileBuffer: Buffer, originalFileName: string) => {
    const s3Key = await uploadCvToCloud(fileBuffer, candidateId, originalFileName);
    await publishCvForProcessing(candidateId, s3Key, originalFileName);

    return { s3Key, status: "processing" };
}