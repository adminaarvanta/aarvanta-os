"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberSelect } from "@/components/shared/member-select";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";

const inputClass =
  "w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF] outline-none focus:border-[#B8965D] focus:ring-1 focus:ring-[#B8965D]/30";

export function CreateCompanyForm({ members }: { members: MemberOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [ownerId, setOwnerId] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
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
          ownerId: ownerId || undefined,
          tags: ["prospect"],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { company: { id: string } };
        setName("");
        setDomain("");
        setIndustry("");
        setSize("");
        setWebsite("");
        setNotes("");
        setOwnerId("");
        setOpen(false);
        router.push(`/crm/companies/${data.company.id}`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Add company
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-[#243656] bg-[#0D1524] p-4 space-y-3"
    >
      <p className="text-sm font-medium text-[#FFFFFF]">New company</p>
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
          placeholder="Size (e.g. 50–200)"
          className={inputClass}
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className={inputClass}
      />
      <MemberSelect
        members={members}
        value={ownerId}
        onChange={setOwnerId}
        placeholder="Owner (optional)"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Saving…" : "Create company"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
