import "dotenv/config";
import { getConsumer, createStorageService, createOcrClient } from "@ats/shared";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../match/generated/prisma/client";

// ── Config ─────────────────────────────────────────────────────────────

const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || "cv-worker-group";
const CV_TOPIC = process.env.KAFKA_CV_TOPIC || "cv-processing";
const OCR_URL = process.env.OCR_URL || "http://localhost:9000";

const connectionString = process.env.DATABASE_URL || "postgresql://match:matchpassword@localhost:5432/match_db";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const storage = createStorageService();
const ocrClient = createOcrClient(OCR_URL);

// ── Worker ─────────────────────────────────────────────────────────────

const run = async () => {
    console.log(`[CV Worker] Starting — topic: ${CV_TOPIC}, group: ${KAFKA_GROUP_ID}`);

    const consumer = await getConsumer(KAFKA_GROUP_ID);
    await consumer.connect();
    await consumer.subscribe({ topic: CV_TOPIC, fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const raw = message.value?.toString();
            if (!raw) return;

            const payload = JSON.parse(raw);
            const { candidateId, fileKey, originalFileName } = payload;

            console.log(`[CV Worker] Processing candidate: ${candidateId}, file: ${originalFileName}`);

            try {
                // 1. Update status → PROCESSING
                await prisma.candidate.update({
                    where: { id: candidateId },
                    data: { cvStatus: "PROCESSING" },
                });

                // 2. Download file from Supabase
                console.log(`[CV Worker] Downloading ${fileKey} from storage…`);
                const fileBuffer = await storage.download(fileKey);

                // 3. Send to OCR service
                console.log(`[CV Worker] Running OCR on ${originalFileName}…`);
                const ocrResult = await ocrClient.recognizeFromFile(fileBuffer, originalFileName);

                console.log(`[CV Worker] OCR complete. Text length: ${ocrResult.text.length}, confidence: ${ocrResult.confidence}`);

                // 4. Update candidate in DB with results
                await prisma.candidate.update({
                    where: { id: candidateId },
                    data: {
                        rawCvText: ocrResult.text,
                        parsedData: {
                            ocrConfidence: ocrResult.confidence,
                            language: ocrResult.language,
                            isPdf: ocrResult.isPdf,
                            extractedAt: new Date().toISOString(),
                        },
                        cvStatus: "COMPLETED",
                    },
                });

                console.log(`[CV Worker] ✅ Candidate ${candidateId} processing complete`);
            } catch (error) {
                console.error(`[CV Worker] ❌ Failed to process candidate ${candidateId}:`, error);

                // Update status → FAILED
                await prisma.candidate.update({
                    where: { id: candidateId },
                    data: {
                        cvStatus: "FAILED",
                        parsedData: {
                            error: error instanceof Error ? error.message : "Unknown error",
                            failedAt: new Date().toISOString(),
                        },
                    },
                }).catch(console.error);
            }
        },
    });
};

// Graceful shutdown
const shutdown = async () => {
    console.log("\n[CV Worker] Shutting down…");
    await prisma.$disconnect();
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

run().catch(console.error);
