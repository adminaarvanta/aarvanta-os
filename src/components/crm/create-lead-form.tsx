"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberSelect } from "@/components/shared/member-select";
import { Button } from "@/components/ui/button";
import type { MemberOption } from "@/lib/crm/members";
import type { ContactTag } from "@/types/crm";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";

export function CreateLeadForm({
  members,
  companies,
}: {
  members: MemberOption[];
  companies: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [accountId, setAccountId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [tag, setTag] = useState<ContactTag>("prospect");
  const [notes, setNotes] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          accountId: accountId || undefined,
          ownerId: ownerId || undefined,
          notes: notes.trim() || undefined,
          tags: [tag],
        }),
      });
      if (res.ok) {
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setJobTitle("");
        setAccountId("");
        setOwnerId("");
        setNotes("");
        setTag("prospect");
        setOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Add lead
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
    >
      <p className="text-sm font-medium text-foreground">New lead</p>
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
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value as ContactTag)}
          className={inputClass}
        >
          <option value="prospect">Prospect</option>
          <option value="hot_lead">Hot lead</option>
          <option value="follow_up">Follow up</option>
        </select>
        <MemberSelect
          members={members}
          value={ownerId}
          onChange={setOwnerId}
          placeholder="Owner (optional)"
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={2}
        className={inputClass}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Saving…" : "Create lead"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
