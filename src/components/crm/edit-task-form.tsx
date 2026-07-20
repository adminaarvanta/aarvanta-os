"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberSelect } from "@/components/shared/member-select";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";
import type { CrmTask, TaskPriority, TaskStatus } from "@/types/crm";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";

export function EditTaskForm({
  task,
  members,
}: {
  task: CrmTask;
  members: MemberOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [assignedTo, setAssignedTo] = useState(task.assignedTo ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          dueDate: dueDate || undefined,
          assignedTo: assignedTo || undefined,
        }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-[10px]"
        onClick={() => setOpen(true)}
      >
        Edit
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded-lg border border-border p-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className={inputClass}
        placeholder="Title"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className={inputClass}
        placeholder="Description"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className={inputClass}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          className={inputClass}
        >
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </div>
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
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-7 text-xs" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
