"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { contactDisplayName, type ContactTag, type CrmContact } from "@/types/crm";
import { EMAIL_MERGE_FIELDS, type EmailCampaignFilters } from "@/types/email-outreach";

const TAG_OPTIONS: ContactTag[] = [
  "prospect",
  "hot_lead",
  "follow_up",
  "vip",
  "customer",
  "partner",
];

type AudienceMode = "all" | "pick" | "filters";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold";

export function EmailCampaignComposer({
  contacts,
}: {
  contacts: CrmContact[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("filters");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactQuery, setContactQuery] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("{{firstName}}, quick note from Aarvanta");
  const [previewText, setPreviewText] = useState("");
  const [textBody, setTextBody] = useState(
    "Hi {{firstName}},\n\nI wanted to share how {{company}} could use Aarvanta OS to keep outreach and follow-up moving without extra headcount.\n\nHappy to send a short walkthrough if useful.\n\nBest,\nPavan"
  );
  const [fromName, setFromName] = useState("Pavan at Aarvanta");
  const [tags, setTags] = useState<ContactTag[]>(["prospect", "hot_lead"]);
  const [minLeadScore, setMinLeadScore] = useState(0);
  const [dailySendLimit, setDailySendLimit] = useState(50);

  const contactsWithEmail = useMemo(
    () => contacts.filter((c) => Boolean(c.email?.trim())),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return contactsWithEmail;
    return contactsWithEmail.filter((c) => {
      const hay = `${contactDisplayName(c)} ${c.email ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [contactQuery, contactsWithEmail]);

  function filters(): EmailCampaignFilters {
    if (audienceMode === "pick") {
      return { contactIds: selectedContactIds };
    }
    if (audienceMode === "all") return {};
    return {
      tags: tags.length ? tags : undefined,
      minLeadScore: minLeadScore > 0 ? minLeadScore : undefined,
    };
  }

  async function previewAudience() {
    setError(null);
    try {
      const res = await fetch("/api/outreach/audience/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters()),
      });
      if (!res.ok) {
        setError("Could not preview audience.");
        return;
      }
      const data = (await res.json()) as { count: number };
      setAudienceCount(data.count);
    } catch {
      setError("Could not preview audience.");
    }
  }

  function insertMerge(field: string) {
    setTextBody((prev) => `${prev}{{${field}}}`);
  }

  async function submit(startAfterCreate: boolean) {
    if (!name.trim() || !subject.trim() || !textBody.trim()) {
      setError("Name, subject, and body are required.");
      return;
    }
    if (audienceMode === "pick" && selectedContactIds.length === 0) {
      setError("Pick at least one contact with an email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          subject: subject.trim(),
          previewText: previewText.trim() || undefined,
          textBody: textBody.trim(),
          htmlBody: textBody.trim(),
          fromName: fromName.trim() || undefined,
          filters: filters(),
          dailySendLimit,
        }),
      });
      if (!res.ok) {
        setError("Could not create campaign.");
        return;
      }
      const data = (await res.json()) as { campaign: { id: string } };
      if (startAfterCreate) {
        await fetch(`/api/outreach/campaigns/${data.campaign.id}/start`, {
          method: "POST",
        });
      }
      router.push(`/outreach/campaigns/${data.campaign.id}`);
      router.refresh();
    } catch {
      setError("Could not create campaign.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <section className="space-y-3 rounded-2xl border border-border bg-surface-elevated p-4">
        <h3 className="text-sm font-semibold text-foreground">Campaign</h3>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Name</span>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Q3 intro — consulting leads"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Internal note</span>
          <input
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">From name</span>
          <input
            className={inputClass}
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Daily send limit</span>
          <input
            type="number"
            min={1}
            max={2000}
            className={inputClass}
            value={dailySendLimit}
            onChange={(e) => setDailySendLimit(Number(e.target.value) || 50)}
          />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface-elevated p-4">
        <h3 className="text-sm font-semibold text-foreground">Email</h3>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Subject</span>
          <input
            className={inputClass}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Preview text</span>
          <input
            className={inputClass}
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Shown in some inboxes next to the subject"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EMAIL_MERGE_FIELDS.map((field) => (
            <button
              key={field}
              type="button"
              className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-muted hover:border-gold/40 hover:text-foreground"
              onClick={() => insertMerge(field)}
            >
              {`{{${field}}}`}
            </button>
          ))}
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Body</span>
          <textarea
            className={`${inputClass} min-h-[220px] font-mono text-[13px]`}
            value={textBody}
            onChange={(e) => setTextBody(e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface-elevated p-4">
        <h3 className="text-sm font-semibold text-foreground">Audience</h3>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["filters", "CRM filters"],
              ["pick", "Pick contacts"],
              ["all", "Everyone with email"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setAudienceMode(mode)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                audienceMode === mode
                  ? "bg-[var(--navy)] text-white dark:bg-gold dark:text-[var(--navy)]"
                  : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {audienceMode === "filters" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((tag) => {
                const on = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setTags((prev) =>
                        on ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                    className={`rounded-full px-2.5 py-1 text-[11px] capitalize ${
                      on
                        ? "bg-gold/15 text-gold-dark dark:text-gold-bright"
                        : "border border-border text-muted"
                    }`}
                  >
                    {tag.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Minimum lead score</span>
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass}
                value={minLeadScore}
                onChange={(e) => setMinLeadScore(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        ) : null}

        {audienceMode === "pick" ? (
          <div className="space-y-2">
            <input
              className={inputClass}
              placeholder="Search contacts"
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
            />
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {filteredContacts.map((contact) => {
                const checked = selectedContactIds.includes(contact.id);
                return (
                  <label
                    key={contact.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedContactIds((prev) =>
                          checked
                            ? prev.filter((id) => id !== contact.id)
                            : [...prev, contact.id]
                        )
                      }
                    />
                    <span className="font-medium">{contactDisplayName(contact)}</span>
                    <span className="text-xs text-muted">{contact.email}</span>
                  </label>
                );
              })}
              {filteredContacts.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted">
                  No CRM contacts with an email address.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => void previewAudience()}>
            Preview audience
          </Button>
          {audienceCount != null ? (
            <p className="text-sm text-muted">
              {audienceCount} contact{audienceCount === 1 ? "" : "s"} will receive this.
            </p>
          ) : null}
        </div>
      </section>

      {error ? <p className="text-sm text-[var(--chart-lost)]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void submit(false)}>
          Save draft
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => void submit(true)}
        >
          Save and start
        </Button>
      </div>
    </div>
  );
}
