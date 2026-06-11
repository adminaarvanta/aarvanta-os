import { isDemoMode } from "@/lib/config/app-mode";

export type AiProvider = "openai";

export interface AiConfig {
  provider: AiProvider;
  model: string;
  apiKey: string | undefined;
  baseURL: string | undefined;
  /** Regenerate summary after each inbound message (default: on when API key is set). */
  autoSummarize: boolean;
  /** Minimum AI qualification score (0–100) before creating a CRM lead from inbound. */
  crmQualificationThreshold: number;
  /** Use keyword heuristics when the API is unavailable or fails. */
  allowHeuristicFallback: boolean;
}

export function getAiConfig(): AiConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || undefined;
  const thresholdRaw = process.env.AI_CRM_QUALIFICATION_THRESHOLD?.trim();
  const parsedThreshold = thresholdRaw ? Number.parseInt(thresholdRaw, 10) : 50;

  return {
    provider: "openai",
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
    autoSummarize:
      process.env.AI_AUTO_SUMMARIZE === "false" ? false : Boolean(apiKey),
    crmQualificationThreshold: Number.isFinite(parsedThreshold)
      ? Math.min(100, Math.max(0, parsedThreshold))
      : 50,
    allowHeuristicFallback:
      process.env.AI_ALLOW_HEURISTIC_FALLBACK === "true" || isDemoMode(),
  };
}

export function isAiConfigured(): boolean {
  return Boolean(getAiConfig().apiKey);
}

export function shouldAutoSummarize(): boolean {
  const config = getAiConfig();
  return config.autoSummarize && Boolean(config.apiKey);
}

/** Run inbound AI processing (summarize + CRM qualification gate). */
export function shouldProcessInboundAi(): boolean {
  const config = getAiConfig();
  return Boolean(config.apiKey) || config.allowHeuristicFallback;
}

export function getCrmQualificationThreshold(): number {
  return getAiConfig().crmQualificationThreshold;
}

export type AiRuntimeStatus =
  | { status: "live"; provider: AiProvider; model: string; autoSummarize: boolean }
  | { status: "heuristic"; reason: string; autoSummarize: false }
  | { status: "disabled"; reason: string; autoSummarize: false };

export function getAiRuntimeStatus(): AiRuntimeStatus {
  const config = getAiConfig();

  if (config.apiKey) {
    return {
      status: "live",
      provider: config.provider,
      model: config.model,
      autoSummarize: config.autoSummarize,
    };
  }

  if (config.allowHeuristicFallback) {
    return {
      status: "heuristic",
      reason: "OPENAI_API_KEY not set — using keyword heuristics",
      autoSummarize: false,
    };
  }

  return {
    status: "disabled",
    reason: "OPENAI_API_KEY not set",
    autoSummarize: false,
  };
}
