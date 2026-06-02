import OpenAI from "openai";

export function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}
