"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ContactTag } from "@/types/crm";
import {
  DEFAULT_RETRY_POLICY,
  DEFAULT_WORKING_HOURS,
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
    if (step !== 1) return;
    void (async () => {
      const res = await fetch("/api/voice/audience/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            tags,
            minLeadScore,
            industries: industries
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            requirePhone: true,
          },
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      setAudienceCount(data.count);
    })();
  }, [step, tags, minLeadScore, industries]);

  function toggleTag(tag: ContactTag) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function launch(startNow: boolean) {
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
          filters: {
            tags,
            minLeadScore,
            industries: industries
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            requirePhone: true,
          },
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
      }

      router.push(`/voice/campaigns/${campaign.id}`);
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
        <div className="space-y-3">
          <p className="text-sm text-muted">Select audience filters</p>
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
          <p className="text-sm text-foreground">
            Audience preview:{" "}
            <strong>{audienceCount ?? "…"}</strong> contacts with phone
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
        <div className="space-y-2 rounded-xl border border-border bg-surface-elevated p-4 text-sm">
          <p>
            <strong>{name || "Untitled"}</strong> — {goal}
          </p>
          <p className="text-muted">
            Audience ≈ {audienceCount ?? "?"} · Agent{" "}
            {agents.find((a) => a.id === voiceAgentId)?.name ?? "—"} ·{" "}
            {timezone} · {dailyCallLimit}/day
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
              disabled={busy || !name.trim() || !voiceAgentId}
              onClick={() => void launch(true)}
            >
              {busy ? "Launching…" : "Launch campaign"}
            </Button>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
