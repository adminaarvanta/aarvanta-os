"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamManagementPanel } from "@/components/team/team-management-panel";
import { ROLE_LABELS, type Invitation, type MemberRole, type WorkspaceMember } from "@/types/tenant";
import type { ActivityFeedItem, TeamChannel, TeamComment, TeamNote } from "@/types/team";
import { formatRelative } from "@/lib/utils";

const roleBadge: Record<string, string> = {
  owner: "bg-[#B8965D]/20 text-[#C9AA72] ring-[#B8965D]/40",
  admin: "bg-blue-950/60 text-blue-300 ring-blue-700/50",
  manager: "bg-purple-950/60 text-purple-300 ring-purple-700/50",
  member: "bg-[#121E32] text-[#9AABC4] ring-[#243656]",
  guest: "bg-[#121E32] text-[#9AABC4]/70 ring-[#243656]",
};

export function TeamClient({
  members,
  notes,
  comments,
  activity,
  channels,
  currentUserId,
  invitations,
  canInvite,
  canManageMembers,
}: {
  members: WorkspaceMember[];
  notes: TeamNote[];
  comments: TeamComment[];
  activity: ActivityFeedItem[];
  channels: TeamChannel[];
  currentUserId: string;
  invitations: Invitation[];
  canInvite: boolean;
  canManageMembers: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<
    "directory" | "management" | "channels" | "notes" | "activity"
  >("directory");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

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
    { id: "directory" as const, label: "Directory" },
    ...(canInvite || canManageMembers
      ? [{ id: "management" as const, label: "Manage team" }]
      : []),
    { id: "channels" as const, label: "Channels" },
    { id: "notes" as const, label: "Internal Notes" },
    { id: "activity" as const, label: "Activity Feed" },
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
                ? "bg-[#B8965D]/15 text-[#C9AA72] ring-1 ring-[#B8965D]/30"
                : "text-[#9AABC4] hover:bg-[#162840]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "directory" && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-[#243656] bg-[#0D1524] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[#FFFFFF]">
                    {m.name}
                    {m.userId === currentUserId && (
                      <span className="ml-1 text-xs text-[#9AABC4]">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-[#9AABC4]">{m.email}</p>
                </div>
                <Badge className={roleBadge[m.role] ?? roleBadge.member}>
                  {ROLE_LABELS[m.role]}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "management" && (
        <TeamManagementPanel
          members={members}
          invitations={invitations}
          currentUserId={currentUserId}
          canInvite={canInvite}
          canManageMembers={canManageMembers}
        />
      )}

      {tab === "channels" && (
        <ul className="space-y-3">
          {channels.map((channel) => (
            <li
              key={channel.id}
              className="rounded-xl border border-[#243656] bg-[#0D1524] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[#FFFFFF]">{channel.name}</p>
                  <p className="mt-0.5 text-xs text-[#9AABC4]">{channel.description}</p>
                  <p className="mt-2 text-sm text-[#9AABC4]">
                    {channel.lastMessagePreview}
                  </p>
                  <p className="mt-1 text-[10px] text-[#9AABC4]/70">
                    {channel.memberCount} members ·{" "}
                    {formatRelative(channel.lastMessageAt)}
                  </p>
                </div>
                {channel.unreadCount > 0 && (
                  <Badge className="bg-[#B8965D]/20 text-[#C9AA72] ring-[#B8965D]/40">
                    {channel.unreadCount} new
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "notes" && (
        <div className="space-y-6">
          <form
            onSubmit={addNote}
            className="rounded-xl border border-[#243656] bg-[#0D1524] p-4 space-y-3"
          >
            <p className="text-sm font-medium text-[#FFFFFF]">New internal note</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a note… Use @Sarah Chen or @John for mentions"
              rows={3}
              className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
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
                  className="rounded-xl border border-[#243656] bg-[#0D1524] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#FFFFFF]">{note.title}</p>
                      <p className="mt-1 text-xs text-[#9AABC4]">
                        {note.authorName} · {formatRelative(note.createdAt)}
                      </p>
                    </div>
                    {note.pinned && (
                      <Badge className="bg-[#B8965D]/20 text-[#C9AA72] ring-[#B8965D]/40">
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[#C4B896] whitespace-pre-wrap">
                    {note.body}
                  </p>
                  {note.mentionNames.length > 0 && (
                    <p className="mt-2 text-xs text-[#C9AA72]">
                      Mentions: {note.mentionNames.map((n) => `@${n}`).join(", ")}
                    </p>
                  )}
                  {noteComments.length > 0 && (
                    <ul className="mt-3 space-y-2 border-t border-[#243656] pt-3">
                      {noteComments.map((c) => (
                        <li key={c.id} className="text-xs text-[#9AABC4]">
                          <span className="text-[#FFFFFF]">{c.authorName}</span>:{" "}
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
              className="flex gap-3 rounded-xl border border-[#243656] bg-[#0D1524] p-4"
            >
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#B8965D]" />
              <div>
                <p className="text-sm font-medium text-[#FFFFFF]">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-[#9AABC4]">{item.description}</p>
                )}
                <p className="mt-1 text-[10px] text-[#9AABC4]/70">
                  {formatRelative(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
