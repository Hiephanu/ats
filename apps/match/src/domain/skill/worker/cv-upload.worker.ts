import { subscribe, publish } from "@ats/shared/queue";
import { createStorageService } from "@ats/shared/storage";

export type CvUploadMessage = {
    candidateId: string;
    originalFileName: string;
    fileBuffer: string;
};

export type CvProcessingMessage = {
    candidateId: string;
    s3Key: string;
    originalFileName: string;
};

const CV_UPLOAD_CHANNEL = "cv-upload";
const CV_QUEUE_CHANNEL = process.env.CV_QUEUE_CHANNEL || "cv-processing";

function getContentType(filename: string): string {
    const ext = filename.toLowerCase().split(".").pop();
    const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
}

export function createUploadMessage(
    candidateId: string,
    originalFileName: string,
    fileBuffer: Buffer
): CvUploadMessage {
    return {
        candidateId,
        originalFileName,
        fileBuffer: fileBuffer.toString("base64"),
    };
}

export async function handleCvUpload(data: CvUploadMessage): Promise<void> {
    const { candidateId, originalFileName, fileBuffer } = data;
    console.log(`Uploading CV for candidate: ${candidateId}`);

    const storage = createStorageService();
    const buffer = Buffer.from(fileBuffer, "base64");
    const s3Key = `cvs/${candidateId}/${Date.now()}-${originalFileName}`;

    await storage.upload(s3Key, buffer, getContentType(originalFileName));

    const processingMessage: CvProcessingMessage = {
        candidateId,
        s3Key,
        originalFileName,
    };

    await publish(CV_QUEUE_CHANNEL, processingMessage);
    console.log(`CV uploaded and queued for processing: ${s3Key}`);
}

export const startCvUploadWorker = async (): Promise<void> => {
    console.log("Starting CV upload worker...");

    await subscribe(CV_UPLOAD_CHANNEL, async (message) => {
        try {
            const data: CvUploadMessage = JSON.parse(message);
            await handleCvUpload(data);
        } catch (error) {
            console.error("Error handling CV upload:", error);
        }
    });

    console.log(`Upload worker subscribed to ${CV_UPLOAD_CHANNEL} channel`);
};

startCvUploadWorker();
