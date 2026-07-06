import { isAiConfigured } from "@/lib/ai/config";
import { completeText } from "@/lib/ai/provider";
import { getHrDocumentSpec, labelForHrDocumentType } from "@/lib/hr/document-types";
import type { HrDocumentType } from "@/types/platform-modules";

export type GenerateHrDocumentInput = {
  type: HrDocumentType;
  title: string;
  subjectName: string;
  instructions: string;
  contextFields: Record<string, string>;
  companyName: string;
  authorName?: string;
};

function buildFallbackDocument(input: GenerateHrDocumentInput): string {
  const spec = getHrDocumentSpec(input.type);
  const fields = Object.entries(input.contextFields)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `- **${key}:** ${value}`)
    .join("\n");

  return `# ${input.title}

**${input.companyName}**  
**Document type:** ${spec.label}  
**Subject:** ${input.subjectName}  
**Date:** ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}

---

Dear ${input.subjectName},

This is a draft **${spec.label}** prepared for ${input.subjectName}.

${input.instructions}

## Details
${fields || "_No additional fields provided._"}

---

Yours sincerely,

**${input.authorName ?? "Human Resources"}**  
${input.companyName}

---
*AI generation is offline. Set \`OPENAI_API_KEY\` for fully drafted corporate documents.*`;
}

export async function generateHrDocument(
  input: GenerateHrDocumentInput
): Promise<string> {
  const docLabel = labelForHrDocumentType(input.type);

  if (!isAiConfigured()) {
    return buildFallbackDocument(input);
  }

  const fieldBlock = Object.entries(input.contextFields)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const system = `You are the HR Document Agent inside Aarvanta OS — an AI-native Business Operating System.
Your job is to draft complete, professional, legally sensible ${docLabel} documents for UK/EU SMEs.

Rules:
- Output polished Markdown ready to send or export to PDF.
- Use formal business English appropriate for HR and corporate correspondence.
- Include letterhead block (company name, date, subject line).
- Include all standard sections for this document type (salutation, body, terms, signature block).
- Use placeholders like [Director Name] only when information is genuinely missing.
- Do NOT invent specific legal jurisdictions beyond UK unless asked.
- Be clear, fair, and professional — never hostile or discriminatory.
- End with signature lines for authorized signatory and HR.

Company issuing document: ${input.companyName}`;

  const user = [
    `Document type: ${docLabel}`,
    `Document title: ${input.title}`,
    `Subject / employee / party name: ${input.subjectName}`,
    `Additional instructions from HR:\n${input.instructions}`,
    fieldBlock ? `Structured fields:\n${fieldBlock}` : null,
    `Prepared by: ${input.authorName ?? "HR Department"}`,
    `Today's date: ${new Date().toISOString().slice(0, 10)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return completeText({
    system,
    messages: [{ role: "user", content: user }],
    temperature: 0.25,
  });
}
