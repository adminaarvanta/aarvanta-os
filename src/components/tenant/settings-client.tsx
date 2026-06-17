"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type SettingsClientProps = {
  organization: Organization;
  workspace: Workspace;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  invitations: Invitation[];
  currentUserId: string;
  currentRole: MemberRole;
  permissions: Permission[];
};

const roleBadgeClass: Record<MemberRole, string> = {
  owner: "bg-[#D4AF37]/20 text-[#F9E076] ring-[#D4AF37]/40",
  admin: "bg-blue-950/60 text-blue-300 ring-blue-700/50",
  manager: "bg-purple-950/60 text-purple-300 ring-purple-700/50",
  member: "bg-[#141414] text-[#A89878] ring-[#3d3528]",
  guest: "bg-[#141414] text-[#A89878]/70 ring-[#3d3528]",
};

export function SettingsClient({
  organization,
  workspace,
  workspaces,
  members,
  invitations,
  currentUserId,
  currentRole,
  permissions,
}: SettingsClientProps) {
  const router = useRouter();
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
        setInviteEmail("");
        setMessage("Invitation sent.");
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

  return (
    <div className="space-y-8">
      {message && (
        <p className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#F9E076]">
          {message}
        </p>
      )}

      <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
        <h3 className="text-sm font-semibold text-[#F5E6C8]">Organization</h3>
        <p className="mt-1 text-xs text-[#A89878]">
          SaaS tenant — {organization.slug}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] uppercase text-[#A89878]">Name</dt>
            <dd className="text-sm text-[#F5E6C8]">{organization.name}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-[#A89878]">Plan</dt>
            <dd className="text-sm capitalize text-[#F5E6C8]">{organization.plan}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-[#A89878]">Your role</dt>
            <dd>
              <Badge className={roleBadgeClass[currentRole]}>
                {ROLE_LABELS[currentRole]}
              </Badge>
            </dd>
          </div>
        </dl>
        {!canManageOrg && (
          <p className="mt-3 text-xs text-[#A89878]">
            Contact an owner to change organization settings.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
        <h3 className="text-sm font-semibold text-[#F5E6C8]">Workspaces</h3>
        <p className="mt-1 text-xs text-[#A89878]">
          Active: {workspace.name} · {workspaces.length} total
        </p>
        <ul className="mt-4 space-y-2">
          {workspaces.map((ws) => (
            <li
              key={ws.id}
              className="flex items-center justify-between rounded-lg border border-[#3d3528] px-3 py-2"
            >
              <span className="text-sm text-[#F5E6C8]">{ws.name}</span>
              {ws.id === workspace.id && (
                <Badge className="bg-[#D4AF37]/20 text-[#F9E076] ring-[#D4AF37]/40">
                  Current
                </Badge>
              )}
            </li>
          ))}
        </ul>
        {canManageWorkspace && (
          <form onSubmit={createWorkspace} className="mt-4 flex gap-2">
            <input
              value={newWorkspace}
              onChange={(e) => setNewWorkspace(e.target.value)}
              placeholder="New workspace name"
              className="flex-1 rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8] placeholder:text-[#A89878]/50"
            />
            <Button type="submit" disabled={busy}>
              Add
            </Button>
          </form>
        )}
      </section>

      <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
        <h3 className="text-sm font-semibold text-[#F5E6C8]">Team directory</h3>
        <p className="mt-1 text-xs text-[#A89878]">
          {members.length} member{members.length === 1 ? "" : "s"} in this workspace
        </p>
        <ul className="mt-4 divide-y divide-[#3d3528]">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-[#F5E6C8]">
                  {member.name}
                  {member.userId === currentUserId && (
                    <span className="ml-2 text-xs text-[#A89878]">(you)</span>
                  )}
                </p>
                <p className="text-xs text-[#A89878]">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {canManageMembers && member.role !== "owner" && member.userId !== currentUserId ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      updateRole(member.id, e.target.value as MemberRole)
                    }
                    disabled={busy}
                    className="rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-2 py-1 text-xs text-[#F5E6C8]"
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
                {canManageMembers &&
                  member.role !== "owner" &&
                  member.userId !== currentUserId && (
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
      </section>

      <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
        <h3 className="text-sm font-semibold text-[#F5E6C8]">Invitations</h3>
        {canInvite && (
          <form onSubmit={inviteMember} className="mt-4 flex flex-wrap gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="min-w-[200px] flex-1 rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as MemberRole)}
              className="rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
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
            <p className="text-sm text-[#A89878]">No pending invitations.</p>
          )}
          {invitations.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#3d3528] px-3 py-2"
            >
              <div>
                <p className="text-sm text-[#F5E6C8]">{inv.email}</p>
                <p className="text-xs text-[#A89878]">
                  {ROLE_LABELS[inv.role]} · invited by {inv.invitedByName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    inv.status === "pending"
                      ? "bg-amber-950/60 text-amber-300 ring-amber-700/50"
                      : "bg-[#141414] text-[#A89878] ring-[#3d3528]"
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
      </section>

      <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
        <h3 className="text-sm font-semibold text-[#F5E6C8]">
          Role permissions (RBAC)
        </h3>
        <p className="mt-1 text-xs text-[#A89878]">
          Your role ({ROLE_LABELS[currentRole]}) grants {permissions.length}{" "}
          permissions.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {permissionsForRole(currentRole).map((perm) => (
            <li
              key={perm}
              className="flex items-center gap-2 rounded-lg border border-[#3d3528] px-3 py-2 text-xs text-[#F5E6C8]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
              {PERMISSION_LABELS[perm]}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
