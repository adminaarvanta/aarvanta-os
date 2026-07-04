import type { AgebEngine } from "@/types/ageb";

/** Core engines from AGEB Volume 3 — implementation status tracked in code. */
export const AGEB_ENGINES: AgebEngine[] = [
  {
    id: "identity",
    name: "Identity Engine",
    volume: 3,
    kind: "engine",
    status: "partial",
    description: "Actor model, session auth, RBAC, AI agent identities.",
    capabilities: [
      "User & organization actors",
      "AI agent identity binding",
      "Session-based authentication",
      "Multi-dimensional permissions",
    ],
    apiPath: "/api/tenant",
  },
  {
    id: "workflow",
    name: "Workflow Engine",
    volume: 9,
    kind: "engine",
    status: "partial",
    description: "Trigger → condition → agent → approval → action execution.",
    capabilities: [
      "Event-based triggers",
      "Multi-step approvals",
      "AI workflow generation",
      "Template workflows",
    ],
    apiPath: "/api/workflows",
  },
  {
    id: "rules",
    name: "Rules Engine",
    volume: 3,
    kind: "engine",
    status: "partial",
    description: "Country and industry rule packs with reject/approval actions.",
    capabilities: [
      "UK default rule pack",
      "Finance, payroll, legal rule packs",
      "Intent-aware pack resolution",
      "Mutation validation",
      "Approval requirements",
    ],
    apiPath: "/api/rules/evaluate",
  },
  {
    id: "finance",
    name: "Finance Engine",
    volume: 3,
    kind: "engine",
    status: "partial",
    description: "Double-entry ledger, P&L, balance sheet, invoices, budgets.",
    capabilities: [
      "Journal entries & trial balance",
      "P&L and balance sheet reports",
      "Invoice-to-ledger posting",
      "UK chart of accounts",
      "AI forecasting (via AI CFO)",
    ],
    apiPath: "/api/finance",
  },
  {
    id: "payroll",
    name: "Payroll Engine",
    volume: 3,
    kind: "engine",
    status: "partial",
    description: "UK monthly PAYE/NI payroll, payslips, ledger integration.",
    capabilities: [
      "UK PAYE/NI calculations",
      "Pay run processing",
      "Payslip generation",
      "Payroll journal posting",
    ],
    apiPath: "/api/payroll",
  },
  {
    id: "legal",
    name: "Legal Engine",
    volume: 3,
    kind: "engine",
    status: "partial",
    description: "Contract templates, clause risk analysis, compliance validation.",
    capabilities: [
      "NDA/MSA/employment templates",
      "Clause risk scoring",
      "Contract repository",
      "UK legal rule pack",
    ],
    apiPath: "/api/legal",
  },
  {
    id: "communication",
    name: "Communication Engine",
    volume: 3,
    kind: "engine",
    status: "partial",
    description: "Unified inbox across WhatsApp, email, SMS, voice, website chat.",
    capabilities: [
      "Multi-channel inbox",
      "AI summarization",
      "Sentiment analysis",
      "Outbound delivery",
    ],
    apiPath: "/api/conversations",
  },
  {
    id: "translation",
    name: "Translation & Localization Engine",
    volume: 3,
    kind: "engine",
    status: "planned",
    description: "Real-time translation, currency and date localization.",
    capabilities: [
      "Context-aware translation",
      "Currency formatting",
      "Regional date/time",
      "Legal translation accuracy",
    ],
  },
  {
    id: "billing",
    name: "Billing Engine",
    volume: 3,
    kind: "engine",
    status: "partial",
    description: "Subscriptions, usage tracking, marketplace billing scaffold.",
    capabilities: [
      "Plan tiers",
      "Usage records",
      "Subscription state",
      "Stripe integration (planned)",
    ],
    apiPath: "/api/billing",
  },
  {
    id: "event",
    name: "Event Engine",
    volume: 3,
    kind: "engine",
    status: "partial",
    description: "Domain event bus with audit log and automation triggers.",
    capabilities: [
      "Event publishing",
      "Event catalog",
      "Automation listeners",
      "Audit trail",
    ],
    apiPath: "/api/platform/events",
  },
  {
    id: "launch",
    name: "Launch OS Generator",
    volume: 11,
    kind: "os_module",
    status: "partial",
    description: "Intent-based business OS generation from a raw idea.",
    capabilities: [
      "Industry detection",
      "Business model generation",
      "System orchestration",
      "Real-time deployment",
    ],
    apiPath: "/api/launch",
  },
  {
    id: "intelligence_fabric",
    name: "Intelligence Fabric",
    volume: 5,
    kind: "fabric",
    status: "partial",
    description: "Global Brain, domain brains, buddy orchestration, decision routing.",
    capabilities: [
      "Task routing to buddies",
      "Cross-module reasoning",
      "Decision validation",
      "AI event loop",
    ],
    apiPath: "/api/v1/action/execute",
  },
];

export function getEngineById(id: string): AgebEngine | undefined {
  return AGEB_ENGINES.find((e) => e.id === id);
}

export function engineStats() {
  const counts = { live: 0, partial: 0, scaffold: 0, planned: 0 };
  for (const engine of AGEB_ENGINES) {
    counts[engine.status]++;
  }
  return { total: AGEB_ENGINES.length, ...counts };
}
