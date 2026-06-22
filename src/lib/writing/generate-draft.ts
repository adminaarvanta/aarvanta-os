import { isAiConfigured } from "@/lib/ai/config";
import { completeText } from "@/lib/ai/provider";
import type { WritingContentType } from "@/types/platform-modules";

const typeLabels: Record<WritingContentType, string> = {
  proposal: "sales proposal",
  email: "professional email",
  blog: "blog article",
  linkedin: "LinkedIn post",
  sop: "standard operating procedure",
  meeting_notes: "meeting notes summary",
};

export async function generateWritingDraft(input: {
  type: WritingContentType;
  title: string;
  prompt: string;
  starterContent?: string;
}): Promise<string> {
  const label = typeLabels[input.type];

  if (!isAiConfigured()) {
    return (
      `# ${input.title}\n\n` +
      `## ${label}\n\n` +
      `${input.prompt}\n\n` +
      (input.starterContent ? `---\n\n${input.starterContent}` : "") +
      `\n\n---\n*Set OPENAI_API_KEY for AI-generated drafts.*`
    );
  }

  const system = `You are the AI Writing Studio inside Aarvanta OS — an AI Workforce & Business Operating System for SMEs.
Write polished, professional ${label} content for UK/EU business audiences.
Use clear headings and bullet points where appropriate. Be concise and actionable.
Brand voice: confident, modern, revenue-focused. Company: Aarvanta Limited.`;

  const user = [
    `Title: ${input.title}`,
    `Brief: ${input.prompt}`,
    input.starterContent
      ? `Starter content to refine:\n${input.starterContent}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return completeText({
    system,
    messages: [{ role: "user", content: user }],
    temperature: 0.4,
  });
}
