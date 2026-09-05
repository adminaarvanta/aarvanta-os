"use client";

import { Kanban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useId, useState } from "react";
import { CompanyPicker } from "@/components/crm/company-picker";
import {
  CrmField,
  CrmFormActions,
  CrmFormBody,
  CrmFormDialog,
  crmInputClass,
} from "@/components/crm/crm-form";
import { OwnerPicker } from "@/components/crm/owner-picker";
import { Button } from "@/components/ui/button";
import {
  emptyCompanySelection,
  ensureCompanyId,
  selectionFromAccountId,
  type CompanyOption,
  type CompanySelection,
} from "@/lib/crm/company-selection";
import {
  emptyOwnerSelection,
  ensureOwnerId,
  type OwnerSelection,
} from "@/lib/crm/owner-selection";
import type { MemberOption } from "@/lib/crm/members";
import type { CrmPipeline } from "@/types/crm";
import { contactDisplayName, type CrmContact } from "@/types/crm";

export function CreateDealForm({
  pipeline,
  contacts,
  companies = [],
  members,
}: {
  pipeline: CrmPipeline;
  contacts: CrmContact[];
  companies?: CompanyOption[];
  members: MemberOption[];
}) {
  const router = useRouter();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [contactId, setContactId] = useState("");
  const [company, setCompany] = useState<CompanySelection>(emptyCompanySelection);
  const [stageId, setStageId] = useState(pipeline.stages[0]?.id ?? "");
  const [owner, setOwner] = useState<OwnerSelection>(emptyOwnerSelection);

  const stages = [...pipeline.stages].sort((a, b) => a.order - b.order);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setError(null);
  }, [busy]);

  function onContactChange(nextId: string) {
    setContactId(nextId);
    const contact = contacts.find((item) => item.id === nextId);
    if (contact?.accountId) {
      setCompany(selectionFromAccountId(contact.accountId, companies));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !stageId) return;
    setBusy(true);
    setError(null);
    try {
      const stage = stages.find((s) => s.id === stageId);
      const contactRecord = contacts.find((c) => c.id === contactId);
      const accountId =
        (await ensureCompanyId(companies, company)) ?? contactRecord?.accountId;
      const ownerId = await ensureOwnerId(members, owner);
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          pipelineId: pipeline.id,
          stageId,
          contactId: contactId || undefined,
          accountId,
          ownerId,
          value: Number(value) || 0,
          currency: "GBP",
          probability: stage?.probability ?? 10,
          status: "open",
        }),
      });
      if (!res.ok) {
        setError("Could not create that deal. Try again.");
        return;
      }
      setTitle("");
      setValue("");
      setContactId("");
      setCompany(emptyCompanySelection());
      setOwner(emptyOwnerSelection());
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
        <Kanban className="mr-1.5 h-3.5 w-3.5" />
        Add deal
      </Button>
      <CrmFormDialog
        open={open}
        title="New deal"
        description={`Add an opportunity to ${pipeline.name}. Pick or type a company name.`}
        icon={Kanban}
        onClose={close}
      >
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <CrmFormBody>
            <CrmField label="Deal title" htmlFor={`${ids}-title`} required>
              <input
                id={`${ids}-title`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Annual platform renewal"
                required
                className={crmInputClass}
              />
            </CrmField>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <CrmField label="Value (GBP)" htmlFor={`${ids}-value`}>
                <input
                  id={`${ids}-value`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  type="number"
                  min={0}
                  placeholder="12000"
                  className={crmInputClass}
                />
              </CrmField>
              <CrmField label="Stage" htmlFor={`${ids}-stage`}>
                <select
                  id={`${ids}-stage`}
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                  className={crmInputClass}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </CrmField>
            </div>
            <CrmField label="Company" htmlFor={`${ids}-company`}>
              <CompanyPicker
                id={`${ids}-company`}
                companies={companies}
                value={company}
                onChange={setCompany}
              />
            </CrmField>
            <CrmField label="Contact" htmlFor={`${ids}-contact`}>
              <select
                id={`${ids}-contact`}
                value={contactId}
                onChange={(e) => onContactChange(e.target.value)}
                className={crmInputClass}
              >
                <option value="">No contact yet</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {contactDisplayName(c)}
                  </option>
                ))}
              </select>
            </CrmField>
            <CrmField label="Owner" htmlFor={`${ids}-owner`}>
              <OwnerPicker
                id={`${ids}-owner`}
                members={members}
                value={owner}
                onChange={setOwner}
              />
            </CrmField>
            {error ? (
              <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </CrmFormBody>
          <CrmFormActions
            busy={busy}
            onCancel={close}
            submitLabel="Create deal"
            busyLabel="Creating…"
          />
        </form>
      </CrmFormDialog>
    </>
  );
}
