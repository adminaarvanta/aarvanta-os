import type { AgebVolume } from "@/types/ageb";

/** AGEB 2.0 volumes — implementation alignment vs blueprint document. */
export const AGEB_VOLUMES: AgebVolume[] = [
  {
    number: 1,
    title: "Constitution of Aarvanta OS",
    status: "partial",
    summary:
      "Core principles encoded in identity model, events, rules engine, and tenant RBAC.",
  },
  {
    number: 2,
    title: "Global System Architecture",
    status: "partial",
    summary:
      "Layered app architecture live. Microservices and multi-cloud deployment planned.",
  },
  {
    number: 3,
    title: "Core Engines",
    status: "partial",
    summary:
      "Identity, workflow, rules, finance, legal, communication, billing, and event engines scaffolded or live.",
  },
  {
    number: 4,
    title: "Data Architecture",
    status: "partial",
    summary:
      "Unified Firestore/memory datastore with tenant scope. Event-first mutations live.",
  },
  {
    number: 5,
    title: "AI Architecture",
    status: "partial",
    summary:
      "AI Workforce, buddy framework, intelligence fabric orchestration, and decision validation.",
  },
  {
    number: 6,
    title: "UI / Experience Architecture",
    status: "partial",
    summary:
      "Gold-on-black design system, role-based modules, workflow-driven screens.",
  },
  {
    number: 7,
    title: "Security & Compliance",
    status: "partial",
    summary:
      "JWT auth, Firestore rules deny-all, RBAC, governance audit trail.",
  },
  {
    number: 8,
    title: "API Architecture & Developer Platform",
    status: "partial",
    summary:
      "REST APIs per module. Business Action API (/v1/action/execute) live.",
  },
  {
    number: 9,
    title: "Workflow Engine (Deep Execution)",
    status: "partial",
    summary:
      "Template workflows, approvals, agent steps. Visual drag-drop builder planned.",
  },
  {
    number: 10,
    title: "Industry OS Deep System",
    status: "scaffold",
    summary:
      "Industry profiles and dynamic UI adaptation scaffolded via Launch OS.",
  },
  {
    number: 11,
    title: "Launch OS (Business Generation Engine)",
    status: "partial",
    summary:
      "M1 complete: intent → brand/domain/legal/store → deploy with UK finance stack and public storefront.",
  },
  {
    number: 12,
    title: "Marketplace & Ecosystem",
    status: "partial",
    summary: "Agent marketplace UI. Plugin sandbox and revenue sharing planned.",
  },
  {
    number: 13,
    title: "Deployment & Global Infrastructure",
    status: "scaffold",
    summary: "Multi-region config page. Global load balancer and DR planned.",
  },
  {
    number: 14,
    title: "AI Economy & Autonomous Business",
    status: "scaffold",
    summary: "Autonomous agent task queue scaffolded.",
  },
  {
    number: 15,
    title: "Master System Blueprint",
    status: "scaffold",
    summary: "Platform hub, coverage report, and AGEB status dashboard.",
  },
];

export function volumeStats() {
  const counts = { live: 0, partial: 0, scaffold: 0, planned: 0 };
  for (const vol of AGEB_VOLUMES) {
    counts[vol.status]++;
  }
  return { total: AGEB_VOLUMES.length, ...counts };
}
