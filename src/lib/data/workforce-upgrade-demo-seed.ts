import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { crmNow } from "@/lib/data/crm-helpers";
import type { SharedMemoryEntry, AgentCollaboration } from "@/types/workforce";

const now = crmNow();

export function buildDemoSharedMemory(): SharedMemoryEntry[] {
  return [
    {
      ...DEMO_TENANT,
      id: "sm_pipeline_q2",
      title: "Q2 pipeline priority accounts",
      content:
        "Meridian Consulting and Northstar Digital are top priority. Both have strong fit scores and active engagement. Sales and Marketing agents should coordinate outreach.",
      contributedBy: ["ceo", "sales_manager", "marketing_manager"],
      tags: ["pipeline", "priority", "q2"],
      sourceRunIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "sm_hiring",
      title: "Hiring plan — Senior AE + CS",
      content:
        "Two open roles approved for Q2. HR agent owns JD drafts; COO tracks onboarding capacity. Target start dates: July.",
      contributedBy: ["ceo", "coo", "hr_manager"],
      tags: ["hiring", "hr"],
      sourceRunIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "sm_ops_bottleneck",
      title: "Ops bottleneck: proposal approvals",
      content:
        "Proposal approval workflow is the main delay in deal cycle. COO recommends auto-routing deals under £10k.",
      contributedBy: ["coo", "sales_manager"],
      tags: ["operations", "workflows"],
      sourceRunIds: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function buildDemoCollaborations(): AgentCollaboration[] {
  return [
    {
      ...DEMO_TENANT,
      id: "collab_northstar",
      title: "Northstar Digital deal strategy",
      leadAgent: "ceo",
      participantAgents: ["ceo", "sales_manager", "marketing_manager"],
      status: "completed",
      summary:
        "Cross-functional review: Sales to send tailored proposal; Marketing to prepare case study assets; CEO to join exec call if needed.",
      insights: [
        "Deal value £24k with 65% close probability",
        "Marketing suggests LinkedIn retargeting for decision makers",
        "Sales recommends 10% early-adopter discount if signed this month",
      ],
      assignedTaskIds: [],
      createdAt: now,
      completedAt: now,
    },
    {
      ...DEMO_TENANT,
      id: "collab_ops_review",
      title: "Weekly operations review",
      leadAgent: "coo",
      participantAgents: ["coo", "hr_manager"],
      status: "completed",
      summary:
        "Task backlog manageable. Hiring pipeline on track. One workflow approval bottleneck flagged.",
      insights: [
        "12 open CRM tasks, 4 assigned to AI agents",
        "2 overdue project tasks on Meridian onboarding",
      ],
      assignedTaskIds: [],
      createdAt: now,
      completedAt: now,
    },
  ];
}
