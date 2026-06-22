import { crmNow } from "@/lib/data/crm-helpers";
import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import type {
  AuditLogEntry,
  AutonomousTask,
  BillingPlan,
  CustomerHealth,
  FinanceBudget,
  FinanceExpense,
  FinanceInvoice,
  FranchiseLocation,
  HrCandidate,
  HrCourse,
  HrEmployee,
  InstalledAgent,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MarketplaceAgent,
  MeetingRecord,
  MemoryLayerEntry,
  PortalAccess,
  ProposalDocument,
  RegionConfig,
  SopDocument,
  SsoConnection,
  Subscription,
  TemplateItem,
  TenantRegion,
  UsageRecord,
  WikiPage,
  WritingDraft,
} from "@/types/platform-modules";

const now = crmNow();

function isoDaysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 49,
    currency: "GBP",
    features: ["1 workspace", "5 users", "Basic automations", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 149,
    currency: "GBP",
    features: [
      "3 workspaces",
      "25 users",
      "Advanced automations",
      "CRM + portal bundle",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    priceMonthly: 399,
    currency: "GBP",
    features: [
      "10 workspaces",
      "Unlimited users",
      "Dedicated success manager",
      "SSO + governance",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 999,
    currency: "GBP",
    features: [
      "Global regions",
      "Custom SLAs",
      "Private marketplace",
      "White-glove onboarding",
    ],
  },
];

export function buildDemoSubscriptions(): Subscription[] {
  return [
    {
      ...DEMO_TENANT,
      id: "sub_demo_growth",
      planId: "growth",
      status: "active",
      stripeCustomerId: "cus_demo_aarvanta",
      currentPeriodEnd: isoDaysFromNow(21),
      createdAt: now,
    },
  ];
}

export function buildDemoUsageRecords(): UsageRecord[] {
  return [
    {
      ...DEMO_TENANT,
      id: "usage_agent_runs_may",
      metric: "agent_runs",
      quantity: 1240,
      period: "2026-05",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "usage_api_calls_may",
      metric: "api_calls",
      quantity: 48210,
      period: "2026-05",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "usage_storage_may",
      metric: "storage_mb",
      quantity: 7230,
      period: "2026-05",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "usage_seats_may",
      metric: "seats",
      quantity: 18,
      period: "2026-05",
      createdAt: now,
    },
  ];
}

export function buildDemoWritingDrafts(): WritingDraft[] {
  return [
    {
      ...DEMO_TENANT,
      id: "draft_q3_growth_proposal",
      type: "proposal",
      title: "Q3 Growth Program Proposal",
      prompt: "Draft a proposal for Meridian's Q3 GTM acceleration.",
      content:
        "Objective: Increase qualified pipeline by 35% in 90 days through outbound, partner co-marketing, and conversion workflow automation.",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "draft_nps_followup_email",
      type: "email",
      title: "NPS Follow-up for Key Accounts",
      prompt: "Write a concise follow-up for promoters and passives.",
      content:
        "Thanks for your NPS feedback. We are scheduling product deep-dives for your team and sharing a practical rollout checklist by Friday.",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "draft_linkedin_case_study",
      type: "linkedin",
      title: "Customer Spotlight: Northstar Digital",
      prompt: "Create a short founder-style LinkedIn post with metrics.",
      content:
        "In 6 weeks, Northstar cut follow-up time from 36 hours to 5 hours and increased proposal acceptance by 22%.",
      createdAt: now,
    },
  ];
}

export function buildDemoMeetingRecords(): MeetingRecord[] {
  return [
    {
      ...DEMO_TENANT,
      id: "meeting_meridian_kickoff",
      title: "Meridian Onboarding Kickoff",
      source: "zoom",
      transcript:
        "Introductions, scope review, timeline, and integration dependencies were discussed with both delivery and sales stakeholders.",
      summary:
        "Aligned on 4-week onboarding plan and weekly progress checkpoint cadence.",
      actionItems: [
        "Send technical checklist by Monday",
        "Provision SSO sandbox",
        "Share proposal template baseline",
      ],
      followUpEmail:
        "Thanks for the kickoff. Attached are owners, milestones, and next steps for SSO, CRM sync, and content migration.",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "meeting_northstar_qbr",
      title: "Northstar QBR - Expansion Review",
      source: "teams",
      transcript:
        "Reviewed adoption metrics, churn indicators, account expansion opportunities, and budget approvals for H2.",
      summary:
        "Northstar approved pilot expansion for two additional business units.",
      actionItems: [
        "Send revised enterprise pricing sheet",
        "Prepare data residency comparison for EU vs UK",
        "Schedule legal review for MSA addendum",
      ],
      followUpEmail:
        "Great discussion today. Sharing expansion options and legal timeline so we can finalize by end of month.",
      createdAt: now,
    },
  ];
}

export function buildDemoKnowledgeGraphNodes(): KnowledgeGraphNode[] {
  return [
    {
      ...DEMO_TENANT,
      id: "kg_customer_meridian",
      entityType: "customer",
      label: "Meridian Health",
      refId: "contact_meridian_ceo",
    },
    {
      ...DEMO_TENANT,
      id: "kg_project_onboarding",
      entityType: "project",
      label: "Meridian Onboarding Project",
      refId: "proj_meridian_onboard",
    },
    {
      ...DEMO_TENANT,
      id: "kg_proposal_q3",
      entityType: "proposal",
      label: "Q3 Growth Proposal",
      refId: "prop_q3_growth",
    },
    {
      ...DEMO_TENANT,
      id: "kg_contract_master",
      entityType: "contract",
      label: "Master Services Agreement",
      refId: "contract_meridian_msa",
    },
    {
      ...DEMO_TENANT,
      id: "kg_doc_security",
      entityType: "document",
      label: "Security Addendum",
      refId: "doc_security_addendum",
    },
  ];
}

export function buildDemoKnowledgeGraphEdges(): KnowledgeGraphEdge[] {
  return [
    {
      ...DEMO_TENANT,
      id: "kg_edge_customer_project",
      fromId: "kg_customer_meridian",
      toId: "kg_project_onboarding",
      relationship: "owns",
    },
    {
      ...DEMO_TENANT,
      id: "kg_edge_project_proposal",
      fromId: "kg_project_onboarding",
      toId: "kg_proposal_q3",
      relationship: "proposed_with",
    },
    {
      ...DEMO_TENANT,
      id: "kg_edge_proposal_contract",
      fromId: "kg_proposal_q3",
      toId: "kg_contract_master",
      relationship: "converted_to",
    },
    {
      ...DEMO_TENANT,
      id: "kg_edge_contract_document",
      fromId: "kg_contract_master",
      toId: "kg_doc_security",
      relationship: "references",
    },
  ];
}

export function buildDemoSopDocuments(): SopDocument[] {
  return [
    {
      ...DEMO_TENANT,
      id: "sop_client_onboarding",
      title: "Client Onboarding SOP",
      question: "How should new enterprise clients be onboarded in 30 days?",
      content:
        "Phase 1 discovery, Phase 2 integration setup, Phase 3 enablement, and Phase 4 executive review. Every phase needs owner and success criteria.",
      version: 3,
      status: "published",
      createdAt: now,
      updatedAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "sop_incident_response",
      title: "Incident Response SOP",
      question: "What steps should teams follow during a production incident?",
      content:
        "Declare incident, assign commander, communicate every 30 minutes, capture timeline, and run postmortem within 48 hours.",
      version: 2,
      status: "published",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function buildDemoProposalDocuments(): ProposalDocument[] {
  return [
    {
      ...DEMO_TENANT,
      id: "prop_q3_growth",
      title: "Meridian Q3 Growth Program",
      clientName: "Meridian Health",
      value: 36000,
      currency: "GBP",
      content:
        "Scope includes outbound orchestration, meeting intelligence, and proposal automation with monthly governance reviews.",
      brandingOrg: "Aarvanta Limited",
      status: "sent",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "prop_northstar_expansion",
      title: "Northstar Multi-Team Expansion",
      clientName: "Northstar Digital",
      value: 52000,
      currency: "GBP",
      content:
        "Expansion to two additional teams with shared knowledge graph and region-aware SSO rollout.",
      brandingOrg: "Aarvanta Limited",
      status: "draft",
      createdAt: now,
    },
  ];
}

export function buildDemoPortalAccessRecords(): PortalAccess[] {
  return [
    {
      ...DEMO_TENANT,
      id: "portal_meridian_ops",
      clientName: "Meridian Health",
      email: "ops@meridianhealth.io",
      enabled: true,
      lastLoginAt: isoDaysFromNow(-1),
      projectIds: ["proj_meridian_onboard"],
    },
    {
      ...DEMO_TENANT,
      id: "portal_northstar_pm",
      clientName: "Northstar Digital",
      email: "pm@northstar.digital",
      enabled: true,
      lastLoginAt: isoDaysFromNow(-3),
      projectIds: ["proj_northstar_expand"],
    },
  ];
}

export function buildDemoTemplateItems(): TemplateItem[] {
  return [
    {
      ...DEMO_TENANT,
      id: "tpl_proposal_exec",
      category: "proposal",
      name: "Executive Proposal Template",
      description: "High-value deal proposal with ROI framing.",
      content: "Problem, ROI model, phased rollout, governance model.",
      tags: ["sales", "executive", "roi"],
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "tpl_sop_onboarding",
      category: "sop",
      name: "Onboarding SOP Blueprint",
      description: "Reusable structure for onboarding workflows.",
      content: "Checklist sections, owners, handoff points, and risks.",
      tags: ["operations", "implementation"],
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "tpl_campaign_launch",
      category: "campaign",
      name: "Campaign Launch Plan",
      description: "Go-to-market launch sequence with checkpoints.",
      content: "Audience matrix, channel plan, KPI targets, cadence.",
      tags: ["marketing", "launch"],
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "tpl_contract_msa",
      category: "contract",
      name: "MSA Addendum Template",
      description: "Contract amendment template for enterprise clients.",
      content: "Scope addendum, billing terms, security clauses.",
      tags: ["legal", "enterprise"],
      createdAt: now,
    },
  ];
}

export function buildDemoMemoryLayerEntries(): MemoryLayerEntry[] {
  return [
    {
      ...DEMO_TENANT,
      id: "memory_user_preferences",
      layer: "user",
      key: "writing_tone",
      content: "Pavan prefers concise executive summaries with bullet actions.",
      source: "manual",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "memory_team_playbook",
      layer: "team",
      key: "weekly_operating_rhythm",
      content: "Monday pipeline review, Wednesday delivery standup, Friday QBR prep.",
      source: "team_handbook",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "memory_company_positioning",
      layer: "company",
      key: "core_positioning",
      content: "Aarvanta is an AI operating system for lean consulting teams.",
      source: "brand_guide",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "memory_customer_meridian",
      layer: "customer",
      key: "meridian_exec_preference",
      content: "Meridian leadership prefers fortnightly dashboards over live portals.",
      source: "meeting_meridian_kickoff",
      createdAt: now,
    },
  ];
}

export function buildDemoCustomerHealthRecords(): CustomerHealth[] {
  return [
    {
      ...DEMO_TENANT,
      id: "health_meridian",
      contactId: "contact_meridian_ceo",
      clientName: "Meridian Health",
      healthScore: 82,
      nps: 9,
      renewalDate: isoDaysFromNow(120),
      churnRisk: "low",
      openTickets: 1,
      updatedAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "health_northstar",
      contactId: "contact_northstar_ops",
      clientName: "Northstar Digital",
      healthScore: 69,
      nps: 7,
      renewalDate: isoDaysFromNow(75),
      churnRisk: "medium",
      openTickets: 4,
      updatedAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "health_aurora",
      contactId: "contact_aurora_founder",
      clientName: "Aurora Labs",
      healthScore: 54,
      nps: 6,
      renewalDate: isoDaysFromNow(45),
      churnRisk: "high",
      openTickets: 7,
      updatedAt: now,
    },
  ];
}

export function buildDemoWikiPages(): WikiPage[] {
  return [
    {
      ...DEMO_TENANT,
      id: "wiki_employee_handbook",
      section: "handbook",
      title: "Employee Handbook",
      content:
        "Core values, communication norms, performance cycles, and leave policy for all team members.",
      version: 5,
      accessRole: "all",
      updatedAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "wiki_sales_department",
      section: "department",
      title: "Sales Department Playbook",
      content:
        "ICP definition, qualification framework, proposal process, and handoff criteria.",
      version: 4,
      accessRole: "manager",
      updatedAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "wiki_onboarding_training",
      section: "training",
      title: "New Hire Onboarding Training",
      content:
        "Week 1 setup, platform walkthrough, security fundamentals, and customer communication standards.",
      version: 2,
      accessRole: "all",
      updatedAt: now,
    },
  ];
}

export function buildDemoAuditLogEntries(): AuditLogEntry[] {
  return [
    {
      ...DEMO_TENANT,
      id: "audit_login_owner",
      action: "login",
      actorId: "user_pavan",
      actorName: "Pavan",
      resource: "workspace/main",
      detail: "Owner logged in with MFA.",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "audit_permission_change",
      action: "permission_change",
      actorId: "user_pavan",
      actorName: "Pavan",
      resource: "member/user_sarah",
      detail: "Updated role from manager to admin.",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "audit_agent_run",
      action: "agent_run",
      actorId: "agent_sales_manager",
      actorName: "AI Sales Manager",
      resource: "workflow/lead_nurturing",
      detail: "Generated 12 follow-up tasks for hot leads.",
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "audit_data_export",
      action: "data_export",
      actorId: "user_john",
      actorName: "John",
      resource: "finance/invoices",
      detail: "Exported paid invoices for quarterly audit.",
      createdAt: now,
    },
  ];
}

export function buildDemoFinanceInvoices(): FinanceInvoice[] {
  return [
    {
      ...DEMO_TENANT,
      id: "inv_meridian_2026_001",
      number: "ARV-2026-001",
      clientName: "Meridian Health",
      amount: 18000,
      currency: "GBP",
      status: "sent",
      dueDate: isoDaysFromNow(14),
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "inv_northstar_2026_002",
      number: "ARV-2026-002",
      clientName: "Northstar Digital",
      amount: 22000,
      currency: "GBP",
      status: "paid",
      dueDate: isoDaysFromNow(-6),
      createdAt: now,
    },
  ];
}

export function buildDemoFinanceExpenses(): FinanceExpense[] {
  return [
    {
      ...DEMO_TENANT,
      id: "exp_aws_may",
      vendor: "AWS",
      category: "infrastructure",
      amount: 2400,
      currency: "GBP",
      date: isoDaysFromNow(-20),
      receiptUrl: "https://example.com/receipts/aws-may.pdf",
    },
    {
      ...DEMO_TENANT,
      id: "exp_travel_q2",
      vendor: "British Airways",
      category: "travel",
      amount: 860,
      currency: "GBP",
      date: isoDaysFromNow(-12),
      receiptUrl: "https://example.com/receipts/travel-q2.pdf",
    },
  ];
}

export function buildDemoFinanceBudgets(): FinanceBudget[] {
  return [
    {
      ...DEMO_TENANT,
      id: "budget_sales_q3",
      department: "Sales",
      allocated: 75000,
      spent: 31200,
      currency: "GBP",
      period: "2026-Q3",
    },
  ];
}

export function buildDemoHrCandidates(): HrCandidate[] {
  return [
    {
      ...DEMO_TENANT,
      id: "candidate_aisha",
      name: "Aisha Khan",
      role: "Senior Account Executive",
      score: 88,
      status: "interview",
      resumeSummary:
        "7 years in B2B SaaS sales with strong enterprise closing track record.",
    },
    {
      ...DEMO_TENANT,
      id: "candidate_rohan",
      name: "Rohan Patel",
      role: "Customer Success Manager",
      score: 81,
      status: "screening",
      resumeSummary:
        "Scaled onboarding and renewals for mid-market accounts in fintech.",
    },
  ];
}

export function buildDemoHrEmployees(): HrEmployee[] {
  return [
    {
      ...DEMO_TENANT,
      id: "employee_sarah",
      name: "Sarah Chen",
      department: "Sales",
      role: "Head of Growth",
      startDate: "2024-04-15",
      leaveBalance: 18,
    },
    {
      ...DEMO_TENANT,
      id: "employee_john",
      name: "John Mathew",
      department: "Operations",
      role: "Delivery Manager",
      startDate: "2023-09-01",
      leaveBalance: 12,
    },
  ];
}

export function buildDemoHrCourses(): HrCourse[] {
  return [
    {
      ...DEMO_TENANT,
      id: "course_enterprise_negotiation",
      title: "Enterprise Negotiation Masterclass",
      category: "sales",
      durationHours: 6,
      enrolled: 9,
    },
    {
      ...DEMO_TENANT,
      id: "course_incident_readiness",
      title: "Incident Readiness and RCA",
      category: "operations",
      durationHours: 4,
      enrolled: 14,
    },
  ];
}

export function buildDemoAutonomousTasks(): AutonomousTask[] {
  return [
    {
      ...DEMO_TENANT,
      id: "task_pipeline_cleanup",
      agentType: "sales_manager",
      goal: "Review stale opportunities and recommend next actions.",
      status: "review",
      steps: [
        "Fetch opportunities older than 21 days",
        "Classify by stage risk",
        "Draft follow-up tasks with owners",
      ],
      requiresApproval: true,
      createdAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "task_qbr_pack",
      agentType: "coo",
      goal: "Prepare QBR pack with delivery and finance highlights.",
      status: "executing",
      steps: [
        "Collect KPI metrics",
        "Draft executive narrative",
        "Assemble board-ready summary",
      ],
      requiresApproval: false,
      createdAt: now,
    },
  ];
}

export function buildDemoSsoConnections(): SsoConnection[] {
  return [
    {
      ...DEMO_TENANT,
      id: "sso_entra_primary",
      provider: "entra",
      protocol: "saml",
      status: "active",
      domain: "aarvanta.com",
      mfaRequired: true,
      scimEnabled: true,
    },
    {
      ...DEMO_TENANT,
      id: "sso_okta_backup",
      provider: "okta",
      protocol: "oidc",
      status: "inactive",
      domain: "okta.aarvanta.com",
      mfaRequired: true,
      scimEnabled: false,
    },
  ];
}

export function buildDemoFranchiseLocations(): FranchiseLocation[] {
  return [
    {
      ...DEMO_TENANT,
      id: "franchise_london",
      name: "Aarvanta London",
      city: "London",
      revenue: 420000,
      complianceScore: 96,
      status: "active",
    },
    {
      ...DEMO_TENANT,
      id: "franchise_manchester",
      name: "Aarvanta Manchester",
      city: "Manchester",
      revenue: 275000,
      complianceScore: 89,
      status: "active",
    },
    {
      ...DEMO_TENANT,
      id: "franchise_dublin",
      name: "Aarvanta Dublin",
      city: "Dublin",
      revenue: 142000,
      complianceScore: 71,
      status: "at_risk",
    },
  ];
}

export const REGION_CONFIGS: RegionConfig[] = [
  {
    id: "region_uk",
    code: "uk",
    name: "United Kingdom",
    status: "active",
    latencyMs: 18,
    dataResidency: true,
  },
  {
    id: "region_eu",
    code: "eu",
    name: "European Union",
    status: "active",
    latencyMs: 28,
    dataResidency: true,
  },
  {
    id: "region_usa",
    code: "usa",
    name: "United States",
    status: "active",
    latencyMs: 75,
    dataResidency: true,
  },
  {
    id: "region_india",
    code: "india",
    name: "India",
    status: "planned",
    latencyMs: 46,
    dataResidency: true,
  },
  {
    id: "region_singapore",
    code: "sg",
    name: "Singapore",
    status: "planned",
    latencyMs: 91,
    dataResidency: true,
  },
  {
    id: "region_australia",
    code: "au",
    name: "Australia",
    status: "planned",
    latencyMs: 134,
    dataResidency: true,
  },
];

export function buildDemoTenantRegions(): TenantRegion[] {
  return [
    {
      ...DEMO_TENANT,
      id: "tenant_region_uk_primary",
      regionCode: "uk",
      primary: true,
      status: "active",
    },
  ];
}

export const MARKETPLACE_AGENTS: MarketplaceAgent[] = [
  {
    id: "mkt_sales_manager",
    name: "Sales Manager Agent",
    author: "Aarvanta Labs",
    category: "sales",
    description: "Pipeline qualification, follow-up planning, and forecast insights.",
    installs: 1840,
    rating: 4.8,
    price: "free",
  },
  {
    id: "mkt_cfo_assistant",
    name: "CFO Assistant Agent",
    author: "Aarvanta Labs",
    category: "finance",
    description: "Invoice analysis, expense anomalies, and budget alerts.",
    installs: 960,
    rating: 4.6,
    price: "paid",
  },
  {
    id: "mkt_hr_recruiter",
    name: "HR Recruiter Agent",
    author: "PeopleOps Studio",
    category: "hr",
    description: "Candidate screening, scorecards, and interview summaries.",
    installs: 720,
    rating: 4.5,
    price: "paid",
  },
  {
    id: "mkt_ops_commander",
    name: "Ops Commander Agent",
    author: "Delivery Forge",
    category: "operations",
    description: "SOP compliance checks and weekly execution planning.",
    installs: 530,
    rating: 4.7,
    price: "free",
  },
];

export function buildDemoInstalledAgents(): InstalledAgent[] {
  return [
    {
      ...DEMO_TENANT,
      id: "installed_sales_manager",
      marketplaceId: "mkt_sales_manager",
      name: "Sales Manager Agent",
      enabled: true,
      installedAt: isoDaysFromNow(-45),
    },
    {
      ...DEMO_TENANT,
      id: "installed_ops_commander",
      marketplaceId: "mkt_ops_commander",
      name: "Ops Commander Agent",
      enabled: true,
      installedAt: isoDaysFromNow(-18),
    },
  ];
}
