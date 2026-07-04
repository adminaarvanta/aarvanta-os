/** Canonical entity kinds — single source of truth references. */
export type EntityType =
  | "contact"
  | "company"
  | "deal"
  | "task"
  | "activity"
  | "conversation"
  | "document"
  | "hr_case"
  | "workflow"
  | "workflow_run"
  | "invoice"
  | "member"
  | "organization"
  | "ai_agent"
  | "project"
  | "launch_session";

export type CanonicalEntityRef = {
  type: EntityType;
  id: string;
  label?: string;
  href?: string;
};
