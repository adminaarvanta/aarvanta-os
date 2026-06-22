import type { AgentDefinition, AgentType } from "@/types/workforce";

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    type: "ceo",
    name: "AI CEO",
    title: "Chief Executive Officer",
    department: "leadership",
    tagline: "Daily business briefing, KPI tracking, and growth recommendations.",
    primaryFunction: "Daily Briefing",
    responsibilities: [
      "Monitor business health and revenue trends",
      "Deliver daily executive briefings",
      "Track KPIs and flag risks early",
      "Recommend strategic growth actions",
    ],
  },
  {
    type: "coo",
    name: "AI COO",
    title: "Chief Operating Officer",
    department: "operations",
    tagline: "Operations review, process optimization, and bottleneck detection.",
    primaryFunction: "Operations Review",
    responsibilities: [
      "Review operational workload and task backlog",
      "Identify process bottlenecks",
      "Suggest workflow improvements",
      "Surface overdue actions across teams",
    ],
  },
  {
    type: "sales_manager",
    name: "AI Sales Manager",
    title: "Sales Director",
    department: "sales",
    tagline: "Pipeline review, lead scoring, and follow-up automation.",
    primaryFunction: "Pipeline Review",
    responsibilities: [
      "Review pipeline health and deal velocity",
      "Score and prioritise hot leads",
      "Suggest follow-up messages and next steps",
      "Draft proposals and meeting outreach",
    ],
    requiresContact: true,
  },
  {
    type: "marketing_manager",
    name: "AI Marketing Manager",
    title: "Marketing Director",
    department: "marketing",
    tagline: "Campaign suggestions, content ideas, and channel recommendations.",
    primaryFunction: "Campaign Suggestions",
    responsibilities: [
      "Propose marketing campaigns and content themes",
      "Suggest LinkedIn, email, and ad copy angles",
      "Recommend SEO and social scheduling priorities",
      "Analyse audience segments from CRM data",
    ],
  },
  {
    type: "hr_manager",
    name: "AI HR Manager",
    title: "HR Director",
    department: "hr",
    tagline: "Recruitment assistant, JD creation, and onboarding support.",
    primaryFunction: "Recruitment Assistant",
    responsibilities: [
      "Draft job descriptions and role requirements",
      "Screen candidate profiles and suggest interview questions",
      "Plan employee onboarding checklists",
      "Track hiring pipeline and team capacity",
    ],
  },
  {
    type: "cfo",
    name: "AI CFO",
    title: "Chief Financial Officer",
    department: "finance",
    tagline: "Revenue forecasting, expense analysis, and cashflow alerts.",
    primaryFunction: "Financial Review",
    responsibilities: [
      "Forecast revenue and pipeline-weighted income",
      "Flag expense anomalies and budget overruns",
      "Summarise invoice and collections status",
      "Recommend pricing and margin improvements",
    ],
  },
  {
    type: "customer_success_manager",
    name: "AI Customer Success Manager",
    title: "Customer Success Director",
    department: "customer_success",
    tagline: "Health scores, renewals, ticket triage, and churn prevention.",
    primaryFunction: "Customer Health Review",
    responsibilities: [
      "Monitor customer health scores and renewal risk",
      "Prioritise support tickets and follow-ups",
      "Draft FAQ responses and nurture sequences",
      "Recommend expansion and upsell opportunities",
    ],
    requiresContact: true,
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

export function agentDepartmentLabel(department: AgentDefinition["department"]) {
  const labels: Record<AgentDefinition["department"], string> = {
    leadership: "Leadership",
    operations: "Operations",
    sales: "Sales",
    marketing: "Marketing",
    hr: "Human Resources",
    finance: "Finance",
    customer_success: "Customer Success",
  };
  return labels[department];
}
