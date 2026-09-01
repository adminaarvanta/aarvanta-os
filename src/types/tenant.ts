import type { TenantScope } from "@/types/communication";

/** Workspace member roles — RBAC foundation */
export type MemberRole = "owner" | "admin" | "manager" | "member" | "guest";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type MemberStatus = "active" | "suspended";

/** Super-admin grants for marketing / ops staff — not full platform super admin. */
export type MemberCreditOverrides = {
  /** No voice minute cap; Voice OS stays on plan feature gates. */
  unlimitedVoice?: boolean;
  /** No email send cap + access to Email OS (/outreach). */
  unlimitedEmailOutreach?: boolean;
};

export type OnboardingStatus = "pending" | "complete";

export type OnboardingUseCase =
  | "own_business"
  | "agency"
  | "internal_team"
  | "exploring";

export type CustomerCountRange =
  | "1-10"
  | "11-50"
  | "51-200"
  | "200+"
  | "none_yet";

/** Post-signup profile collected by `/onboarding`. Absent on legacy orgs. */
export interface OrganizationOnboarding {
  status: OnboardingStatus;
  website?: string;
  useCase?: OnboardingUseCase;
  industry?: string;
  customerCountRange?: CustomerCountRange;
  tools?: string[];
  completedAt?: string;
  launchpadDismissedAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "starter" | "growth" | "scale" | "enterprise";
  createdAt: string;
  updatedAt: string;
  onboarding?: OrganizationOnboarding;
}

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  defaultCompanyId: string;
  createdAt: string;
  updatedAt: string;
}

export type MemberAuthProvider = "password" | "google";

export interface WorkspaceMember extends TenantScope {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
  /** E.164 or national format; required for free-tier self-serve accounts. */
  phone?: string;
  /** ISO country code or display country name. */
  country?: string;
  /** Optional company label from signup. */
  companyName?: string;
  authProvider?: MemberAuthProvider;
  /** False until phone/country collected (Google signup). */
  profileComplete?: boolean;
  /** Free first-run product walkthrough completed or skipped. */
  hasSeenWalkthrough?: boolean;
  walkthroughCompletedAt?: string;
  /** Platform super-admin grants for voice + Email OS outreach. */
  creditOverrides?: MemberCreditOverrides;
  joinedAt: string;
  updatedAt: string;
}

export interface Invitation extends TenantScope {
  id: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  invitedByName: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export const MEMBER_ROLES: MemberRole[] = [
  "owner",
  "admin",
  "manager",
  "member",
  "guest",
];

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  member: "Member",
  guest: "Guest",
};

/** PRD Multi-Tenant Architecture — human role descriptions. */
export const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  owner: "Full control of the organization, billing, and every workspace.",
  admin: "Manage workspaces, members, and all operating modules.",
  manager: "Lead teams, invite people, and run day-to-day operations.",
  member: "Contribute across CRM, finance views, and AI workforce tools.",
  guest: "Limited read access — ideal for contractors and external partners.",
};

/** Hierarchy: Organization → Workspace → Members (by role) + Invitations. */
export type OrgWorkspaceBranch = {
  workspace: Workspace;
  members: WorkspaceMember[];
  membersByRole: Record<MemberRole, WorkspaceMember[]>;
  invitations: Invitation[];
};

export type OrganizationHierarchy = {
  organization: Organization;
  workspaces: OrgWorkspaceBranch[];
  totalMembers: number;
  pendingInvitations: number;
};
