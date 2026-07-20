"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberSelect } from "@/components/shared/member-select";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";

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
  const [assignedAgentType, setAssignedAgentType] = useState("");
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
          assignedTo: assignedAgentType ? undefined : assignedTo || undefined,
          assignedAgentType: assignedAgentType || undefined,
          contactId,
          accountId,
          dealId,
          source: assignedAgentType ? "ai" : "manual",
        }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setDueDate("");
        setAssignedTo("");
        setAssignedAgentType("");
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
      <p className="text-sm font-medium text-foreground">Create task</p>
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <select
          value={assignedAgentType}
          onChange={(e) => {
            setAssignedAgentType(e.target.value);
            if (e.target.value) setAssignedTo("");
          }}
          className={inputClass}
        >
          <option value="">Human or AI agent…</option>
          {AGENT_DEFINITIONS.map((agent) => (
            <option key={agent.type} value={agent.type}>
              {agent.name}
            </option>
          ))}
        </select>
        {!assignedAgentType && (
          <MemberSelect
            members={members}
            value={assignedTo}
            onChange={setAssignedTo}
            placeholder="Assign to teammate…"
          />
        )}
      </div>
      {assignedAgentType && (
        <p className="text-xs text-muted">
          Assigned to an AI agent — open Workforce → Tasks and click{" "}
          <span className="text-foreground">Complete with agent</span>, or use
          Process open tasks.
        </p>
      )}
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? "Creating…" : "Add task"}
      </Button>
    </form>
  );
}
