import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { chunkText } from "@/lib/knowledge/chunking";
import type { KnowledgeDocument, KnowledgeChunk } from "@/types/knowledge";

const onboardingSop = `Customer Onboarding SOP — Aarvanta Limited

1. Welcome call within 24 hours of contract signature.
2. Collect company profile, team size, and primary goals.
3. Configure Aarvanta OS workspace with CRM, inbox, and AI workforce.
4. Import existing contacts and pipeline stages.
5. Train the client team on unified inbox and AI CEO daily briefing.
6. Schedule 30-day check-in to review adoption and KPIs.

Escalation: If onboarding exceeds 14 days, notify the AI COO and account owner.`;

const salesPlaybook = `Aarvanta OS Sales Playbook

Ideal customer profile: SMEs with 5–50 employees using fragmented tools for CRM, comms, and ops.

Value proposition: One AI Workforce & Business Operating System replacing chatbots, separate CRMs, and workflow tools.

Discovery questions:
- How do you track leads and follow-ups today?
- Which manual processes consume the most leadership time?
- What would a daily AI business briefing be worth to you?

Pricing tiers: Starter (single workspace), Growth (AI workforce + knowledge hub), Scale (multi-team), Enterprise (SSO + governance).`;

const hrPolicy = `Remote Work Policy — Aarvanta Limited

All employees may work remotely 3 days per week. Core collaboration hours are 10:00–16:00 UK time.

Equipment: Company provides laptop and required software licenses.

Leave: 25 days annual leave plus UK bank holidays. Request leave via HR OS (coming soon) or email HR.

Performance reviews occur quarterly with OKRs aligned to company goals.`;

function seedDoc(
  id: string,
  title: string,
  fileName: string,
  fileType: KnowledgeDocument["fileType"],
  text: string,
  tags: string[],
  summary: string,
  createdAt: string
): { doc: KnowledgeDocument; chunks: KnowledgeChunk[] } {
  const pieces = chunkText(text);
  const doc: KnowledgeDocument = {
    ...DEMO_TENANT,
    id,
    title,
    fileName,
    fileType,
    fileSize: text.length,
    tags,
    summary,
    chunkCount: pieces.length,
    charCount: text.length,
    status: "ready",
    createdAt,
    updatedAt: createdAt,
  };

  const chunks: KnowledgeChunk[] = pieces.map((content, index) => ({
    ...DEMO_TENANT,
    id: `${id}_chunk_${index}`,
    documentId: id,
    documentTitle: title,
    index,
    content,
    createdAt,
  }));

  return { doc, chunks };
}

const seeded = [
  seedDoc(
    "kdoc_onboarding",
    "Customer Onboarding SOP",
    "customer-onboarding-sop.txt",
    "txt",
    onboardingSop,
    ["sop", "onboarding", "operations"],
    "Standard 6-step customer onboarding process with escalation rules for delays beyond 14 days.",
    "2026-06-01T09:00:00.000Z"
  ),
  seedDoc(
    "kdoc_sales",
    "Sales Playbook",
    "sales-playbook.txt",
    "txt",
    salesPlaybook,
    ["sales", "playbook", "pricing"],
    "ICP, value proposition, discovery questions, and pricing tier overview for Aarvanta OS.",
    "2026-06-05T10:00:00.000Z"
  ),
  seedDoc(
    "kdoc_hr",
    "Remote Work Policy",
    "remote-work-policy.txt",
    "txt",
    hrPolicy,
    ["hr", "policy", "remote"],
    "Remote work guidelines, equipment, leave, and quarterly performance review policy.",
    "2026-06-08T11:00:00.000Z"
  ),
];

export const DEMO_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = seeded.map((s) => s.doc);
export const DEMO_KNOWLEDGE_CHUNKS: KnowledgeChunk[] = seeded.flatMap((s) => s.chunks);

export function buildDemoKnowledgeSeed() {
  return {
    documents: structuredClone(DEMO_KNOWLEDGE_DOCUMENTS),
    chunks: structuredClone(DEMO_KNOWLEDGE_CHUNKS),
  };
}
