"use client";

import { NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useId, useState } from "react";
import {
  CrmField,
  CrmFormActions,
  CrmFormBody,
  CrmFormDialog,
  crmChipClass,
  crmInputClass,
} from "@/components/crm/crm-form";
import { MemberSelect } from "@/components/shared/member-select";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";

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
  const [authorId, setAuthorId] = useState(defaultAuthorId ?? "");
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
      if (!res.ok) {
        setError("Could not log that activity. Try again.");
        return;
      }
      setTitle("");
      setDescription("");
      setOpen(false);
      router.refresh();
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
              <MemberSelect
                id={`${ids}-author`}
                members={members}
                value={authorId}
                onChange={setAuthorId}
                placeholder="Logged by…"
                allowUnassigned={false}
                className={crmInputClass}
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
      <label className="mb-1 block text-xs font-semibold text-foreground">
        {label}
      </label>
      <MemberSelect
        members={members}
        value={ownerId}
        onChange={save}
        placeholder="Unassigned"
        className={busy ? `${crmInputClass} opacity-60` : crmInputClass}
      />
    </div>
  );
}
