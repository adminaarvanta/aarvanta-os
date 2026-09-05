"use client";

import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useId, useState } from "react";
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
  emptyOwnerSelection,
  ensureOwnerId,
  type OwnerSelection,
} from "@/lib/crm/owner-selection";
import type { MemberOption } from "@/lib/crm/members";

export function CreateCompanyForm({ members }: { members: MemberOption[] }) {
  const router = useRouter();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [owner, setOwner] = useState<OwnerSelection>(emptyOwnerSelection);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setError(null);
  }, [busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const ownerId = await ensureOwnerId(members, owner);
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim() || undefined,
          industry: industry.trim() || undefined,
          size: size.trim() || undefined,
          website: website.trim() || undefined,
          notes: notes.trim() || undefined,
          ownerId,
          tags: ["prospect"],
        }),
      });
      if (!res.ok) {
        setError("Could not create that company. Try again.");
        return;
      }
      const data = (await res.json()) as { company: { id: string } };
      setName("");
      setDomain("");
      setIndustry("");
      setSize("");
      setWebsite("");
      setNotes("");
      setOwner(emptyOwnerSelection());
      setOpen(false);
      router.push(`/crm/companies/${data.company.id}`);
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
        <Building2 className="mr-1.5 h-3.5 w-3.5" />
        Add company
      </Button>
      <CrmFormDialog
        open={open}
        title="New company"
        description="Create an account. You can type any company name — it does not have to be in a list."
        icon={Building2}
        onClose={close}
      >
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <CrmFormBody>
            <CrmField label="Company name" htmlFor={`${ids}-name`} required>
              <input
                id={`${ids}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Robotics"
                required
                className={crmInputClass}
              />
            </CrmField>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <CrmField label="Domain" htmlFor={`${ids}-domain`}>
                <input
                  id={`${ids}-domain`}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="acme.com"
                  className={crmInputClass}
                />
              </CrmField>
              <CrmField label="Website" htmlFor={`${ids}-website`}>
                <input
                  id={`${ids}-website`}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                  className={crmInputClass}
                />
              </CrmField>
              <CrmField label="Industry" htmlFor={`${ids}-industry`}>
                <input
                  id={`${ids}-industry`}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="SaaS, consulting…"
                  className={crmInputClass}
                />
              </CrmField>
              <CrmField label="Size" htmlFor={`${ids}-size`}>
                <input
                  id={`${ids}-size`}
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="50–200"
                  className={crmInputClass}
                />
              </CrmField>
            </div>
            <CrmField label="Notes" htmlFor={`${ids}-notes`}>
              <textarea
                id={`${ids}-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What they buy, how you met…"
                className={`${crmInputClass} resize-none`}
              />
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
            submitLabel="Create company"
          />
        </form>
      </CrmFormDialog>
    </>
  );
}
