"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemberManagementPanel } from "@/components/team/member-management-panel";
import {
  OrgHierarchyClient,
  RoleCatalogPanel,
} from "@/components/tenant/org-hierarchy-client";
import {
  ROLE_LABELS,
  type Invitation,
  type MemberRole,
  type OrganizationHierarchy,
  type WorkspaceMember,
} from "@/types/tenant";
import type { ActivityFeedItem, TeamComment, TeamNote } from "@/types/team";
import { formatRelative } from "@/lib/utils";

const roleBadge: Record<string, string> = {
  owner: "bg-gold/20 text-gold-bright ring-gold/40",
  admin: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  manager: "bg-navy/60 text-gold-bright ring-gold/30",
  member: "bg-surface-muted text-muted ring-border",
  guest: "bg-surface-muted text-muted/70 ring-border",
};

export const TEAM_TABS = [
  "hierarchy",
  "directory",
  "manage",
  "notes",
  "activity",
  "roles",
] as const;

export type TeamTab = (typeof TEAM_TABS)[number];

type RoleCatalogItem = {
  role: MemberRole;
  label: string;
  description: string;
  permissions: Array<{ id: string; label: string }>;
};

export function parseTeamTab(raw: string | undefined): TeamTab {
  if (raw && (TEAM_TABS as readonly string[]).includes(raw)) {
    return raw as TeamTab;
  }
  return "directory";
}

export function TeamClient({
  members,
  notes,
  comments,
  activity,
  currentUserId,
  invitations,
  canInvite,
  canManageMembers,
  hierarchy,
  roles,
  current,
  initialTab,
}: {
  members: WorkspaceMember[];
  notes: TeamNote[];
  comments: TeamComment[];
  activity: ActivityFeedItem[];
  currentUserId: string;
  invitations: Invitation[];
  canInvite: boolean;
  canManageMembers: boolean;
  hierarchy: OrganizationHierarchy;
  roles: RoleCatalogItem[];
  current: {
    userId: string;
    email: string;
    name: string;
    role: MemberRole;
    workspaceId: string;
  };
  initialTab?: string;
}) {
  const router = useRouter();
  const canManage = canInvite || canManageMembers;
  const requested = parseTeamTab(initialTab);
  const [tab, setTabState] = useState<TeamTab>(
    requested === "manage" && !canManage ? "directory" : requested
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  function setTab(next: TeamTab) {
    setTabState(next);
    const href = next === "directory" ? "/team" : `/team?tab=${next}`;
    router.replace(href, { scroll: false });
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          entityType: "general",
        }),
      });
      setTitle("");
      setBody("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    { id: "hierarchy" as const, label: "Hierarchy" },
    { id: "directory" as const, label: "Directory" },
    ...(canManage ? [{ id: "manage" as const, label: "Manage" }] : []),
    { id: "notes" as const, label: "Notes" },
    { id: "activity" as const, label: "Activity" },
    { id: "roles" as const, label: "Roles" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.id
                ? "bg-gold/15 text-gold-bright ring-1 ring-gold/30"
                : "text-muted hover:bg-surface-hover"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "hierarchy" && (
        <OrgHierarchyClient
          hierarchy={hierarchy}
          roles={roles}
          current={current}
          canInvite={canInvite}
          canManageMembers={canManageMembers}
          showRoleCatalog={false}
        />
      )}

      {tab === "directory" && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-border bg-surface-elevated p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">
                    {m.name}
                    {m.userId === currentUserId && (
                      <span className="ml-1 text-xs text-muted">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">{m.email}</p>
                </div>
                <Badge className={roleBadge[m.role] ?? roleBadge.member}>
                  {ROLE_LABELS[m.role]}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "manage" && canManage && (
        <MemberManagementPanel
          members={members}
          invitations={invitations}
          currentUserId={currentUserId}
          canInvite={canInvite}
          canManageMembers={canManageMembers}
        />
      )}

      {tab === "notes" && (
        <div className="space-y-6">
          <form
            onSubmit={addNote}
            className="rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
          >
            <p className="text-sm font-medium text-foreground">New internal note</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a note… Use @Sarah Chen or @John for mentions"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <Button type="submit" disabled={busy} size="sm">
              Add note
            </Button>
          </form>

          <ul className="space-y-4">
            {notes.map((note) => {
              const noteComments = comments.filter((c) => c.noteId === note.id);
              return (
                <li
                  key={note.id}
                  className="rounded-xl border border-border bg-surface-elevated p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{note.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {note.authorName} · {formatRelative(note.createdAt)}
                      </p>
                    </div>
                    {note.pinned && (
                      <Badge className="bg-gold/20 text-gold-bright ring-gold/40">
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gold-bright whitespace-pre-wrap">
                    {note.body}
                  </p>
                  {note.mentionNames.length > 0 && (
                    <p className="mt-2 text-xs text-gold-bright">
                      Mentions: {note.mentionNames.map((n) => `@${n}`).join(", ")}
                    </p>
                  )}
                  {noteComments.length > 0 && (
                    <ul className="mt-3 space-y-2 border-t border-border pt-3">
                      {noteComments.map((c) => (
                        <li key={c.id} className="text-xs text-muted">
                          <span className="text-foreground">{c.authorName}</span>:{" "}
                          {c.body}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {tab === "activity" && (
        <ul className="space-y-3">
          {activity.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 rounded-xl border border-border bg-surface-elevated p-4"
            >
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                )}
                <p className="mt-1 text-[10px] text-muted/70">
                  {formatRelative(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "roles" && <RoleCatalogPanel roles={roles} />}
    </div>
  );
}
