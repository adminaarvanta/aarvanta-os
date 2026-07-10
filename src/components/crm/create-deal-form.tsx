"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberSelect } from "@/components/shared/member-select";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";
import type { CrmPipeline } from "@/types/crm";
import { contactDisplayName, type CrmContact } from "@/types/crm";

const inputClass =
  "w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF] outline-none focus:border-[#B8965D] focus:ring-1 focus:ring-[#B8965D]/30";

export function CreateDealForm({
  pipeline,
  contacts,
  members,
}: {
  pipeline: CrmPipeline;
  contacts: CrmContact[];
  members: MemberOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [contactId, setContactId] = useState("");
  const [stageId, setStageId] = useState(pipeline.stages[0]?.id ?? "");
  const [ownerId, setOwnerId] = useState("");

  const stages = [...pipeline.stages].sort((a, b) => a.order - b.order);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !stageId) return;
    setBusy(true);
    try {
      const stage = stages.find((s) => s.id === stageId);
      const contactRecord = contacts.find((c) => c.id === contactId);
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          pipelineId: pipeline.id,
          stageId,
          contactId: contactId || undefined,
          accountId: contactRecord?.accountId,
          ownerId: ownerId || undefined,
          value: Number(value) || 0,
          currency: "GBP",
          probability: stage?.probability ?? 10,
          status: "open",
        }),
      });
      if (res.ok) {
        setTitle("");
        setValue("");
        setContactId("");
        setOwnerId("");
        setOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Add deal
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-[#243656] bg-[#0D1524] p-4 space-y-3"
    >
      <p className="text-sm font-medium text-[#FFFFFF]">New deal</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Deal title *"
        required
        className={inputClass}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value (GBP)"
          type="number"
          min={0}
          className={inputClass}
        />
        <select
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          className={inputClass}
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          className={inputClass}
        >
          <option value="">Contact (optional)</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {contactDisplayName(c)}
            </option>
          ))}
        </select>
        <MemberSelect
          members={members}
          value={ownerId}
          onChange={setOwnerId}
          placeholder="Owner (optional)"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Creating…" : "Create deal"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
