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
  owner: "bg-[#B8965D]/20 text-[#C9AA72] ring-[#B8965D]/40",
  admin: "bg-[#0D1A2E] text-[#4DA6FF] ring-[#4DA6FF]/30",
  manager: "bg-[#1A2B48]/60 text-[#C9AA72] ring-[#B8965D]/30",
  member: "bg-[#121E32] text-[#9AABC4] ring-[#243656]",
  guest: "bg-[#121E32] text-[#9AABC4]/70 ring-[#243656]",
};

const inputClass =
  "w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF] outline-none focus:border-[#B8965D] focus:ring-1 focus:ring-[#B8965D]/30";

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
        <p className="rounded-lg border border-[#243656] bg-[#121E32] px-3 py-2 text-sm text-[#FFFFFF]">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {canManageMembers && (
          <form
            onSubmit={addMember}
            className="rounded-xl border border-[#243656] bg-[#0D1524] p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Add team member</h3>
            <p className="text-xs text-[#9AABC4]">
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
            className="rounded-xl border border-[#243656] bg-[#0D1524] p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Invite by email</h3>
            <p className="text-xs text-[#9AABC4]">
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

      <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-4">
        <h3 className="text-sm font-semibold text-[#FFFFFF]">Manage members</h3>
        <ul className="mt-3 space-y-3">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-col gap-2 rounded-lg border border-[#243656] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-[#FFFFFF]">
                  {member.name}
                  {member.userId === currentUserId && (
                    <span className="ml-1 text-xs text-[#9AABC4]">(you)</span>
                  )}
                </p>
                <p className="text-xs text-[#9AABC4]">{member.email}</p>
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
                      className="rounded-lg border border-[#243656] bg-[#040608] px-2 py-1 text-xs text-[#FFFFFF]"
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
        <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-4">
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Pending invitations</h3>
          <ul className="mt-3 space-y-2">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#243656] px-3 py-2 text-sm"
              >
                <span className="text-[#FFFFFF]">
                  {invite.email}{" "}
                  <span className="text-[#9AABC4]">· {ROLE_LABELS[invite.role]}</span>
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
