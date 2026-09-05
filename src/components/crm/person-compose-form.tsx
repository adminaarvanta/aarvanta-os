"use client";

import { UserPlus } from "lucide-react";
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
import { MemberSelect } from "@/components/shared/member-select";
import { Button } from "@/components/ui/button";
import {
  emptyCompanySelection,
  ensureCompanyId,
  type CompanyOption,
  type CompanySelection,
} from "@/lib/crm/company-selection";
import type { MemberOption } from "@/lib/crm/members";
import { cn } from "@/lib/utils";
import type { ContactTag } from "@/types/crm";

const LEAD_TAGS: Array<{ value: ContactTag; label: string }> = [
  { value: "prospect", label: "Prospect" },
  { value: "hot_lead", label: "Hot lead" },
  { value: "follow_up", label: "Follow up" },
];

export function PersonComposeForm({
  mode,
  members,
  companies,
}: {
  mode: "contact" | "lead";
  members: MemberOption[];
  companies: CompanyOption[];
}) {
  const router = useRouter();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState<CompanySelection>(emptyCompanySelection);
  const [ownerId, setOwnerId] = useState("");
  const [tag, setTag] = useState<ContactTag>("prospect");
  const [notes, setNotes] = useState("");

  const isLead = mode === "lead";

  const reset = useCallback(() => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setJobTitle("");
    setCompany(emptyCompanySelection());
    setOwnerId("");
    setTag("prospect");
    setNotes("");
    setError(null);
  }, []);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setError(null);
  }, [busy]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const accountId = await ensureCompanyId(companies, company);
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          accountId,
          ownerId: ownerId || undefined,
          notes: isLead ? notes.trim() || undefined : undefined,
          tags: isLead ? [tag] : ["prospect"],
        }),
      });
      if (!res.ok) {
        setError(
          isLead
            ? "Could not create that lead. Check the details and try again."
            : "Could not create that contact. Check the details and try again."
        );
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" size="sm" variant="navy" onClick={() => setOpen(true)}>
        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
        {isLead ? "Add lead" : "Add contact"}
      </Button>

      <CrmFormDialog
        open={open}
        title={isLead ? "New lead" : "New contact"}
        description={
          isLead
            ? "Capture someone you want to follow — company can be picked or created here."
            : "Add someone you met. Link an existing company or type a new name."
        }
        icon={UserPlus}
        onClose={close}
      >
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <CrmFormBody>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <CrmField label="First name" htmlFor={`${ids}-first`} required>
              <input
                id={`${ids}-first`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
                className={crmInputClass}
              />
            </CrmField>
            <CrmField label="Last name" htmlFor={`${ids}-last`} required>
              <input
                id={`${ids}-last`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
                className={crmInputClass}
              />
            </CrmField>
            <CrmField label="Email" htmlFor={`${ids}-email`}>
              <input
                id={`${ids}-email`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                className={crmInputClass}
              />
            </CrmField>
            <CrmField label="Phone" htmlFor={`${ids}-phone`}>
              <input
                id={`${ids}-phone`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                autoComplete="tel"
                placeholder="+44 …"
                className={crmInputClass}
              />
            </CrmField>
            <CrmField
              label="Job title"
              htmlFor={`${ids}-title`}
              className="sm:col-span-2"
            >
              <input
                id={`${ids}-title`}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Head of Operations"
                className={crmInputClass}
              />
            </CrmField>
            <CrmField
              label="Company"
              htmlFor={`${ids}-company`}
              className="sm:col-span-2"
            >
              <CompanyPicker
                id={`${ids}-company`}
                companies={companies}
                value={company}
                onChange={setCompany}
              />
            </CrmField>
            {isLead ? (
              <CrmField label="Lead status" className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {LEAD_TAGS.map((option) => {
                    const active = tag === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTag(option.value)}
                        className={active ? crmChipClass.active : crmChipClass.idle}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </CrmField>
            ) : null}
            <CrmField
              label="Owner"
              htmlFor={`${ids}-owner`}
              className="sm:col-span-2"
            >
              <MemberSelect
                id={`${ids}-owner`}
                members={members}
                value={ownerId}
                onChange={setOwnerId}
                placeholder="Unassigned"
                className={crmInputClass}
              />
            </CrmField>
            {isLead ? (
              <CrmField
                label="Notes"
                htmlFor={`${ids}-notes`}
                className="sm:col-span-2"
              >
                <textarea
                  id={`${ids}-notes`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Context, next step, or how you met…"
                  className={cn(crmInputClass, "resize-none")}
                />
              </CrmField>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          </CrmFormBody>

          <CrmFormActions
            busy={busy}
            onCancel={close}
            submitLabel={isLead ? "Create lead" : "Create contact"}
          />
        </form>
      </CrmFormDialog>
    </>
  );
}
