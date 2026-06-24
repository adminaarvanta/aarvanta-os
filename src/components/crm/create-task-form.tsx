"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberSelect } from "@/components/shared/member-select";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";

const inputClass =
  "w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30";

export function CreateTaskForm({
  members,
  contactId,
  accountId,
  dealId,
}: {
  members: MemberOption[];
  contactId?: string;
  accountId?: string;
  dealId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          assignedTo: assignedTo || undefined,
          contactId,
          accountId,
          dealId,
          source: "manual",
        }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setDueDate("");
        setAssignedTo("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-[#3d3528] bg-[#101010] p-4 space-y-3"
    >
      <p className="text-sm font-medium text-[#F5E6C8]">Create task</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title *"
        required
        className={inputClass}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className={inputClass}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value as "low" | "medium" | "high")
          }
          className={inputClass}
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputClass}
        />
        <MemberSelect
          members={members}
          value={assignedTo}
          onChange={setAssignedTo}
          placeholder="Assign to…"
        />
      </div>
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? "Creating…" : "Add task"}
      </Button>
    </form>
  );
}
