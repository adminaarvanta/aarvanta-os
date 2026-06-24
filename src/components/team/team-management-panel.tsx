"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MEMBER_ROLES,
  ROLE_LABELS,
  type Invitation,
  type MemberRole,
  type WorkspaceMember,
} from "@/types/tenant";

const roleBadge: Record<string, string> = {
  owner: "bg-[#D4AF37]/20 text-[#F9E076] ring-[#D4AF37]/40",
  admin: "bg-blue-950/60 text-blue-300 ring-blue-700/50",
  manager: "bg-purple-950/60 text-purple-300 ring-purple-700/50",
  member: "bg-[#141414] text-[#A89878] ring-[#3d3528]",
  guest: "bg-[#141414] text-[#A89878]/70 ring-[#3d3528]",
};

const inputClass =
  "w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30";

export function TeamManagementPanel({
  members,
  invitations,
  currentUserId,
  canInvite,
  canManageMembers,
}: {
  members: WorkspaceMember[];
  invitations: Invitation[];
  currentUserId: string;
  canInvite: boolean;
  canManageMembers: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<MemberRole>("member");

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
        setMessage("Invitation created.");
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error?.message ?? "Invite failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tenant/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: memberName.trim(),
          email: memberEmail.trim(),
          role: memberRole,
        }),
      });
      if (res.ok) {
        setMemberName("");
        setMemberEmail("");
        setMessage("Team member added.");
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error?.message ?? "Could not add member.");
      }
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

  async function revokeInvite(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/tenant/invitations/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const pendingInvites = invitations.filter((i) => i.status === "pending");
  const assignableRoles = MEMBER_ROLES.filter((r) => r !== "owner");

  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-sm text-[#F5E6C8]">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {canManageMembers && (
          <form
            onSubmit={addMember}
            className="rounded-xl border border-[#3d3528] bg-[#101010] p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-[#F5E6C8]">Add team member</h3>
            <p className="text-xs text-[#A89878]">
              Manually add a colleague to this workspace for CRM assignment and collaboration.
            </p>
            <input
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Full name *"
              required
              className={inputClass}
            />
            <input
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Email *"
              type="email"
              required
              className={inputClass}
            />
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as MemberRole)}
              className={inputClass}
            >
              {assignableRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" disabled={busy}>
              Add member
            </Button>
          </form>
        )}

        {canInvite && (
          <form
            onSubmit={inviteMember}
            className="rounded-xl border border-[#3d3528] bg-[#101010] p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-[#F5E6C8]">Invite by email</h3>
            <p className="text-xs text-[#A89878]">
              Send an invitation with a role — they can accept when auth is connected.
            </p>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              type="email"
              required
              className={inputClass}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as MemberRole)}
              className={inputClass}
            >
              {assignableRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" disabled={busy}>
              Create invitation
            </Button>
          </form>
        )}
      </div>

      <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-4">
        <h3 className="text-sm font-semibold text-[#F5E6C8]">Manage members</h3>
        <ul className="mt-3 space-y-3">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-col gap-2 rounded-lg border border-[#3d3528] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-[#F5E6C8]">
                  {member.name}
                  {member.userId === currentUserId && (
                    <span className="ml-1 text-xs text-[#A89878]">(you)</span>
                  )}
                </p>
                <p className="text-xs text-[#A89878]">{member.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canManageMembers && member.role !== "owner" && member.userId !== currentUserId ? (
                  <>
                    <select
                      value={member.role}
                      disabled={busy}
                      onChange={(e) =>
                        updateRole(member.id, e.target.value as MemberRole)
                      }
                      className="rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-2 py-1 text-xs text-[#F5E6C8]"
                    >
                      {assignableRoles.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => removeMember(member.id)}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <Badge className={roleBadge[member.role] ?? roleBadge.member}>
                    {ROLE_LABELS[member.role]}
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {canInvite && pendingInvites.length > 0 && (
        <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-4">
          <h3 className="text-sm font-semibold text-[#F5E6C8]">Pending invitations</h3>
          <ul className="mt-3 space-y-2">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#3d3528] px-3 py-2 text-sm"
              >
                <span className="text-[#F5E6C8]">
                  {invite.email}{" "}
                  <span className="text-[#A89878]">· {ROLE_LABELS[invite.role]}</span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => revokeInvite(invite.id)}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
