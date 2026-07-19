import { crmNow } from "@/lib/data/crm-helpers";
import type {
  Invitation,
  Organization,
  Workspace,
  WorkspaceMember,
} from "@/types/tenant";

export const DEMO_ORG_AARVANTA = "org_aarvanta";
export const DEMO_ORG_ABC = "org_abc";
export const DEMO_ORG_XYZ = "org_xyz";

export const DEMO_WS_AARVANTA_MAIN = "ws_aarvanta_main";
export const DEMO_WS_AARVANTA_EU = "ws_aarvanta_eu";
export const DEMO_WS_ABC = "ws_abc_default";
export const DEMO_WS_XYZ = "ws_xyz_default";

export const DEMO_COMPANY_AARVANTA = "company_aarvanta";
export const DEMO_COMPANY_ABC = "company_abc";
export const DEMO_COMPANY_XYZ = "company_xyz";

export const DEMO_USER_ID = "user_pavan";

const now = crmNow();

function member(
  partial: Omit<WorkspaceMember, "status" | "joinedAt" | "updatedAt"> &
    Partial<Pick<WorkspaceMember, "status">>
): WorkspaceMember {
  return {
    status: "active",
    joinedAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function buildDemoOrganizationSeed(): Organization[] {
  return [
    {
      id: DEMO_ORG_AARVANTA,
      name: "Aarvanta Limited",
      slug: "aarvanta",
      plan: "enterprise",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_ORG_ABC,
      name: "ABC Consulting",
      slug: "abc-consulting",
      plan: "growth",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_ORG_XYZ,
      name: "XYZ Agency",
      slug: "xyz-agency",
      plan: "starter",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function buildDemoWorkspaceSeed(): Workspace[] {
  return [
    {
      id: DEMO_WS_AARVANTA_MAIN,
      tenantId: DEMO_ORG_AARVANTA,
      name: "Main",
      slug: "main",
      defaultCompanyId: DEMO_COMPANY_AARVANTA,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_WS_AARVANTA_EU,
      tenantId: DEMO_ORG_AARVANTA,
      name: "Europe",
      slug: "europe",
      defaultCompanyId: DEMO_COMPANY_AARVANTA,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_WS_ABC,
      tenantId: DEMO_ORG_ABC,
      name: "Default",
      slug: "default",
      defaultCompanyId: DEMO_COMPANY_ABC,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_WS_XYZ,
      tenantId: DEMO_ORG_XYZ,
      name: "Default",
      slug: "default",
      defaultCompanyId: DEMO_COMPANY_XYZ,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * PRD roles for every user: Owner, Admin, Manager, Member, Guest
 * across Organization → Workspace hierarchy.
 */
export function buildDemoMemberSeed(): WorkspaceMember[] {
  return [
    // —— Aarvanta Limited / Main — all five PRD roles ——
    member({
      id: "member_pavan",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      companyId: DEMO_COMPANY_AARVANTA,
      userId: DEMO_USER_ID,
      email: "pavan@aarvanta.com",
      name: "Pavan",
      role: "owner",
    }),
    member({
      id: "member_sarah",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      companyId: DEMO_COMPANY_AARVANTA,
      userId: "user_sarah",
      email: "sarah.chen@meridian.io",
      name: "Sarah Chen",
      role: "admin",
    }),
    member({
      id: "member_john",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      companyId: DEMO_COMPANY_AARVANTA,
      userId: "user_john",
      email: "john@aarvanta.com",
      name: "John Reeves",
      role: "manager",
    }),
    member({
      id: "member_priya",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      companyId: DEMO_COMPANY_AARVANTA,
      userId: "user_priya",
      email: "priya@aarvanta.com",
      name: "Priya Shah",
      role: "member",
    }),
    member({
      id: "member_guest",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      companyId: DEMO_COMPANY_AARVANTA,
      userId: "user_guest",
      email: "guest@aarvanta.com",
      name: "Guest User",
      role: "guest",
    }),

    // —— Aarvanta Limited / Europe ——
    member({
      id: "member_eu_lead",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_EU,
      companyId: DEMO_COMPANY_AARVANTA,
      userId: DEMO_USER_ID,
      email: "pavan@aarvanta.com",
      name: "Pavan",
      role: "owner",
    }),
    member({
      id: "member_eu_manager",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_EU,
      companyId: DEMO_COMPANY_AARVANTA,
      userId: "user_elena",
      email: "elena@aarvanta.com",
      name: "Elena Rossi",
      role: "manager",
    }),
    member({
      id: "member_eu_member",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_EU,
      companyId: DEMO_COMPANY_AARVANTA,
      userId: "user_tom",
      email: "tom@aarvanta.com",
      name: "Tom Hughes",
      role: "member",
    }),

    // —— ABC Consulting ——
    member({
      id: "member_abc_owner",
      tenantId: DEMO_ORG_ABC,
      workspaceId: DEMO_WS_ABC,
      companyId: DEMO_COMPANY_ABC,
      userId: "user_abc_owner",
      email: "owner@abcconsulting.com",
      name: "Alex Brooks",
      role: "owner",
    }),
    member({
      id: "member_abc_admin",
      tenantId: DEMO_ORG_ABC,
      workspaceId: DEMO_WS_ABC,
      companyId: DEMO_COMPANY_ABC,
      userId: "user_abc_admin",
      email: "ops@abcconsulting.com",
      name: "Nina Okonkwo",
      role: "admin",
    }),
    member({
      id: "member_abc_member",
      tenantId: DEMO_ORG_ABC,
      workspaceId: DEMO_WS_ABC,
      companyId: DEMO_COMPANY_ABC,
      userId: "user_abc_member",
      email: "consultant@abcconsulting.com",
      name: "Chris Dalton",
      role: "member",
    }),

    // —— XYZ Agency ——
    member({
      id: "member_xyz_owner",
      tenantId: DEMO_ORG_XYZ,
      workspaceId: DEMO_WS_XYZ,
      companyId: DEMO_COMPANY_XYZ,
      userId: "user_xyz_owner",
      email: "founder@xyzagency.com",
      name: "Maya Patel",
      role: "owner",
    }),
    member({
      id: "member_xyz_manager",
      tenantId: DEMO_ORG_XYZ,
      workspaceId: DEMO_WS_XYZ,
      companyId: DEMO_COMPANY_XYZ,
      userId: "user_xyz_manager",
      email: "studio@xyzagency.com",
      name: "Jonah Reed",
      role: "manager",
    }),
    member({
      id: "member_xyz_guest",
      tenantId: DEMO_ORG_XYZ,
      workspaceId: DEMO_WS_XYZ,
      companyId: DEMO_COMPANY_XYZ,
      userId: "user_xyz_guest",
      email: "freelancer@example.com",
      name: "Riley Cole",
      role: "guest",
    }),
  ];
}

export function buildDemoInvitationSeed(): Invitation[] {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return [
    {
      id: "inv_new_hire",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_MAIN,
      companyId: DEMO_COMPANY_AARVANTA,
      email: "newhire@aarvanta.com",
      role: "member",
      invitedBy: DEMO_USER_ID,
      invitedByName: "Pavan",
      token: "demo_invite_newhire",
      status: "pending",
      expiresAt: expires,
      createdAt: now,
    },
    {
      id: "inv_contractor",
      tenantId: DEMO_ORG_AARVANTA,
      workspaceId: DEMO_WS_AARVANTA_EU,
      companyId: DEMO_COMPANY_AARVANTA,
      email: "contractor@example.com",
      role: "guest",
      invitedBy: DEMO_USER_ID,
      invitedByName: "Pavan",
      token: "demo_invite_contractor",
      status: "pending",
      expiresAt: expires,
      createdAt: now,
    },
    {
      id: "inv_abc_manager",
      tenantId: DEMO_ORG_ABC,
      workspaceId: DEMO_WS_ABC,
      companyId: DEMO_COMPANY_ABC,
      email: "manager@abcconsulting.com",
      role: "manager",
      invitedBy: "user_abc_owner",
      invitedByName: "Alex Brooks",
      token: "demo_invite_abc_manager",
      status: "pending",
      expiresAt: expires,
      createdAt: now,
    },
  ];
}
