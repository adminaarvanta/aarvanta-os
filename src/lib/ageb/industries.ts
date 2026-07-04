import type { IndustryProfile } from "@/types/ageb";

export const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    id: "retail_ecommerce",
    label: "Retail & E-commerce",
    primarySector: "retail",
    secondarySectors: ["ecommerce", "consumer_goods"],
    defaultWorkflows: ["lead_nurturing", "customer_onboarding", "deal_won"],
    defaultBuddies: [
      "sales_buddy",
      "marketing_buddy",
      "accounting_buddy",
      "customer_success_buddy",
    ],
    kpis: ["conversion_rate", "average_order_value", "cart_abandonment", "revenue"],
    complianceNotes: ["consumer_protection", "gdpr", "distance_selling"],
  },
  {
    id: "professional_services",
    label: "Professional Services",
    primarySector: "services",
    secondarySectors: ["consulting", "agency"],
    defaultWorkflows: ["lead_nurturing", "customer_onboarding", "deal_won"],
    defaultBuddies: ["sales_buddy", "legal_buddy", "accounting_buddy", "hr_buddy"],
    kpis: ["utilization_rate", "pipeline_value", "client_retention", "margin"],
    complianceNotes: ["contract_law", "data_protection", "professional_indemnity"],
  },
  {
    id: "restaurant_hospitality",
    label: "Restaurant & Hospitality",
    primarySector: "hospitality",
    secondarySectors: ["food_service", "retail"],
    defaultWorkflows: ["customer_onboarding"],
    defaultBuddies: ["operations_buddy", "accounting_buddy", "hr_buddy"],
    kpis: ["table_turnover", "food_cost_ratio", "labour_cost", "covers"],
    complianceNotes: ["food_hygiene", "allergen_labelling", "licensing"],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    primarySector: "healthcare",
    secondarySectors: ["clinical", "wellness"],
    defaultWorkflows: ["customer_onboarding"],
    defaultBuddies: ["operations_buddy", "legal_buddy", "hr_buddy"],
    kpis: ["patient_satisfaction", "appointment_utilization", "wait_times"],
    complianceNotes: ["hipaa_gdpr", "clinical_protocols", "data_security"],
  },
  {
    id: "manufacturing",
    label: "Manufacturing",
    primarySector: "manufacturing",
    secondarySectors: ["industrial", "supply_chain"],
    defaultWorkflows: ["deal_won", "customer_onboarding"],
    defaultBuddies: ["operations_buddy", "inventory_buddy", "accounting_buddy"],
    kpis: ["production_yield", "defect_rate", "lead_time", "inventory_turns"],
    complianceNotes: ["iso_standards", "health_safety", "environmental"],
  },
  {
    id: "construction",
    label: "Construction",
    primarySector: "construction",
    secondarySectors: ["real_estate", "trades"],
    defaultWorkflows: ["lead_nurturing", "deal_won"],
    defaultBuddies: ["operations_buddy", "legal_buddy", "accounting_buddy"],
    kpis: ["project_margin", "schedule_variance", "safety_incidents"],
    complianceNotes: ["building_regs", "cdm", "contract_law"],
  },
];

const KEYWORD_MAP: Array<{ keywords: string[]; profileId: string }> = [
  {
    keywords: [
      "candle",
      "shop",
      "store",
      "ecommerce",
      "e-commerce",
      "retail",
      "product",
      "sell online",
      "marketplace",
    ],
    profileId: "retail_ecommerce",
  },
  {
    keywords: [
      "consult",
      "agency",
      "service",
      "law",
      "accounting",
      "design",
      "marketing agency",
    ],
    profileId: "professional_services",
  },
  {
    keywords: ["restaurant", "cafe", "food", "kitchen", "hospitality", "hotel"],
    profileId: "restaurant_hospitality",
  },
  {
    keywords: ["clinic", "hospital", "health", "medical", "dental", "patient"],
    profileId: "healthcare",
  },
  {
    keywords: ["factory", "manufactur", "production", "warehouse", "supply"],
    profileId: "manufacturing",
  },
  {
    keywords: ["construction", "builder", "contractor", "renovation", "property"],
    profileId: "construction",
  },
];

export function getIndustryProfile(id: string): IndustryProfile | undefined {
  return INDUSTRY_PROFILES.find((p) => p.id === id);
}

export function detectIndustryFromText(text: string): {
  profile: IndustryProfile;
  confidence: number;
  matchedKeywords: string[];
} {
  const lower = text.toLowerCase();
  let best = { profileId: "retail_ecommerce", score: 0, keywords: [] as string[] };

  for (const entry of KEYWORD_MAP) {
    const matched = entry.keywords.filter((k) => lower.includes(k));
    if (matched.length > best.score) {
      best = { profileId: entry.profileId, score: matched.length, keywords: matched };
    }
  }

  const profile = getIndustryProfile(best.profileId) ?? INDUSTRY_PROFILES[0]!;
  const confidence = best.score > 0 ? Math.min(0.95, 0.55 + best.score * 0.15) : 0.45;

  return { profile, confidence, matchedKeywords: best.keywords };
}
