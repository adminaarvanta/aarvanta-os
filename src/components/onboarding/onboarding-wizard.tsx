"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { AuthAlert, AuthField, AuthSubmitButton } from "@/components/auth/auth-fields";
import {
  ONBOARDING_CUSTOMER_COUNTS,
  ONBOARDING_INDUSTRIES,
  ONBOARDING_TOOLS,
  ONBOARDING_USE_CASES,
} from "@/lib/onboarding/catalog";
import { cn } from "@/lib/utils";
import type {
  CustomerCountRange,
  OnboardingUseCase,
  OrganizationOnboarding,
} from "@/types/tenant";

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEP_COUNT = 5;

type LoadPayload = {
  organization: {
    id: string;
    name: string;
    onboarding: OrganizationOnboarding | null;
  };
  suggestedWebsite: string;
  firstName: string;
};

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
  const [useCase, setUseCase] = useState<OnboardingUseCase | "">("");
  const [industry, setIndustry] = useState("");
  const [industryQuery, setIndustryQuery] = useState("");
  const [customerCount, setCustomerCount] = useState<CustomerCountRange | "">(
    ""
  );
  const [tools, setTools] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tenant/onboarding");
        const data = (await res.json()) as LoadPayload & {
          error?: { message?: string };
        };
        if (!res.ok) {
          throw new Error(data.error?.message ?? "Could not load onboarding.");
        }
        if (cancelled) return;
        if (data.organization.onboarding?.status === "complete") {
          router.replace("/dashboard");
          return;
        }
        setFirstName(data.firstName || "there");
        setName(data.organization.name);
        setWebsite(
          data.organization.onboarding?.website || data.suggestedWebsite || ""
        );
        setUseCase(data.organization.onboarding?.useCase ?? "");
        setIndustry(data.organization.onboarding?.industry ?? "");
        setCustomerCount(data.organization.onboarding?.customerCountRange ?? "");
        setTools(data.organization.onboarding?.tools ?? []);
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

  const industries = useMemo(() => {
    const q = industryQuery.trim().toLowerCase();
    if (!q) return [...ONBOARDING_INDUSTRIES];
    return ONBOARDING_INDUSTRIES.filter((item) =>
      item.toLowerCase().includes(q)
    );
  }, [industryQuery]);

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
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Could not save.");
      }
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
      if (!name.trim()) {
        setError("Add your company or workspace name.");
        return;
      }
      const ok = await save({
        name: name.trim(),
        website: website.trim(),
      });
      if (ok) setStep(2);
      return;
    }
    if (step === 2) {
      if (!useCase) {
        setError("Choose how you plan to use Aarvanta.");
        return;
      }
      const ok = await save({ useCase });
      if (ok) setStep(3);
      return;
    }
    if (step === 3) {
      if (!industry) {
        setError("Choose the industry that best fits.");
        return;
      }
      const ok = await save({ industry });
      if (ok) setStep(4);
      return;
    }
    if (step === 4) {
      if (!customerCount) {
        setError("Select how many customers you serve.");
        return;
      }
      const ok = await save({ customerCountRange: customerCount });
      if (ok) setStep(5);
      return;
    }
    const ok = await save({ tools, complete: true });
    if (ok) router.replace("/dashboard");
  }

  function toggleTool(tool: string) {
    setTools((current) =>
      current.includes(tool)
        ? current.filter((item) => item !== tool)
        : [...current, tool]
    );
  }

  const titles: Record<WizardStep, { heading: string; body: string }> = {
    1: {
      heading: `Welcome, ${firstName}`,
      body: "A few details so we can set up your workspace — not another password.",
    },
    2: {
      heading: "How will you use Aarvanta?",
      body: "This shapes your Home setup list. You can change it later.",
    },
    3: {
      heading: "What industry are you in?",
      body: "Pick the closest match so we can tailor CRM and Knowledge prompts.",
    },
    4: {
      heading: "How many customers do you have?",
      body: "Helps us size pipelines and AI Team suggestions.",
    },
    5: {
      heading: "What do you use today?",
      body: "Optional. We’ll use this to suggest integrations — skip if you prefer.",
    },
  };

  const canContinue =
    (step === 1 && Boolean(name.trim())) ||
    (step === 2 && Boolean(useCase)) ||
    (step === 3 && Boolean(industry)) ||
    (step === 4 && Boolean(customerCount)) ||
    step === 5;

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
      <p className="mt-1.5 text-sm text-muted">{titles[step].body}</p>

      <div className="mt-6 space-y-4">
        {step === 1 ? (
          <>
            <AuthField
              id="company"
              label="Company / workspace"
              icon="company"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <AuthField
              id="website"
              label="Website"
              hint="Optional. We guessed from your email if it looked like a company domain."
              icon="country"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
          </>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2.5">
            {ONBOARDING_USE_CASES.map((item) => (
              <ChoiceButton
                key={item.id}
                selected={useCase === item.id}
                title={item.label}
                subtitle={item.description}
                onClick={() => setUseCase(item.id)}
              />
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
              <input
                value={industryQuery}
                onChange={(e) => setIndustryQuery(e.target.value)}
                placeholder="Search industry"
                className="h-12 w-full rounded-2xl border border-border/80 bg-surface-muted/80 pl-11 pr-3.5 text-sm outline-none focus:border-gold/70"
              />
            </label>
            <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
              {industries.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setIndustry(item)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    industry === item
                      ? "border-gold/70 bg-gold/10 text-foreground"
                      : "border-border/80 bg-surface-muted/50 text-muted hover:border-gold/40 hover:text-foreground"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {ONBOARDING_CUSTOMER_COUNTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCustomerCount(item.id)}
                className={cn(
                  "rounded-2xl border px-3 py-4 text-sm font-semibold transition-colors",
                  customerCount === item.id
                    ? "border-gold/70 bg-gold/10 text-foreground"
                    : "border-border/80 bg-surface-muted/50 text-muted hover:border-gold/40 hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ONBOARDING_TOOLS.map((tool) => {
              const selected = tools.includes(tool);
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => toggleTool(tool)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    selected
                      ? "border-accent-cyan/50 bg-accent-cyan/10 text-foreground"
                      : "border-border/80 bg-surface-muted/50 text-muted hover:border-accent-cyan/30 hover:text-foreground"
                  )}
                >
                  <span className="min-w-0 truncate">{tool}</span>
                  {selected ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-accent-cyan" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {error ? <div className="mt-4"><AuthAlert>{error}</AuthAlert></div> : null}

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
          disabled={!canContinue}
          onClick={(e) => {
            e.preventDefault();
            void goNext();
          }}
          type="button"
        >
          {step === 5 ? "Set up my workspace" : "Continue"}
        </AuthSubmitButton>
      </div>
      {step === 5 ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void save({ tools: [], complete: true }).then((ok) => ok && router.replace("/dashboard"))}
          className="mt-3 w-full text-center text-sm font-medium text-muted hover:text-foreground"
        >
          Skip tools and go to Home
        </button>
      ) : null}
    </div>
  );
}
