"use client";

import { NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  CrmField,
  CrmFormActions,
  CrmFormBody,
  CrmFormDialog,
  crmChipClass,
  crmInputClass,
} from "@/components/crm/crm-form";
import { OwnerPicker } from "@/components/crm/owner-picker";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";
import {
  ensureOwnerId,
  selectionFromOwnerId,
  type OwnerSelection,
} from "@/lib/crm/owner-selection";

const ACTIVITY_TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
] as const;

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
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"call" | "meeting" | "note">("note");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState<OwnerSelection>(() =>
    selectionFromOwnerId(defaultAuthorId, members)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setError(null);
  }, [busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const authorId = await ensureOwnerId(members, author);
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
          authorId,
        }),
      });
      if (!res.ok) {
        setError("Could not log that activity. Try again.");
        return;
      }
      setTitle("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" size="sm" variant="navy" onClick={() => setOpen(true)}>
        <NotebookPen className="mr-1.5 h-3.5 w-3.5" />
        Log activity
      </Button>
      <CrmFormDialog
        open={open}
        title="Log activity"
        description="Record a note, call, or meeting against this record."
        icon={NotebookPen}
        onClose={close}
      >
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <CrmFormBody>
            <CrmField label="Type">
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_TYPES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={
                      type === option.value ? crmChipClass.active : crmChipClass.idle
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </CrmField>
            <CrmField label="Title" htmlFor={`${ids}-title`} required>
              <input
                id={`${ids}-title`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Called to confirm next steps"
                required
                className={crmInputClass}
              />
            </CrmField>
            <CrmField label="Notes" htmlFor={`${ids}-notes`}>
              <textarea
                id={`${ids}-notes`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What happened…"
                className={`${crmInputClass} resize-none`}
              />
            </CrmField>
            <CrmField label="Logged by" htmlFor={`${ids}-author`}>
              <OwnerPicker
                id={`${ids}-author`}
                members={members}
                value={author}
                onChange={setAuthor}
              />
            </CrmField>
            {error ? (
              <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </CrmFormBody>
          <CrmFormActions busy={busy} onCancel={close} submitLabel="Save activity" />
        </form>
      </CrmFormDialog>
    </>
  );
}

export function AssignOwnerField({
  label,
  value,
  members,
  onSave,
  compact = false,
}: {
  label?: string;
  value?: string;
  members: MemberOption[];
  onSave: (ownerId: string) => Promise<void>;
  compact?: boolean;
}) {
  const [knownMembers, setKnownMembers] = useState(members);
  const [owner, setOwner] = useState<OwnerSelection>(() =>
    selectionFromOwnerId(value, members)
  );
  const [busy, setBusy] = useState(false);
  const savedOwnerId = useRef(value);

  useEffect(() => {
    setKnownMembers((current) => {
      const extras = current.filter(
        (member) => !members.some((next) => next.userId === member.userId)
      );
      return extras.length ? [...members, ...extras] : members;
    });
  }, [members]);

  useEffect(() => {
    if (savedOwnerId.current === value) return;
    savedOwnerId.current = value;
    setOwner(selectionFromOwnerId(value, knownMembers));
  }, [value, knownMembers]);

  async function commit(next: OwnerSelection) {
    setOwner(next);
    setBusy(true);
    try {
      const ownerId = (await ensureOwnerId(knownMembers, next)) ?? "";
      if (next.kind === "new" && ownerId) {
        const created = {
          userId: ownerId,
          name: next.name,
          email: "",
        };
        setKnownMembers((current) =>
          current.some((member) => member.userId === ownerId)
            ? current
            : [...current, created]
        );
        setOwner({ kind: "existing", id: ownerId, name: next.name });
      }
      savedOwnerId.current = ownerId || undefined;
      await onSave(ownerId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={busy ? "opacity-60" : undefined}>
      {label ? (
        <label className="mb-1.5 block text-xs font-semibold text-foreground">
          {label}
        </label>
      ) : null}
      <OwnerPicker
        members={knownMembers}
        value={owner}
        onChange={setOwner}
        compact={compact}
        onCommit={(next) => {
          void commit(next);
        }}
      />
    </div>
  );
}
