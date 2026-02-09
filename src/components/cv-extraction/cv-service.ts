import pdfParse from "pdf-parse";
import { saveCvMetadata } from "./cv-dal.js";
import { createEmbeddingRecord, saveCvEmbedding } from "./cv-embedding-dal.js";
import { generateEmbedding } from "./cv-embedding-service.js";

type ExtractCvInput = {
  filePath: string;
  originalName: string;
};

export async function extractCvText({ filePath, originalName }: ExtractCvInput) {
  const { readFile } = await import("node:fs/promises");
  const fileBuffer = await readFile(filePath);
  const parsed = await pdfParse(fileBuffer);

  const metadata = {
    originalName,
    filePath,
    extractedTextLength: parsed.text.length,
    pages: parsed.numpages,
    extractedAt: new Date().toISOString(),
  };

  await saveCvMetadata(metadata);

  const embeddingResult = await generateEmbedding(parsed.text);
  const embeddingRecord = createEmbeddingRecord({
    originalName,
    filePath,
    model: embeddingResult.model,
    dimensions: embeddingResult.dimensions,
    embedding: embeddingResult.embedding,
  });
  await saveCvEmbedding(embeddingRecord);

  return {
    ...metadata,
    preview: parsed.text.slice(0, 500),
    embedding: {
      id: embeddingRecord.id,
      model: embeddingRecord.model,
      dimensions: embeddingRecord.dimensions,
    },
  };
}
