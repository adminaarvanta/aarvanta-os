"use client";

import { Pencil } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  ensureCompanyId,
  selectionFromAccountId,
  type CompanySelection,
} from "@/lib/crm/company-selection";
import type { CrmCompany, CrmContact, ContactTag } from "@/types/crm";

const TAG_OPTIONS: ContactTag[] = [
  "prospect",
  "hot_lead",
  "customer",
  "vip",
  "partner",
  "follow_up",
];

export function EditContactForm({
  contact,
  companies,
}: {
  contact: CrmContact;
  companies: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(contact.firstName);
  const [lastName, setLastName] = useState(contact.lastName);
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [jobTitle, setJobTitle] = useState(contact.jobTitle ?? "");
  const [company, setCompany] = useState<CompanySelection>(() =>
    selectionFromAccountId(contact.accountId, companies)
  );
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [tags, setTags] = useState<ContactTag[]>(contact.tags);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setError(null);
  }, [busy]);

  function toggleTag(tag: ContactTag) {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const accountId = await ensureCompanyId(companies, company);
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          accountId,
          notes: notes.trim() || undefined,
          tags,
        }),
      });
      if (!res.ok) {
        setError("Could not save this contact. Try again.");
        return;
      }
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
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Edit contact
      </Button>
      <CrmFormDialog
        open={open}
        title="Edit contact"
        description="Update details, or type a new company name to create and link it."
        icon={Pencil}
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
                  required
                  className={crmInputClass}
                />
              </CrmField>
              <CrmField label="Last name" htmlFor={`${ids}-last`} required>
                <input
                  id={`${ids}-last`}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
                  className={crmInputClass}
                />
              </CrmField>
              <CrmField label="Phone" htmlFor={`${ids}-phone`}>
                <input
                  id={`${ids}-phone`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={crmInputClass}
                />
              </CrmField>
            </div>
            <CrmField label="Job title" htmlFor={`${ids}-title`}>
              <input
                id={`${ids}-title`}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={crmInputClass}
              />
            </CrmField>
            <CrmField label="Company" htmlFor={`${ids}-company`}>
              <CompanyPicker
                id={`${ids}-company`}
                companies={companies}
                value={company}
                onChange={setCompany}
              />
            </CrmField>
            <CrmField label="Notes" htmlFor={`${ids}-notes`}>
              <textarea
                id={`${ids}-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={`${crmInputClass} resize-none`}
              />
            </CrmField>
            <CrmField label="Tags">
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={
                      tags.includes(tag) ? crmChipClass.active : crmChipClass.idle
                    }
                  >
                    {tag.replace("_", " ")}
                  </button>
                ))}
              </div>
            </CrmField>
            {error ? (
              <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </CrmFormBody>
          <CrmFormActions busy={busy} onCancel={close} submitLabel="Save changes" />
        </form>
      </CrmFormDialog>
    </>
  );
}

export function EditCompanyForm({ company }: { company: CrmCompany }) {
  const router = useRouter();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(company.name);
  const [domain, setDomain] = useState(company.domain ?? "");
  const [industry, setIndustry] = useState(company.industry ?? "");
  const [size, setSize] = useState(company.size ?? "");
  const [website, setWebsite] = useState(company.website ?? "");
  const [address, setAddress] = useState(company.address ?? "");
  const [notes, setNotes] = useState(company.notes ?? "");

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
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim() || undefined,
          industry: industry.trim() || undefined,
          size: size.trim() || undefined,
          website: website.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setError("Could not save this company. Try again.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Edit company
      </Button>
      <CrmFormDialog
        open={open}
        title="Edit company"
        description="Update the account details. The company name can be anything you need."
        icon={Pencil}
        onClose={close}
      >
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <CrmFormBody>
            <CrmField label="Company name" htmlFor={`${ids}-name`} required>
              <input
                id={`${ids}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                  className={crmInputClass}
                />
              </CrmField>
              <CrmField label="Website" htmlFor={`${ids}-website`}>
                <input
                  id={`${ids}-website`}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={crmInputClass}
                />
              </CrmField>
              <CrmField label="Industry" htmlFor={`${ids}-industry`}>
                <input
                  id={`${ids}-industry`}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={crmInputClass}
                />
              </CrmField>
              <CrmField label="Size" htmlFor={`${ids}-size`}>
                <input
                  id={`${ids}-size`}
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className={crmInputClass}
                />
              </CrmField>
            </div>
            <CrmField label="Address" htmlFor={`${ids}-address`}>
              <input
                id={`${ids}-address`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={crmInputClass}
              />
            </CrmField>
            <CrmField label="Notes" htmlFor={`${ids}-notes`}>
              <textarea
                id={`${ids}-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={`${crmInputClass} resize-none`}
              />
            </CrmField>
            {error ? (
              <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </CrmFormBody>
          <CrmFormActions busy={busy} onCancel={close} submitLabel="Save changes" />
        </form>
      </CrmFormDialog>
    </>
  );
}
