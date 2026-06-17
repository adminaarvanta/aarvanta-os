import OpenAI from "openai";
import { getAiConfig, isAiConfigured } from "@/lib/ai/config";
import { AiNotConfiguredError, AiRequestError } from "@/lib/ai/provider";

const EMBEDDING_MODEL = "text-embedding-3-small";

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!isAiConfigured()) throw new AiNotConfiguredError();
  if (!openaiClient) {
    const { apiKey, baseURL } = getAiConfig();
    openaiClient = new OpenAI({
      apiKey: apiKey!,
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return openaiClient;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const openai = getClient();

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    });
    return response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown embedding error";
    throw new AiRequestError(`Embedding request failed: ${message}`, error);
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
