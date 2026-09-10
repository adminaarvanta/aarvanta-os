"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/logo";
import { AuthAlert, AuthField, AuthSelect, AuthSubmitButton } from "@/components/auth/auth-fields";
import { HelpTip } from "@/components/ui/help-tip";
import { Button } from "@/components/ui/button";
import {
  ONBOARDING_CURRENCIES,
  ONBOARDING_CUSTOMER_COUNTS,
  ONBOARDING_INDUSTRIES,
  ONBOARDING_STARTING_WORKFLOWS,
  ONBOARDING_TIMEZONES,
} from "@/lib/onboarding/catalog";
import { cn } from "@/lib/utils";
import type {
  CustomerCountRange,
  OrganizationOnboarding,
  StartingWorkflow,
} from "@/types/tenant";

type WizardStep = 1 | 2 | 3 | 4;
const STEP_COUNT = 4;

function ChoiceButton({
  selected,
  title,
  subtitle,
  onClick,
}: {
  selected: boolean;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-gold/70 bg-gold/10 shadow-[0_0_0_4px_rgba(168,137,79,0.12)]"
          : "border-border/80 bg-surface-muted/60 hover:border-gold/40 hover:bg-surface"
      )}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
    </button>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<WizardStep>(1);
  const [firstName, setFirstName] = useState("there");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [customerCount, setCustomerCount] = useState<CustomerCountRange | "">("");
  const [timezone, setTimezone] = useState("Europe/London");
  const [currency, setCurrency] = useState("GBP");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [workflow, setWorkflow] = useState<StartingWorkflow | "">("");
  const [imported, setImported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tenant/onboarding");
        const data = (await res.json()) as {
          firstName?: string;
          suggestedWebsite?: string;
          organization: { name: string; onboarding: OrganizationOnboarding | null };
          error?: { message?: string };
        };
        if (!res.ok) throw new Error(data.error?.message ?? "Could not load onboarding.");
        if (cancelled) return;
        if (data.organization.onboarding?.status === "complete") {
          router.replace("/dashboard");
          return;
        }
        const ob = data.organization.onboarding;
        setFirstName(data.firstName || "there");
        setName(data.organization.name);
        setWebsite(ob?.website || data.suggestedWebsite || "");
        setIndustry(ob?.industry ?? "");
        setCustomerCount(ob?.customerCountRange ?? "");
        setPrimaryGoal(ob?.primaryGoal ?? "");
        setWorkflow(ob?.startingWorkflow ?? "");
        if (ob?.startingWorkflow) setStep(ob.connectSkipped ? 4 : 3);
        else if (ob?.industry) setStep(2);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load onboarding.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const industries = useMemo(() => [...ONBOARDING_INDUSTRIES], []);

  async function save(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tenant/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!res.ok) throw new Error(data?.error?.message ?? "Could not save.");
      void fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.complete ? "first_useful_action" : "onboarding_step",
          step: String(step),
          module: "onboarding",
          outcome: payload.complete ? "workspace_ready" : undefined,
        }),
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function goNext() {
    if (step === 1) {
      if (!name.trim() || !industry || !customerCount) {
        setError("Company name, industry, and size are required.");
        return;
      }
      const ok = await save({
        name: name.trim(),
        website: website.trim(),
        industry,
        customerCountRange: customerCount,
        primaryGoal: primaryGoal.trim(),
        timezone,
        currency,
      });
      if (ok) setStep(2);
      return;
    }
    if (step === 2) {
      if (!workflow) {
        setError("Choose a starting workflow. Marketing is not an option.");
        return;
      }
      const ok = await save({ startingWorkflow: workflow });
      if (ok) setStep(3);
      return;
    }
    if (step === 3) {
      const ok = await save({ connectSkipped: true });
      if (ok) setStep(4);
      return;
    }
    const ok = await save({ complete: true });
    if (ok) router.replace("/dashboard");
  }

  async function onCsv(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("entity", "contacts");
      const res = await fetch("/api/crm/import", { method: "POST", body });
      if (!res.ok) {
        throw new Error("Import failed. Check the CSV template and try again.");
      }
      setImported(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<WizardStep, { heading: string; body: string }> = {
    1: {
      heading: `Welcome, ${firstName}`,
      body: "Tell us about the business so the workspace uses the right currency, timezone, and language.",
    },
    2: {
      heading: "Choose a starting workflow",
      body: "Begin with one useful path. You can open every live module afterwards.",
    },
    3: {
      heading: "Connect or import",
      body: "CSV import is available now. Other connectors can be skipped safely.",
    },
    4: {
      heading: "Your workspace is ready",
      body: "Home opens with a five-item checklist for your first useful outcome. High-impact AI stays on approval.",
    },
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-surface p-8">
        <div className="h-40 animate-pulse rounded-2xl bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <BrandLogo size="sm" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {step} / {STEP_COUNT}
        </p>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-gold transition-[width]"
          style={{ width: `${(step / STEP_COUNT) * 100}%` }}
        />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {titles[step].heading}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {titles[step].body}{" "}
        <HelpTip label="What happens next">
          Progress is saved after each step. You can skip optional integrations
          and resume later.
        </HelpTip>
      </p>

      <div className="mt-6 space-y-4">
        {step === 1 ? (
          <>
            <AuthField
              id="company"
              label="Business name"
              icon="company"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <AuthField
              id="website"
              label="Website"
              hint="Optional."
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
            <AuthSelect
              id="industry"
              label="Industry"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              options={["", ...industries]}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <AuthSelect
                id="size"
                label="Business size"
                required
                value={customerCount}
                onChange={(e) =>
                  setCustomerCount(e.target.value as CustomerCountRange | "")
                }
                options={["", ...ONBOARDING_CUSTOMER_COUNTS.map((item) => item.id)]}
              />
              <AuthSelect
                id="currency"
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={[...ONBOARDING_CURRENCIES]}
              />
            </div>
            <AuthSelect
              id="timezone"
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={[...ONBOARDING_TIMEZONES]}
            />
            <AuthField
              id="goal"
              label="Primary goal"
              hint="Optional. Example: close more leads this month."
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
            />
          </>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2.5">
            {ONBOARDING_STARTING_WORKFLOWS.map((item) => (
              <ChoiceButton
                key={item.id}
                selected={workflow === item.id}
                title={item.label}
                subtitle={item.description}
                onClick={() => setWorkflow(item.id)}
              />
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Import contacts from CSV, or skip and add the first customer from
              Home. Gmail, Outlook, and WhatsApp OAuth are not invented here —
              connect them later from Integrations if they are live.
            </p>
            <a
              href="/api/crm/import/template"
              className="inline-flex text-sm font-medium text-gold hover:underline"
            >
              Download CSV template
            </a>
            <input
              type="file"
              accept=".csv,.xlsx"
              aria-label="Import contacts CSV"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onCsv(file);
              }}
            />
            {imported ? (
              <p className="text-sm text-success">Contacts imported. Continue when ready.</p>
            ) : null}
            <Button href="/integrations" variant="secondary" size="sm">
              Open integrations
            </Button>
          </div>
        ) : null}

        {step === 4 ? (
          <ul className="space-y-2 text-sm text-muted">
            <li>Starter checklist on Home until the first useful outcome.</li>
            <li>AI permissions default to Approval required for high-impact actions.</li>
            <li>No sample data was created unless you already used the demo workspace.</li>
          </ul>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4">
          <AuthAlert>{error}</AuthAlert>
        </div>
      ) : null}

      <div className="mt-6 flex items-center gap-3">
        {step > 1 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setError(null);
              setStep((current) => (current - 1) as WizardStep);
            }}
            className="h-12 rounded-2xl border border-border px-4 text-sm font-semibold text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-60"
          >
            Back
          </button>
        ) : null}
        <AuthSubmitButton
          busy={busy}
          onClick={(e) => {
            e.preventDefault();
            void goNext();
          }}
          type="button"
        >
          {step === 3 ? "Skip and continue" : step === 4 ? "Open Home" : "Continue"}
        </AuthSubmitButton>
      </div>
    </div>
  );
}
