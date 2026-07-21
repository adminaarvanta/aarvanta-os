"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SystemStatusPanel } from "@/components/settings/system-status-panel";
import { WorkspaceSettingsPanel } from "@/components/settings/workspace-settings-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import { PERMISSION_LABELS, permissionsForRole } from "@/lib/tenant/permissions";
import type { Permission } from "@/lib/tenant/permissions";
import {
  MEMBER_ROLES,
  ROLE_LABELS,
  type Invitation,
  type MemberRole,
  type Organization,
  type Workspace,
  type WorkspaceMember,
} from "@/types/tenant";
import type { WorkspaceSettings } from "@/types/workspace-settings";

type SettingsClientProps = {
  organization: Organization;
  workspace: Workspace;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  invitations: Invitation[];
  currentUserId: string;
  currentRole: MemberRole;
  currentEmail: string;
  currentName: string;
  permissions: Permission[];
  workspaceSettings: WorkspaceSettings;
  production: boolean;
};

const roleBadgeClass: Record<MemberRole, string> = {
  owner: "bg-gold/20 text-gold-bright ring-gold/40",
  admin: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  manager: "bg-navy/60 text-gold-bright ring-gold/30",
  member: "bg-surface-muted text-muted ring-border",
  guest: "bg-surface-muted text-muted/70 ring-border",
};

export function SettingsClient({
  organization,
  workspace,
  workspaces,
  members,
  invitations,
  currentUserId,
  currentRole,
  currentEmail,
  currentName,
  permissions,
  workspaceSettings,
  production,
}: SettingsClientProps) {
  const router = useRouter();
  const [orgName, setOrgName] = useState(organization.name);
  const [orgPlan, setOrgPlan] = useState(organization.plan);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [newWorkspace, setNewWorkspace] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canManageOrg = permissions.includes("org:manage");
  const canManageWorkspace = permissions.includes("workspace:manage");
  const canInvite = permissions.includes("members:invite");
  const canManageMembers = permissions.includes("members:manage");

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tenant/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (res.ok) {
        const data = (await res.json()) as { acceptPath?: string };
        setInviteEmail("");
        setMessage(
          data.acceptPath
            ? `Invitation created. Share link: ${data.acceptPath}`
            : "Invitation sent."
        );
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error?.message ?? "Invite failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function revokeInvite(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/tenant/invitations/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function updateRole(memberId: string, role: MemberRole) {
    setBusy(true);
    try {
      await fetch(`/api/tenant/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(memberId: string) {
    setBusy(true);
    try {
      await fetch(`/api/tenant/members/${memberId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkspace.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tenant/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspace.trim() }),
      });
      if (res.ok) {
        setNewWorkspace("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveOrganization(e: React.FormEvent) {
    e.preventDefault();
    if (!canManageOrg) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tenant/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim(), plan: orgPlan }),
      });
      if (res.ok) {
        setMessage("Organization updated.");
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error?.message ?? "Update failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function switchWorkspace(workspaceId: string) {
    if (workspaceId === workspace.id) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tenant/switch-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {message && (
        <p className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-gold-bright">
          {message}
        </p>
      )}

      <WorkspaceSettingsPanel
        initialSettings={workspaceSettings}
        canManage={canManageWorkspace}
      />

      <SystemStatusPanel />

      <Panel>
        <SectionHeader title="Your account" description="Signed-in user for this workspace." />
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] uppercase text-muted">Name</dt>
            <dd className="text-sm text-foreground">{currentName}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-muted">Email</dt>
            <dd className="text-sm text-foreground">{currentEmail}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-muted">Role</dt>
            <dd className="mt-1">
              <Badge className={roleBadgeClass[currentRole]}>{ROLE_LABELS[currentRole]}</Badge>
            </dd>
          </div>
        </dl>
        {production && (
          <form action="/api/auth/logout" method="post" className="mt-4">
            <Button type="submit" variant="ghost" className="text-muted hover:text-foreground">
              Sign out
            </Button>
          </form>
        )}
      </Panel>

      <Panel>
        <SectionHeader
          title="Organization"
          description={`${organization.name} — manage plan here, or view the full user hierarchy`}
        />
        <p className="mt-2 text-xs text-muted">
          <a href="/organization" className="font-medium text-gold hover:text-gold-bright">
            Open organization hierarchy
          </a>{" "}
          to see every workspace user by Owner / Admin / Manager / Member / Guest.
        </p>
        {canManageOrg ? (
          <form onSubmit={saveOrganization} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Organization name</label>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Plan</label>
              <select
                value={orgPlan}
                onChange={(e) => setOrgPlan(e.target.value as Organization["plan"])}
                className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <Button type="submit" disabled={busy}>
              Save organization
            </Button>
          </form>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-[10px] uppercase text-muted">Name</dt>
              <dd className="text-sm text-foreground">{organization.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase text-muted">Plan</dt>
              <dd className="text-sm capitalize text-foreground">{organization.plan}</dd>
            </div>
          </dl>
        )}
      </Panel>

      <Panel>
        <SectionHeader
          title="Workspaces"
          description={`Active: ${workspace.name} · ${workspaces.length} total`}
        />
        <ul className="mt-4 space-y-2">
          {workspaces.map((ws) => (
            <li
              key={ws.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2"
            >
              <span className="text-sm text-foreground">{ws.name}</span>
              <div className="flex items-center gap-2">
                {ws.id === workspace.id ? (
                  <Badge className="bg-gold/20 text-gold-bright ring-gold/40">Current</Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => switchWorkspace(ws.id)}
                    disabled={busy}
                    className="rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-border hover:bg-surface-hover disabled:opacity-50"
                  >
                    Switch
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {canManageWorkspace && (
          <form onSubmit={createWorkspace} className="mt-4 flex gap-2">
            <input
              value={newWorkspace}
              onChange={(e) => setNewWorkspace(e.target.value)}
              placeholder="New workspace name"
              className="flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground placeholder:text-dim"
            />
            <Button type="submit" disabled={busy}>
              Add workspace
            </Button>
          </form>
        )}
      </Panel>

      <Panel padding="none">
        <div className="border-b border-border-subtle px-4 py-3 sm:px-5">
          <SectionHeader
            title="Team directory"
            description={`${members.length} member${members.length === 1 ? "" : "s"} in this workspace`}
            className="mb-0"
          />
        </div>
        <ul className="divide-y divide-border-subtle px-4 sm:px-5">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-4 last:pb-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {member.name}
                  {member.userId === currentUserId && (
                    <span className="ml-2 text-xs text-muted">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {canManageMembers && member.role !== "owner" && member.userId !== currentUserId ? (
                  <select
                    value={member.role}
                    onChange={(e) => updateRole(member.id, e.target.value as MemberRole)}
                    disabled={busy}
                    className="rounded-lg border border-border bg-surface-muted px-2 py-1 text-xs text-foreground"
                  >
                    {MEMBER_ROLES.filter((r) => r !== "owner").map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge className={roleBadgeClass[member.role]}>
                    {ROLE_LABELS[member.role]}
                  </Badge>
                )}
                {canManageMembers && member.role !== "owner" && member.userId !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    disabled={busy}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel padding="none">
        <div className="border-b border-border-subtle px-4 py-3 sm:px-5">
          <SectionHeader title="Invitations" className="mb-0" />
        </div>
        <div className="px-4 py-4 sm:px-5">
          {canInvite && (
            <form onSubmit={inviteMember} className="flex flex-wrap gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="min-w-[200px] flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
              >
                {MEMBER_ROLES.filter((r) => r !== "owner").map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={busy}>
                Invite
              </Button>
            </form>
          )}
          <ul className="mt-4 space-y-2">
            {invitations.length === 0 && (
              <p className="text-sm text-muted">No pending invitations.</p>
            )}
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2"
              >
                <div>
                  <p className="text-sm text-foreground">{inv.email}</p>
                  <p className="text-xs text-muted">
                    {ROLE_LABELS[inv.role]} · invited by {inv.invitedByName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      inv.status === "pending"
                        ? "bg-gold/10 text-gold-bright ring-gold/35"
                        : "bg-surface-muted text-muted ring-border"
                    }
                  >
                    {inv.status}
                  </Badge>
                  {canInvite && inv.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => revokeInvite(inv.id)}
                      disabled={busy}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <Panel>
        <SectionHeader
          title="Role permissions"
          description={`Your role (${ROLE_LABELS[currentRole]}) grants ${permissions.length} permissions.`}
        />
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {permissionsForRole(currentRole).map((perm) => (
            <li
              key={perm}
              className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-xs text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {PERMISSION_LABELS[perm]}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
