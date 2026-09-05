"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmailSection } from "@/components/outreach/email-os-ui";
import {
  buildEmailPreviewHtml,
  htmlToPlainText,
} from "@/lib/email-outreach/html-utils";
import {
  getEmailStarterTemplate,
  listEmailStarterTemplates,
} from "@/lib/email-outreach/starter-templates";
import { contactDisplayName, type ContactTag, type CrmContact } from "@/types/crm";
import {
  EMAIL_MERGE_FIELDS,
  type EmailCampaign,
  type EmailCampaignFilters,
} from "@/types/email-outreach";

const TAG_OPTIONS: ContactTag[] = [
  "prospect",
  "hot_lead",
  "follow_up",
  "vip",
  "customer",
  "partner",
];

const HTML_MAX = 100_000;

type AudienceMode = "all" | "pick" | "filters";
type BodyTab = "write" | "html" | "preview";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20";

const pillActive =
  "bg-gradient-to-r from-[#2f7f92] to-[#1a2f59] text-white shadow-[0_4px_12px_rgba(47,127,146,0.24)]";
const pillIdle =
  "border border-border/80 bg-background text-muted hover:border-cyan-400/40 hover:text-foreground";

function initialAudienceMode(campaign?: EmailCampaign): AudienceMode {
  if (!campaign) return "filters";
  if (campaign.filters.contactIds?.length) return "pick";
  if (
    !campaign.filters.tags?.length &&
    campaign.filters.minLeadScore == null &&
    !campaign.filters.industries?.length &&
    !campaign.filters.accountIds?.length
  ) {
    return "all";
  }
  return "filters";
}

export function EmailCampaignComposer({
  contacts,
  campaign,
  initialTemplateId,
}: {
  contacts: CrmContact[];
  campaign?: EmailCampaign;
  initialTemplateId?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(campaign);
  const isDraft = !campaign || campaign.status === "draft";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(() =>
    initialAudienceMode(campaign)
  );
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(
    () => campaign?.filters.contactIds ?? []
  );
  const [contactQuery, setContactQuery] = useState("");
  const [bodyTab, setBodyTab] = useState<BodyTab>("write");

  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [subject, setSubject] = useState(
    campaign?.subject ?? "{{firstName}}, quick note from Aarvanta"
  );
  const [previewText, setPreviewText] = useState(campaign?.previewText ?? "");
  const [textBody, setTextBody] = useState(
    campaign?.textBody ??
      "Hi {{firstName}},\n\nI wanted to share how {{company}} could use Aarvanta OS to keep outreach and follow-up moving without extra headcount.\n\nHappy to send a short walkthrough if useful.\n\nBest,\nPavan"
  );
  const [htmlBody, setHtmlBody] = useState(campaign?.htmlBody ?? "");
  const [fromName, setFromName] = useState(
    campaign?.fromName ?? "Pavan at Aarvanta"
  );
  const [tags, setTags] = useState<ContactTag[]>(
    () => campaign?.filters.tags ?? ["prospect", "hot_lead"]
  );
  const [minLeadScore, setMinLeadScore] = useState(
    () => campaign?.filters.minLeadScore ?? 0
  );
  const [dailySendLimit, setDailySendLimit] = useState(
    campaign?.dailySendLimit ?? 50
  );

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiBrandName, setAiBrandName] = useState("Aarvanta");
  const [aiCtaUrl, setAiCtaUrl] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const [templateBusy, setTemplateBusy] = useState(false);

  const textRef = useRef<HTMLTextAreaElement>(null);
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const templateAppliedRef = useRef(false);

  const starters = useMemo(() => listEmailStarterTemplates(), []);

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

  useEffect(() => {
    if (!initialTemplateId || templateAppliedRef.current) return;
    templateAppliedRef.current = true;

    if (initialTemplateId.startsWith("starter-")) {
      const starter = getEmailStarterTemplate(initialTemplateId);
      if (starter) {
        setSubject(starter.subject);
        setPreviewText(starter.previewText ?? "");
        setHtmlBody(starter.htmlBody);
        setTextBody(starter.textBody);
        setBodyTab(starter.htmlBody.trim() ? "html" : "write");
      }
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/outreach/templates");
        if (!res.ok) return;
        const data = (await res.json()) as {
          templates?: Array<{
            id: string;
            subject: string;
            previewText?: string;
            htmlBody: string;
            textBody: string;
          }>;
        };
        const match = data.templates?.find((t) => t.id === initialTemplateId);
        if (!match) return;
        setSubject(match.subject);
        setPreviewText(match.previewText ?? "");
        setHtmlBody(match.htmlBody);
        setTextBody(match.textBody);
        setBodyTab(match.htmlBody.trim() ? "html" : "write");
      } catch {
        // Leave composer defaults if template load fails.
      }
    })();
  }, [initialTemplateId]);

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

  function applyTemplateContent(content: {
    subject: string;
    previewText?: string;
    htmlBody: string;
    textBody: string;
  }) {
    setSubject(content.subject);
    setPreviewText(content.previewText ?? "");
    setHtmlBody(content.htmlBody);
    setTextBody(content.textBody);
    setBodyTab(content.htmlBody.trim() ? "html" : "write");
    setError(null);
  }

  function onStarterSelect(id: string) {
    if (!id) return;
    const starter = getEmailStarterTemplate(id);
    if (starter) applyTemplateContent(starter);
  }

  function insertMerge(field: string) {
    const token = `{{${field}}}`;
    const targetTab: BodyTab =
      bodyTab === "html" ? "html" : bodyTab === "write" ? "write" : "write";
    if (bodyTab === "preview") setBodyTab("write");

    const el = targetTab === "html" ? htmlRef.current : textRef.current;
    const value = targetTab === "html" ? htmlBody : textBody;
    const setValue = targetTab === "html" ? setHtmlBody : setTextBody;

    if (el && typeof el.selectionStart === "number") {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = value.slice(0, start) + token + value.slice(end);
      setValue(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + token.length;
        el.setSelectionRange(pos, pos);
      });
      return;
    }
    setValue(`${value}${token}`);
  }

  function resolveBodies(): { htmlBody: string; textBody: string } | null {
    const html = htmlBody.trim();
    const text = textBody.trim();
    if (!html && !text) return null;
    if (html && text) return { htmlBody: html, textBody: text };
    if (html) return { htmlBody: html, textBody: htmlToPlainText(html) };
    return { htmlBody: text, textBody: text };
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

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(htmlBody);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("failed");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  }

  async function saveAsTemplate() {
    const templateName = window.prompt("Template name");
    if (!templateName?.trim()) return;

    const bodies = resolveBodies();
    if (!bodies) {
      setError("Add HTML or plain-text body before saving a template.");
      return;
    }
    if (bodies.htmlBody.length > HTML_MAX) {
      setError(`HTML body must be ${HTML_MAX.toLocaleString()} characters or fewer.`);
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required to save a template.");
      return;
    }

    setTemplateBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/outreach/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          subject: subject.trim(),
          previewText: previewText.trim() || undefined,
          htmlBody: bodies.htmlBody,
          textBody: bodies.textBody,
          source: "user",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setError(data?.error?.message ?? "Could not save template.");
        return;
      }
    } catch {
      setError("Could not save template.");
    } finally {
      setTemplateBusy(false);
    }
  }

  async function generateWithAi() {
    if (!aiPrompt.trim()) {
      setAiError("Describe the email you want to generate.");
      return;
    }
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await fetch("/api/outreach/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          tone: aiTone.trim() || undefined,
          brandName: aiBrandName.trim() || undefined,
          ctaUrl: aiCtaUrl.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        subject?: string;
        previewText?: string;
        htmlBody?: string;
        textBody?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        setAiError(
          data.error?.message ??
            (res.status === 503
              ? "AI is not configured. Set OPENAI_API_KEY, or use a starter / paste HTML."
              : "Could not generate template.")
        );
        return;
      }
      applyTemplateContent({
        subject: data.subject ?? subject,
        previewText: data.previewText,
        htmlBody: data.htmlBody ?? "",
        textBody: data.textBody ?? "",
      });
    } catch {
      setAiError("Could not generate template.");
    } finally {
      setAiBusy(false);
    }
  }

  async function submit(startAfterSave: boolean) {
    if (!name.trim() || !subject.trim()) {
      setError("Name and subject are required.");
      return;
    }
    const bodies = resolveBodies();
    if (!bodies) {
      setError("Add an HTML or plain-text body.");
      return;
    }
    if (bodies.htmlBody.length > HTML_MAX) {
      setError(`HTML body must be ${HTML_MAX.toLocaleString()} characters or fewer.`);
      return;
    }
    if (isDraft && audienceMode === "pick" && selectedContactIds.length === 0) {
      setError("Pick at least one contact with an email.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        subject: subject.trim(),
        previewText: previewText.trim() || undefined,
        htmlBody: bodies.htmlBody,
        textBody: bodies.textBody,
        fromName: fromName.trim() || undefined,
        filters: isDraft ? filters() : undefined,
        dailySendLimit,
      };

      let campaignId = campaign?.id;

      if (isEdit && campaign) {
        const res = await fetch(`/api/outreach/campaigns/${campaign.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          setError("Could not save campaign.");
          return;
        }
      } else {
        const res = await fetch("/api/outreach/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          setError("Could not create campaign.");
          return;
        }
        const data = (await res.json()) as { campaign: { id: string } };
        campaignId = data.campaign.id;
      }

      if (startAfterSave && campaignId) {
        await fetch(`/api/outreach/campaigns/${campaignId}/start`, {
          method: "POST",
        });
      }

      if (campaignId) {
        router.push(`/outreach/campaigns/${campaignId}`);
        router.refresh();
      }
    } catch {
      setError(isEdit ? "Could not save campaign." : "Could not create campaign.");
    } finally {
      setBusy(false);
    }
  }

  const showAudience = !campaign || campaign.status === "draft";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <EmailSection title="Campaign" accent="navy">
        <div className="space-y-3">
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
        </div>
      </EmailSection>

      <EmailSection
        title="Email"
        accent="cyan"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={templateBusy || (!htmlBody.trim() && !textBody.trim())}
              onClick={() => void saveAsTemplate()}
            >
              Save as template
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!htmlBody.trim()}
              onClick={() => void copyHtml()}
            >
              {copyStatus === "copied"
                ? "Copied"
                : copyStatus === "failed"
                  ? "Copy failed"
                  : "Copy HTML"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Starter template</span>
            <select
              className={inputClass}
              defaultValue=""
              onChange={(e) => {
                onStarterSelect(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Choose a starter…
              </option>
              {starters.map((starter) => (
                <option key={starter.id} value={starter.id}>
                  {starter.name}
                </option>
              ))}
            </select>
          </label>

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
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted transition hover:border-cyan-400/40 hover:text-foreground"
                onClick={() => insertMerge(field)}
              >
                {`{{${field}}}`}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["write", "Write"],
                ["html", "HTML"],
                ["preview", "Preview"],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setBodyTab(tab)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  bodyTab === tab ? pillActive : pillIdle
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {bodyTab === "write" ? (
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Plain text body</span>
              <textarea
                ref={textRef}
                className={`${inputClass} min-h-[220px] font-mono text-[13px]`}
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
              />
            </label>
          ) : null}

          {bodyTab === "html" ? (
            <div className="space-y-2">
              <label className="block text-sm">
                <span className="mb-1 block text-muted">HTML body</span>
                <textarea
                  ref={htmlRef}
                  className={`${inputClass} min-h-[280px] font-mono text-[12px] leading-relaxed`}
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  spellCheck={false}
                />
              </label>
              <p className="text-xs text-muted">
                Tip: use table layout and inline CSS for deliverability. Avoid
                base64 logos — link hosted images instead.
              </p>
              {htmlBody.length > HTML_MAX ? (
                <p className="text-xs text-[var(--chart-lost)]">
                  HTML is {htmlBody.length.toLocaleString()} characters (max{" "}
                  {HTML_MAX.toLocaleString()}).
                </p>
              ) : null}
            </div>
          ) : null}

          {bodyTab === "preview" ? (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-background">
              <iframe
                title="Email preview"
                sandbox=""
                className="h-[420px] w-full bg-white"
                srcDoc={buildEmailPreviewHtml(htmlBody, textBody)}
              />
            </div>
          ) : null}
        </div>
      </EmailSection>

      <EmailSection title="AI generate" accent="emerald">
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Prompt</span>
            <textarea
              className={`${inputClass} min-h-[96px]`}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Trade partnership intro for clothing wholesalers, short CTA to book a call"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Tone</span>
              <input
                className={inputClass}
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                placeholder="professional"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Brand name</span>
              <input
                className={inputClass}
                value={aiBrandName}
                onChange={(e) => setAiBrandName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">CTA URL</span>
              <input
                className={inputClass}
                value={aiCtaUrl}
                onChange={(e) => setAiCtaUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>
          </div>
          {aiError ? (
            <p className="text-sm text-[var(--chart-lost)]">{aiError}</p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            disabled={aiBusy}
            onClick={() => void generateWithAi()}
          >
            {aiBusy ? "Generating…" : "Generate"}
          </Button>
        </div>
      </EmailSection>

      {showAudience ? (
        <EmailSection title="Audience" accent="gold">
          <div className="space-y-3">
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
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    audienceMode === mode ? pillActive : pillIdle
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
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                          on
                            ? "bg-gold text-black shadow-sm"
                            : "border border-border bg-background text-muted hover:border-gold/40 hover:text-foreground"
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
                    onChange={(e) =>
                      setMinLeadScore(Number(e.target.value) || 0)
                    }
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
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border/80 bg-background/70 p-2">
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
                        <span className="font-medium">
                          {contactDisplayName(contact)}
                        </span>
                        <span className="text-xs text-muted">
                          {contact.email}
                        </span>
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
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void previewAudience()}
              >
                Preview audience
              </Button>
              {audienceCount != null ? (
                <p className="text-sm text-muted">
                  {audienceCount} contact{audienceCount === 1 ? "" : "s"} will
                  receive this.
                </p>
              ) : null}
            </div>
          </div>
        </EmailSection>
      ) : null}

      {error ? <p className="text-sm text-[var(--chart-lost)]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void submit(false)}>
          {isEdit ? "Save changes" : "Save draft"}
        </Button>
        {isDraft ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void submit(true)}
          >
            Save and start
          </Button>
        ) : null}
      </div>
    </div>
  );
}
