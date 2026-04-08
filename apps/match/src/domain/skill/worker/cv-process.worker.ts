import { createQueue } from "@ats/shared/queue";
import { createStorageService } from "@ats/shared/storage";
import { createOcrClient, type OcrClient } from "@ats/shared/ocr-client";
import instance from "src/libs/gemini.client";
import { structuredSkillPrompt } from "@ats/shared/utils";
import * as skillService from "../serivce/skill.service";
import { SkillLevel } from "../../../../generated/prisma/enums";
import { prisma } from "src/libs/prisma";

export type CvProcessingMessage = {
    candidateId: string;
    s3Key: string;
    originalFileName: string;
    retryCount?: number;
};

export type LlmSkill = {
    name: string;
    confidence: number;
    year: number | null;
    level: SkillLevel | null;
};

const CV_QUEUE_CHANNEL = process.env.CV_QUEUE_CHANNEL || "cv-processing";
const MAX_RETRIES = parseInt(process.env.CV_MAX_RETRIES || "3", 10);

const cvQueue = createQueue({
    maxRetries: MAX_RETRIES,
    retryDelay: 1000,
    retryBackoff: 2,
});

async function processCvWithOcr(
    data: CvProcessingMessage,
    ocr: OcrClient
): Promise<void> {
    const { candidateId, s3Key } = data;
    console.log(`Processing CV for candidate: ${candidateId} from ${s3Key}`);

    const storage = createStorageService();

    try {
        const ocrResult = await ocr.recognizeFromS3(s3Key, storage);
        console.log(`OCR completed. Text length: ${ocrResult.text.length} chars`);

        const structuredData: LlmSkill[] = await instance.generateJSON(
            structuredSkillPrompt(ocrResult.text)
        );

        console.log(`LLM extracted ${structuredData.length} skills`);

        for (const skill of structuredData) {
            await prisma.$transaction(async (tx) => {
                const skillId = await skillService.createSkill(tx, skill.name);
                await skillService.createOrUpdateSkillCandidate(
                    tx,
                    candidateId,
                    skillId,
                    skill.level,
                    skill.year,
                    skill.confidence
                );
            });
        }

        console.log(`CV processed successfully for candidate: ${candidateId}`);
    } catch (error) {
        console.error(`Failed to process CV for candidate ${candidateId}:`, error);
        throw error;
    }
}

export const startCvProcessingWorker = async (): Promise<void> => {
    console.log("Starting CV processing worker with OCR...");

    const ocr = createOcrClient(process.env.OCR_URL);

    const isReady = await ocr.healthCheck();
    if (!isReady) {
        throw new Error("OCR service is not available");
    }
    console.log("OCR service is ready");

    await cvQueue.subscribe(
        CV_QUEUE_CHANNEL,
        async (message) => {
            const data: CvProcessingMessage = message.payload as CvProcessingMessage;
            await processCvWithOcr(data, ocr);
        },
        (message, error) => {
            console.error(`DLQ: Message ${message.id} failed permanently:`, error.message);
        }
    );

    console.log(`Processing worker subscribed to ${CV_QUEUE_CHANNEL} channel`);
};

export const publishCvForProcessing = async (payload: Omit<CvProcessingMessage, "retryCount">): Promise<string> => {
    return cvQueue.publish(CV_QUEUE_CHANNEL, payload);
};

startCvProcessingWorker();