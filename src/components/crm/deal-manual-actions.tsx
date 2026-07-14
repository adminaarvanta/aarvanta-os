"use client";

import { useState } from "react";
import { LogActivityForm } from "@/components/crm/crm-manual-forms";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";
import type { CrmDeal } from "@/types/crm";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-gold";

export function DealManualActions({
  deal,
  members,
  currentUserId,
  onUpdate,
}: {
  deal: CrmDeal;
  members: MemberOption[];
  currentUserId: string;
  onUpdate: (deal: CrmDeal) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [logging, setLogging] = useState(false);
  const [title, setTitle] = useState(deal.title);
  const [value, setValue] = useState(String(deal.value));
  const [notes, setNotes] = useState(deal.notes ?? "");

  async function patchDeal(patch: Partial<CrmDeal>) {
    setBusy(true);
    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (response.ok) {
        const data = (await response.json()) as { deal: CrmDeal };
        onUpdate(data.deal);
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    await patchDeal({
      title: title.trim(),
      value: Number(value) || 0,
      notes: notes.trim() || undefined,
    });
    setEditing(false);
  }

  return (
    <div className="mt-2 space-y-2 border-t border-border pt-2">
      <div className="flex flex-wrap gap-1.5">
        {deal.status === "open" && (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[10px] text-accent-cyan"
              disabled={busy}
              onClick={() => patchDeal({ status: "won" })}
            >
              Won
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[10px] text-red-400"
              disabled={busy}
              onClick={() => patchDeal({ status: "lost" })}
            >
              Lost
            </Button>
          </>
        )}
        {deal.status !== "open" && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[10px]"
            disabled={busy}
            onClick={() => patchDeal({ status: "open" })}
          >
            Reopen
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px]"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Cancel" : "Edit"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px]"
          onClick={() => setLogging((v) => !v)}
        >
          {logging ? "Hide log" : "Log activity"}
        </Button>
      </div>

      {editing && (
        <form onSubmit={saveEdit} className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Title"
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            min={0}
            className={inputClass}
            placeholder="Value"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Notes"
          />
          <Button type="submit" size="sm" className="h-7 text-xs" disabled={busy}>
            Save
          </Button>
        </form>
      )}

      {logging && (
        <LogActivityForm
          dealId={deal.id}
          contactId={deal.contactId}
          members={members}
          defaultAuthorId={currentUserId}
        />
      )}
    </div>
  );
}
