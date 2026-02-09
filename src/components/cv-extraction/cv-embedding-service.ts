import OpenAI from "openai";

const DEFAULT_MODEL = "text-embedding-3-small";

export type EmbeddingResult = {
  embedding: number[];
  model: string;
  dimensions: number;
};

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const dimensions = 1536;
    return {
      embedding: new Array(dimensions).fill(0),
      model: "local-zero-vector",
      dimensions,
    };
  }

  const client = new OpenAI({ apiKey });
  const response = await client.embeddings.create({
    model: DEFAULT_MODEL,
    input: text,
  });

  const embedding = response.data[0]?.embedding ?? [];
  return {
    embedding,
    model: DEFAULT_MODEL,
    dimensions: embedding.length,
  };
}
