"use client";

import { ListTodo } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useId, useState } from "react";
import { CompanyPicker } from "@/components/crm/company-picker";
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
import {
  emptyCompanySelection,
  ensureCompanyId,
  type CompanyOption,
  type CompanySelection,
} from "@/lib/crm/company-selection";
import {
  emptyOwnerSelection,
  ensureOwnerId,
  type OwnerSelection,
} from "@/lib/crm/owner-selection";
import type { MemberOption } from "@/lib/crm/members";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import { cn } from "@/lib/utils";

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export function CreateTaskForm({
  members,
  companies = [],
  contactId,
  accountId,
  dealId,
}: {
  members: MemberOption[];
  companies?: CompanyOption[];
  contactId?: string;
  accountId?: string;
  dealId?: string;
}) {
  const router = useRouter();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [owner, setOwner] = useState<OwnerSelection>(emptyOwnerSelection);
  const [assignedAgentType, setAssignedAgentType] = useState("");
  const [company, setCompany] = useState<CompanySelection>(emptyCompanySelection);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showCompanyPicker = !accountId;

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
      const resolvedAccountId =
        accountId ?? (await ensureCompanyId(companies, company));
      const assignedTo = assignedAgentType
        ? undefined
        : await ensureOwnerId(members, owner);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          assignedTo,
          assignedAgentType: assignedAgentType || undefined,
          contactId,
          accountId: resolvedAccountId,
          dealId,
          source: assignedAgentType ? "ai" : "manual",
        }),
      });
      if (!res.ok) {
        setError("Could not create that task. Try again.");
        return;
      }
      setTitle("");
      setDescription("");
      setDueDate("");
      setOwner(emptyOwnerSelection());
      setAssignedAgentType("");
      setCompany(emptyCompanySelection());
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
        <ListTodo className="mr-1.5 h-3.5 w-3.5" />
        Add task
      </Button>
      <CrmFormDialog
        open={open}
        title="New task"
        description="A follow-up, call, or piece of work. Attach a company by picking or typing a name."
        icon={ListTodo}
        onClose={close}
      >
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <CrmFormBody>
            <CrmField label="Title" htmlFor={`${ids}-title`} required>
              <input
                id={`${ids}-title`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Follow up after the demo"
                required
                className={crmInputClass}
              />
            </CrmField>
            <CrmField label="Description" htmlFor={`${ids}-desc`}>
              <textarea
                id={`${ids}-desc`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What needs to happen…"
                className={cn(crmInputClass, "resize-none")}
              />
            </CrmField>
            <CrmField label="Priority">
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={
                      priority === option.value
                        ? crmChipClass.active
                        : crmChipClass.idle
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </CrmField>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <CrmField label="Due date" htmlFor={`${ids}-due`}>
                <input
                  id={`${ids}-due`}
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={crmInputClass}
                />
              </CrmField>
              <CrmField label="Assign to AI" htmlFor={`${ids}-agent`}>
                <select
                  id={`${ids}-agent`}
                  value={assignedAgentType}
                  onChange={(e) => {
                    setAssignedAgentType(e.target.value);
                    if (e.target.value) setOwner(emptyOwnerSelection());
                  }}
                  className={crmInputClass}
                >
                  <option value="">A teammate instead</option>
                  {AGENT_DEFINITIONS.map((agent) => (
                    <option key={agent.type} value={agent.type}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </CrmField>
            </div>
            {!assignedAgentType ? (
              <CrmField label="Owner" htmlFor={`${ids}-owner`}>
                <OwnerPicker
                  id={`${ids}-owner`}
                  members={members}
                  value={owner}
                  onChange={setOwner}
                />
              </CrmField>
            ) : (
              <p className="text-xs text-muted">
                Assigned to an AI specialist — the AI Team brain will pick this up
                automatically.
              </p>
            )}
            {showCompanyPicker ? (
              <CrmField label="Company" htmlFor={`${ids}-company`}>
                <CompanyPicker
                  id={`${ids}-company`}
                  companies={companies}
                  value={company}
                  onChange={setCompany}
                />
              </CrmField>
            ) : null}
            {error ? (
              <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </CrmFormBody>
          <CrmFormActions
            busy={busy}
            onCancel={close}
            submitLabel="Create task"
            busyLabel="Creating…"
          />
        </form>
      </CrmFormDialog>
    </>
  );
}
