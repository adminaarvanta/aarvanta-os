"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberSelect } from "@/components/shared/member-select";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";

export function LogActivityForm({
  contactId,
  accountId,
  dealId,
  members,
  defaultAuthorId,
}: {
  contactId?: string;
  accountId?: string;
  dealId?: string;
  members: MemberOption[];
  defaultAuthorId?: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<"call" | "meeting" | "note">("note");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [authorId, setAuthorId] = useState(defaultAuthorId ?? "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          contactId,
          accountId,
          dealId,
          authorId: authorId || undefined,
        }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
    >
      <p className="text-sm font-medium text-foreground">Log activity</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "call" | "meeting" | "note")}
          className={inputClass}
        >
          <option value="note">Note</option>
          <option value="call">Call</option>
          <option value="meeting">Meeting</option>
        </select>
        <MemberSelect
          members={members}
          value={authorId}
          onChange={setAuthorId}
          placeholder="Logged by…"
          allowUnassigned={false}
        />
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Activity title *"
        required
        className={inputClass}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className={inputClass}
      />
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? "Saving…" : "Log activity"}
      </Button>
    </form>
  );
}

export function AssignOwnerField({
  label,
  value,
  members,
  onSave,
}: {
  label: string;
  value?: string;
  members: MemberOption[];
  onSave: (ownerId: string) => Promise<void>;
}) {
  const [ownerId, setOwnerId] = useState(value ?? "");
  const [busy, setBusy] = useState(false);

  async function save(next: string) {
    setOwnerId(next);
    setBusy(true);
    try {
      await onSave(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <MemberSelect
        members={members}
        value={ownerId}
        onChange={save}
        placeholder="Unassigned"
        className={busy ? "opacity-60" : undefined}
      />
    </div>
  );
}
