import { randomUUID } from "node:crypto";

export type CvEmbeddingRecord = {
  id: string;
  originalName: string;
  filePath: string;
  model: string;
  dimensions: number;
  embedding: number[];
  createdAt: string;
};

export async function saveCvEmbedding(record: CvEmbeddingRecord) {
  const { mkdir, readFile, writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const dataDir = join(process.cwd(), "data");
  const dataFile = join(dataDir, "cv-embeddings.json");

  await mkdir(dataDir, { recursive: true });

  let existing: CvEmbeddingRecord[] = [];
  try {
    const contents = await readFile(dataFile, "utf-8");
    existing = JSON.parse(contents) as CvEmbeddingRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  existing.push(record);
  await writeFile(dataFile, JSON.stringify(existing, null, 2));
}

export async function loadCvEmbeddings(): Promise<CvEmbeddingRecord[]> {
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const dataDir = join(process.cwd(), "data");
  const dataFile = join(dataDir, "cv-embeddings.json");

  try {
    const contents = await readFile(dataFile, "utf-8");
    return JSON.parse(contents) as CvEmbeddingRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function createEmbeddingRecord(params: Omit<CvEmbeddingRecord, "id" | "createdAt">): CvEmbeddingRecord {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...params,
  };
}
