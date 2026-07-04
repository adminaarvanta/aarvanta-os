import type { TenantScope } from "@/types/communication";

// ─── Billing (Module 11) ───────────────────────────────────────────
export type BillingPlanId = "starter" | "growth" | "scale" | "enterprise";

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
}

export interface Subscription extends TenantScope {
  id: string;
  planId: BillingPlanId;
  status: "active" | "trialing" | "past_due" | "canceled";
  stripeCustomerId?: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  createdAt: string;
}

export interface UsageRecord extends TenantScope {
  id: string;
  metric: "agent_runs" | "api_calls" | "storage_mb" | "seats";
  quantity: number;
  period: string;
  createdAt: string;
}

// ─── Writing Studio (Module 13) ────────────────────────────────────
export type WritingContentType =
  | "proposal"
  | "email"
  | "blog"
  | "linkedin"
  | "sop"
  | "meeting_notes";

export interface WritingDraft extends TenantScope {
  id: string;
  type: WritingContentType;
  title: string;
  prompt: string;
  content: string;
  createdAt: string;
}

// ─── Meetings (Module 14/26) ───────────────────────────────────────
export interface MeetingRecord extends TenantScope {
  id: string;
  title: string;
  source: "zoom" | "teams" | "manual";
  transcript: string;
  summary: string;
  actionItems: string[];
  followUpEmail: string;
  createdAt: string;
}

// ─── Knowledge Graph (Module 15) ───────────────────────────────────
export type GraphEntityType =
  | "customer"
  | "project"
  | "proposal"
  | "contract"
  | "document";

export interface KnowledgeGraphNode extends TenantScope {
  id: string;
  entityType: GraphEntityType;
  label: string;
  refId?: string;
}

export interface KnowledgeGraphEdge extends TenantScope {
  id: string;
  fromId: string;
  toId: string;
  relationship: string;
}

// ─── SOP Engine (Module 18) ────────────────────────────────────────
export interface SopDocument extends TenantScope {
  id: string;
  title: string;
  question: string;
  content: string;
  version: number;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

// ─── Proposal Engine (Module 19) ───────────────────────────────────
export interface ProposalDocument extends TenantScope {
  id: string;
  title: string;
  clientName: string;
  value: number;
  currency: string;
  content: string;
  brandingOrg: string;
  status: "draft" | "sent" | "accepted" | "declined";
  createdAt: string;
}

// ─── Client Portal (Module 20) ────────────────────────────────────
export interface PortalAccess extends TenantScope {
  id: string;
  clientName: string;
  email: string;
  enabled: boolean;
  lastLoginAt?: string;
  projectIds: string[];
}

// ─── Templates (Module 22) ─────────────────────────────────────────
export type TemplateCategory =
  | "proposal"
  | "sop"
  | "campaign"
  | "workflow"
  | "contract";

export interface TemplateItem extends TenantScope {
  id: string;
  category: TemplateCategory;
  name: string;
  description: string;
  content: string;
  tags: string[];
  createdAt: string;
}

// ─── Memory Layers (Module 23) ─────────────────────────────────────
export type MemoryLayer = "user" | "team" | "company" | "customer";

export interface MemoryLayerEntry extends TenantScope {
  id: string;
  layer: MemoryLayer;
  key: string;
  content: string;
  source?: string;
  createdAt: string;
}

// ─── Customer Success (Module 24) ──────────────────────────────────
export interface CustomerHealth extends TenantScope {
  id: string;
  contactId: string;
  clientName: string;
  healthScore: number;
  nps?: number;
  renewalDate?: string;
  churnRisk: "low" | "medium" | "high";
  openTickets: number;
  updatedAt: string;
}

// ─── Wiki (Module 25) ──────────────────────────────────────────────
export type WikiSection =
  | "handbook"
  | "department"
  | "sop_library"
  | "training";

export interface WikiPage extends TenantScope {
  id: string;
  section: WikiSection;
  title: string;
  content: string;
  version: number;
  accessRole: "all" | "admin" | "manager";
  updatedAt: string;
}

// ─── Governance (Module 26) ────────────────────────────────────────
export type AuditAction =
  | "login"
  | "permission_change"
  | "agent_run"
  | "approval"
  | "data_export";

export interface AuditLogEntry extends TenantScope {
  id: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  resource: string;
  detail: string;
  createdAt: string;
}

// ─── Finance OS (Module 28) ────────────────────────────────────────
export interface FinanceInvoice extends TenantScope {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  createdAt: string;
}

export interface FinanceExpense extends TenantScope {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  receiptUrl?: string;
}

export interface FinanceBudget extends TenantScope {
  id: string;
  department: string;
  allocated: number;
  spent: number;
  currency: string;
  period: string;
}

/** UK chart of accounts entry (Milestone 1 — Launch OS finance stack). */
export interface ChartOfAccount extends TenantScope {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  vatApplicable: boolean;
  currency: string;
  active: boolean;
  createdAt: string;
}

// ─── HR OS (Module 29) ──────────────────────────────────────────────
export interface HrCandidate extends TenantScope {
  id: string;
  name: string;
  role: string;
  score: number;
  status: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  resumeSummary: string;
  email?: string;
}

export interface HrEmployee extends TenantScope {
  id: string;
  name: string;
  department: string;
  role: string;
  startDate: string;
  leaveBalance: number;
  email?: string;
  /** Annual salary in GBP for payroll engine (M2). */
  annualSalaryGbp?: number;
}

export interface HrCourse extends TenantScope {
  id: string;
  title: string;
  category: string;
  durationHours: number;
  enrolled: number;
}

export type HrDocumentType =
  | "offer_letter"
  | "experience_letter"
  | "appointment_letter"
  | "relieving_letter"
  | "salary_certificate"
  | "employment_verification"
  | "corporate_invoice"
  | "nda"
  | "policy_memo"
  | "warning_letter"
  | "custom_corporate";

export type HrDocumentStatus = "draft" | "finalized";

export interface HrDocument extends TenantScope {
  id: string;
  type: HrDocumentType;
  title: string;
  subjectName: string;
  subjectId?: string;
  subjectKind?: "employee" | "candidate" | "vendor" | "other";
  status: HrDocumentStatus;
  instructions: string;
  contextFields: Record<string, string>;
  content: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Autonomous Agents (Module 30) ─────────────────────────────────
export interface AutonomousTask extends TenantScope {
  id: string;
  agentType: string;
  goal: string;
  status: "queued" | "planning" | "executing" | "review" | "completed" | "failed";
  steps: string[];
  requiresApproval: boolean;
  createdAt: string;
}

// ─── SSO (Module 31) ───────────────────────────────────────────────
export type SsoProvider = "entra" | "google" | "okta" | "onelogin";

export interface SsoConnection extends TenantScope {
  id: string;
  provider: SsoProvider;
  protocol: "saml" | "oidc" | "oauth";
  status: "active" | "inactive";
  domain: string;
  mfaRequired: boolean;
  scimEnabled: boolean;
}

// ─── Franchise (Module 32) ─────────────────────────────────────────
export interface FranchiseLocation extends TenantScope {
  id: string;
  name: string;
  city: string;
  revenue: number;
  complianceScore: number;
  status: "active" | "at_risk" | "closed";
}

// ─── Multi-Region (Module 33) ──────────────────────────────────────
export interface RegionConfig {
  id: string;
  code: string;
  name: string;
  status: "active" | "planned";
  latencyMs: number;
  dataResidency: boolean;
}

export interface TenantRegion extends TenantScope {
  id: string;
  regionCode: string;
  primary: boolean;
  status: "active" | "failover";
}

// ─── Agent Marketplace (Module 34) ───────────────────────────────────
export interface MarketplaceAgent {
  id: string;
  name: string;
  author: string;
  category: string;
  description: string;
  installs: number;
  rating: number;
  price: "free" | "paid";
}

export interface InstalledAgent extends TenantScope {
  id: string;
  marketplaceId: string;
  name: string;
  enabled: boolean;
  installedAt: string;
}
