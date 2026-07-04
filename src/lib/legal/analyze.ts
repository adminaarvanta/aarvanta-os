import type { ClauseRisk, LegalClause, LegalContractType } from "@/types/legal";

const RISK_PATTERNS: Array<{ pattern: RegExp; risk: ClauseRisk; note: string }> = [
  {
    pattern: /unlimited liability/i,
    risk: "high",
    note: "Unlimited liability exposes the business to uncapped risk.",
  },
  {
    pattern: /indemnif/i,
    risk: "medium",
    note: "Indemnity clause — verify scope and cap.",
  },
  {
    pattern: /exclusive jurisdiction/i,
    risk: "low",
    note: "Jurisdiction clause — confirm it matches your operating country.",
  },
  {
    pattern: /auto-?renew/i,
    risk: "medium",
    note: "Auto-renewal may lock you into unwanted terms.",
  },
  {
    pattern: /non-?compete/i,
    risk: "high",
    note: "Non-compete restrictions — UK enforceability varies; seek legal review.",
  },
  {
    pattern: /gdpr|data protection/i,
    risk: "low",
    note: "Data protection reference — ensure UK GDPR alignment.",
  },
  {
    pattern: /terminate.*without cause/i,
    risk: "medium",
    note: "Termination without cause — check notice periods.",
  },
];

export function analyzeContractText(content: string): {
  clauses: LegalClause[];
  riskScore: number;
  riskSummary: string;
} {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const clauses: LegalClause[] = paragraphs.slice(0, 12).map((text, index) => {
    let risk: ClauseRisk = "low";
    let note: string | undefined;

    for (const rule of RISK_PATTERNS) {
      if (rule.pattern.test(text)) {
        risk = rule.risk;
        note = rule.note;
        break;
      }
    }

    return {
      id: `clause_${index + 1}`,
      text: text.slice(0, 280) + (text.length > 280 ? "…" : ""),
      risk,
      note,
    };
  });

  const high = clauses.filter((c) => c.risk === "high").length;
  const medium = clauses.filter((c) => c.risk === "medium").length;
  const riskScore = Math.min(100, high * 30 + medium * 15 + 10);

  const riskSummary =
    high > 0
      ? `${high} high-risk clause(s) detected — legal review recommended before signing.`
      : medium > 0
        ? `${medium} medium-risk clause(s) — review recommended.`
        : "No significant risks detected in automated scan.";

  return { clauses, riskScore, riskSummary };
}

export function getLegalContractTemplate(
  type: LegalContractType,
  input: { brandName: string; counterparty: string }
): string {
  const templates: Record<LegalContractType, string> = {
    nda: `# Mutual Non-Disclosure Agreement

Between **${input.brandName}** and **${input.counterparty}**

Each party agrees to keep confidential all proprietary information shared during discussions. Obligations survive for 3 years from disclosure.

No unlimited liability. Governing law: England and Wales.`,

    msa: `# Master Services Agreement

**${input.brandName}** (Supplier) and **${input.counterparty}** (Client)

## Services
Supplier will deliver professional services as defined in statements of work.

## Payment
Net 30 days. VAT applies where relevant.

## Liability
Liability capped at fees paid in the prior 12 months. No unlimited liability.

## Term
12 months, auto-renewal unless 30 days notice.`,

    employment: `# Employment Contract (Draft)

**${input.brandName}** employs **${input.counterparty}**

Role, salary, and start date to be confirmed. Standard UK employment protections apply including GDPR data handling.

Probation: 3 months. Notice: 1 month.`,

    supplier: `# Supplier Agreement

**${input.brandName}** and **${input.counterparty}**

Supply of goods/services per purchase orders. Quality standards per specification. Payment terms: net 30.`,

    custom: `# Custom Agreement\n\nParties: ${input.brandName} and ${input.counterparty}\n\n[Add terms]`,
  };

  return templates[type];
}
