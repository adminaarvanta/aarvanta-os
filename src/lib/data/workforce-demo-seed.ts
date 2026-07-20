import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import type { AgentMemoryEntry } from "@/types/workforce";
import type { CrmTask } from "@/types/crm";

export const DEMO_AGENT_MEMORY: AgentMemoryEntry[] = [
  {
    ...DEMO_TENANT,
    id: "mem_ceo_1",
    agentType: "ceo",
    category: "insight",
    content:
      "Q2 pipeline is £142k with 68% weighted forecast. Top priority: close Meridian Consulting deal.",
    source: "run",
    createdAt: "2026-06-10T08:00:00.000Z",
  },
  {
    ...DEMO_TENANT,
    id: "mem_coo_1",
    agentType: "coo",
    category: "decision",
    content:
      "Standardise client onboarding to a 5-step checklist to reduce handoff delays.",
    source: "manual",
    createdAt: "2026-06-12T09:30:00.000Z",
  },
  {
    ...DEMO_TENANT,
    id: "mem_sales_1",
    agentType: "sales_manager",
    category: "fact",
    content:
      "Meridian Consulting responded positively to proposal — follow up within 48 hours.",
    source: "chat",
    createdAt: "2026-06-14T14:00:00.000Z",
  },
  {
    ...DEMO_TENANT,
    id: "mem_marketing_1",
    agentType: "marketing_manager",
    category: "preference",
    content:
      "LinkedIn posts perform 2× better when published Tuesday–Thursday, 9–11am UK time.",
    source: "run",
    createdAt: "2026-06-15T10:00:00.000Z",
  },
  {
    ...DEMO_TENANT,
    id: "mem_hr_1",
    agentType: "hr_manager",
    category: "fact",
    content:
      "Open role: Senior Account Manager — 12 applicants, 3 shortlisted for interview.",
    source: "manual",
    createdAt: "2026-06-16T11:00:00.000Z",
  },
  {
    ...DEMO_TENANT,
    id: "mem_cfo_1",
    agentType: "cfo",
    category: "insight",
    content:
      "Weighted forecast £96k; Meridian (£48k) is the largest open commitment this quarter.",
    source: "run",
    createdAt: "2026-06-17T09:00:00.000Z",
  },
  {
    ...DEMO_TENANT,
    id: "mem_csm_1",
    agentType: "customer_success_manager",
    category: "fact",
    content:
      "Northstar Digital health score 84 — strong upsell candidate for AI Workforce add-on.",
    source: "run",
    createdAt: "2026-06-17T10:00:00.000Z",
  },
];

/** Templates for agent-assigned CRM tasks (IDs applied by seed helpers). */
export const DEMO_AGENT_TASKS: Array<
  Omit<CrmTask, "id" | "createdAt" | "updatedAt"> & { seedId: string }
> = [
  {
    seedId: "task_ceo_briefing",
    ...DEMO_TENANT,
    title: "Prepare weekly executive briefing",
    description:
      "Compile KPIs, open pipeline value, hot leads, and top risks for leadership review.",
    status: "todo",
    priority: "high",
    dueDate: "2026-07-25",
    assignedAgentType: "ceo",
    source: "ai",
  },
  {
    seedId: "task_coo_backlog",
    ...DEMO_TENANT,
    title: "Review overdue operational tasks",
    description:
      "Audit open CRM tasks older than 7 days, summarise bottlenecks, and propose owners.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-07-22",
    assignedAgentType: "coo",
    source: "ai",
  },
  {
    seedId: "task_sales_meridian",
    ...DEMO_TENANT,
    title: "Follow up: Meridian Consulting proposal",
    description:
      "Send a personalised follow-up referencing the discovery call and board-approval timeline. Advance the deal if appropriate.",
    status: "todo",
    priority: "high",
    dueDate: "2026-07-21",
    contactId: "contact_sarah",
    accountId: "co_meridian",
    dealId: "deal_meridian",
    assignedAgentType: "sales_manager",
    source: "ai",
  },
  {
    seedId: "task_sales_brightpath",
    ...DEMO_TENANT,
    title: "Qualify BrightPath lead",
    description:
      "Review Emily Walsh's profile, score the opportunity, and recommend next pipeline stage.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-07-23",
    contactId: "contact_emily",
    accountId: "co_brightpath",
    dealId: "deal_brightpath",
    assignedAgentType: "sales_manager",
    source: "ai",
  },
  {
    seedId: "task_marketing_campaign",
    ...DEMO_TENANT,
    title: "Draft LinkedIn campaign for AI services launch",
    description:
      "Propose a 3-post series highlighting Aarvanta OS CRM + AI workforce for mid-market consultancies.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-07-28",
    assignedAgentType: "marketing_manager",
    source: "ai",
  },
  {
    seedId: "task_hr_screen",
    ...DEMO_TENANT,
    title: "Screen candidates for Senior Account Manager",
    description:
      "Review open applications and shortlist top candidates with interview questions.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-07-24",
    assignedAgentType: "hr_manager",
    source: "ai",
  },
  {
    seedId: "task_cfo_forecast",
    ...DEMO_TENANT,
    title: "Refresh Q3 revenue forecast",
    description:
      "Use open deals and probabilities to produce a cashflow-oriented forecast and flag collection risks.",
    status: "todo",
    priority: "high",
    dueDate: "2026-07-22",
    assignedAgentType: "cfo",
    source: "ai",
  },
  {
    seedId: "task_csm_northstar",
    ...DEMO_TENANT,
    title: "Northstar renewal & upsell check-in",
    description:
      "Review customer health, draft nurture notes, and recommend next steps on the AI Workforce add-on deal.",
    status: "todo",
    priority: "high",
    dueDate: "2026-07-21",
    contactId: "contact_james",
    accountId: "co_northstar",
    dealId: "deal_northstar_upsell",
    assignedAgentType: "customer_success_manager",
    source: "ai",
  },
];
