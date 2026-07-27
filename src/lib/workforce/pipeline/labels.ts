import type { AgentType, GoalObjective } from "@/types/workforce";

export const GOAL_OBJECTIVE_LABELS: Record<GoalObjective, string> = {
  close_lead: "Close Lead",
  follow_up: "Follow Up",
  recover_customer: "Recover Customer",
  book_meeting: "Book Meeting",
  generate_proposal: "Generate Proposal",
  custom: "Custom Goal",
};

export function agentLabel(agentType: AgentType): string {
  const map: Record<AgentType, string> = {
    ceo: "AI CEO",
    coo: "AI COO",
    sales_manager: "AI Sales Manager",
    marketing_manager: "AI Marketing Manager",
    hr_manager: "AI HR Manager",
    cfo: "AI CFO",
    customer_success_manager: "AI Customer Success Manager",
  };
  return map[agentType];
}
