import type { BusinessModuleHint, GoalObjective } from "@/types/workforce";

export type GoalCreatePayload = {
  objective: GoalObjective;
  customObjective?: string;
  instructions?: string;
  moduleHint?: BusinessModuleHint;
};

export type QuickActionId =
  | "review_business"
  | "follow_up_leads"
  | "recover_customers"
  | "create_proposal"
  | "launch_campaign"
  | "hire_employee"
  | "prepare_reports"
  | "find_opportunities";

export const AI_TEAM_QUICK_ACTIONS: {
  id: QuickActionId;
  label: string;
  prompt: string;
  payload: GoalCreatePayload;
}[] = [
  {
    id: "follow_up_leads",
    label: "Follow up Leads",
    prompt: "Follow up my leads",
    payload: { objective: "follow_up" },
  },
  {
    id: "recover_customers",
    label: "Recover Customers",
    prompt: "Recover at-risk customers",
    payload: { objective: "recover_customer" },
  },
  {
    id: "create_proposal",
    label: "Create Proposal",
    prompt: "Create a proposal",
    payload: { objective: "generate_proposal" },
  },
  {
    id: "find_opportunities",
    label: "Find Opportunities",
    prompt: "Find opportunities to close",
    payload: { objective: "close_lead" },
  },
  {
    id: "review_business",
    label: "Review Business",
    prompt: "Review the business and surface priorities",
    payload: {
      objective: "custom",
      customObjective: "Review the business and surface priorities",
      moduleHint: "operations",
    },
  },
  {
    id: "launch_campaign",
    label: "Launch Campaign",
    prompt: "Launch a marketing campaign",
    payload: {
      objective: "custom",
      customObjective: "Launch a marketing campaign",
      moduleHint: "marketing",
    },
  },
  {
    id: "hire_employee",
    label: "Hire Employee",
    prompt: "Help hire an employee",
    payload: {
      objective: "custom",
      customObjective: "Help hire an employee",
      moduleHint: "hr",
    },
  },
  {
    id: "prepare_reports",
    label: "Prepare Reports",
    prompt: "Prepare finance and performance reports",
    payload: {
      objective: "custom",
      customObjective: "Prepare finance and performance reports",
      moduleHint: "finance",
    },
  },
];

const RULES: { test: RegExp; payload: GoalCreatePayload }[] = [
  {
    test: /recover|churn|at[- ]?risk|win\s*back/i,
    payload: { objective: "recover_customer" },
  },
  {
    test: /follow\s*up|nurture|check\s*in/i,
    payload: { objective: "follow_up" },
  },
  {
    test: /proposal|quote|sow|statement of work/i,
    payload: { objective: "generate_proposal" },
  },
  {
    test: /book\s*(a\s*)?meeting|schedule|demo|call/i,
    payload: { objective: "book_meeting" },
  },
  {
    test: /close\s*(the\s*)?lead|opportunit|pipeline|deal/i,
    payload: { objective: "close_lead" },
  },
  {
    test: /hire|recruit|onboard|ats/i,
    payload: {
      objective: "custom",
      moduleHint: "hr",
    },
  },
  {
    test: /campaign|marketing|launch/i,
    payload: {
      objective: "custom",
      moduleHint: "marketing",
    },
  },
  {
    test: /report|forecast|finance|cfo|p&l|revenue/i,
    payload: {
      objective: "custom",
      moduleHint: "finance",
    },
  },
  {
    test: /review\s*(the\s*)?business|priorit/i,
    payload: {
      objective: "custom",
      moduleHint: "operations",
    },
  },
];

/** Map free-text or quick-action prompts to a goals API payload. */
export function promptToGoalPayload(prompt: string): GoalCreatePayload {
  const text = prompt.trim();
  if (!text) {
    return {
      objective: "custom",
      customObjective: "Custom goal",
    };
  }

  const quick = AI_TEAM_QUICK_ACTIONS.find(
    (a) =>
      a.prompt.toLowerCase() === text.toLowerCase() ||
      a.label.toLowerCase() === text.toLowerCase()
  );
  if (quick) return { ...quick.payload };

  for (const rule of RULES) {
    if (rule.test.test(text)) {
      const payload = { ...rule.payload };
      if (payload.objective === "custom") {
        payload.customObjective = text;
        payload.instructions = text;
      } else {
        payload.instructions = text;
      }
      return payload;
    }
  }

  return {
    objective: "custom",
    customObjective: text,
    instructions: text,
  };
}
