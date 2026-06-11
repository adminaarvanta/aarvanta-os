import OpenAI from "openai";
import { isAiConfigured } from "@/lib/ai/config";

export {
  getAiConfig,
  getAiRuntimeStatus,
  isAiConfigured,
  shouldAutoSummarize,
} from "@/lib/ai/config";
export type { AiConfig, AiProvider, AiRuntimeStatus } from "@/lib/ai/config";

/** @deprecated Use isAiConfigured() */
export function isOpenAIConfigured() {
  return isAiConfigured();
}

/** @deprecated Prefer completeJson() from @/lib/ai/provider */
export function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  return new OpenAI({
    apiKey: key,
    ...(baseURL ? { baseURL } : {}),
  });
}
