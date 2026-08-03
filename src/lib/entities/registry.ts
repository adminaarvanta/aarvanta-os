import type { EntityType, CanonicalEntityRef } from "@/types/entity";

const ENTITY_ROUTES: Partial<Record<EntityType, (id: string) => string>> = {
  contact: (id) => `/crm/contacts/${id}`,
  company: (id) => `/crm/companies/${id}`,
  deal: (id) => `/crm/deals/${id}`,
  task: (id) => `/crm/tasks`,
  project: (id) => `/projects/${id}`,
  workflow: (id) => `/workflows/${id}`,
  conversation: (id) => `/inbox/${id}`,
  hr_case: (id) => `/hr?case=${id}`,
  launch_session: (id) => `/launch?session=${id}`,
  workforce_goal: () => `/workforce/jobs`,
  workforce_execution: (id) => `/workforce/jobs/${id}`,
  workforce_approval: () => `/workforce/waiting`,
};

export function entityRef(
  type: EntityType,
  id: string,
  label?: string
): CanonicalEntityRef {
  const route = ENTITY_ROUTES[type];
  return {
    type,
    id,
    label,
    href: route ? route(id) : undefined,
  };
}

export function entityTypeLabel(type: EntityType): string {
  const labels: Record<EntityType, string> = {
    contact: "Contact",
    company: "Company",
    deal: "Deal",
    task: "Task",
    activity: "Activity",
    conversation: "Conversation",
    document: "Document",
    hr_case: "HR case",
    workflow: "Workflow",
    workflow_run: "Workflow run",
    invoice: "Invoice",
    member: "Member",
    organization: "Organization",
    ai_agent: "AI agent",
    project: "Project",
    launch_session: "Launch session",
    workforce_goal: "AI Team goal",
    workforce_execution: "AI Team job",
    workforce_approval: "Waiting for You",
  };
  return labels[type] ?? type;
}
