"use client";

import Link from "next/link";
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
  ROLE_LABELS,
  type MemberRole,
  type Organization,
  type Workspace,
} from "@/types/tenant";
import type { WorkspaceSettings } from "@/types/workspace-settings";

type SettingsClientProps = {
  organization: Organization;
  workspace: Workspace;
  workspaces: Workspace[];
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
  const [newWorkspace, setNewWorkspace] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canManageOrg = permissions.includes("org:manage");
  const canManageWorkspace = permissions.includes("workspace:manage");

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

      <Panel>
        <SectionHeader
          title="Partners"
          description="Share your partner link, track leads and commissions, request payouts."
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/partners"
            className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black hover:bg-gold-bright"
          >
            Open Partners
          </Link>
          <Link
            href="/affiliate"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-foreground hover:border-gold/40"
          >
            Public apply page
          </Link>
        </div>
      </Panel>

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
          description={`${organization.name} — name, plan, and a link to manage people`}
        />
        <p className="mt-2 text-xs text-muted">
          <Link href="/team" className="font-medium text-gold hover:text-gold-bright">
            Manage team
          </Link>{" "}
          for directory, invitations, roles, and hierarchy.
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
                <option value="free">Free</option>
                <option value="starter">Launch</option>
                <option value="growth">Growth</option>
                <option value="scale">Scale</option>
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

      <Panel>
        <SectionHeader
          title="Your permissions"
          description={`Your role (${ROLE_LABELS[currentRole]}) grants ${permissions.length} permissions.`}
        />
        <p className="mt-2 text-xs text-muted">
          See the full catalog for every role on{" "}
          <Link href="/team?tab=roles" className="font-medium text-gold hover:text-gold-bright">
            Team → Roles
          </Link>
          .
        </p>
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
