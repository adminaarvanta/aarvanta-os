import type { FeatureAccess, PlanFeatureMatrix } from "@/lib/billing/plan-catalog";

/** Keys on PlanFeatureMatrix that use FeatureAccess (not booleans/enums). */
export type PlanFeatureKey = {
  [K in keyof PlanFeatureMatrix]: PlanFeatureMatrix[K] extends FeatureAccess ? K : never;
}[keyof PlanFeatureMatrix];

const ACCESS_RANK: Record<FeatureAccess, number> = {
  none: 0,
  explore: 1,
  lite: 2,
  full: 3,
};

export function accessRank(access: FeatureAccess): number {
  return ACCESS_RANK[access];
}

export function hasMinAccess(
  actual: FeatureAccess,
  required: FeatureAccess
): boolean {
  return accessRank(actual) >= accessRank(required);
}

/** Map platform module ids and nav paths to plan feature keys. */
export const MODULE_FEATURE_MAP: Record<string, PlanFeatureKey | "ungated"> = {
  dashboard: "ungated",
  help: "ungated",
  billing: "ungated",
  settings: "ungated",
  organization: "ungated",
  team: "ungated",
  integrations: "ungated",
  referrals: "ungated",
  affiliate: "ungated",
  inbox: "unifiedInbox",
  communications: "unifiedInbox",
  whatsapp: "whatsappChannel",
  voice: "voiceAi",
  calling: "voiceAi",
  crm: "crm",
  workforce: "aiWorkforce",
  projects: "projects",
  workflows: "workflows",
  hr: "hr",
  finance: "finance",
  payroll: "payroll",
  analytics: "analytics",
  knowledge: "knowledgeHub",
  wiki: "knowledgeHub",
  build: "websiteBuilder",
  launch: "websiteBuilder",
  writing: "websiteBuilder",
  portal: "clientPortal",
  proposals: "clientPortal",
  marketplace: "aiWorkforce",
  meetings: "unifiedInbox",
  templates: "workflows",
  sops: "workflows",
  legal: "hr",
  governance: "analytics",
  success: "analytics",
  memory: "knowledgeHub",
  franchise: "ungated",
  regions: "ungated",
  sso: "ungated",
  platform: "ungated",
  demo: "ungated",
};

/** Resolve feature key from a pathname like /finance/invoices. */
export function featureKeyForPath(pathname: string): PlanFeatureKey | "ungated" | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment) return "ungated";
  return MODULE_FEATURE_MAP[segment] ?? null;
}

export function featureKeyForModuleId(
  moduleId: string
): PlanFeatureKey | "ungated" | null {
  return MODULE_FEATURE_MAP[moduleId] ?? null;
}
