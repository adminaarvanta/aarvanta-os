"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/os/status-pill";
import type {
  SiteBuildJob,
  SiteCtaGoal,
  SiteDesignStyle,
  SiteFeatureOption,
  SitePageOption,
  SitePreferences,
  SiteTone,
  SiteType,
} from "@/types/site-builder";

const STEPS = ["Business", "Design", "Pages & features"] as const;

const TONES: SiteTone[] = ["professional", "friendly", "bold", "luxury"];
const SITE_TYPES: SiteType[] = ["landing", "business", "store", "portfolio"];
const DESIGN_STYLES: SiteDesignStyle[] = ["minimal", "modern", "bold", "classic"];
const COLOR_MOODS = ["warm", "cool", "neutral", "vibrant"] as const;
const CTA_GOALS: { value: SiteCtaGoal; label: string }[] = [
  { value: "contact", label: "Contact us" },
  { value: "book_call", label: "Book a call" },
  { value: "buy", label: "Buy now" },
  { value: "subscribe", label: "Subscribe" },
];

const PAGE_OPTIONS: { value: SitePageOption; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "services", label: "Services" },
  { value: "pricing", label: "Pricing" },
  { value: "products", label: "Products" },
  { value: "portfolio", label: "Portfolio" },
  { value: "testimonials", label: "Testimonials" },
  { value: "faq", label: "FAQ" },
  { value: "blog", label: "Blog" },
  { value: "contact", label: "Contact" },
];

const FEATURE_OPTIONS: { value: SiteFeatureOption; label: string }[] = [
  { value: "contact_form", label: "Contact form" },
  { value: "chat_widget", label: "Chat widget" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "testimonials", label: "Testimonials" },
  { value: "blog", label: "Blog" },
  { value: "newsletter", label: "Newsletter" },
];

const DEFAULT_PREFERENCES: SitePreferences = {
  businessName: "Artisan Candles Co",
  businessIdea:
    "Sell handmade soy candles online to UK customers with subscription boxes and gift sets.",
  targetAudience: "Eco-conscious home fragrance buyers aged 25–45",
  countryBase: "UK",
  tone: "friendly",
  siteType: "store",
  designStyle: "modern",
  colorMood: "warm",
  pages: ["home", "about", "products", "contact"],
  features: ["contact_form", "ecommerce", "testimonials"],
  ctaGoal: "buy",
  keyMessages: "Hand-poured, sustainable, gift-ready",
};

function inputClassName() {
  return "w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]";
}

function chipClassName(active: boolean) {
  return `rounded-full border px-2.5 py-1 text-[11px] capitalize transition-colors ${
    active
      ? "border-[#B8965D] bg-[#B8965D]/10 text-[#C9AA72]"
      : "border-[#243656] text-[#9AABC4] hover:border-[#3d5278]"
  }`;
}

export function BuildOsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobParam = searchParams.get("job");

  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<SitePreferences>(DEFAULT_PREFERENCES);
  const [job, setJob] = useState<SiteBuildJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);

  const loadJob = useCallback(async (id: string) => {
    const res = await fetch(`/api/build/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { job: SiteBuildJob };
    setJob(data.job);
    setPreferences(data.job.preferences);
    setUsedAi(data.job.usedAi ?? false);
  }, []);

  useEffect(() => {
    if (jobParam) void loadJob(jobParam);
  }, [jobParam, loadJob]);

  function updatePreferences<K extends keyof SitePreferences>(
    key: K,
    value: SitePreferences[K]
  ) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  function togglePage(page: SitePageOption) {
    setPreferences((prev) => {
      if (page === "home") return prev;
      const pages = prev.pages.includes(page)
        ? prev.pages.filter((p) => p !== page)
        : [...prev.pages, page];
      return {
        ...prev,
        pages: pages.includes("home") ? pages : ["home", ...pages],
      };
    });
  }

  function toggleFeature(feature: SiteFeatureOption) {
    setPreferences((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  }

  async function onGeneratePlan() {
    setBusy(true);
    setError(null);
    try {
      const endpoint = job ? `/api/build/${job.id}/plan` : "/api/build";
      const method = "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        setError(body.error?.message ?? "Could not generate site plan.");
        return;
      }

      const data = (await res.json()) as { job: SiteBuildJob; usedAi: boolean };
      setJob(data.job);
      setUsedAi(data.usedAi);
      router.replace(`/build?job=${data.job.id}`);
    } finally {
      setBusy(false);
    }
  }

  async function onApprovePlan() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/build/${job.id}/approve`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        setError(body.error?.message ?? "Could not approve plan.");
        return;
      }
      const data = (await res.json()) as { job: SiteBuildJob };
      setJob(data.job);
    } finally {
      setBusy(false);
    }
  }

  const canProceedStep0 =
    preferences.businessName.trim().length >= 2 &&
    preferences.businessIdea.trim().length >= 10;
  const canProceedStep2 = preferences.pages.length >= 1;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-4">
        <p className="text-sm font-medium text-[#FFFFFF]">
          Step 1 — Set your site preferences
        </p>
        <p className="mt-1 text-xs text-[#9AABC4]">
          Build OS turns your preferences into a reviewed site plan before any pages are generated.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={chipClassName(step === index)}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {step === 0 && (
            <>
              <label className="block space-y-1 text-xs text-[#9AABC4]">
                Business name
                <input
                  value={preferences.businessName}
                  onChange={(e) => updatePreferences("businessName", e.target.value)}
                  className={inputClassName()}
                />
              </label>
              <label className="block space-y-1 text-xs text-[#9AABC4]">
                What does your business do?
                <textarea
                  value={preferences.businessIdea}
                  onChange={(e) => updatePreferences("businessIdea", e.target.value)}
                  rows={3}
                  className={inputClassName()}
                />
              </label>
              <label className="block space-y-1 text-xs text-[#9AABC4]">
                Target audience (optional)
                <input
                  value={preferences.targetAudience ?? ""}
                  onChange={(e) => updatePreferences("targetAudience", e.target.value)}
                  className={inputClassName()}
                  placeholder="Who is this site for?"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-[#9AABC4]">
                  Country base
                  <input
                    value={preferences.countryBase}
                    onChange={(e) => updatePreferences("countryBase", e.target.value)}
                    className={inputClassName()}
                  />
                </label>
                <label className="space-y-1 text-xs text-[#9AABC4]">
                  Site type
                  <select
                    value={preferences.siteType}
                    onChange={(e) =>
                      updatePreferences("siteType", e.target.value as SiteType)
                    }
                    className={inputClassName()}
                  >
                    {SITE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-1 text-xs text-[#9AABC4]">
                Tone of voice
                <div className="flex flex-wrap gap-2 pt-1">
                  {TONES.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => updatePreferences("tone", tone)}
                      className={chipClassName(preferences.tone === tone)}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 text-xs text-[#9AABC4]">
                Design style
                <div className="flex flex-wrap gap-2 pt-1">
                  {DESIGN_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => updatePreferences("designStyle", style)}
                      className={chipClassName(preferences.designStyle === style)}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 text-xs text-[#9AABC4]">
                Color mood
                <div className="flex flex-wrap gap-2 pt-1">
                  {COLOR_MOODS.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => updatePreferences("colorMood", mood)}
                      className={chipClassName(preferences.colorMood === mood)}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block space-y-1 text-xs text-[#9AABC4]">
                Primary goal (CTA)
                <select
                  value={preferences.ctaGoal}
                  onChange={(e) =>
                    updatePreferences("ctaGoal", e.target.value as SiteCtaGoal)
                  }
                  className={inputClassName()}
                >
                  {CTA_GOALS.map((cta) => (
                    <option key={cta.value} value={cta.value}>
                      {cta.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-xs text-[#9AABC4]">
                Key messages (optional)
                <input
                  value={preferences.keyMessages ?? ""}
                  onChange={(e) => updatePreferences("keyMessages", e.target.value)}
                  className={inputClassName()}
                  placeholder="Taglines, differentiators, offers"
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1 text-xs text-[#9AABC4]">
                Pages to include
                <div className="flex flex-wrap gap-2 pt-1">
                  {PAGE_OPTIONS.map((page) => (
                    <button
                      key={page.value}
                      type="button"
                      onClick={() => togglePage(page.value)}
                      disabled={page.value === "home"}
                      className={chipClassName(
                        preferences.pages.includes(page.value) || page.value === "home"
                      )}
                    >
                      {page.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 text-xs text-[#9AABC4]">
                Features
                <div className="flex flex-wrap gap-2 pt-1">
                  {FEATURE_OPTIONS.map((feature) => (
                    <button
                      key={feature.value}
                      type="button"
                      onClick={() => toggleFeature(feature.value)}
                      className={chipClassName(
                        preferences.features.includes(feature.value)
                      )}
                    >
                      {feature.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block space-y-1 text-xs text-[#9AABC4]">
                Reference site URL (optional)
                <input
                  value={preferences.referenceUrl ?? ""}
                  onChange={(e) => updatePreferences("referenceUrl", e.target.value)}
                  className={inputClassName()}
                  placeholder="https://example.com"
                />
              </label>
            </>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            {step > 0 && (
              <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={(step === 0 && !canProceedStep0) || (step === 2 && !canProceedStep2)}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onGeneratePlan}
                disabled={busy || !canProceedStep0 || !canProceedStep2}
              >
                {busy ? "Planning site…" : job ? "Regenerate plan" : "Generate site plan"}
              </Button>
            )}
          </div>
        </div>
      </section>

      {job?.plan && (
        <section className="space-y-4 rounded-xl border border-[#B8965D]/30 bg-[#0D1524] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[#FFFFFF]">
              Step 2 — Review site plan
            </p>
            <StatusPill
              variant={
                job.status === "approved"
                  ? "success"
                  : job.status === "plan_ready"
                    ? "warning"
                    : job.status === "failed"
                      ? "default"
                      : "default"
              }
            >
              {job.status}
            </StatusPill>
            {usedAi && <span className="text-[10px] text-[#9AABC4]">AI-enhanced</span>}
          </div>

          <p className="text-sm text-[#9AABC4]">{job.plan.summary}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#243656] p-3">
              <p className="text-xs font-medium text-[#B8965D]">Site</p>
              <p className="mt-1 text-sm text-[#FFFFFF]">{job.plan.siteName}</p>
              <p className="mt-1 font-mono text-xs text-[#9AABC4]">
                /sites/{job.plan.slug}
              </p>
            </div>
            <div className="rounded-lg border border-[#243656] p-3">
              <p className="text-xs font-medium text-[#B8965D]">Theme</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: job.plan.theme.primaryColor }}
                />
                <span
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: job.plan.theme.accentColor }}
                />
                <span className="text-xs text-[#9AABC4]">{job.plan.theme.fontStyle}</span>
              </div>
              <p className="mt-2 text-[10px] text-[#6B7F9E]">
                {job.plan.theme.styleNotes}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[#243656] p-3">
            <p className="text-xs font-medium text-[#B8965D]">Navigation</p>
            <p className="mt-2 text-xs text-[#9AABC4]">
              {job.plan.navigation.map((n) => n.label).join(" · ")}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-[#B8965D]">Pages & sections</p>
            {job.plan.pages.map((page) => (
              <div
                key={page.slug || "home"}
                className="rounded-lg border border-[#243656] p-3"
              >
                <p className="text-sm font-medium text-[#FFFFFF]">
                  {page.title}
                  <span className="ml-2 font-mono text-[10px] text-[#6B7F9E]">
                    {page.slug ? `/${page.slug}` : "/"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-[#9AABC4]">{page.purpose}</p>
                <ul className="mt-2 space-y-1">
                  {page.sections.map((section) => (
                    <li key={section.type + section.label} className="text-xs text-[#9AABC4]">
                      <span className="font-medium text-[#FFFFFF]">{section.label}</span>
                      {" — "}
                      {section.description}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {job.status === "plan_ready" && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={onApprovePlan} disabled={busy}>
                {busy ? "Approving…" : "Approve plan & continue"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setStep(0)}>
                Edit preferences
              </Button>
            </div>
          )}

          {job.status === "approved" && (
            <div className="rounded-lg border border-[#B8965D]/40 bg-[#B8965D]/5 p-4">
              <p className="text-sm font-semibold text-[#C9AA72]">Plan approved</p>
              <p className="mt-1 text-xs text-[#9AABC4]">
                Site generation from this plan is next. For now, your approved plan is saved
                and ready for the Build OS generation pipeline.
              </p>
              <Link
                href="/launch"
                className="mt-3 inline-block text-sm font-medium text-[#B8965D] hover:underline"
              >
                Deploy full business OS via Launch OS →
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
