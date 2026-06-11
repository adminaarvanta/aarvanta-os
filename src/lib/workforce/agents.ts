import type { AgentDefinition, AgentType } from "@/types/workforce";

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    type: "sales",
    name: "AI Sales Agent",
    tagline: "Qualify leads, follow up, and move deals forward.",
    responsibilities: [
      "Qualify leads from CRM and inbox signals",
      "Suggest follow-up messages and next steps",
      "Recommend meeting booking and objection handling",
    ],
    requiresContact: true,
  },
  {
    type: "support",
    name: "AI Support Agent",
    tagline: "Resolve issues faster with FAQ and escalation guidance.",
    responsibilities: [
      "Answer FAQs from conversation context",
      "Troubleshoot customer issues",
      "Recommend when to escalate to a human",
    ],
    requiresConversation: true,
  },
  {
    type: "account_manager",
    name: "AI Account Manager",
    tagline: "Protect revenue with retention and upsell insights.",
    responsibilities: [
      "Identify at-risk accounts",
      "Suggest renewal and check-in outreach",
      "Spot upsell opportunities from purchase history",
    ],
    requiresContact: true,
  },
  {
    type: "operations",
    name: "AI Operations Assistant",
    tagline: "Keep the team on track with tasks and reminders.",
    responsibilities: [
      "Create follow-up tasks from inbox and CRM",
      "Surface overdue or missing actions",
      "Summarise operational workload",
    ],
  },
  {
    type: "executive",
    name: "AI Executive Assistant",
    tagline: "Daily business pulse, pipeline, and revenue alerts.",
    responsibilities: [
      "Summarise pipeline and forecast",
      "Highlight hot leads and urgent conversations",
      "Flag revenue risks and opportunities",
    ],
  },
];

export function getAgentDefinition(type: AgentType): AgentDefinition {
  const agent = AGENT_DEFINITIONS.find((a) => a.type === type);
  if (!agent) throw new Error(`Unknown agent type: ${type}`);
  return agent;
}

export function isAgentType(value: string): value is AgentType {
  return AGENT_DEFINITIONS.some((a) => a.type === value);
}
