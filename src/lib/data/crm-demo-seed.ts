import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { DEMO_AGENT_TASKS } from "@/lib/data/workforce-demo-seed";
import { crmNow } from "@/lib/data/crm-helpers";
import type {
  CrmActivity,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmPipeline,
  CrmTask,
} from "@/types/crm";
import type { TenantScope } from "@/types/communication";

const now = crmNow();
const pipelineId = "pipe_main";
const stageLead = "stage_lead";
const stageQualified = "stage_qualified";
const stageProposal = "stage_proposal";
const stageNegotiation = "stage_negotiation";
const stageWon = "stage_won";

const companyMeridian: CrmCompany = {
  ...DEMO_TENANT,
  id: "co_meridian",
  name: "Meridian Consulting",
  domain: "meridianconsulting.co.uk",
  industry: "Consulting",
  size: "11-50",
  website: "https://meridianconsulting.co.uk",
  tags: ["prospect", "partner"],
  purchaseTotal: 0,
  currency: "GBP",
  notes: "Inbound from website chat — interested in AI workforce.",
  createdAt: now,
  updatedAt: now,
};

const companyNorthstar: CrmCompany = {
  ...DEMO_TENANT,
  id: "co_northstar",
  name: "Northstar Digital",
  domain: "northstar.digital",
  industry: "Marketing",
  size: "51-200",
  website: "https://northstar.digital",
  tags: ["customer", "vip"],
  purchaseTotal: 24000,
  currency: "GBP",
  notes: "Existing Growth plan customer — strong upsell potential.",
  createdAt: now,
  updatedAt: now,
};

const companyBrightpath: CrmCompany = {
  ...DEMO_TENANT,
  id: "co_brightpath",
  name: "BrightPath Labs",
  domain: "brightpath.io",
  industry: "SaaS",
  size: "1-10",
  website: "https://brightpath.io",
  tags: ["prospect"],
  purchaseTotal: 0,
  currency: "GBP",
  notes: "Early-stage founder-led SaaS. Needs nurture.",
  createdAt: now,
  updatedAt: now,
};

const companyHarbor: CrmCompany = {
  ...DEMO_TENANT,
  id: "co_harbor",
  name: "Harbor Retail Group",
  domain: "harborretail.co.uk",
  industry: "Retail",
  size: "201-500",
  website: "https://harborretail.co.uk",
  tags: ["prospect", "hot_lead"],
  purchaseTotal: 0,
  currency: "GBP",
  notes: "Multi-location retailer exploring unified inbox + CRM.",
  createdAt: now,
  updatedAt: now,
};

export const DEMO_CRM_PIPELINES: CrmPipeline[] = [
  {
    ...DEMO_TENANT,
    id: pipelineId,
    name: "Sales Pipeline",
    stages: [
      { id: stageLead, name: "Lead", order: 0, probability: 10 },
      { id: stageQualified, name: "Qualified", order: 1, probability: 35 },
      { id: stageProposal, name: "Proposal", order: 2, probability: 60 },
      { id: stageNegotiation, name: "Negotiation", order: 3, probability: 80 },
      { id: stageWon, name: "Won", order: 4, probability: 100 },
    ],
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_CRM_CONTACTS: CrmContact[] = [
  {
    ...DEMO_TENANT,
    id: "contact_sarah",
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@meridianconsulting.co.uk",
    phone: "+447700900123",
    jobTitle: "Managing Director",
    accountId: companyMeridian.id,
    tags: ["hot_lead", "prospect", "follow_up"],
    leadScore: 82,
    leadScoreReason: "High engagement; proposal stage deal; active inbox thread.",
    leadScoreUpdatedAt: now,
    purchases: [],
    purchaseTotal: 0,
    currency: "GBP",
    conversationIds: ["conv_whatsapp_sarah"],
    notes: "Prefers WhatsApp for quick updates; board review mid-month.",
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "contact_james",
    firstName: "James",
    lastName: "Okonkwo",
    email: "james@northstar.digital",
    phone: "+447700900456",
    jobTitle: "Head of Operations",
    accountId: companyNorthstar.id,
    tags: ["customer", "vip"],
    leadScore: 91,
    leadScoreReason: "Existing customer with upsell potential; £24k purchase history.",
    leadScoreUpdatedAt: now,
    purchases: [
      {
        id: "pur_1",
        label: "Aarvanta OS Growth plan",
        amount: 24000,
        currency: "GBP",
        purchasedAt: "2026-03-01T00:00:00.000Z",
      },
    ],
    purchaseTotal: 24000,
    currency: "GBP",
    conversationIds: [],
    notes: "Renewal in 90 days. Interested in AI workforce add-on.",
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "contact_emily",
    firstName: "Emily",
    lastName: "Walsh",
    email: "emily.walsh@brightpath.io",
    phone: "+447700900789",
    jobTitle: "Founder",
    accountId: companyBrightpath.id,
    tags: ["prospect"],
    leadScore: 58,
    leadScoreReason: "Early-stage prospect; needs nurture sequence.",
    leadScoreUpdatedAt: now,
    purchases: [],
    purchaseTotal: 0,
    currency: "GBP",
    conversationIds: [],
    notes: "Asked for a lightweight CRM + chatbot package.",
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "contact_priya",
    firstName: "Priya",
    lastName: "Nair",
    email: "priya.nair@harborretail.co.uk",
    phone: "+447700900321",
    jobTitle: "Chief Digital Officer",
    accountId: companyHarbor.id,
    tags: ["hot_lead", "prospect"],
    leadScore: 74,
    leadScoreReason: "Requested demo for multi-location WhatsApp + CRM rollout.",
    leadScoreUpdatedAt: now,
    purchases: [],
    purchaseTotal: 0,
    currency: "GBP",
    conversationIds: [],
    notes: "Budget window this quarter; needs security review.",
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_CRM_COMPANIES: CrmCompany[] = [
  companyMeridian,
  companyNorthstar,
  companyBrightpath,
  companyHarbor,
];

export const DEMO_CRM_DEALS: CrmDeal[] = [
  {
    ...DEMO_TENANT,
    id: "deal_meridian",
    title: "Meridian — Aarvanta OS Enterprise",
    pipelineId,
    stageId: stageProposal,
    contactId: "contact_sarah",
    accountId: companyMeridian.id,
    value: 48000,
    currency: "GBP",
    probability: 60,
    expectedCloseDate: "2026-08-15",
    status: "open",
    notes: "Proposal sent. Awaiting board approval.",
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "deal_northstar_upsell",
    title: "Northstar — AI Workforce add-on",
    pipelineId,
    stageId: stageQualified,
    contactId: "contact_james",
    accountId: companyNorthstar.id,
    value: 12000,
    currency: "GBP",
    probability: 35,
    expectedCloseDate: "2026-09-01",
    status: "open",
    notes: "Upsell from Growth plan. Ops team champion engaged.",
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "deal_brightpath",
    title: "BrightPath — Starter CRM pack",
    pipelineId,
    stageId: stageLead,
    contactId: "contact_emily",
    accountId: companyBrightpath.id,
    value: 4800,
    currency: "GBP",
    probability: 10,
    expectedCloseDate: "2026-09-30",
    status: "open",
    notes: "Early discovery. Needs qualification.",
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "deal_harbor",
    title: "Harbor Retail — Multi-location inbox",
    pipelineId,
    stageId: stageNegotiation,
    contactId: "contact_priya",
    accountId: companyHarbor.id,
    value: 72000,
    currency: "GBP",
    probability: 80,
    expectedCloseDate: "2026-08-01",
    status: "open",
    notes: "Commercial terms agreed; security questionnaire outstanding.",
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_CRM_ACTIVITIES: CrmActivity[] = [
  {
    ...DEMO_TENANT,
    id: "act_1",
    type: "meeting",
    title: "Discovery call — Meridian Consulting",
    description: "Discussed AI workforce and CRM consolidation.",
    contactId: "contact_sarah",
    accountId: companyMeridian.id,
    dealId: "deal_meridian",
    occurredAt: "2026-06-10T14:00:00.000Z",
    durationMinutes: 45,
    authorName: "Sales Team",
    createdAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "act_2",
    type: "call",
    title: "Renewal check-in — Northstar",
    description: "Confirmed interest in AI Workforce add-on.",
    contactId: "contact_james",
    accountId: companyNorthstar.id,
    dealId: "deal_northstar_upsell",
    occurredAt: "2026-06-12T11:00:00.000Z",
    durationMinutes: 20,
    authorName: "Account Manager",
    createdAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "act_3",
    type: "note",
    title: "Demo follow-up — Harbor Retail",
    description: "Sent security pack and commercial draft.",
    contactId: "contact_priya",
    accountId: companyHarbor.id,
    dealId: "deal_harbor",
    occurredAt: "2026-07-05T16:30:00.000Z",
    authorName: "Sales Team",
    createdAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "act_4",
    type: "note",
    title: "BrightPath nurture",
    description: "Founder asked for starter pricing after website chat.",
    contactId: "contact_emily",
    accountId: companyBrightpath.id,
    dealId: "deal_brightpath",
    occurredAt: "2026-07-08T09:15:00.000Z",
    authorName: "Marketing",
    createdAt: now,
  },
];

export const DEMO_CRM_TASKS: CrmTask[] = DEMO_AGENT_TASKS.map((task) => {
  const { seedId, ...rest } = task;
  return {
    ...rest,
    id: seedId,
    createdAt: now,
    updatedAt: now,
  };
});

export const DEMO_CRM_TENANT = DEMO_TENANT;

function isLead(contact: CrmContact) {
  return (
    contact.tags.includes("prospect") ||
    contact.tags.includes("hot_lead") ||
    (contact.leadScore ?? 0) >= 50
  );
}

export function filterDemoLeads(contacts: CrmContact[]) {
  return contacts.filter(isLead);
}

/** Build sample CRM records remapped into the active workspace scope. */
export function buildCrmSampleForScope(scope: TenantScope): {
  pipelines: CrmPipeline[];
  companies: CrmCompany[];
  contacts: CrmContact[];
  deals: CrmDeal[];
  tasks: CrmTask[];
  activities: CrmActivity[];
} {
  const stamp = crmNow();

  return {
    pipelines: DEMO_CRM_PIPELINES.map((p) => ({
      ...p,
      ...scope,
      createdAt: stamp,
      updatedAt: stamp,
    })),
    companies: DEMO_CRM_COMPANIES.map((c) => ({
      ...c,
      ...scope,
      createdAt: stamp,
      updatedAt: stamp,
    })),
    contacts: DEMO_CRM_CONTACTS.map((c) => ({
      ...c,
      ...scope,
      createdAt: stamp,
      updatedAt: stamp,
    })),
    deals: DEMO_CRM_DEALS.map((d) => ({
      ...d,
      ...scope,
      createdAt: stamp,
      updatedAt: stamp,
    })),
    tasks: DEMO_CRM_TASKS.map((t) => ({
      ...t,
      ...scope,
      status: t.status === "done" ? ("todo" as const) : t.status,
      agentRunId: undefined,
      createdAt: stamp,
      updatedAt: stamp,
    })),
    activities: DEMO_CRM_ACTIVITIES.map((a) => ({
      ...a,
      ...scope,
      createdAt: stamp,
    })),
  };
}
