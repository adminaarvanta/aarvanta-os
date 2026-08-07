"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { contactDisplayName, type ContactTag, type CrmContact } from "@/types/crm";
import {
  DEFAULT_RETRY_POLICY,
  DEFAULT_WORKING_HOURS,
  type CampaignFilters,
  type RetryPolicy,
  type VoiceAgent,
} from "@/types/calling-agent";

const STEPS = [
  "Campaign",
  "Leads",
  "Voice Agent",
  "Working Hours",
  "Retry Rules",
  "Launch",
] as const;

type AudienceMode = "all" | "pick" | "filters";

const TAG_OPTIONS: ContactTag[] = [
  "prospect",
  "hot_lead",
  "follow_up",
  "vip",
  "customer",
  "partner",
];

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold";

async function ensureVoiceAgents(
  existing: VoiceAgent[]
): Promise<{ agents: VoiceAgent[]; error?: string }> {
  if (existing.length > 0) return { agents: existing };

  const listRes = await fetch("/api/voice/agents");
  if (listRes.ok) {
    const data = (await listRes.json()) as { agents: VoiceAgent[] };
    if (data.agents.length > 0) return { agents: data.agents };
  } else if (listRes.status === 401) {
    return { agents: [], error: "Sign in required to load voice agents." };
  }

  const createRes = await fetch("/api/voice/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Ava",
      language: "en-US",
      ttsProvider: "ElevenLabs",
      greetingName: "Ava",
    }),
  });
  if (!createRes.ok) {
    return {
      agents: [],
      error: "No voice agents found. Create one under Voice Agents first.",
    };
  }
  const created = (await createRes.json()) as { agent: VoiceAgent };
  return { agents: [created.agent] };
}

export function CampaignWizard({
  initialAgents = [],
}: {
  initialAgents?: VoiceAgent[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [agents, setAgents] = useState<VoiceAgent[]>(initialAgents);
  const [agentsLoading, setAgentsLoading] = useState(initialAgents.length === 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("pick");
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactQuery, setContactQuery] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("Book Meetings");
  const [targetMeetings, setTargetMeetings] = useState(20);
  const [tags, setTags] = useState<ContactTag[]>(["prospect", "hot_lead"]);
  const [minLeadScore, setMinLeadScore] = useState(50);
  const [industries, setIndustries] = useState("");
  const [voiceAgentId, setVoiceAgentId] = useState(initialAgents[0]?.id ?? "");
  const [timezone, setTimezone] = useState("America/New_York");
  const [dailyCallLimit, setDailyCallLimit] = useState(40);
  const [weekendCalling, setWeekendCalling] = useState(false);
  const [retryPolicy, setRetryPolicy] = useState<RetryPolicy>(DEFAULT_RETRY_POLICY);

  const contactsWithPhone = useMemo(
    () => contacts.filter((c) => Boolean(c.phone?.trim())),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return contactsWithPhone;
    return contactsWithPhone.filter((c) => {
      const label = contactDisplayName(c).toLowerCase();
      return (
        label.includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [contactsWithPhone, contactQuery]);

  function buildFilters(): CampaignFilters {
    if (audienceMode === "all") {
      return { requirePhone: true };
    }
    if (audienceMode === "pick") {
      return {
        requirePhone: true,
        contactIds: selectedContactIds,
      };
    }
    return {
      tags,
      minLeadScore,
      industries: industries
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      requirePhone: true,
    };
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setAgentsLoading(true);
      const result = await ensureVoiceAgents(initialAgents);
      if (cancelled) return;
      setAgents(result.agents);
      setVoiceAgentId((current) => {
        if (current && result.agents.some((a) => a.id === current)) {
          return current;
        }
        return result.agents[0]?.id ?? "";
      });
      if (result.error) setError(result.error);
      setAgentsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialAgents]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/contacts");
        if (!res.ok) return;
        const data = (await res.json()) as { contacts: CrmContact[] };
        setContacts(data.contacts ?? []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (step !== 1 && step !== 5) return;
    if (audienceMode === "pick") {
      setAudienceCount(selectedContactIds.length);
      return;
    }
    void (async () => {
      const res = await fetch("/api/voice/audience/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: buildFilters() }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      setAudienceCount(data.count);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild when audience inputs change
  }, [
    step,
    audienceMode,
    selectedContactIds,
    tags,
    minLeadScore,
    industries,
  ]);

  function toggleTag(tag: ContactTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleContact(id: string) {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function launch(startNow: boolean, dialFirst = false) {
    if (audienceMode === "pick" && selectedContactIds.length === 0) {
      setError("Select at least one CRM contact, or switch to All / Filters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const createRes = await fetch("/api/voice/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          goal,
          targetMeetings,
          voiceAgentId,
          timezone,
          dailyCallLimit,
          weekendCalling,
          retryPolicy,
          workingHours: DEFAULT_WORKING_HOURS,
          filters: buildFilters(),
          status: "draft",
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error?.message ?? "Failed to create campaign");
      }
      const { campaign } = (await createRes.json()) as {
        campaign: { id: string };
      };

      if (startNow) {
        const startRes = await fetch(
          `/api/voice/campaigns/${campaign.id}/start`,
          { method: "POST" }
        );
        if (!startRes.ok) {
          throw new Error("Campaign created but failed to start");
        }

        if (dialFirst) {
          const queueRes = await fetch(
            `/api/voice/campaigns/${campaign.id}/queue`
          );
          if (queueRes.ok) {
            const data = (await queueRes.json()) as {
              queue: { id: string; status: string }[];
            };
            const first =
              data.queue.find((q) => q.status === "pending") ?? data.queue[0];
            if (first) {
              const dialRes = await fetch("/api/voice/queue/call-now", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ queueId: first.id }),
              });
              if (!dialRes.ok) {
                throw new Error(
                  "Campaign started but first call failed — use Queue → Call now"
                );
              }
              router.push("/voice/live");
              router.refresh();
              return;
            }
          }
        }
      }

      router.push(
        dialFirst || startNow
          ? `/voice/queue`
          : `/voice/campaigns/${campaign.id}`
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <ol className="flex flex-wrap gap-2 rounded-2xl border border-border bg-surface-elevated p-3 shadow-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              i === step
                ? "bg-[var(--navy)] text-white shadow-sm dark:bg-gold dark:text-[var(--navy)]"
                : i < step
                  ? "bg-[rgba(168,137,79,0.18)] text-gold-dark dark:text-gold-bright"
                  : "bg-surface-muted text-muted"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">

      {step === 0 && (
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span>Campaign name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Healthcare Demo Campaign"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Description</span>
            <textarea
              className={inputClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Campaign goal</span>
            <input
              className={inputClass}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Target meetings</span>
            <input
              type="number"
              className={inputClass}
              value={targetMeetings}
              onChange={(e) => setTargetMeetings(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Who should this campaign call?
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["pick", "Select people"],
                ["all", "All with phone"],
                ["filters", "By filters"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAudienceMode(mode)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  audienceMode === mode
                    ? "bg-[var(--navy)] text-white dark:bg-gold dark:text-[var(--navy)]"
                    : "border border-border text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {audienceMode === "all" ? (
            <p className="rounded-xl border border-border bg-surface px-3 py-3 text-sm text-muted">
              Queue every CRM contact that has a phone number (
              <strong className="text-foreground">
                {contactsWithPhone.length}
              </strong>{" "}
              right now).
            </p>
          ) : null}

          {audienceMode === "pick" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className={`${inputClass} max-w-xs`}
                  placeholder="Search people…"
                  value={contactQuery}
                  onChange={(e) => setContactQuery(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setSelectedContactIds(contactsWithPhone.map((c) => c.id))
                  }
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedContactIds([])}
                >
                  Clear
                </Button>
              </div>
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                {filteredContacts.length === 0 ? (
                  <li className="px-2 py-6 text-center text-sm text-muted">
                    No CRM contacts with phone numbers.
                  </li>
                ) : (
                  filteredContacts.map((c) => {
                    const checked = selectedContactIds.includes(c.id);
                    return (
                      <li key={c.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleContact(c.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {contactDisplayName(c)}
                            </span>
                            <span className="block truncate text-xs text-muted">
                              {c.phone}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ) : null}

          {audienceMode === "filters" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      tags.includes(tag)
                        ? "bg-gold text-background"
                        : "border border-border text-muted"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <label className="block space-y-1 text-sm">
                <span>Min lead score</span>
                <input
                  type="number"
                  className={inputClass}
                  value={minLeadScore}
                  onChange={(e) => setMinLeadScore(Number(e.target.value))}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>Industries (comma-separated)</span>
                <input
                  className={inputClass}
                  value={industries}
                  onChange={(e) => setIndustries(e.target.value)}
                  placeholder="Healthcare, SaaS"
                />
              </label>
            </div>
          ) : null}

          <p className="text-sm text-foreground">
            Audience: <strong>{audienceCount ?? "…"}</strong> contacts
            {audienceMode === "pick" && selectedContactIds.length === 0
              ? " — select at least one for the demo"
              : ""}
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Who should place the calls? Pick a voice agent persona and script.
          </p>
          {agentsLoading ? (
            <p className="text-sm text-muted">Loading agents…</p>
          ) : agents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm">
              <p className="font-medium text-foreground">No voice agents yet</p>
              <p className="mt-1 text-muted">
                Create a default agent to continue, or add one under Voice Agents.
              </p>
              <Button
                type="button"
                className="mt-3"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    setError(null);
                    const result = await ensureVoiceAgents([]);
                    setAgents(result.agents);
                    if (result.agents[0]) setVoiceAgentId(result.agents[0].id);
                    if (result.error) setError(result.error);
                    setBusy(false);
                  })();
                }}
              >
                Create default agent (Ava)
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {agents.map((a) => {
                const selected = voiceAgentId === a.id;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setVoiceAgentId(a.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        selected
                          ? "border-[var(--navy)] bg-[var(--primary-soft)] ring-2 ring-[rgba(26,47,89,0.2)] dark:border-gold dark:ring-[rgba(168,137,79,0.3)]"
                          : "border-border bg-background hover:border-gold/50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[var(--navy)] bg-[var(--navy)] dark:border-gold dark:bg-gold"
                            : "border-border"
                        }`}
                      >
                        {selected ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-[var(--navy)]" />
                        ) : null}
                      </span>
                      <span>
                        <span className="block font-semibold text-foreground">
                          {a.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {a.language}
                          {a.ttsProvider ? ` · ${a.ttsProvider}` : ""} ·{" "}
                          {a.flowConfig.stages.length} stages
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span>Timezone</span>
            <input
              className={inputClass}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Daily call limit</span>
            <input
              type="number"
              className={inputClass}
              value={dailyCallLimit}
              onChange={(e) => setDailyCallLimit(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={weekendCalling}
              onChange={(e) => setWeekendCalling(e.target.checked)}
            />
            Allow weekend calling
          </label>
          <p className="text-xs text-muted">
            Default window: Mon–Fri 09:00–17:00 in campaign timezone.
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["maxRetries", "Max retries"],
              ["busyMinutes", "Busy retry (min)"],
              ["noAnswerHours", "No answer (hours)"],
              ["failedMinutes", "Failed retry (min)"],
              ["voicemailHours", "Voicemail (hours)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1 text-sm">
              <span>{label}</span>
              <input
                type="number"
                className={inputClass}
                value={retryPolicy[key]}
                onChange={(e) =>
                  setRetryPolicy((p) => ({
                    ...p,
                    [key]: Number(e.target.value),
                  }))
                }
              />
            </label>
          ))}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
          <p>
            <strong>{name || "Untitled"}</strong> — {goal}
          </p>
          <p className="text-muted">
            Audience ≈ {audienceCount ?? "?"} (
            {audienceMode === "all"
              ? "all with phone"
              : audienceMode === "pick"
                ? "selected people"
                : "filters"}
            ) · Agent{" "}
            {agents.find((a) => a.id === voiceAgentId)?.name ?? "—"} ·{" "}
            {timezone} · {dailyCallLimit}/day
          </p>
          <p className="text-xs text-muted">
            Tip for a live demo: use{" "}
            <strong className="text-foreground">Launch & call first now</strong>{" "}
            — the queue fills immediately and the first lead starts dialing in
            seconds. Auto-dial cron alone is not second-by-second.
          </p>
        </div>
      )}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="secondary"
          disabled={step === 0 || busy}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={
              busy ||
              (step === 0 && !name.trim()) ||
              (step === 1 &&
                audienceMode === "pick" &&
                selectedContactIds.length === 0) ||
              (step === 2 && !voiceAgentId)
            }
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !name.trim() || !voiceAgentId}
              onClick={() => void launch(false)}
            >
              Save draft
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !name.trim() || !voiceAgentId}
              onClick={() => void launch(true, false)}
            >
              Launch campaign
            </Button>
            <Button
              type="button"
              disabled={busy || !name.trim() || !voiceAgentId}
              onClick={() => void launch(true, true)}
            >
              {busy ? "Starting…" : "Launch & call first now"}
            </Button>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
