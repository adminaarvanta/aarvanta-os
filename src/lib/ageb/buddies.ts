import type { AiBuddyDefinition } from "@/types/ageb";

/** AI Buddy framework — maps AGEB Volume 5 buddies to workforce agents. */
export const AI_BUDDIES: AiBuddyDefinition[] = [
  {
    id: "accounting_buddy",
    name: "Accounting Buddy",
    domain: "accounting",
    workforceAgentType: "cfo",
    description: "Reconciliation, journal entries, expense classification, forecasting.",
    tools: ["finance_engine", "rules_engine", "document_ingest"],
    status: "partial",
  },
  {
    id: "legal_buddy",
    name: "Legal Buddy",
    domain: "legal",
    workforceAgentType: "hr_manager",
    description: "Contracts, NDAs, employment agreements, compliance validation.",
    tools: ["legal_engine", "rules_engine", "document_generate"],
    status: "partial",
  },
  {
    id: "payroll_buddy",
    name: "Payroll Buddy",
    domain: "payroll",
    description: "Salary processing, tax calculation, payslip generation.",
    tools: ["payroll_engine", "rules_engine", "hr_engine"],
    status: "planned",
  },
  {
    id: "hr_buddy",
    name: "HR Buddy",
    domain: "hr",
    workforceAgentType: "hr_manager",
    description: "Recruitment, JD creation, onboarding, candidate screening.",
    tools: ["hr_engine", "workflow_engine", "document_generate"],
    status: "partial",
  },
  {
    id: "sales_buddy",
    name: "Sales Buddy",
    domain: "sales",
    workforceAgentType: "sales_manager",
    description: "Lead scoring, pipeline management, follow-up automation.",
    tools: ["crm_engine", "workflow_engine", "communication_engine"],
    status: "partial",
  },
  {
    id: "marketing_buddy",
    name: "Marketing Buddy",
    domain: "marketing",
    workforceAgentType: "marketing_manager",
    description: "Campaign creation, content generation, SEO recommendations.",
    tools: ["writing_engine", "crm_engine", "knowledge_hub"],
    status: "partial",
  },
  {
    id: "operations_buddy",
    name: "Operations Buddy",
    domain: "operations",
    workforceAgentType: "coo",
    description: "Process optimization, bottleneck detection, workflow monitoring.",
    tools: ["workflow_engine", "project_engine", "event_engine"],
    status: "partial",
  },
  {
    id: "inventory_buddy",
    name: "Inventory Buddy",
    domain: "inventory",
    description: "Stock tracking, reorder alerts, fulfillment coordination.",
    tools: ["commerce_engine", "workflow_engine"],
    status: "planned",
  },
  {
    id: "customer_success_buddy",
    name: "Customer Success Buddy",
    domain: "customer_success",
    workforceAgentType: "customer_success_manager",
    description: "Health scores, ticket handling, churn prediction, renewals.",
    tools: ["crm_engine", "communication_engine", "success_engine"],
    status: "partial",
  },
  {
    id: "ceo_buddy",
    name: "Global Brain (CEO)",
    domain: "operations",
    workforceAgentType: "ceo",
    description: "Cross-module strategic reasoning, KPI monitoring, growth recommendations.",
    tools: ["intelligence_fabric", "analytics_engine", "all_modules"],
    status: "partial",
  },
];

export function getBuddyById(id: string): AiBuddyDefinition | undefined {
  return AI_BUDDIES.find((b) => b.id === id);
}

export function buddiesForIndustry(industryProfileId: string): AiBuddyDefinition[] {
  const industryBuddyMap: Record<string, string[]> = {
    retail_ecommerce: [
      "sales_buddy",
      "marketing_buddy",
      "accounting_buddy",
      "customer_success_buddy",
      "operations_buddy",
    ],
    professional_services: [
      "sales_buddy",
      "legal_buddy",
      "accounting_buddy",
      "hr_buddy",
      "ceo_buddy",
    ],
    restaurant_hospitality: [
      "operations_buddy",
      "accounting_buddy",
      "hr_buddy",
      "inventory_buddy",
    ],
    healthcare: ["operations_buddy", "legal_buddy", "hr_buddy", "customer_success_buddy"],
    manufacturing: [
      "operations_buddy",
      "inventory_buddy",
      "accounting_buddy",
      "sales_buddy",
    ],
    construction: ["operations_buddy", "legal_buddy", "accounting_buddy", "sales_buddy"],
    default: ["ceo_buddy", "sales_buddy", "accounting_buddy", "operations_buddy"],
  };

  const ids = industryBuddyMap[industryProfileId] ?? industryBuddyMap.default!;
  return ids
    .map((id) => getBuddyById(id))
    .filter((b): b is AiBuddyDefinition => Boolean(b));
}
