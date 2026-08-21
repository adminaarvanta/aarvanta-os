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
  owner: "bg-gold/20 text-gold-bright ring-gold/40",
  admin: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  manager: "bg-navy/60 text-gold-bright ring-gold/30",
  member: "bg-surface-muted text-muted ring-border",
  guest: "bg-surface-muted text-muted/70 ring-border",
};

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";

function inviteUrl(token: string) {
  return typeof window !== "undefined"
    ? `${window.location.origin}/invite/${token}`
    : `/invite/${token}`;
}

export function MemberManagementPanel({
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
      const data = (await res.json()) as {
        error?: { message?: string };
        emailSent?: boolean;
        acceptUrl?: string;
        acceptPath?: string;
        emailError?: string;
      };
      if (res.ok) {
        setInviteEmail("");
        if (data.emailSent) {
          setMessage(
            `Invitation emailed. They can also use: ${data.acceptUrl ?? data.acceptPath}`
          );
        } else {
          setMessage(
            `Invite created, but email failed (${data.emailError ?? "unavailable"}). Copy and share: ${data.acceptUrl ?? data.acceptPath ?? ""}`
          );
          if (data.acceptUrl && typeof navigator !== "undefined") {
            void navigator.clipboard.writeText(data.acceptUrl).catch(() => undefined);
          }
        }
        router.refresh();
      } else {
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

  async function resendInvite(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/tenant/invitations/${id}`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        error?: { message?: string };
        emailSent?: boolean;
        acceptUrl?: string;
        emailError?: string;
      };
      if (!res.ok) {
        setMessage(data.error?.message ?? "Could not resend invite.");
        return;
      }
      if (data.emailSent) {
        setMessage("Invitation email resent.");
      } else {
        setMessage(
          `Email not sent (${data.emailError ?? "unavailable"}). Share: ${data.acceptUrl ?? "invite link"}`
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function copyInviteLink(token: string) {
    const url = inviteUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Invite link copied.");
    } catch {
      setMessage(`Invite link: ${url}`);
    }
  }

  const pendingInvites = invitations.filter((i) => i.status === "pending");
  const assignableRoles = MEMBER_ROLES.filter((r) => r !== "owner");

  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-gold-bright">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {canManageMembers && (
          <form
            onSubmit={addMember}
            className="rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground">Add team member</h3>
            <p className="text-xs text-muted">
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
            className="rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground">Invite by email</h3>
            <p className="text-xs text-muted">
              We email the invite link when Gmail is configured. You can also copy or resend.
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
              Invite
            </Button>
          </form>
        )}
      </div>

      <section className="rounded-xl border border-border bg-surface-elevated p-4">
        <h3 className="text-sm font-semibold text-foreground">Manage members</h3>
        <ul className="mt-3 space-y-3">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">
                  {member.name}
                  {member.userId === currentUserId && (
                    <span className="ml-1 text-xs text-muted">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted">{member.email}</p>
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
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
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

      {canInvite && (
        <section className="rounded-xl border border-border bg-surface-elevated p-4">
          <h3 className="text-sm font-semibold text-foreground">Pending invitations</h3>
          {pendingInvites.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No pending invitations.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pendingInvites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="text-foreground">
                    {invite.email}{" "}
                    <span className="text-muted">· {ROLE_LABELS[invite.role]}</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void copyInviteLink(invite.token)}
                      disabled={busy}
                      className="text-xs text-gold hover:text-gold-bright"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => void resendInvite(invite.id)}
                      disabled={busy}
                      className="text-xs text-gold hover:text-gold-bright"
                    >
                      Resend email
                    </button>
                    <button
                      type="button"
                      onClick={() => revokeInvite(invite.id)}
                      disabled={busy}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Revoke
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
