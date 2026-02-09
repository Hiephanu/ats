import OpenAI from "openai";
import { loadCvEmbeddings } from "../cv-extraction/cv-embedding-dal.js";

const DEFAULT_MODEL = "text-embedding-3-small";

export type SearchResult = {
  id: string;
  originalName: string;
  score: number;
  model: string;
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function generateQueryEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return [];
  }

  const client = new OpenAI({ apiKey });
  const response = await client.embeddings.create({
    model: DEFAULT_MODEL,
    input: text,
  });

  return response.data[0]?.embedding ?? [];
}

export async function searchCvEmbeddings(query: string, limit = 5): Promise<SearchResult[]> {
  const [embeddingRecords, queryEmbedding] = await Promise.all([
    loadCvEmbeddings(),
    generateQueryEmbedding(query),
  ]);

  const scored = embeddingRecords.map((record) => ({
    id: record.id,
    originalName: record.originalName,
    model: record.model,
    score: cosineSimilarity(queryEmbedding, record.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
