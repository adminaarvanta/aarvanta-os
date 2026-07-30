/**
 * Aarvanta OS commercial plan catalog — single source of truth for limits,
 * credit tariffs, and public pricing copy.
 *
 * Unit-economics assumptions (GBP, approx.):
 * - Non-voice AI credit COGS ≈ £0.002 / credit (gpt-4o-mini blended)
 * - AI voice minute COGS ≈ £0.10 (Twilio ConversationRelay + PSTN + LLM)
 * - Shared business hosting COGS ≈ £3 / live workspace (CDN); dedicated EC2 is add-on
 * Target: ≥35% gross margin at full included allowance; healthy at typical ~40% use.
 *
 * Packaging note: we do NOT sell “number of websites”. A business owner runs one
 * brand presence (unlimited pages / landing pages). Higher plans unlock extra
 * business workspaces for multi-location, multi-brand, or partner accounts.
 */

import type { BillingPlanId, PublicPlanId } from "@/types/platform-modules";

export type { PublicPlanId, BillingPlanId };

export type PlanLimitKey =
  | "users"
  | "businessWorkspaces"
  | "aiCredits"
  | "aiEmployees"
  | "voiceMinutes"
  | "whatsappConversations"
  | "emailsPerMonth"
  | "storageGb"
  | "workflows"
  | "crmRecords";

export type PlanLimits = Record<PlanLimitKey, number | "unlimited">;

export type FeatureAccess = "none" | "explore" | "lite" | "full";

export type PlanFeatureMatrix = {
  crm: FeatureAccess;
  websiteBuilder: FeatureAccess;
  /** Draft forever on Free; publish custom domain only on paid. */
  publishLiveBusiness: boolean;
  /** Unlimited pages & landing pages under each live business workspace. */
  unlimitedPagesAndLandingPages: boolean;
  sharedHostingSsl: boolean;
  aiWorkforce: FeatureAccess;
  unifiedInbox: FeatureAccess;
  emailChannel: FeatureAccess;
  whatsappChannel: FeatureAccess;
  voiceAi: FeatureAccess;
  workflows: FeatureAccess;
  projects: FeatureAccess;
  knowledgeHub: FeatureAccess;
  finance: FeatureAccess;
  hr: FeatureAccess;
  payroll: FeatureAccess;
  clientPortal: FeatureAccess;
  employeePortal: FeatureAccess;
  analytics: FeatureAccess;
  apiAccess: "none" | "basic" | "standard" | "advanced" | "unlimited";
  whiteLabel: "none" | "lite" | "full";
  support: "community" | "email" | "priority" | "dedicated";
};

export type PlanDefinition = {
  id: PublicPlanId;
  name: string;
  tagline: string;
  /** Monthly list price in GBP. null = free or custom. */
  priceMonthly: number | null;
  /** Annual total in GBP (10× monthly = 2 months free). null if N/A. */
  priceAnnual: number | null;
  currency: "GBP";
  highlighted?: boolean;
  cta: string;
  bestFor: string;
  limits: PlanLimits;
  features: PlanFeatureMatrix;
  /** Short bullets for marketing cards. */
  highlights: string[];
  /** Explicit exclusions for Free / lower tiers. */
  exclusions?: string[];
};

export type CreditTariffActionId =
  | "ai_chat"
  | "conversation_summary"
  | "lead_score"
  | "ai_employee_run"
  | "generate_blog"
  | "generate_landing"
  | "generate_website"
  | "hr_legal_draft"
  | "workflow_ai_step"
  | "knowledge_embed";

/** Published credit burn — only AI actions consume credits. */
export const CREDIT_TARIFF = [
  { id: "ai_chat" as const, action: "AI chat / agent reply", credits: 2, notes: "Inbox, workforce chat, copilot" },
  { id: "conversation_summary" as const, action: "Conversation AI summary", credits: 3, notes: "Sentiment + summary" },
  { id: "lead_score" as const, action: "Lead / deal AI score", credits: 2, notes: "CRM scoring" },
  { id: "ai_employee_run" as const, action: "AI employee task run", credits: 15, notes: "One autonomous workforce run" },
  { id: "generate_blog" as const, action: "Generate blog / long article", credits: 25, notes: "Writing studio" },
  { id: "generate_landing" as const, action: "Generate landing page", credits: 30, notes: "Build OS section" },
  { id: "generate_website" as const, action: "Generate full website", credits: 180, notes: "Multi-page site plan + copy" },
  { id: "hr_legal_draft" as const, action: "HR / legal document draft", credits: 20, notes: "Contracts, JDs, policies" },
  { id: "workflow_ai_step" as const, action: "Workflow AI step", credits: 8, notes: "AI node inside a workflow" },
  { id: "knowledge_embed" as const, action: "Knowledge doc embed", credits: 5, notes: "Per document ingested" },
] as const;

export function creditsForAction(actionId: CreditTariffActionId): number {
  const row = CREDIT_TARIFF.find((r) => r.id === actionId);
  return row?.credits ?? 0;
}

/**
 * Voice is metered in minutes, not credits — COGS is too high to bury in the
 * soft credit pool without a hard cap.
 */
export const VOICE_METERING_NOTE =
  "AI voice minutes are a separate pool. Manual CRM/edits never use credits.";

export const ADD_ONS = [
  {
    id: "extra_user",
    name: "Extra user",
    priceFrom: 12,
    unit: "user/month",
    description: "Additional human seat on any paid plan.",
  },
  {
    id: "extra_business",
    name: "Extra business workspace",
    priceFrom: 29,
    unit: "business/month",
    description:
      "Additional live brand / location with its own domain, CRM scope, and shared hosting. Dedicated EC2 uses Hosting plans.",
  },
  {
    id: "credits_2k",
    name: "Capacity Pack — 2,000 credits",
    priceFrom: 19,
    unit: "pack",
    description: "~£0.0095/credit. Does not roll over past billing period.",
  },
  {
    id: "credits_10k",
    name: "Capacity Pack — 10,000 credits",
    priceFrom: 79,
    unit: "pack",
    description: "~£0.0079/credit.",
  },
  {
    id: "credits_25k",
    name: "Capacity Pack — 25,000 credits",
    priceFrom: 179,
    unit: "pack",
    description: "~£0.0072/credit.",
  },
  {
    id: "voice_50",
    name: "Voice Pack — 50 minutes",
    priceFrom: 9,
    unit: "pack",
    description: "£0.18/min retail vs ~£0.10 COGS.",
  },
  {
    id: "voice_200",
    name: "Voice Pack — 200 minutes",
    priceFrom: 29,
    unit: "pack",
    description: "£0.145/min.",
  },
  {
    id: "voice_500",
    name: "Voice Pack — 500 minutes",
    priceFrom: 65,
    unit: "pack",
    description: "£0.13/min.",
  },
  {
    id: "whatsapp_500",
    name: "WhatsApp Pack — 500 conversations",
    priceFrom: 12,
    unit: "pack",
    description: "AI replies still consume AI credits.",
  },
  {
    id: "hosting_ec2",
    name: "Dedicated EC2 hosting",
    priceFrom: 12,
    unit: "site/month",
    description:
      "Per business workspace. Existing Hosting Starter/Standard/Growth (£12 / £24 / £48).",
  },
] as const;

const exploreCore = {
  crm: "full" as const,
  websiteBuilder: "full" as const,
  publishLiveBusiness: false,
  unlimitedPagesAndLandingPages: true,
  sharedHostingSsl: false,
  aiWorkforce: "explore" as const,
  unifiedInbox: "explore" as const,
  emailChannel: "explore" as const,
  whatsappChannel: "none" as const,
  voiceAi: "none" as const,
  workflows: "explore" as const,
  projects: "full" as const,
  knowledgeHub: "explore" as const,
  finance: "explore" as const,
  hr: "explore" as const,
  payroll: "none" as const,
  clientPortal: "none" as const,
  employeePortal: "none" as const,
  analytics: "explore" as const,
  apiAccess: "none" as const,
  whiteLabel: "none" as const,
  support: "community" as const,
};

export const PLAN_CATALOG: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Build and explore — no card required.",
    priceMonthly: 0,
    priceAnnual: 0,
    currency: "GBP",
    cta: "Start free",
    bestFor: "Marketing acquisition, evaluation, building your business draft, learning the OS",
    limits: {
      users: 1,
      businessWorkspaces: 1,
      aiCredits: 400,
      aiEmployees: 1,
      voiceMinutes: 0,
      whatsappConversations: 0,
      emailsPerMonth: 100,
      storageGb: 1,
      workflows: 2,
      crmRecords: 250,
    },
    features: exploreCore,
    highlights: [
      "1 user — CRM, projects & full site builder (draft)",
      "Build your business online — preview on Aarvanta subdomain",
      "Unlimited pages & landing pages while drafting",
      "400 AI credits / month · 1 AI Employee to explore",
      "Sample inbox & workflows (explore mode)",
      "Community support",
    ],
    exclusions: [
      "No custom domain go-live / SSL publish",
      "No WhatsApp or AI voice calling",
      "No API, portals, payroll, or white-label",
      "Finance & HR in explore/demo data only",
    ],
  },
  {
    id: "starter",
    name: "Launch",
    tagline: "Go live alone — your business online, CRM, and a small AI team.",
    priceMonthly: 49,
    priceAnnual: 490,
    currency: "GBP",
    cta: "Start Launch",
    bestFor: "Freelancers, consultants, solopreneurs ready to publish",
    limits: {
      users: 1,
      businessWorkspaces: 1,
      aiCredits: 3000,
      aiEmployees: 3,
      voiceMinutes: 40,
      whatsappConversations: 200,
      emailsPerMonth: 5000,
      storageGb: 25,
      workflows: 10,
      crmRecords: "unlimited",
    },
    features: {
      ...exploreCore,
      publishLiveBusiness: true,
      sharedHostingSsl: true,
      aiWorkforce: "full",
      unifiedInbox: "full",
      emailChannel: "full",
      whatsappChannel: "full",
      voiceAi: "lite",
      workflows: "full",
      knowledgeHub: "full",
      finance: "lite",
      hr: "lite",
      analytics: "full",
      apiAccess: "basic",
      support: "email",
    },
    highlights: [
      "Everything in Free, unlocked for production",
      "1 live business — custom domain, hosting, SSL & CDN",
      "Unlimited pages & landing pages for that business",
      "3,000 AI credits · 3 AI Employees",
      "40 AI voice minutes + 200 WhatsApp conversations",
      "Finance Lite & HR Lite · basic API",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Small team OS — channels, automation, and complete ops.",
    priceMonthly: 129,
    priceAnnual: 1290,
    currency: "GBP",
    highlighted: true,
    cta: "Start Growth",
    bestFor: "Small businesses with 2–10 people scaling revenue",
    limits: {
      users: 5,
      businessWorkspaces: 1,
      aiCredits: 12000,
      aiEmployees: 8,
      voiceMinutes: 150,
      whatsappConversations: 1000,
      emailsPerMonth: 25000,
      storageGb: 200,
      workflows: 50,
      crmRecords: "unlimited",
    },
    features: {
      crm: "full",
      websiteBuilder: "full",
      publishLiveBusiness: true,
      unlimitedPagesAndLandingPages: true,
      sharedHostingSsl: true,
      aiWorkforce: "full",
      unifiedInbox: "full",
      emailChannel: "full",
      whatsappChannel: "full",
      voiceAi: "full",
      workflows: "full",
      projects: "full",
      knowledgeHub: "full",
      finance: "full",
      hr: "full",
      payroll: "lite",
      clientPortal: "full",
      employeePortal: "full",
      analytics: "full",
      apiAccess: "standard",
      whiteLabel: "none",
      support: "priority",
    },
    highlights: [
      "5 users · 1 live business (unlimited pages & campaigns)",
      "12,000 AI credits · 8 AI Employees",
      "150 AI voice minutes · 1,000 WhatsApp conversations",
      "Complete Finance & HR · client & employee portals",
      "Workflow automation · priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "Multi-location and multi-brand capacity with partner-ready controls.",
    priceMonthly: 299,
    priceAnnual: 2990,
    currency: "GBP",
    cta: "Start Scale",
    bestFor: "Growing companies, multi-location brands, or agency partners",
    limits: {
      users: 20,
      businessWorkspaces: 3,
      aiCredits: 35000,
      aiEmployees: 25,
      voiceMinutes: 400,
      whatsappConversations: 4000,
      emailsPerMonth: 75000,
      storageGb: 1000,
      workflows: "unlimited",
      crmRecords: "unlimited",
    },
    features: {
      crm: "full",
      websiteBuilder: "full",
      publishLiveBusiness: true,
      unlimitedPagesAndLandingPages: true,
      sharedHostingSsl: true,
      aiWorkforce: "full",
      unifiedInbox: "full",
      emailChannel: "full",
      whatsappChannel: "full",
      voiceAi: "full",
      workflows: "full",
      projects: "full",
      knowledgeHub: "full",
      finance: "full",
      hr: "full",
      payroll: "full",
      clientPortal: "full",
      employeePortal: "full",
      analytics: "full",
      apiAccess: "advanced",
      whiteLabel: "lite",
      support: "dedicated",
    },
    highlights: [
      "20 users · up to 3 live businesses (brands / locations)",
      "35,000 AI credits · 25 AI Employees",
      "400 voice minutes · 4,000 WhatsApp conversations",
      "Full payroll · white-label lite · partner portal",
      "Advanced API · dedicated success manager",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom capacity, security, and dedicated infrastructure.",
    priceMonthly: null,
    priceAnnual: null,
    currency: "GBP",
    cta: "Contact sales",
    bestFor: "Large organisations with SSO, SLA, and committed usage",
    limits: {
      users: "unlimited",
      businessWorkspaces: "unlimited",
      aiCredits: "unlimited",
      aiEmployees: "unlimited",
      voiceMinutes: "unlimited",
      whatsappConversations: "unlimited",
      emailsPerMonth: "unlimited",
      storageGb: "unlimited",
      workflows: "unlimited",
      crmRecords: "unlimited",
    },
    features: {
      crm: "full",
      websiteBuilder: "full",
      publishLiveBusiness: true,
      unlimitedPagesAndLandingPages: true,
      sharedHostingSsl: true,
      aiWorkforce: "full",
      unifiedInbox: "full",
      emailChannel: "full",
      whatsappChannel: "full",
      voiceAi: "full",
      workflows: "full",
      projects: "full",
      knowledgeHub: "full",
      finance: "full",
      hr: "full",
      payroll: "full",
      clientPortal: "full",
      employeePortal: "full",
      analytics: "full",
      apiAccess: "unlimited",
      whiteLabel: "full",
      support: "dedicated",
    },
    highlights: [
      "Unlimited business workspaces under contract",
      "Committed usage (credits + voice)",
      "SSO, private AI options, multi-region",
      "Custom integrations & SLA · full white-label",
    ],
  },
];

export function getPlan(id: PublicPlanId): PlanDefinition | undefined {
  return PLAN_CATALOG.find((p) => p.id === id);
}

export function getPaidPlans(): PlanDefinition[] {
  return PLAN_CATALOG.filter((p) => p.id !== "free");
}

/** Stripe / in-app billing cards (excludes Free). Enterprise is custom quote. */
export function getBillingPlanSummaries() {
  return getPaidPlans().map((p) => ({
    id: p.id as BillingPlanId,
    name: p.name,
    priceMonthly: p.id === "enterprise" ? 0 : (p.priceMonthly ?? 0),
    currency: p.currency,
    features: p.highlights,
  }));
}

/** Rough included COGS at 100% allowance (Enterprise excluded). */
export function estimateIncludedCogsGbp(plan: PlanDefinition): number | null {
  if (plan.priceMonthly === null || plan.id === "enterprise") return null;
  const credits =
    typeof plan.limits.aiCredits === "number" ? plan.limits.aiCredits : 0;
  const voice =
    typeof plan.limits.voiceMinutes === "number" ? plan.limits.voiceMinutes : 0;
  const workspaces =
    typeof plan.limits.businessWorkspaces === "number"
      ? plan.limits.businessWorkspaces
      : 0;
  const wa =
    typeof plan.limits.whatsappConversations === "number"
      ? plan.limits.whatsappConversations
      : 0;

  const creditCogs = credits * 0.002;
  const voiceCogs = voice * 0.1;
  /** Live publish hosting only when the plan can go live. */
  const siteCogs = plan.features.publishLiveBusiness ? workspaces * 3 : 0;
  const waCogs = wa * 0.008;
  return Math.round((creditCogs + voiceCogs + siteCogs + waCogs) * 10) / 10;
}

export function estimateGrossMarginPct(plan: PlanDefinition): number | null {
  const cogs = estimateIncludedCogsGbp(plan);
  if (cogs === null || plan.priceMonthly === null || plan.priceMonthly <= 0) {
    return null;
  }
  return Math.round(((plan.priceMonthly - cogs) / plan.priceMonthly) * 100);
}
