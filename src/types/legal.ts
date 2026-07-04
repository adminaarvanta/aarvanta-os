import type { TenantScope } from "@/types/communication";

export type LegalContractType = "nda" | "msa" | "employment" | "supplier" | "custom";

export type ClauseRisk = "low" | "medium" | "high";

export type LegalClause = {
  id: string;
  text: string;
  risk: ClauseRisk;
  note?: string;
};

export type LegalContract = TenantScope & {
  id: string;
  title: string;
  type: LegalContractType;
  counterparty: string;
  content: string;
  status: "draft" | "review" | "active" | "expired";
  riskScore: number;
  riskSummary: string;
  clauses: LegalClause[];
  createdAt: string;
  updatedAt: string;
};
