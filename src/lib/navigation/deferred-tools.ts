/**
 * Modules that exist as routes/seeds but are not product-ready yet.
 * Hidden from All Tools and feature search until completed.
 *
 * Human backlog: docs/DEFERRED_TOOLS.md
 */
export type DeferredTool = {
  id: string;
  label: string;
  href: string;
  reason: string;
  /** Rough completion notes for later work */
  todo: string;
};

export const DEFERRED_TOOLS: DeferredTool[] = [
  {
    id: "analytics-v2",
    label: "Analytics 2.0",
    href: "/analytics",
    reason: "Duplicate of Analytics — same href, not a separate product surface.",
    todo: "Remove from PLATFORM_MODULES once All Tools consumers are stable, or merge copy into Analytics.",
  },
  {
    id: "ageb",
    label: "AGEB Blueprint",
    href: "/platform/ageb",
    reason: "Internal engineering status page, not an end-user tool.",
    todo: "Keep under /platform for engineers; do not surface in All Tools.",
  },
  {
    id: "engines",
    label: "Core Engines",
    href: "/platform/engines",
    reason: "Status catalog; many engines still “Coming soon”.",
    todo: "Wire real engine health and promote when actionable.",
  },
  {
    id: "portal",
    label: "Client Portal",
    href: "/portal",
    reason: "Read-only seeded access list — not a customer-facing portal.",
    todo: "Build authenticated client login, project/docs/messages views, and mutations.",
  },
  {
    id: "knowledge-graph",
    label: "Knowledge Graph",
    href: "/knowledge/graph",
    reason: "Seeded entity lists only — no graph UI or editing.",
    todo: "Add relationship graph visualization, search, and CRUD on nodes/edges.",
  },
  {
    id: "wiki",
    label: "Internal Wiki",
    href: "/wiki",
    reason: "Read-only seeded pages; no editor or create flow.",
    todo: "Add page editor, departments, search, and write APIs.",
  },
  {
    id: "memory",
    label: "Memory Layers",
    href: "/memory",
    reason: "Read-only seeded layers; real memory lives under AI Workforce agents.",
    todo: "Either fold into Workforce memory UX or build company/team memory management UI.",
  },
  {
    id: "templates",
    label: "Templates",
    href: "/templates",
    reason: "Read-only catalog; no apply/use/install flow.",
    todo: "Template picker that creates proposals, SOPs, workflows, or campaigns.",
  },
  {
    id: "franchise",
    label: "Franchise OS",
    href: "/franchise",
    reason: "Read-only seeded locations; GET-only.",
    todo: "Multi-location performance, compliance checks, and location management.",
  },
  {
    id: "regions",
    label: "Multi-Region",
    href: "/regions",
    reason: "Static region map; no residency/routing controls.",
    todo: "Data residency settings, tenant region assignment, latency routing.",
  },
  {
    id: "success",
    label: "Customer Success",
    href: "/success",
    reason: "Read-only health scores; no renewals/NPS actions.",
    todo: "Health scoring pipeline, renewal tasks, NPS capture, churn alerts.",
  },
  {
    id: "governance",
    label: "Governance",
    href: "/governance",
    reason: "Read-only audit list; no permission-management UI.",
    todo: "Live audit trail, retention policies, and permission review workflows.",
  },
  {
    id: "legal",
    label: "Legal OS",
    href: "/legal",
    reason: "List-only shell; analyze/generate APIs exist but no usable page UI.",
    todo: "Contract upload, clause analysis UI, risk scoring, template generation.",
  },
];

export const DEFERRED_TOOL_IDS = new Set(DEFERRED_TOOLS.map((t) => t.id));

export function isDeferredToolId(id: string): boolean {
  return DEFERRED_TOOL_IDS.has(id);
}
