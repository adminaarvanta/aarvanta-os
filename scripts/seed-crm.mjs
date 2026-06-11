/**
 * Seed Module 2 CRM data into Firestore.
 * Usage: node --env-file=.env.local scripts/seed-crm.mjs
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const scope = {
  tenantId: process.env.TENANT_ID,
  workspaceId: process.env.WORKSPACE_ID,
  companyId: process.env.COMPANY_ID,
  currency: "GBP",
};

const salesStages = [
  { id: "stage_lead", name: "Lead", order: 0, probability: 10 },
  { id: "stage_qualified", name: "Qualified", order: 1, probability: 30 },
  { id: "stage_proposal", name: "Proposal", order: 2, probability: 50 },
  { id: "stage_negotiation", name: "Negotiation", order: 3, probability: 70 },
  { id: "stage_won", name: "Won", order: 4, probability: 100 },
  { id: "stage_lost", name: "Lost", order: 5, probability: 0 },
];

const records = {
  crm_companies: [
    {
      id: "acct_northline",
      name: "Northline Logistics",
      domain: "northline.co.uk",
      industry: "Logistics",
      size: "50-200",
      tags: ["prospect", "hot_lead"],
      purchaseTotal: 0,
      notes: "Enterprise prospect — evaluating unified comms for sales team.",
      createdAt: "2026-05-15T09:00:00Z",
      updatedAt: "2026-06-01T15:42:00Z",
    },
    {
      id: "acct_brightpath",
      name: "Brightpath Retail",
      domain: "brightpath.io",
      industry: "Retail",
      size: "10-50",
      tags: ["customer", "vip"],
      purchaseTotal: 12400,
      notes: "Active customer on annual plan.",
      createdAt: "2026-03-01T10:00:00Z",
      updatedAt: "2026-05-28T11:00:00Z",
    },
  ],
  crm_contacts: [
    {
      id: "crm_contact_sarah",
      firstName: "Sarah",
      lastName: "Mitchell",
      email: "sarah@northline.co.uk",
      phone: "+447700900123",
      jobTitle: "Head of Sales",
      accountId: "acct_northline",
      tags: ["hot_lead", "follow_up"],
      leadScore: 82,
      leadScoreReason:
        "Strong buying signals: requested demo, budget Q3, decision maker engaged on WhatsApp.",
      leadScoreUpdatedAt: "2026-06-01T14:30:00Z",
      purchases: [],
      purchaseTotal: 0,
      conversationIds: ["conv_1"],
      createdAt: "2026-05-15T09:00:00Z",
      updatedAt: "2026-06-01T15:42:00Z",
    },
    {
      id: "crm_contact_james",
      firstName: "James",
      lastName: "Okonkwo",
      email: "james@brightpath.io",
      phone: "+447700900456",
      jobTitle: "Operations Director",
      accountId: "acct_brightpath",
      tags: ["customer", "vip"],
      leadScore: 91,
      leadScoreReason:
        "Existing customer with upsell potential — asked about AI workforce module.",
      leadScoreUpdatedAt: "2026-05-28T11:00:00Z",
      purchases: [
        {
          id: "pur_1",
          label: "Annual platform license",
          amount: 8400,
          currency: "GBP",
          purchasedAt: "2026-03-15T00:00:00Z",
        },
      ],
      purchaseTotal: 8400,
      conversationIds: ["conv_2"],
      createdAt: "2026-03-01T10:00:00Z",
      updatedAt: "2026-05-28T11:00:00Z",
    },
  ],
  crm_pipelines: [
    {
      id: "pipe_sales",
      name: "Sales",
      stages: salesStages,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "pipe_support",
      name: "Support",
      stages: [
        { id: "stage_new", name: "New", order: 0, probability: 20 },
        { id: "stage_in_progress", name: "In Progress", order: 1, probability: 50 },
        { id: "stage_resolved", name: "Resolved", order: 2, probability: 100 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "pipe_recruitment",
      name: "Recruitment",
      stages: [
        { id: "rec_applied", name: "Applied", order: 0, probability: 10 },
        { id: "rec_interview", name: "Interview", order: 1, probability: 60 },
        { id: "rec_hired", name: "Hired", order: 2, probability: 100 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ],
  crm_deals: [
    {
      id: "deal_northline",
      title: "Northline — Enterprise rollout",
      pipelineId: "pipe_sales",
      stageId: "stage_proposal",
      contactId: "crm_contact_sarah",
      accountId: "acct_northline",
      value: 48000,
      probability: 50,
      expectedCloseDate: "2026-07-15",
      status: "open",
      createdAt: "2026-05-20T10:00:00Z",
      updatedAt: "2026-06-01T15:42:00Z",
    },
    {
      id: "deal_brightpath_upsell",
      title: "Brightpath — AI Workforce add-on",
      pipelineId: "pipe_sales",
      stageId: "stage_qualified",
      contactId: "crm_contact_james",
      accountId: "acct_brightpath",
      value: 12000,
      probability: 30,
      status: "open",
      createdAt: "2026-05-25T09:00:00Z",
      updatedAt: "2026-05-28T11:00:00Z",
    },
  ],
  crm_tasks: [
    {
      id: "task_demo_prep",
      title: "Prepare Northline demo deck",
      status: "todo",
      priority: "high",
      dueDate: "2026-06-04",
      contactId: "crm_contact_sarah",
      accountId: "acct_northline",
      dealId: "deal_northline",
      assignedTo: "Alex Chen",
      source: "manual",
      createdAt: "2026-06-01T16:00:00Z",
      updatedAt: "2026-06-01T16:00:00Z",
    },
    {
      id: "task_followup_james",
      title: "Send AI Workforce one-pager to James",
      status: "in_progress",
      priority: "medium",
      contactId: "crm_contact_james",
      source: "ai",
      createdAt: "2026-05-28T12:00:00Z",
      updatedAt: "2026-05-29T09:00:00Z",
    },
  ],
  crm_activities: [
    {
      id: "act_call_sarah",
      type: "call",
      title: "Discovery call with Sarah",
      description: "12-person sales team, budget Q3.",
      contactId: "crm_contact_sarah",
      accountId: "acct_northline",
      dealId: "deal_northline",
      occurredAt: "2026-06-01T10:00:00Z",
      durationMinutes: 7,
      authorName: "Alex Chen",
      createdAt: "2026-06-01T10:07:00Z",
    },
  ],
};

for (const [collection, items] of Object.entries(records)) {
  for (const item of items) {
    await db.collection(collection).doc(item.id).set({ ...item, ...scope });
  }
  console.log(`Seeded ${items.length} → ${collection}`);
}

console.log("CRM seed complete. Open /crm");
