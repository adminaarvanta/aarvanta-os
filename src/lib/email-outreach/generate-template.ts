import { isAiConfigured } from "@/lib/ai/config";
import {
  AiNotConfiguredError,
  completeJson,
} from "@/lib/ai/provider";
import { htmlToPlainText } from "@/lib/email-outreach/html-utils";
import { EMAIL_MERGE_FIELDS } from "@/types/email-outreach";

export type GeneratedEmailTemplate = {
  subject: string;
  previewText: string;
  htmlBody: string;
  textBody: string;
};

const SYSTEM = `You write deliverable marketing/outreach emails as JSON.
Return ONLY a JSON object with keys: subject, previewText, htmlBody, textBody.

Rules for htmlBody:
- Email-safe HTML only: single-column table layout, inline CSS, no <script>, no external stylesheets, no forms.
- Prefer width around 560–600px.
- Use merge tokens exactly like {{firstName}}, {{lastName}}, {{fullName}}, {{email}}, {{company}}, {{jobTitle}} where personalization helps.
- Include a clear CTA link (use the provided CTA URL when given).
- Do not use base64 images or huge embedded assets; text wordmark or a normal https image URL is fine.
- Keep HTML under ~30k characters.

Rules for textBody:
- Plaintext sibling of the same message (no HTML tags).
- Keep merge tokens identical to htmlBody where used.

Subject and previewText should be concise and inbox-friendly.`;

export async function generateEmailHtmlTemplate(input: {
  prompt: string;
  tone?: string;
  ctaUrl?: string;
  brandName?: string;
}): Promise<GeneratedEmailTemplate> {
  if (!isAiConfigured()) {
    throw new AiNotConfiguredError();
  }

  const user = [
    `Prompt: ${input.prompt}`,
    input.tone ? `Tone: ${input.tone}` : null,
    input.brandName ? `Brand name: ${input.brandName}` : null,
    input.ctaUrl ? `CTA URL: ${input.ctaUrl}` : null,
    `Allowed merge fields: ${EMAIL_MERGE_FIELDS.map((f) => `{{${f}}}`).join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await completeJson<Partial<GeneratedEmailTemplate>>({
    system: SYSTEM,
    user,
    temperature: 0.45,
  });

  const htmlBody = (raw.htmlBody ?? "").trim();
  let textBody = (raw.textBody ?? "").trim();
  if (htmlBody && !textBody) {
    textBody = htmlToPlainText(htmlBody);
  }
  if (!htmlBody && !textBody) {
    throw new Error("AI returned an empty email body.");
  }

  return {
    subject: (raw.subject ?? "Follow-up").trim().slice(0, 200) || "Follow-up",
    previewText: (raw.previewText ?? "").trim().slice(0, 200),
    htmlBody: htmlBody || textBody,
    textBody: textBody || htmlToPlainText(htmlBody),
  };
}
