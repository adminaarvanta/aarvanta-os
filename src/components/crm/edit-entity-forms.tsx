"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CrmCompany, CrmContact, ContactTag } from "@/types/crm";

const inputClass =
  "w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF] outline-none focus:border-[#B8965D] focus:ring-1 focus:ring-[#B8965D]/30";

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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [firstName, setFirstName] = useState(contact.firstName);
  const [lastName, setLastName] = useState(contact.lastName);
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [jobTitle, setJobTitle] = useState(contact.jobTitle ?? "");
  const [accountId, setAccountId] = useState(contact.accountId ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [tags, setTags] = useState<ContactTag[]>(contact.tags);

  function toggleTag(tag: ContactTag) {
    setTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          accountId: accountId || undefined,
          notes: notes.trim() || undefined,
          tags,
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
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Edit contact
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-[#243656] bg-[#0D1524] p-4 space-y-3"
    >
      <p className="text-sm font-medium text-[#FFFFFF]">Edit contact</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name *"
          required
          className={inputClass}
        />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name *"
          required
          className={inputClass}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className={inputClass}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className={inputClass}
        />
        <input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Job title"
          className={inputClass}
        />
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className={inputClass}
        >
          <option value="">Company (optional)</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={2}
        className={inputClass}
      />
      <div className="flex flex-wrap gap-2">
        {TAG_OPTIONS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={
              tags.includes(tag)
                ? "rounded-full bg-[#B8965D]/20 px-2.5 py-1 text-xs text-[#B8965D] ring-1 ring-[#B8965D]/40"
                : "rounded-full border border-[#243656] px-2.5 py-1 text-xs text-[#9AABC4]"
            }
          >
            {tag.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function EditCompanyForm({ company }: { company: CrmCompany }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(company.name);
  const [domain, setDomain] = useState(company.domain ?? "");
  const [industry, setIndustry] = useState(company.industry ?? "");
  const [size, setSize] = useState(company.size ?? "");
  const [website, setWebsite] = useState(company.website ?? "");
  const [address, setAddress] = useState(company.address ?? "");
  const [notes, setNotes] = useState(company.notes ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
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
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Edit company
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-[#243656] bg-[#0D1524] p-4 space-y-3"
    >
      <p className="text-sm font-medium text-[#FFFFFF]">Edit company</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Company name *"
        required
        className={inputClass}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Domain"
          className={inputClass}
        />
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website"
          className={inputClass}
        />
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Industry"
          className={inputClass}
        />
        <input
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Size"
          className={inputClass}
        />
      </div>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address"
        className={inputClass}
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={2}
        className={inputClass}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
