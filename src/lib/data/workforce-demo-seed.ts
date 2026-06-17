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
];

export const DEMO_AGENT_TASKS: Omit<
  CrmTask,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    ...DEMO_TENANT,
    title: "Prepare weekly executive briefing",
    description: "Compile KPIs, pipeline, and risk summary for leadership review.",
    status: "todo",
    priority: "high",
    dueDate: "2026-06-20",
    assignedAgentType: "ceo",
    source: "ai",
  },
  {
    ...DEMO_TENANT,
    title: "Review overdue operational tasks",
    description: "Audit open tasks older than 7 days and reassign owners.",
    status: "in_progress",
    priority: "medium",
    dueDate: "2026-06-18",
    assignedAgentType: "coo",
    source: "ai",
  },
  {
    ...DEMO_TENANT,
    title: "Follow up: Meridian Consulting proposal",
    description: "Send personalised follow-up email referencing last meeting notes.",
    status: "todo",
    priority: "high",
    dueDate: "2026-06-17",
    assignedAgentType: "sales_manager",
    source: "ai",
  },
  {
    ...DEMO_TENANT,
    title: "Draft LinkedIn campaign for AI services launch",
    description: "3-post series highlighting Aarvanta OS capabilities.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-06-22",
    assignedAgentType: "marketing_manager",
    source: "ai",
  },
  {
    ...DEMO_TENANT,
    title: "Screen candidates for Senior Account Manager",
    description: "Review 12 applications and shortlist top 5 for phone screen.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-06-19",
    assignedAgentType: "hr_manager",
    source: "ai",
  },
];
