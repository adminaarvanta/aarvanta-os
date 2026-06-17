import OpenAI from "openai";
import { getAiConfig, isAiConfigured } from "@/lib/ai/config";

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "AI is not configured. Set OPENAI_API_KEY in your environment (see .env.example)."
    );
    this.name = "AiNotConfiguredError";
  }
}

export class AiRequestError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AiRequestError";
    if (cause instanceof Error) this.cause = cause;
  }
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!isAiConfigured()) {
    throw new AiNotConfiguredError();
  }

  if (!openaiClient) {
    const { apiKey, baseURL } = getAiConfig();
    openaiClient = new OpenAI({
      apiKey: apiKey!,
      ...(baseURL ? { baseURL } : {}),
    });
  }

  return openaiClient;
}

export async function completeJson<T>(input: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<T> {
  const { model } = getAiConfig();
  const openai = getOpenAIClient();

  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    completion = await openai.chat.completions.create({
      model,
      temperature: input.temperature ?? 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI provider error";
    throw new AiRequestError(`OpenAI request failed: ${message}`, error);
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new AiRequestError("OpenAI returned an empty response.");
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new AiRequestError("OpenAI returned invalid JSON.");
  }
}

export async function completeText(input: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  temperature?: number;
}): Promise<string> {
  const { model } = getAiConfig();
  const openai = getOpenAIClient();

  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    completion = await openai.chat.completions.create({
      model,
      temperature: input.temperature ?? 0.3,
      messages: [
        { role: "system", content: input.system },
        ...input.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI provider error";
    throw new AiRequestError(`OpenAI request failed: ${message}`, error);
  }

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new AiRequestError("OpenAI returned an empty response.");
  }

  return raw;
}
