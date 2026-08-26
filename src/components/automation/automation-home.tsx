"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  PhoneCall,
  Target,
  PhoneMissed,
  Hourglass,
  Trophy,
  Play,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { WorkflowBuilder } from "@/components/workflow/workflow-builder";
import { WorkflowEnableToggle } from "@/components/workflow/workflow-enable-toggle";
import { WorkflowList } from "@/components/workflow/workflow-list";
import { WorkflowTemplatesGallery } from "@/components/workflow/workflow-templates-gallery";
import {
  FlowPrimaryButton,
  FlowSecondaryButton,
  flowInputClass,
} from "@/components/workflow/workflow-shell";
import { isAutomationBackground } from "@/lib/workflow/preset-kinds";
import type { Workflow } from "@/types/workflow";

type Template = Omit<
  Workflow,
  "id" | "createdAt" | "updatedAt" | "tenantId" | "workspaceId" | "companyId"
>;

const PRESET_VISUAL: Record<
  string,
  { icon: LucideIcon; soft: string; fg: string; bar: string; wash: string }
> = {
  schedule_team_call: {
    icon: Calendar,
    soft: "var(--flow-amber-soft)",
    fg: "var(--flow-amber)",
    bar: "from-amber-400 to-orange-500",
    wash: "from-amber-500/[0.08] via-surface-elevated to-surface-elevated",
  },
  ai_voice_followup: {
    icon: PhoneCall,
    soft: "var(--flow-accent-soft)",
    fg: "var(--flow-accent)",
    bar: "from-violet-500 to-indigo-500",
    wash: "from-violet-500/[0.10] via-surface-elevated to-surface-elevated",
  },
  new_lead_chase: {
    icon: Target,
    soft: "var(--flow-rose-soft)",
    fg: "var(--flow-rose)",
    bar: "from-rose-500 to-pink-500",
    wash: "from-rose-500/[0.09] via-surface-elevated to-surface-elevated",
  },
  missed_call_callback: {
    icon: PhoneMissed,
    soft: "var(--flow-cyan-soft)",
    fg: "var(--flow-cyan)",
    bar: "from-cyan-500 to-sky-500",
    wash: "from-cyan-500/[0.10] via-surface-elevated to-surface-elevated",
  },
  quiet_deal_followup: {
    icon: Hourglass,
    soft: "var(--flow-wait-soft)",
    fg: "var(--flow-wait)",
    bar: "from-orange-400 to-amber-500",
    wash: "from-orange-500/[0.09] via-surface-elevated to-surface-elevated",
  },
  deal_won_next_steps: {
    icon: Trophy,
    soft: "var(--flow-emerald-soft)",
    fg: "var(--flow-emerald)",
    bar: "from-emerald-500 to-teal-500",
    wash: "from-emerald-500/[0.10] via-surface-elevated to-surface-elevated",
  },
};

const WHEN: Record<string, string> = {
  schedule_team_call: "When you ask",
  ai_voice_followup: "When you ask",
  new_lead_chase: "When a new lead looks interested",
  missed_call_callback: "After a missed call — you can also try it now",
  quiet_deal_followup: "When a deal goes quiet",
  deal_won_next_steps: "When you win a deal",
};

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("explore-only") || lower.includes("upgrade")) {
    return "You can set this up on Free. Upgrade to run it for a real person.";
  }
  if (lower.includes("disabled") || lower.includes("turn this on")) {
    return "Switch Automatic on first, then try again.";
  }
  if (lower.includes("no phone")) {
    return "This person has no phone number. Add one in CRM, then try again.";
  }
  if (lower.includes("no email")) {
    return "This person has no email. Add one in CRM, then try again.";
  }
  if (lower.includes("1 minute")) {
    return "Pick a later time — we need at least a minute to set the call.";
  }
  return raw;
}

export function AutomationHome({
  presets,
  extras,
  legacyTemplates,
  contacts,
}: {
  presets: Workflow[];
  extras: Workflow[];
  legacyTemplates: Template[];
  contacts: Array<{ id: string; name: string; leadScore?: number }>;
}) {
  const [showLegacy, setShowLegacy] = useState(false);

  const askNow = presets.filter((w) => !isAutomationBackground(w.templateId));
  const background = presets.filter((w) => isAutomationBackground(w.templateId));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <p className="text-sm leading-relaxed text-muted">
        Ask us to do something now. Switch Automatic on only for the ones that
        should keep going without you.
      </p>

      {askNow.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            When you ask
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {askNow.map((workflow) => (
              <li key={workflow.id} className="min-h-0">
                <PresetCard workflow={workflow} contacts={contacts} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {background.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Happens by itself
            </h2>
            <p className="mt-1 text-xs text-muted">
              These start off. Nothing emails or calls on its own until you switch
              Automatic on.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {background.map((workflow) => (
              <li key={workflow.id} className="min-h-0">
                <PresetCard workflow={workflow} contacts={contacts} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <WorkflowBuilder />

      <p className="text-sm text-muted">
        Just need this once?{" "}
        <Link
          href="/automation?view=ask"
          className="font-semibold text-violet-600 hover:underline dark:text-violet-300"
        >
          Tell the AI Team
        </Link>
      </p>

      {extras.length > 0 ? (
        <div className="space-y-3">
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--flow-ink)" }}
          >
            Ones you created
          </h3>
          <WorkflowList workflows={extras} />
        </div>
      ) : null}

      <div>
        <button
          type="button"
          onClick={() => setShowLegacy((v) => !v)}
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--flow-accent)" }}
        >
          {showLegacy ? "Hide extra ideas" : "Need a different idea?"}
        </button>
        {showLegacy ? (
          <div className="mt-4">
            <WorkflowTemplatesGallery templates={legacyTemplates} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PresetCard({
  workflow,
  contacts,
}: {
  workflow: Workflow;
  contacts: Array<{ id: string; name: string; leadScore?: number }>;
}) {
  const visual =
    PRESET_VISUAL[workflow.templateId ?? ""] ?? PRESET_VISUAL.new_lead_chase!;
  const Icon = visual.icon;
  const background = isAutomationBackground(workflow.templateId);
  const canTryNow = workflow.trigger.type === "manual";
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [detailsHref, setDetailsHref] = useState<string | null>(null);

  async function run(id: string) {
    if (!id) {
      setError("Add a person in CRM first, then try again.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const contact = contacts.find((c) => c.id === id);
      const res = await fetch(`/api/workflows/${workflow.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: id,
          contactName: contact?.name,
          leadScore: contact?.leadScore,
        }),
      });
      const data = (await res.json()) as {
        run?: {
          id: string;
          status?: string;
          error?: string;
          stepLogs?: Array<{ status: string; stepLabel: string; output?: string }>;
        };
        error?: string | { message?: string; code?: string };
      };
      if (!res.ok || !data.run) {
        const raw =
          typeof data.error === "string"
            ? data.error
            : typeof data.error === "object" && data.error?.message
              ? data.error.message
              : "Couldn’t finish this. Try again.";
        setError(friendlyError(raw));
        return;
      }
      if (data.run.status === "failed") {
        setError(friendlyError(data.run.error ?? "Something went wrong."));
        return;
      }
      const doneBits = (data.run.stepLogs ?? [])
        .filter((log) => log.status === "completed")
        .map((log) => log.stepLabel);
      const who = contact?.name ?? "them";
      setDone(
        doneBits.length
          ? `Done for ${who}. ${doneBits.join(". ")}.`
          : `Done for ${who}.`
      );
      setDetailsHref(`/workflows/runs/${data.run.id}`);
      setPickerOpen(false);
    } catch {
      setError("Couldn’t reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className={`h-1.5 bg-gradient-to-r ${visual.bar}`} />
      <div className={`flex h-full flex-col bg-gradient-to-b p-5 ${visual.wash}`}>
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm"
          style={{ background: visual.soft, color: visual.fg }}
        >
          <Icon className="h-5 w-5" />
        </div>
        {background ? (
          <WorkflowEnableToggle
            workflow={workflow}
            labels={{ on: "Automatic", off: "Off" }}
          />
        ) : (
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: visual.soft, color: visual.fg }}
          >
            When you ask
          </span>
        )}
      </div>
      <p className="mt-3 text-[15px] font-semibold tracking-tight text-foreground">
        {workflow.name}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {workflow.description}
      </p>
      {background ? (
        <p
          className="mt-3 inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold leading-relaxed"
          style={{ background: visual.soft, color: visual.fg }}
        >
          {WHEN[workflow.templateId ?? ""] ?? "When the matching event happens"}
        </p>
      ) : null}
      <div className="flex-1" />
      {done ? (
        <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--flow-ok)" }}>
          {done}{" "}
          {detailsHref ? (
            <Link href={detailsHref} className="font-medium underline">
              See what happened
            </Link>
          ) : null}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs" style={{ color: "var(--flow-danger)" }}>
          {error}
        </p>
      ) : null}
      {pickerOpen && canTryNow ? (
        <div className="mt-3 space-y-2">
          {contacts.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--flow-muted)" }}>
              Add a person in{" "}
              <Link href="/crm/people" className="font-medium underline">
                CRM
              </Link>{" "}
              first.
            </p>
          ) : (
            <>
              <label
                className="block text-[11px] font-medium"
                style={{ color: "var(--flow-muted)" }}
                htmlFor={`who-${workflow.id}`}
              >
                Who should we do this for?
              </label>
              <select
                id={`who-${workflow.id}`}
                className={flowInputClass}
                style={{ borderColor: "var(--flow-line)", color: "var(--flow-ink)" }}
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className="flex gap-2">
            <FlowPrimaryButton
              type="button"
              disabled={busy || !contactId}
              className="!px-3 !py-1.5 text-xs"
              onClick={() => void run(contactId)}
            >
              {busy ? "Working…" : "Do it now"}
            </FlowPrimaryButton>
            <FlowSecondaryButton
              type="button"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => setPickerOpen(false)}
            >
              Not now
            </FlowSecondaryButton>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/workflows/${workflow.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:bg-black/[0.03]"
            style={{ borderColor: "var(--flow-line)", color: "var(--flow-ink)" }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Change
          </Link>
          {canTryNow ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(109,94,246,0.28)] transition hover:brightness-110"
              onClick={() => {
                setPickerOpen(true);
                setError(null);
              }}
            >
              <Play className="h-3.5 w-3.5" />
              Try it
            </button>
          ) : null}
        </div>
      )}
      </div>
    </div>
  );
}
