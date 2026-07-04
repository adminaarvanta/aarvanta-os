/** AGEB 2.0 — Global Architecture & Engineering Blueprint types. */

export type AgebComponentKind =
  | "engine"
  | "framework"
  | "service"
  | "os_module"
  | "buddy"
  | "fabric";

export type AgebImplementationStatus =
  | "live"
  | "partial"
  | "scaffold"
  | "planned";

export type AgebEngine = {
  id: string;
  name: string;
  volume: number;
  description: string;
  kind: AgebComponentKind;
  status: AgebImplementationStatus;
  capabilities: string[];
  apiPath?: string;
};

export type AgebVolume = {
  number: number;
  title: string;
  status: AgebImplementationStatus;
  summary: string;
};

export type BuddyDomain =
  | "legal"
  | "accounting"
  | "payroll"
  | "hr"
  | "sales"
  | "marketing"
  | "operations"
  | "inventory"
  | "customer_success";

export type AiBuddyDefinition = {
  id: string;
  name: string;
  domain: BuddyDomain;
  workforceAgentType?: string;
  description: string;
  tools: string[];
  status: AgebImplementationStatus;
};

export type IndustryProfile = {
  id: string;
  label: string;
  primarySector: string;
  secondarySectors: string[];
  defaultWorkflows: string[];
  defaultBuddies: string[];
  kpis: string[];
  complianceNotes: string[];
};
