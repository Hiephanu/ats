import pdfParse from "pdf-parse";
import { saveCvMetadata } from "./cv-dal.js";

export async function extractCvText({ filePath, originalName }) {
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

  return {
    ...metadata,
    preview: parsed.text.slice(0, 500),
  };
}
