import type { MemberRole } from "@/types/tenant";

export type Permission =
  | "org:manage"
  | "org:billing"
  | "workspace:manage"
  | "members:invite"
  | "members:manage"
  | "crm:read"
  | "crm:write"
  | "workforce:run"
  | "workforce:configure"
  | "workflows:manage"
  | "platform:audit"
  | "settings:view";

const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  owner: [
    "org:manage",
    "org:billing",
    "workspace:manage",
    "members:invite",
    "members:manage",
    "crm:read",
    "crm:write",
    "workforce:run",
    "workforce:configure",
    "workflows:manage",
    "platform:audit",
    "settings:view",
  ],
  admin: [
    "workspace:manage",
    "members:invite",
    "members:manage",
    "crm:read",
    "crm:write",
    "workforce:run",
    "workforce:configure",
    "workflows:manage",
    "platform:audit",
    "settings:view",
  ],
  manager: [
    "members:invite",
    "crm:read",
    "crm:write",
    "workforce:run",
    "workflows:manage",
    "platform:audit",
    "settings:view",
  ],
  member: [
    "crm:read",
    "crm:write",
    "workforce:run",
    "settings:view",
  ],
  guest: ["crm:read", "settings:view"],
};

export function can(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsForRole(role: MemberRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  "org:manage": "Manage organization",
  "org:billing": "Billing & plans",
  "workspace:manage": "Manage workspaces",
  "members:invite": "Invite members",
  "members:manage": "Manage members",
  "crm:read": "View CRM",
  "crm:write": "Edit CRM",
  "workforce:run": "Run AI agents",
  "workforce:configure": "Configure AI agents",
  "workflows:manage": "Manage workflows",
  "platform:audit": "View audit log & events",
  "settings:view": "View settings",
};
