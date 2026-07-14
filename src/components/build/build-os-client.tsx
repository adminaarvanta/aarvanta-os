"use client";

import Link from "next/link";
import {
  Briefcase,
  ImagePlus,
  LayoutTemplate,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DomainPurchasePanel } from "@/components/build/domain-purchase-panel";
import { SiteLivePreview } from "@/components/build/site-live-preview";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/os/status-pill";
import { DEFAULT_DEPLOYMENT } from "@/lib/site-builder/normalize-preferences";
import { SITE_THEME_PRESETS } from "@/lib/site-builder/theme-presets";
import { formatDomainPrice } from "@/lib/site-builder/domain-catalog";
import type {
  SiteBuildJob,
  SiteCtaGoal,
  SiteDesignStyle,
  SiteFeatureOption,
  SitePageOption,
  SitePreferences,
  SiteReferenceScreenshot,
  SiteThemePreset,
  SiteTone,
  SiteType,
} from "@/types/site-builder";

const STEPS = ["Business", "Style", "Pages", "Go live"] as const;

const TONES: { value: SiteTone; label: string; hint: string }[] = [
  { value: "professional", label: "Professional", hint: "Clear & credible" },
  { value: "friendly", label: "Friendly", hint: "Warm & approachable" },
  { value: "bold", label: "Bold", hint: "Confident & punchy" },
  { value: "luxury", label: "Luxury", hint: "Premium & refined" },
];

const SITE_TYPES: {
  value: SiteType;
  label: string;
  hint: string;
  icon: typeof Briefcase;
}[] = [
  { value: "landing", label: "Landing page", hint: "One page to convert visitors", icon: LayoutTemplate },
  { value: "business", label: "Business site", hint: "Services, about, contact", icon: Briefcase },
  { value: "store", label: "Online store", hint: "Sell products online", icon: ShoppingBag },
  { value: "portfolio", label: "Portfolio", hint: "Showcase your work", icon: Sparkles },
];

const DESIGN_STYLES: SiteDesignStyle[] = ["minimal", "modern", "bold", "classic"];
const COLOR_MOODS = ["warm", "cool", "neutral", "vibrant"] as const;

const CTA_GOALS: { value: SiteCtaGoal; label: string }[] = [
  { value: "contact", label: "Get in touch" },
  { value: "book_call", label: "Book a call" },
  { value: "buy", label: "Buy / shop" },
  { value: "subscribe", label: "Subscribe" },
];

const PAGE_OPTIONS: { value: SitePageOption; label: string; hint: string }[] = [
  { value: "home", label: "Home", hint: "Always included" },
  { value: "about", label: "About", hint: "Your story" },
  { value: "services", label: "Services", hint: "What you offer" },
  { value: "pricing", label: "Pricing", hint: "Plans & packages" },
  { value: "products", label: "Products", hint: "Catalog" },
  { value: "portfolio", label: "Portfolio", hint: "Case studies" },
  { value: "testimonials", label: "Reviews", hint: "Social proof" },
  { value: "faq", label: "FAQ", hint: "Common questions" },
  { value: "blog", label: "Blog", hint: "Articles" },
  { value: "contact", label: "Contact", hint: "Reach you" },
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

type QuickStart = {
  id: string;
  label: string;
  description: string;
  patch: Partial<SitePreferences>;
};

const QUICK_STARTS: QuickStart[] = [
  {
    id: "store",
    label: "Online shop",
    description: "Products, checkout, trust signals",
    patch: {
      siteType: "store",
      tone: "friendly",
      themePreset: "sunset_warm",
      designStyle: "modern",
      colorMood: "warm",
      pages: ["home", "about", "products", "faq", "contact"],
      features: ["ecommerce", "contact_form", "testimonials", "seo_pack"],
      ctaGoal: "buy",
      keyMessages: "Quality products, fast delivery, easy returns",
    },
  },
  {
    id: "service",
    label: "Local service",
    description: "Bookings, reviews, contact",
    patch: {
      siteType: "business",
      tone: "professional",
      themePreset: "ocean_cool",
      designStyle: "modern",
      colorMood: "cool",
      pages: ["home", "about", "services", "pricing", "contact"],
      features: ["contact_form", "booking", "testimonials", "seo_pack"],
      ctaGoal: "book_call",
      keyMessages: "Trusted locally · Free consultation",
    },
  },
  {
    id: "agency",
    label: "Agency / studio",
    description: "Portfolio and case studies",
    patch: {
      siteType: "portfolio",
      tone: "bold",
      themePreset: "bold_dark",
      designStyle: "bold",
      colorMood: "vibrant",
      pages: ["home", "about", "portfolio", "services", "contact"],
      features: ["contact_form", "testimonials", "analytics"],
      ctaGoal: "contact",
      keyMessages: "Strategy, craft, results",
    },
  },
  {
    id: "saas",
    label: "Product launch",
    description: "Landing page that converts",
    patch: {
      siteType: "landing",
      tone: "professional",
      themePreset: "gold_navy",
      designStyle: "minimal",
      colorMood: "neutral",
      pages: ["home", "pricing", "faq", "contact"],
      features: ["contact_form", "newsletter", "analytics", "seo_pack"],
      ctaGoal: "subscribe",
      keyMessages: "Simple setup · Clear results",
    },
  },
];

const EMPTY_PREFERENCES: SitePreferences = {
  businessName: "",
  businessIdea: "",
  targetAudience: "",
  countryBase: "UK",
  tone: "professional",
  siteType: "business",
  designStyle: "modern",
  colorMood: "neutral",
  themePreset: "gold_navy",
  pages: ["home", "about", "services", "contact"],
  features: ["contact_form", "seo_pack"],
  ctaGoal: "contact",
  keyMessages: "",
  customPrompt: "",
  referenceScreenshots: [],
  deployment: {
    ...DEFAULT_DEPLOYMENT,
    domain: { ...DEFAULT_DEPLOYMENT.domain, status: "none" as const },
  },
};

const MAX_SCREENSHOTS = 3;
const MAX_SCREENSHOT_BYTES = 1_500_000;

function inputClassName() {
  return "w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-dim";
}

function chipClassName(active: boolean) {
  return `rounded-lg border px-3 py-1.5 text-xs transition-colors ${
    active
      ? "border-gold bg-primary-soft text-gold-bright"
      : "border-border text-muted hover:border-gold/40"
  }`;
}

export function BuildOsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobParam = searchParams.get("job");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<SitePreferences>(EMPTY_PREFERENCES);
  const [job, setJob] = useState<SiteBuildJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const loadJob = useCallback(async (id: string) => {
    const res = await fetch(`/api/build/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { job: SiteBuildJob };
    setJob(data.job);
    setPreferences({
      ...EMPTY_PREFERENCES,
      ...data.job.preferences,
      deployment: {
        ...EMPTY_PREFERENCES.deployment,
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

  function updateDomain(domain: SitePreferences["deployment"]["domain"]) {
    setPreferences((prev) => ({
      ...prev,
      deployment: { ...prev.deployment, domain },
    }));
  }

  function applyQuickStart(start: QuickStart) {
    setPreferences((prev) => ({
      ...prev,
      ...start.patch,
      deployment: prev.deployment,
      businessName: prev.businessName,
      businessIdea: prev.businessIdea,
      targetAudience: prev.targetAudience,
      countryBase: prev.countryBase,
      referenceScreenshots: prev.referenceScreenshots,
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
      setError(`Maximum ${MAX_SCREENSHOTS} reference images allowed.`);
      return;
    }

    const toAdd: SiteReferenceScreenshot[] = [];

    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files (PNG, JPG, WebP) are supported.");
        continue;
      }
      if (file.size > MAX_SCREENSHOT_BYTES) {
        setError("Each image must be under 1.5 MB.");
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
        customPrompt: preferences.customPrompt || undefined,
        keyMessages: preferences.keyMessages || undefined,
        targetAudience: preferences.targetAudience || undefined,
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
  const previewReady = canProceedStep0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <section className="rounded-xl border border-border bg-surface-elevated p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Design your website</p>
              <p className="mt-1 text-xs text-muted">
                Answer a few plain questions — watch the preview update on the right. Domain is optional until you go live.
              </p>
            </div>
          </div>

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

          <div className="mt-5 space-y-4">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Start from a template</p>
                  <p className="text-[11px] text-dim">
                    Pick a starting point — you can change anything after.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {QUICK_STARTS.map((start) => (
                      <button
                        key={start.id}
                        type="button"
                        onClick={() => applyQuickStart(start)}
                        className="rounded-lg border border-border bg-surface-muted p-3 text-left transition-colors hover:border-gold/50"
                      >
                        <p className="text-xs font-medium text-foreground">{start.label}</p>
                        <p className="mt-0.5 text-[11px] text-dim">{start.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block space-y-1.5 text-xs text-muted">
                  What&apos;s your business called?
                  <input
                    value={preferences.businessName}
                    onChange={(e) => updatePreferences("businessName", e.target.value)}
                    className={inputClassName()}
                    placeholder="e.g. Northstar Coffee"
                    autoComplete="organization"
                  />
                </label>

                <label className="block space-y-1.5 text-xs text-muted">
                  In one or two sentences, what do you do?
                  <textarea
                    value={preferences.businessIdea}
                    onChange={(e) => updatePreferences("businessIdea", e.target.value)}
                    rows={3}
                    className={inputClassName()}
                    placeholder="e.g. We roast specialty coffee and deliver subscription boxes across the UK."
                  />
                </label>

                <label className="block space-y-1.5 text-xs text-muted">
                  Who is this for? <span className="text-dim">(optional)</span>
                  <input
                    value={preferences.targetAudience ?? ""}
                    onChange={(e) => updatePreferences("targetAudience", e.target.value)}
                    className={inputClassName()}
                    placeholder="e.g. Busy professionals who care about quality coffee"
                  />
                </label>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">What kind of site?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SITE_TYPES.map((type) => {
                      const Icon = type.icon;
                      const active = preferences.siteType === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updatePreferences("siteType", type.value)}
                          className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                            active
                              ? "border-gold bg-primary-soft"
                              : "border-border bg-surface-muted hover:border-gold/40"
                          }`}
                        >
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                          <span>
                            <span className="block text-xs font-medium text-foreground">
                              {type.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-dim">{type.hint}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block space-y-1.5 text-xs text-muted">
                  Primary market / country
                  <input
                    value={preferences.countryBase}
                    onChange={(e) => updatePreferences("countryBase", e.target.value)}
                    className={inputClassName()}
                    placeholder="UK"
                  />
                </label>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Pick a look</p>
                  <p className="text-[11px] text-dim">Tap a theme — the preview updates instantly.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SITE_THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => selectThemePreset(preset.id)}
                        className={`overflow-hidden rounded-lg border text-left transition-colors ${
                          preferences.themePreset === preset.id
                            ? "border-gold ring-1 ring-gold/40"
                            : "border-border hover:border-gold/40"
                        }`}
                      >
                        <div
                          className="flex h-14 items-end justify-between px-3 pb-2"
                          style={{ backgroundColor: preset.backgroundColor }}
                        >
                          <span
                            className="h-6 w-6 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.primaryColor }}
                          />
                          <span
                            className="h-6 w-6 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                        </div>
                        <div className="bg-surface-muted px-3 py-2">
                          <p className="text-xs font-medium text-foreground">{preset.label}</p>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-dim">
                            {preset.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Tone of voice</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {TONES.map((tone) => (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() => updatePreferences("tone", tone.value)}
                        className={`rounded-lg border p-3 text-left ${
                          preferences.tone === tone.value
                            ? "border-gold bg-primary-soft"
                            : "border-border bg-surface-muted hover:border-gold/40"
                        }`}
                      >
                        <p className="text-xs font-medium text-foreground">{tone.label}</p>
                        <p className="mt-0.5 text-[11px] text-dim">{tone.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block space-y-1.5 text-xs text-muted">
                  Main button on the site should say…
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

                <label className="block space-y-1.5 text-xs text-muted">
                  Tagline or key promise <span className="text-dim">(optional)</span>
                  <input
                    value={preferences.keyMessages ?? ""}
                    onChange={(e) => updatePreferences("keyMessages", e.target.value)}
                    className={inputClassName()}
                    placeholder="e.g. Hand-roasted · Next-day UK delivery"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="text-xs font-medium text-gold hover:underline"
                >
                  {showAdvanced ? "Hide fine-tuning" : "Fine-tune style & inspiration"}
                </button>

                {showAdvanced && (
                  <div className="space-y-4 rounded-lg border border-border bg-surface-muted p-3">
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

                    <label className="block space-y-1.5 text-xs text-muted">
                      Extra notes for the AI <span className="text-dim">(optional)</span>
                      <textarea
                        value={preferences.customPrompt ?? ""}
                        onChange={(e) => updatePreferences("customPrompt", e.target.value)}
                        rows={3}
                        className={inputClassName()}
                        placeholder="e.g. Large product photos, gift-focused hero, soft shadows"
                      />
                    </label>

                    <div className="space-y-2">
                      <p className="text-xs text-muted">
                        Inspiration screenshots <span className="text-dim">(max {MAX_SCREENSHOTS})</span>
                      </p>
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
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={(preferences.referenceScreenshots?.length ?? 0) >= MAX_SCREENSHOTS}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload inspiration
                      </Button>
                      {(preferences.referenceScreenshots?.length ?? 0) > 0 ? (
                        <ul className="grid gap-2 sm:grid-cols-3">
                          {preferences.referenceScreenshots!.map((shot) => (
                            <li
                              key={shot.id}
                              className="relative overflow-hidden rounded-lg border border-border bg-surface"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={shot.dataUrl}
                                alt={shot.name}
                                className="h-24 w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeScreenshot(shot.id)}
                                className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white"
                                aria-label={`Remove ${shot.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-xs text-dim">
                          <ImagePlus className="h-4 w-4" />
                          Optional — sites you like for layout inspiration.
                        </div>
                      )}
                    </div>

                    <label className="block space-y-1.5 text-xs text-muted">
                      Reference website <span className="text-dim">(optional)</span>
                      <input
                        value={preferences.referenceUrl ?? ""}
                        onChange={(e) => updatePreferences("referenceUrl", e.target.value)}
                        className={inputClassName()}
                        placeholder="https://example.com"
                      />
                    </label>
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Which pages do you need?</p>
                  <p className="text-[11px] text-dim">Home is always included. Toggle the rest.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PAGE_OPTIONS.map((page) => {
                      const active =
                        preferences.pages.includes(page.value) || page.value === "home";
                      return (
                        <button
                          key={page.value}
                          type="button"
                          onClick={() => togglePage(page.value)}
                          disabled={page.value === "home"}
                          className={`rounded-lg border p-3 text-left ${
                            active
                              ? "border-gold bg-primary-soft"
                              : "border-border bg-surface-muted hover:border-gold/40"
                          } disabled:opacity-80`}
                        >
                          <p className="text-xs font-medium text-foreground">{page.label}</p>
                          <p className="mt-0.5 text-[11px] text-dim">{page.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Add-ons</p>
                  <p className="text-[11px] text-dim">Only turn on what you&apos;ll use.</p>
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
              </>
            )}

            {step === 3 && (
              <>
                <div className="rounded-lg border border-gold/30 bg-primary-soft p-3">
                  <p className="text-xs font-medium text-foreground">Preview first, domain when ready</p>
                  <p className="mt-1 text-[11px] text-muted">
                    You can generate a site plan with the details above. Buying a domain is only needed
                    when you&apos;re ready to publish under your own URL. Hosting is managed by Aarvanta
                    automatically.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Domain (optional)</p>
                  <DomainPurchasePanel
                    businessName={preferences.businessName || "yoursite"}
                    countryBase={preferences.countryBase}
                    domain={preferences.deployment.domain}
                    buildJobId={job?.id}
                    onDomainChange={updateDomain}
                  />
                </div>
              </>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
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
                  {busy ? "Building plan…" : job ? "Update site plan" : "Generate site plan"}
                </Button>
              )}
              {step < STEPS.length - 1 && canProceedStep0 && canProceedStep2 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(STEPS.length - 1)}
                >
                  Skip to go live
                </Button>
              )}
            </div>
          </div>
        </section>

        <aside className="xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            {previewReady ? (
              <SiteLivePreview preferences={preferences} />
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
                <LayoutTemplate className="h-8 w-8 text-gold/70" />
                <p className="mt-3 text-sm font-medium text-foreground">Your preview appears here</p>
                <p className="mt-1 text-xs text-muted">
                  Add a business name and a short description to see a live mockup of your site.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {job?.plan && (
        <section className="space-y-4 rounded-xl border border-gold/30 bg-surface-elevated p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">Site plan ready</p>
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
            <p className="text-xs font-medium text-gold">Publishing</p>
            {job.plan.deployment.domain.selectedDomain ? (
              <p className="mt-1 text-xs text-muted">
                Domain:{" "}
                <span className="font-mono text-foreground">
                  {job.plan.deployment.domain.selectedDomain}
                </span>
                {job.plan.deployment.domain.priceAnnual
                  ? ` · ${formatDomainPrice(
                      job.plan.deployment.domain.priceAnnual,
                      job.plan.deployment.domain.currency
                    )}/yr`
                  : null}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted">
                No domain yet — you can publish on a preview URL first.
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              URL:{" "}
              <span className="font-mono text-foreground">
                {job.plan.deployment.liveUrl ?? job.plan.deployment.previewUrl}
              </span>
            </p>
            <p className="mt-1 text-xs text-dim">Hosting is managed automatically by Aarvanta.</p>
          </div>

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

          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <p className="text-xs font-medium text-gold">What happens next</p>
            <ol className="mt-2 space-y-2">
              {job.plan.deployment.deployNotes.map((note) => (
                <li key={note.title} className="text-xs text-muted">
                  <span className="font-medium text-foreground">{note.title}</span>
                  {" — "}
                  {note.body}
                </li>
              ))}
            </ol>
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
            <div className="rounded-lg border border-gold/40 bg-primary-soft p-4">
              <p className="text-sm font-semibold text-gold-bright">Plan approved</p>
              <p className="mt-1 text-xs text-muted">
                Site generation is next. Aarvanta Hosting will publish your pages when generation
                completes.
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
