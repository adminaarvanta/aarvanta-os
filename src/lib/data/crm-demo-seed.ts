import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { DEMO_AGENT_TASKS } from "@/lib/data/workforce-demo-seed";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import type {
  CrmActivity,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmPipeline,
  CrmTask,
} from "@/types/crm";

const now = crmNow();
const pipelineId = "pipe_main";
const stageLead = "stage_lead";
const stageQualified = "stage_qualified";
const stageProposal = "stage_proposal";

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
  tags: ["customer"],
  purchaseTotal: 24000,
  currency: "GBP",
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
      { id: "stage_negotiation", name: "Negotiation", order: 3, probability: 80 },
      { id: "stage_won", name: "Won", order: 4, probability: 100 },
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
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "contact_james",
    firstName: "James",
    lastName: "Okonkwo",
    email: "james@northstar.digital",
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
    createdAt: now,
    updatedAt: now,
  },
  {
    ...DEMO_TENANT,
    id: "contact_emily",
    firstName: "Emily",
    lastName: "Walsh",
    email: "emily.walsh@brightpath.io",
    jobTitle: "Founder",
    tags: ["prospect"],
    leadScore: 58,
    leadScoreReason: "Early-stage prospect; needs nurture sequence.",
    leadScoreUpdatedAt: now,
    purchases: [],
    purchaseTotal: 0,
    currency: "GBP",
    conversationIds: [],
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_CRM_COMPANIES: CrmCompany[] = [companyMeridian, companyNorthstar];

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
    expectedCloseDate: "2026-07-15",
    status: "open",
    notes: "Proposal sent 12 June. Awaiting board approval.",
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
    status: "open",
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
    contactId: "contact_james",
    accountId: companyNorthstar.id,
    occurredAt: "2026-06-12T11:00:00.000Z",
    durationMinutes: 20,
    authorName: "Account Manager",
    createdAt: now,
  },
];

export const DEMO_CRM_TASKS: CrmTask[] = DEMO_AGENT_TASKS.map((task) => ({
  ...task,
  id: crmNewId("task"),
  createdAt: now,
  updatedAt: now,
}));

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
