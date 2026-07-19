"use client";

import Link from "next/link";
import { Building2, Copy, Network, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/os/panel";
import {
  MEMBER_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type Invitation,
  type MemberRole,
  type OrganizationHierarchy,
  type WorkspaceMember,
} from "@/types/tenant";

type RoleCatalogItem = {
  role: MemberRole;
  label: string;
  description: string;
  permissions: Array<{ id: string; label: string }>;
};

type OrgHierarchyClientProps = {
  hierarchy: OrganizationHierarchy;
  roles: RoleCatalogItem[];
  current: {
    userId: string;
    email: string;
    name: string;
    role: MemberRole;
    workspaceId: string;
  };
  canInvite: boolean;
  canManageMembers: boolean;
};

const roleBadgeClass: Record<MemberRole, string> = {
  owner: "bg-gold/20 text-gold-bright ring-gold/40",
  admin: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  manager: "bg-navy/60 text-gold-bright ring-gold/30",
  member: "bg-surface-muted text-muted ring-border",
  guest: "bg-surface-muted text-dim ring-border",
};

function MemberRow({
  member,
  isYou,
}: {
  member: WorkspaceMember;
  isYou: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-surface-muted/50 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {member.name}
          {isYou ? (
            <span className="ml-1.5 text-[10px] font-normal text-gold">you</span>
          ) : null}
        </p>
        <p className="truncate text-[11px] text-dim">{member.email}</p>
      </div>
      <Badge className={`ring-1 ${roleBadgeClass[member.role]}`}>
        {ROLE_LABELS[member.role]}
      </Badge>
    </li>
  );
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const [copied, setCopied] = useState(false);
  const acceptUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${invitation.token}`
      : `/invite/${invitation.token}`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{invitation.email}</p>
        <p className="text-[11px] text-dim">
          Pending · {ROLE_LABELS[invitation.role]} · invited by{" "}
          {invitation.invitedByName}
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-8 px-2 text-[11px]"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(acceptUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* ignore */
          }
        }}
      >
        <Copy className="mr-1 h-3 w-3" />
        {copied ? "Copied" : "Copy invite link"}
      </Button>
    </li>
  );
}

export function OrgHierarchyClient({
  hierarchy,
  roles,
  current,
  canInvite,
  canManageMembers,
}: OrgHierarchyClientProps) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    current.workspaceId || hierarchy.workspaces[0]?.workspace.id || ""
  );

  const activeBranch = useMemo(
    () =>
      hierarchy.workspaces.find((w) => w.workspace.id === activeWorkspaceId) ??
      hierarchy.workspaces[0],
    [hierarchy.workspaces, activeWorkspaceId]
  );

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              <Network className="h-3.5 w-3.5" />
              Organization hierarchy
            </p>
            <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold text-foreground">
              <Building2 className="h-5 w-5 text-gold" />
              {hierarchy.organization.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              PRD structure: Organization → Workspace → Users with roles Owner,
              Admin, Manager, Member, Guest.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-center">
            <div className="rounded-xl border border-border bg-surface-muted px-4 py-2">
              <p className="text-lg font-semibold text-foreground">
                {hierarchy.workspaces.length}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-dim">
                Workspaces
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-muted px-4 py-2">
              <p className="text-lg font-semibold text-foreground">
                {hierarchy.totalMembers}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-dim">
                Users
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-muted px-4 py-2">
              <p className="text-lg font-semibold text-foreground">
                {hierarchy.pendingInvitations}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-dim">
                Pending invites
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {hierarchy.workspaces.map((branch) => {
            const active = branch.workspace.id === activeBranch?.workspace.id;
            return (
              <button
                key={branch.workspace.id}
                type="button"
                onClick={() => setActiveWorkspaceId(branch.workspace.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-gold bg-primary-soft text-foreground"
                    : "border-border text-muted hover:border-gold/40"
                }`}
              >
                {branch.workspace.name}
                <span className="ml-1.5 text-dim">
                  ({branch.members.length})
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      {activeBranch ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel className="p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Users className="h-4 w-4 text-gold" />
                  {activeBranch.workspace.name} workspace
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  Users grouped by PRD role
                </p>
              </div>
              {(canInvite || canManageMembers) && (
                <Link
                  href="/settings"
                  className="text-xs font-medium text-gold hover:text-gold-bright"
                >
                  Manage in Settings
                </Link>
              )}
            </div>

            <div className="mt-5 space-y-5">
              {MEMBER_ROLES.map((role) => {
                const people = activeBranch.membersByRole[role];
                return (
                  <section key={role}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">
                        {ROLE_LABELS[role]}
                        <span className="ml-1.5 font-normal normal-case tracking-normal">
                          · {people.length}
                        </span>
                      </p>
                      <p className="hidden max-w-xs truncate text-[10px] text-dim sm:block">
                        {ROLE_DESCRIPTIONS[role]}
                      </p>
                    </div>
                    {people.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-dim">
                        No {ROLE_LABELS[role].toLowerCase()}s in this workspace
                        yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {people.map((member) => (
                          <MemberRow
                            key={member.id}
                            member={member}
                            isYou={member.userId === current.userId}
                          />
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>

            {activeBranch.invitations.length > 0 ? (
              <div className="mt-6 border-t border-border-subtle pt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-dim">
                  Pending invitations
                </p>
                <ul className="space-y-2">
                  {activeBranch.invitations.map((inv) => (
                    <InvitationRow key={inv.id} invitation={inv} />
                  ))}
                </ul>
              </div>
            ) : null}
          </Panel>

          <Panel className="p-5">
            <h3 className="text-base font-semibold text-foreground">
              Role permissions
            </h3>
            <p className="mt-1 text-xs text-muted">
              What each PRD user type can do in this organization.
            </p>
            <ul className="mt-4 space-y-3">
              {roles.map((item) => (
                <li
                  key={item.role}
                  className="rounded-xl border border-border bg-surface-muted/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={`ring-1 ${roleBadgeClass[item.role]}`}>
                      {item.label}
                    </Badge>
                    <span className="text-[10px] text-dim">
                      {item.permissions.length} permissions
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">{item.description}</p>
                  <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-dim">
                    {item.permissions
                      .slice(0, 4)
                      .map((p) => p.label)
                      .join(" · ")}
                    {item.permissions.length > 4
                      ? ` · +${item.permissions.length - 4} more`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
