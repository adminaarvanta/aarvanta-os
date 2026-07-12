"use client";

import Link from "next/link";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { VercelDeployNotesPanel } from "@/components/build/vercel-deploy-notes-panel";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/os/status-pill";
import { SITE_THEME_PRESETS } from "@/lib/site-builder/theme-presets";
import type {
  SiteBuildJob,
  SiteCtaGoal,
  SiteDesignStyle,
  SiteFeatureOption,
  SiteHostingProvider,
  SitePageOption,
  SitePreferences,
  SiteReferenceScreenshot,
  SiteThemePreset,
  SiteTone,
  SiteType,
} from "@/types/site-builder";

const STEPS = ["Business", "Design & theme", "Content & features", "Deploy"] as const;

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

const FEATURE_OPTIONS: { value: SiteFeatureOption; label: string; group: string }[] = [
  { value: "contact_form", label: "Contact form", group: "Lead capture" },
  { value: "chat_widget", label: "Chat widget", group: "Lead capture" },
  { value: "live_chat", label: "Live chat", group: "Lead capture" },
  { value: "booking", label: "Booking", group: "Lead capture" },
  { value: "ecommerce", label: "E-commerce", group: "Commerce" },
  { value: "newsletter", label: "Newsletter", group: "Growth" },
  { value: "blog", label: "Blog", group: "Growth" },
  { value: "testimonials", label: "Testimonials", group: "Social proof" },
  { value: "analytics", label: "Analytics", group: "Insights" },
  { value: "seo_pack", label: "SEO pack", group: "Insights" },
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
  themePreset: "gold_navy",
  pages: ["home", "about", "products", "contact"],
  features: ["contact_form", "ecommerce", "testimonials", "seo_pack"],
  ctaGoal: "buy",
  keyMessages: "Hand-poured, sustainable, gift-ready",
  customPrompt:
    "Emphasize gift-ready packaging and UK fast delivery. Hero should feel warm and cozy.",
  referenceScreenshots: [],
  deployment: {
    hostingProvider: "vercel",
    projectName: "artisan-candles-co",
    customDomain: "",
    autoDeployOnApprove: false,
  },
};

const MAX_SCREENSHOTS = 3;
const MAX_SCREENSHOT_BYTES = 1_500_000;

function inputClassName() {
  return "w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground";
}

function chipClassName(active: boolean) {
  return `rounded-full border px-2.5 py-1 text-[11px] capitalize transition-colors ${
    active
      ? "border-gold bg-primary-soft text-gold-bright"
      : "border-border text-muted hover:border-gold/40"
  }`;
}

function sectionClassName() {
  return "rounded-xl border border-border bg-surface-elevated p-4";
}

export function BuildOsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobParam = searchParams.get("job");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setPreferences({
      ...DEFAULT_PREFERENCES,
      ...data.job.preferences,
      deployment: {
        ...DEFAULT_PREFERENCES.deployment,
        ...data.job.preferences.deployment,
      },
      referenceScreenshots: data.job.preferences.referenceScreenshots ?? [],
    });
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

  function updateDeployment<K extends keyof SitePreferences["deployment"]>(
    key: K,
    value: SitePreferences["deployment"][K]
  ) {
    setPreferences((prev) => ({
      ...prev,
      deployment: { ...prev.deployment, [key]: value },
    }));
  }

  function selectThemePreset(presetId: SiteThemePreset) {
    const preset = SITE_THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setPreferences((prev) => ({
      ...prev,
      themePreset: presetId,
      designStyle: preset.designStyle,
      colorMood: preset.colorMood,
    }));
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

  async function onScreenshotFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    const existing = preferences.referenceScreenshots ?? [];
    const remaining = MAX_SCREENSHOTS - existing.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_SCREENSHOTS} reference screenshots allowed.`);
      return;
    }

    const toAdd: SiteReferenceScreenshot[] = [];

    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files (PNG, JPG, WebP) are supported.");
        continue;
      }
      if (file.size > MAX_SCREENSHOT_BYTES) {
        setError("Each screenshot must be under 1.5 MB.");
        continue;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      toAdd.push({
        id: `ref_${Date.now()}_${file.name}`,
        name: file.name,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }

    if (toAdd.length) {
      updatePreferences("referenceScreenshots", [...existing, ...toAdd]);
    }
  }

  function removeScreenshot(id: string) {
    updatePreferences(
      "referenceScreenshots",
      (preferences.referenceScreenshots ?? []).filter((s) => s.id !== id)
    );
  }

  async function onGeneratePlan() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...preferences,
        referenceUrl: preferences.referenceUrl || undefined,
        deployment: {
          ...preferences.deployment,
          customDomain: preferences.deployment.customDomain || undefined,
        },
      };

      const endpoint = job ? `/api/build/${job.id}/plan` : "/api/build";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <section className={sectionClassName()}>
        <p className="text-sm font-medium text-foreground">
          Step 1 — Set your site preferences
        </p>
        <p className="mt-1 text-xs text-muted">
          Build OS collects your brief, theme, reference screenshots, and Vercel
          deployment config before generating pages.
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
              <label className="block space-y-1 text-xs text-muted">
                Business name
                <input
                  value={preferences.businessName}
                  onChange={(e) => {
                    updatePreferences("businessName", e.target.value);
                    if (!preferences.deployment.projectName) {
                      updateDeployment(
                        "projectName",
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "")
                          .slice(0, 48)
                      );
                    }
                  }}
                  className={inputClassName()}
                />
              </label>
              <label className="block space-y-1 text-xs text-muted">
                What does your business do?
                <textarea
                  value={preferences.businessIdea}
                  onChange={(e) => updatePreferences("businessIdea", e.target.value)}
                  rows={3}
                  className={inputClassName()}
                />
              </label>
              <label className="block space-y-1 text-xs text-muted">
                Target audience (optional)
                <input
                  value={preferences.targetAudience ?? ""}
                  onChange={(e) => updatePreferences("targetAudience", e.target.value)}
                  className={inputClassName()}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-muted">
                  Country base
                  <input
                    value={preferences.countryBase}
                    onChange={(e) => updatePreferences("countryBase", e.target.value)}
                    className={inputClassName()}
                  />
                </label>
                <label className="space-y-1 text-xs text-muted">
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
              <div className="space-y-2">
                <p className="text-xs text-muted">Site theme preset</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {SITE_THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectThemePreset(preset.id)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        preferences.themePreset === preset.id
                          ? "border-gold bg-primary-soft"
                          : "border-border bg-surface-muted hover:border-gold/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <span
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                        <span className="text-xs font-medium text-foreground">
                          {preset.label}
                        </span>
                      </div>
                      <p className="mt-2 text-[10px] leading-relaxed text-dim">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted">
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

              <div className="space-y-1 text-xs text-muted">
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

              <div className="space-y-1 text-xs text-muted">
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

              <label className="block space-y-1 text-xs text-muted">
                Custom prompt — tell the AI exactly what you want
                <textarea
                  value={preferences.customPrompt ?? ""}
                  onChange={(e) => updatePreferences("customPrompt", e.target.value)}
                  rows={4}
                  className={inputClassName()}
                  placeholder="E.g. Make the hero feel premium and cozy. Highlight subscription boxes. Use large product photography."
                />
              </label>

              <div className="space-y-2">
                <p className="text-xs text-muted">Reference screenshots (max {MAX_SCREENSHOTS})</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void onScreenshotFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={(preferences.referenceScreenshots?.length ?? 0) >= MAX_SCREENSHOTS}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload screenshot
                  </Button>
                  <span className="self-center text-[10px] text-dim">
                    PNG, JPG, WebP — 1.5 MB max each
                  </span>
                </div>
                {(preferences.referenceScreenshots?.length ?? 0) > 0 && (
                  <ul className="grid gap-2 sm:grid-cols-3">
                    {preferences.referenceScreenshots!.map((shot) => (
                      <li
                        key={shot.id}
                        className="relative overflow-hidden rounded-lg border border-border bg-surface-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={shot.dataUrl}
                          alt={shot.name}
                          className="h-28 w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                          <span className="truncate text-[10px] text-muted">{shot.name}</span>
                          <button
                            type="button"
                            onClick={() => removeScreenshot(shot.id)}
                            className="text-dim hover:text-foreground"
                            aria-label={`Remove ${shot.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {(preferences.referenceScreenshots?.length ?? 0) === 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-6 text-xs text-dim">
                    <ImagePlus className="h-4 w-4" />
                    Upload inspiration screenshots to guide layout and style.
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1 text-xs text-muted">
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

              <div className="space-y-2 text-xs text-muted">
                Features
                <div className="grid gap-3 sm:grid-cols-2">
                  {["Lead capture", "Commerce", "Growth", "Social proof", "Insights"].map(
                    (group) => (
                      <div
                        key={group}
                        className="rounded-lg border border-border bg-surface-muted p-3"
                      >
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-dim">
                          {group}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {FEATURE_OPTIONS.filter((f) => f.group === group).map((feature) => (
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
                    )
                  )}
                </div>
              </div>

              <label className="block space-y-1 text-xs text-muted">
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

              <label className="block space-y-1 text-xs text-muted">
                Key messages (optional)
                <input
                  value={preferences.keyMessages ?? ""}
                  onChange={(e) => updatePreferences("keyMessages", e.target.value)}
                  className={inputClassName()}
                />
              </label>

              <label className="block space-y-1 text-xs text-muted">
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

          {step === 3 && (
            <>
              <label className="block space-y-1 text-xs text-muted">
                Hosting provider
                <select
                  value={preferences.deployment.hostingProvider}
                  onChange={(e) =>
                    updateDeployment(
                      "hostingProvider",
                      e.target.value as SiteHostingProvider
                    )
                  }
                  className={inputClassName()}
                >
                  <option value="vercel">Vercel (recommended)</option>
                  <option value="self_hosted">Self-hosted</option>
                </select>
              </label>

              <label className="block space-y-1 text-xs text-muted">
                Vercel project name
                <input
                  value={preferences.deployment.projectName ?? ""}
                  onChange={(e) => updateDeployment("projectName", e.target.value)}
                  className={inputClassName()}
                  placeholder="my-business-site"
                />
              </label>

              <label className="block space-y-1 text-xs text-muted">
                Custom domain (optional — configure DNS in Vercel)
                <input
                  value={preferences.deployment.customDomain ?? ""}
                  onChange={(e) => updateDeployment("customDomain", e.target.value)}
                  className={inputClassName()}
                  placeholder="www.yourbusiness.com"
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={preferences.deployment.autoDeployOnApprove ?? false}
                  onChange={(e) => updateDeployment("autoDeployOnApprove", e.target.checked)}
                  className="rounded border-border"
                />
                Auto-deploy to Vercel when plan is approved (coming soon)
              </label>

              <div className="rounded-lg border border-gold/30 bg-primary-soft p-3">
                <p className="text-xs font-medium text-gold-bright">Vercel deployment notes</p>
                <div className="mt-3">
                  <VercelDeployNotesPanel deployment={preferences.deployment} compact />
                </div>
              </div>
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
        <section className="space-y-4 rounded-xl border border-gold/30 bg-surface-elevated p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">Step 2 — Review site plan</p>
            <StatusPill
              variant={
                job.status === "approved"
                  ? "success"
                  : job.status === "plan_ready"
                    ? "warning"
                    : "default"
              }
            >
              {job.status}
            </StatusPill>
            {usedAi && <span className="text-[10px] text-dim">AI-enhanced</span>}
          </div>

          <p className="text-sm text-muted">{job.plan.summary}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xs font-medium text-gold">Site</p>
              <p className="mt-1 text-sm text-foreground">{job.plan.siteName}</p>
              <p className="mt-1 font-mono text-xs text-muted">/sites/{job.plan.slug}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xs font-medium text-gold">Theme — {job.plan.theme.presetId}</p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="h-6 w-6 rounded border border-border"
                  style={{ backgroundColor: job.plan.theme.primaryColor }}
                />
                <span
                  className="h-6 w-6 rounded border border-border"
                  style={{ backgroundColor: job.plan.theme.accentColor }}
                />
                <span className="text-xs text-muted">{job.plan.theme.fontStyle}</span>
              </div>
              <p className="mt-2 text-[10px] text-dim">{job.plan.theme.styleNotes}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <p className="text-xs font-medium text-gold">Deployment</p>
            <p className="mt-1 text-xs text-muted">
              Host: {job.plan.deployment.hostingProvider} · Preview:{" "}
              <span className="font-mono text-foreground">
                {job.plan.deployment.previewUrl}
              </span>
            </p>
            {job.plan.deployment.customDomain && (
              <p className="mt-1 text-xs text-muted">
                Custom domain: {job.plan.deployment.customDomain} (configure DNS in Vercel)
              </p>
            )}
          </div>

          {(job.preferences.referenceScreenshots?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xs font-medium text-gold">Reference screenshots</p>
              <p className="mt-1 text-xs text-muted">
                {job.preferences.referenceScreenshots!.length} inspiration image(s) included in
                planning context.
              </p>
            </div>
          )}

          {job.preferences.customPrompt && (
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xs font-medium text-gold">Custom prompt</p>
              <p className="mt-1 text-xs text-muted">{job.preferences.customPrompt}</p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <p className="text-xs font-medium text-gold">Navigation</p>
            <p className="mt-2 text-xs text-muted">
              {job.plan.navigation.map((n) => n.label).join(" · ")}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-gold">Pages & sections</p>
            {job.plan.pages.map((page) => (
              <div
                key={page.slug || "home"}
                className="rounded-lg border border-border bg-surface-muted p-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {page.title}
                  <span className="ml-2 font-mono text-[10px] text-dim">
                    {page.slug ? `/${page.slug}` : "/"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted">{page.purpose}</p>
                <ul className="mt-2 space-y-1">
                  {page.sections.map((section) => (
                    <li key={section.type + section.label} className="text-xs text-muted">
                      <span className="font-medium text-foreground">{section.label}</span>
                      {" — "}
                      {section.description}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {job.plan.deployment.hostingProvider === "vercel" && (
            <div className="rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xs font-medium text-gold">Vercel setup instructions</p>
              <ol className="mt-2 space-y-2">
                {job.plan.deployment.vercelNotes.map((note) => (
                  <li key={note.title} className="text-xs text-muted">
                    <span className="font-medium text-foreground">{note.title}</span>
                    {" — "}
                    {note.body}
                  </li>
                ))}
              </ol>
            </div>
          )}

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
            <div className="rounded-lg border border-gold/40 bg-primary-soft p-4">
              <p className="text-sm font-semibold text-gold-bright">Plan approved</p>
              <p className="mt-1 text-xs text-muted">
                Site generation is next. Deploy to Vercel using the instructions above once pages
                are generated.
              </p>
              <Link
                href="/launch"
                className="mt-3 inline-block text-sm font-medium text-gold hover:underline"
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
