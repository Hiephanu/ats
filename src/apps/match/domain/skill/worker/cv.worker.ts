import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client } from "@/libs/storage/s3";
import { getOrCreateQueueUrl, receiveMessages, deleteMessage } from "@/libs/sqs";
import * as processFileUtil from "@/libs/utils/procress-file";
import instance from "@/libs/gemini.client";
import { structuredSkillPrompt } from "@/libs/utils/prompt";
import { prisma } from "@/libs/prisma";
import * as skillService from "@/apps/match/domain/skill/serivce/skill.service";
import { SkillLevel } from "@/generated/prisma/enums";
import fs from "fs/promises";
import path from "path";
import os from "os";

export type CvProcessingMessage = {
    candidateId: string;
    s3Key: string;
    originalFileName: string;
};

export type LlmSkill = {
    name: string;
    confidence: number;
    year: number | null;
    level: SkillLevel | null;
};

const CV_QUEUE_NAME = process.env.CV_SQS_QUEUE || "ats-cv-processing";
const CV_BUCKET = process.env.CV_S3_BUCKET || "ats-cvs";

export const startCvWorker = async (): Promise<void> => {
    console.log("Starting CV processing worker with SQS...");
    const queueUrl = await getOrCreateQueueUrl(CV_QUEUE_NAME);
    console.log(`Worker connected to queue: ${CV_QUEUE_NAME}`);

    while (true) {
        try {
            const messages = await receiveMessages(queueUrl);
            
            for (const message of messages) {
                try {
                    const data: CvProcessingMessage = JSON.parse(message.Body || "{}");
                    await processCv(data);
                    await deleteMessage(queueUrl, message.ReceiptHandle!);
                } catch (error) {
                    console.error("Error processing message:", error);
                }
            }
        } catch (error) {
            console.error("Error receiving messages:", error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

async function processCv(data: CvProcessingMessage): Promise<void> {
    const { candidateId, s3Key } = data;
    console.log(`Processing CV for candidate: ${candidateId}`);

    const tempFilePath = await downloadFromS3(s3Key);
    
    try {
        const cvData = await processFileUtil.parseText(tempFilePath);
        const structuredData: LlmSkill[] = await instance.generateJSON(structuredSkillPrompt(cvData));

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
    } finally {
        await fs.unlink(tempFilePath);
    }
}

async function downloadFromS3(s3Key: string): Promise<string> {
    const client = getS3Client();
    const command = new GetObjectCommand({
        Bucket: CV_BUCKET,
        Key: s3Key,
    });

    const response = await client.send(command);
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `cv-${Date.now()}.pdf`);

    if (response.Body) {
        const stream = response.Body as any;
        const chunks: Uint8Array[] = [];
        
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        
        const buffer = Buffer.concat(chunks);
        await fs.writeFile(tempFilePath, buffer);
    }

    return tempFilePath;
}

startCvWorker();
