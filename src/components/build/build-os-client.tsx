"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { BuildStudioLayout } from "@/components/build/build-studio-layout";
import {
  BUILD_WIZARD_STEPS,
  BuildWizardRail,
  type BuildWizardStepId,
} from "@/components/build/build-wizard-rail";
import { DesignOptionsPicker } from "@/components/build/design-options-picker";
import { DomainPurchasePanel } from "@/components/build/domain-purchase-panel";
import { HostingCheckoutPanel } from "@/components/build/hosting-checkout-panel";
import { Button } from "@/components/ui/button";
import {
  clearComposeDraftCache,
  readComposeDraftCache,
  writeComposeDraftCache,
} from "@/lib/site-builder/compose-draft-cache";
import { buildEc2DeployNotes } from "@/lib/site-builder/ec2-deploy-notes";
import { EXAMPLE_PROMPTS, inferPreferencesFromPrompt } from "@/lib/site-builder/infer-preferences";
import {
  defaultCustomThemeFromPreset,
} from "@/lib/site-builder/theme-presets";
import type {
  AwsEc2InstanceType,
  SiteCustomTheme,
  SiteDesignOption,
  SiteDomainPurchase,
  SiteFeatureOption,
  SiteGenerationStage,
  SitePreferences,
  SiteReferenceScreenshot,
  SiteThemePreset,
  SiteTone,
} from "@/types/site-builder";
import { cn } from "@/lib/utils";

const MAX_SCREENSHOTS = 3;
const MAX_SCREENSHOT_BYTES = 1_500_000;

const GOAL_OPTIONS = [
  "Sell more products online",
  "Build a loyal customer base",
  "Increase brand awareness",
  "Generate leads",
  "Book more appointments",
  "Showcase portfolio work",
] as const;

const APP_OPTIONS: Array<{ id: SiteFeatureOption; label: string; description: string }> = [
  { id: "ecommerce", label: "Store", description: "Products & checkout-ready pages" },
  { id: "contact_form", label: "Forms", description: "Lead capture forms" },
  { id: "booking", label: "Bookings", description: "Appointment scheduling" },
  { id: "blog", label: "Blog", description: "Content & SEO articles" },
  { id: "live_chat", label: "Chat", description: "Live chat widget" },
  { id: "newsletter", label: "Newsletter", description: "Email capture" },
  { id: "testimonials", label: "Reviews", description: "Social proof blocks" },
  { id: "seo_pack", label: "SEO", description: "Meta & discoverability" },
];

const QUICK_TAGS = ["Online Store", "Portfolio", "Blog", "Local Service", "SaaS"] as const;

const TONE_VIBES: Array<{ id: SiteTone; label: string }> = [
  { id: "friendly", label: "Playful" },
  { id: "professional", label: "Trustworthy" },
  { id: "bold", label: "Bold" },
  { id: "luxury", label: "Premium" },
];

function formatDraftTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "Recently";
  }
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function BuildOsClient({
  initialJobs = [],
}: {
  initialJobs?: import("@/types/site-builder").SiteBuildJob[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobParam = searchParams.get("job");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jobRef = useRef<import("@/types/site-builder").SiteBuildJob | null>(null);
  const hydratedRef = useRef(false);

  const [step, setStep] = useState<BuildWizardStepId>("about");
  const [prompt, setPrompt] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<SiteTone>("friendly");
  const [goals, setGoals] = useState<string[]>(["Sell more products online"]);
  const [features, setFeatures] = useState<SiteFeatureOption[]>([
    "ecommerce",
    "contact_form",
  ]);
  const [themePreset, setThemePreset] = useState<SiteThemePreset>("gold_navy");
  const [customTheme, setCustomTheme] = useState<SiteCustomTheme>(() =>
    defaultCustomThemeFromPreset("gold_navy")
  );
  const [screenshots, setScreenshots] = useState<SiteReferenceScreenshot[]>([]);
  const [designOptions, setDesignOptions] = useState<SiteDesignOption[]>([]);
  const [selectedDesignOptionId, setSelectedDesignOptionId] = useState<string | null>(null);

  const [job, setJob] = useState<import("@/types/site-builder").SiteBuildJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<import("@/types/site-builder").SiteBuildJob[]>(
    initialJobs
  );
  const [busy, setBusy] = useState(false);
  const [designsBusy, setDesignsBusy] = useState(false);
  const [genProgress, setGenProgress] = useState<{
    stage: SiteGenerationStage;
    percent: number;
    message: string;
  } | null>(null);
  const [refineInput, setRefineInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);

  useEffect(() => {
    jobRef.current = job;
  }, [job]);

  const completed = useMemo(() => {
    const set = new Set<BuildWizardStepId>();
    if (prompt.trim().length >= 12) set.add("about");
    if (businessName.trim().length >= 2) set.add("name");
    if (goals.length) set.add("goals");
    if (features.length) set.add("apps");
    if (selectedDesignOptionId) set.add("designs");
    if (job?.preferences.deployment.domain.selectedDomain) set.add("domain");
    if (job?.generatedSite) set.add("generate");
    return set;
  }, [prompt, businessName, goals, features, selectedDesignOptionId, job]);

  const hydrateFromJob = useCallback((next: import("@/types/site-builder").SiteBuildJob) => {
    setJob(next);
    setUsedAi(next.usedAi ?? false);
    setPrompt(next.preferences.customPrompt ?? next.preferences.businessIdea);
    setBusinessName(next.preferences.businessName ?? "");
    setAudience(next.preferences.targetAudience ?? "");
    setTone(next.preferences.tone);
    setFeatures(next.preferences.features ?? ["contact_form"]);
    setDesignOptions(next.preferences.designOptions ?? []);
    setSelectedDesignOptionId(next.preferences.selectedDesignOptionId ?? null);
    setThemePreset(next.preferences.themePreset);
    setCustomTheme(
      next.preferences.customTheme ??
        defaultCustomThemeFromPreset(
          next.preferences.themePreset === "custom" ? "gold_navy" : next.preferences.themePreset
        )
    );
    const fromKeys = next.preferences.keyMessages
      ?.split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (fromKeys?.length) setGoals(fromKeys);
    if (next.generatedSite) setStep("generate");
    else if (next.preferences.designOptions?.length) setStep("designs");
    else setStep("about");
  }, []);

  const refreshJobList = useCallback(async () => {
    const res = await fetch("/api/build");
    if (!res.ok) return;
    const data = (await res.json()) as {
      jobs: import("@/types/site-builder").SiteBuildJob[];
    };
    setRecentJobs(data.jobs ?? []);
  }, []);

  const loadJob = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/build/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        job: import("@/types/site-builder").SiteBuildJob;
      };
      hydrateFromJob(data.job);
    },
    [hydrateFromJob]
  );

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    void (async () => {
      await refreshJobList();
      if (jobParam) {
        await loadJob(jobParam);
        return;
      }
      const cache = readComposeDraftCache();
      if (cache?.prompt) {
        setPrompt(cache.prompt);
        setBusinessName(cache.businessName ?? "");
        setAudience(cache.audience ?? "");
        setGoals(cache.goals?.length ? cache.goals : ["Sell more products online"]);
        setThemePreset(cache.themePreset);
        setCustomTheme(cache.customTheme);
        setScreenshots(cache.screenshots ?? []);
        setSelectedDesignOptionId(cache.selectedDesignOptionId ?? null);
        setStep(cache.step ?? "about");
        if (cache.jobId) await loadJob(cache.jobId);
      }
    })();
  }, [jobParam, loadJob, refreshJobList]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (jobParam && jobParam !== jobRef.current?.id) void loadJob(jobParam);
  }, [jobParam, loadJob]);

  const buildPreferences = useCallback(
    (extraPrompt?: string): SitePreferences => {
      const mergedPrompt = [prompt.trim(), extraPrompt?.trim()].filter(Boolean).join("\n\n");
      const safePrompt = mergedPrompt || "Untitled draft";
      return inferPreferencesFromPrompt(safePrompt, {
        businessName: businessName.trim() || undefined,
        targetAudience: audience.trim() || undefined,
        tone,
        features,
        themePreset,
        customTheme,
        customPrompt: mergedPrompt || undefined,
        keyMessages: goals.join(" | "),
        referenceScreenshots: screenshots,
        designOptions: designOptions.length ? designOptions : undefined,
        selectedDesignOptionId: selectedDesignOptionId ?? undefined,
        deployment: jobRef.current?.preferences.deployment,
        businessProfile: jobRef.current?.preferences.businessProfile,
        brandSystem: jobRef.current?.preferences.brandSystem,
      });
    },
    [
      prompt,
      businessName,
      audience,
      tone,
      features,
      themePreset,
      customTheme,
      screenshots,
      goals,
      designOptions,
      selectedDesignOptionId,
    ]
  );

  const syncLocalCache = useCallback(
    (jobId?: string, nextStep?: BuildWizardStepId) => {
      writeComposeDraftCache({
        jobId: jobId ?? jobRef.current?.id,
        prompt,
        businessName,
        audience,
        goals,
        step: nextStep ?? step,
        themePreset,
        customTheme,
        screenshots,
        selectedDesignOptionId,
        savedAt: new Date().toISOString(),
      });
    },
    [
      prompt,
      businessName,
      audience,
      goals,
      step,
      themePreset,
      customTheme,
      screenshots,
      selectedDesignOptionId,
    ]
  );

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (step === "generate") return;
    syncLocalCache();
  }, [prompt, businessName, audience, goals, step, syncLocalCache]);

  async function ensureJob(
    preferences: SitePreferences
  ): Promise<string | null> {
    if (job?.id) {
      await fetch(`/api/build/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preferences, referenceScreenshots: [] }),
      });
      return job.id;
    }
    const createRes = await fetch("/api/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...preferences, mode: "draft", referenceScreenshots: [] }),
    });
    if (!createRes.ok) {
      const body = (await createRes.json()) as { error?: { message?: string } };
      setError(body.error?.message ?? "Could not create build job.");
      return null;
    }
    const created = (await createRes.json()) as {
      job: import("@/types/site-builder").SiteBuildJob;
    };
    setJob(created.job);
    router.replace(`/build?job=${created.job.id}`);
    return created.job.id;
  }

  async function proposeDesigns() {
    if (prompt.trim().length < 12) {
      setError("Describe your business in a sentence or two.");
      return;
    }
    if (businessName.trim().length < 2) {
      setError("Add a site name first.");
      setStep("name");
      return;
    }
    const preferences = buildPreferences();
    setDesignsBusy(true);
    setError(null);
    try {
      const jobId = await ensureJob(preferences);
      if (!jobId) return;
      const res = await fetch(`/api/build/${jobId}/design-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        setError(body.error?.message ?? "Could not generate designs.");
        return;
      }
      const data = (await res.json()) as {
        job: import("@/types/site-builder").SiteBuildJob;
        options: SiteDesignOption[];
        usedAi: boolean;
      };
      setJob(data.job);
      setDesignOptions(data.options);
      setSelectedDesignOptionId(data.options[0]?.id ?? null);
      setUsedAi(data.usedAi);
      setStep("designs");
      syncLocalCache(data.job.id, "designs");
      void refreshJobList();
    } finally {
      setDesignsBusy(false);
    }
  }

  async function generate(extraPrompt?: string) {
    if (!selectedDesignOptionId) {
      setError("Pick a design direction first.");
      setStep("designs");
      return;
    }
    const preferences = buildPreferences(extraPrompt);
    setBusy(true);
    setError(null);
    setStep("generate");
    setGenProgress({ stage: "business", percent: 0, message: "Starting…" });
    try {
      const jobId = await ensureJob(preferences);
      if (!jobId) return;

      const res = await fetch(`/api/build/${jobId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setError(body?.error?.message ?? "Could not generate your site.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalJob: import("@/types/site-builder").SiteBuildJob | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            const payload = JSON.parse(line.slice(6)) as {
              type: string;
              stage?: SiteGenerationStage;
              percent?: number;
              message?: string;
              job?: import("@/types/site-builder").SiteBuildJob;
              usedAi?: boolean;
              partial?: { site?: import("@/types/site-builder").GeneratedSite };
            };
            if (payload.type === "progress") {
              setGenProgress({
                stage: payload.stage ?? "business",
                percent: payload.percent ?? 0,
                message: payload.message ?? "",
              });
              if (payload.partial?.site) {
                setJob((prev) =>
                  prev
                    ? { ...prev, status: "generating", generatedSite: payload.partial!.site }
                    : prev
                );
              }
            } else if (payload.type === "complete" && payload.job) {
              finalJob = payload.job;
              setUsedAi(payload.usedAi ?? false);
            } else if (payload.type === "error") {
              setError((payload as { message?: string }).message ?? "Generation failed.");
            }
          } catch {
            /* ignore */
          }
        }
      }

      if (finalJob) {
        setJob(finalJob);
        setDesignOptions(finalJob.preferences.designOptions ?? designOptions);
        setSelectedDesignOptionId(
          finalJob.preferences.selectedDesignOptionId ?? selectedDesignOptionId
        );
        setRefineInput("");
        syncLocalCache(finalJob.id, "generate");
        router.replace(`/build?job=${finalJob.id}`);
        void refreshJobList();
      }
    } finally {
      setBusy(false);
      setGenProgress(null);
    }
  }

  async function onScreenshotFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_SCREENSHOTS - screenshots.length;
    if (remaining <= 0) return;
    const toAdd: SiteReferenceScreenshot[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith("image/") || file.size > MAX_SCREENSHOT_BYTES) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      toAdd.push({
        id: `ref_${Date.now()}_${file.name}`,
        name: file.name,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }
    if (toAdd.length) setScreenshots((prev) => [...prev, ...toAdd]);
  }

  function applyDomainChange(domain: SiteDomainPurchase) {
    setJob((current) => {
      if (!current) return current;
      const deployment = { ...current.preferences.deployment, domain };
      const liveUrl = domain.selectedDomain ? `https://${domain.selectedDomain}` : undefined;
      const previewUrl =
        current.plan?.deployment.previewUrl ??
        `https://${current.preferences.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.sites.aarvanta.cloud`;
      return {
        ...current,
        preferences: { ...current.preferences, deployment },
        plan: current.plan
          ? {
              ...current.plan,
              deployment: {
                ...current.plan.deployment,
                domain,
                liveUrl,
                previewUrl,
                deployNotes: buildEc2DeployNotes(deployment),
              },
            }
          : current.plan,
      };
    });
    const current = jobRef.current;
    if (!current) return;
    void fetch(`/api/build/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...current.preferences,
        deployment: { ...current.preferences.deployment, domain },
        referenceScreenshots: [],
      }),
    });
  }

  async function patchDeployment(partial: {
    domain?: SiteDomainPurchase;
    instanceType?: AwsEc2InstanceType;
  }) {
    const current = jobRef.current;
    if (!current) return;
    const nextPreferences: SitePreferences = {
      ...current.preferences,
      deployment: {
        ...current.preferences.deployment,
        ...(partial.domain ? { domain: partial.domain } : {}),
        ec2: {
          ...current.preferences.deployment.ec2,
          ...(partial.instanceType ? { instanceType: partial.instanceType } : {}),
        },
      },
    };
    const optimistic = { ...current, preferences: nextPreferences };
    setJob(optimistic);
    jobRef.current = optimistic;
    await fetch(`/api/build/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nextPreferences, referenceScreenshots: [] }),
    });
  }

  function startOver() {
    clearComposeDraftCache();
    setJob(null);
    setPrompt("");
    setBusinessName("");
    setAudience("");
    setTone("friendly");
    setGoals(["Sell more products online"]);
    setFeatures(["ecommerce", "contact_form"]);
    setDesignOptions([]);
    setSelectedDesignOptionId(null);
    setScreenshots([]);
    setRefineInput("");
    setError(null);
    setGenProgress(null);
    setStep("about");
    router.replace("/build");
  }

  async function discardJob(id: string) {
    await fetch(`/api/build/${id}`, { method: "DELETE" });
    if (job?.id === id) startOver();
    void refreshJobList();
  }

  const draftJobs = recentJobs.filter(
    (j) => j.status === "draft" || j.status === "designs_ready" || !j.generatedSite
  );
  const generatedJobs = recentJobs.filter((j) => Boolean(j.generatedSite));
  const sectionCount =
    job?.generatedSite?.pages.reduce((n, p) => n + p.blocks.length, 0) ?? 0;

  /* ---- Generate / studio ---- */
  if (step === "generate") {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[hsl(222_28%_6%)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(selectedDesignOptionId ? "domain" : "designs")}
              className="text-xs font-medium text-muted hover:text-foreground"
            >
              ← Back
            </button>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                Build OS
              </p>
              <p className="text-[11px] text-dim">
                {busy ? "Generating…" : job?.generatedSite ? "Studio" : "AI Generation"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => syncLocalCache(job?.id, "generate")}
            >
              Save
            </Button>
            {job?.id ? (
              <Link
                href={`/build/preview/${job.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Download <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            <Button type="button" size="sm" onClick={startOver} variant="secondary">
              New site
            </Button>
            <Button type="button" size="sm" disabled={!job?.generatedSite}>
              Publish Website
            </Button>
          </div>
        </div>
        {error ? <p className="border-b border-border px-4 py-2 text-xs text-red-400">{error}</p> : null}
        <BuildStudioLayout
          site={job?.generatedSite}
          progress={
            genProgress
              ? {
                  stage: genProgress.stage,
                  percent: genProgress.percent,
                  message: genProgress.message,
                  updatedAt: new Date().toISOString(),
                }
              : job?.progress ?? null
          }
          busy={busy}
          businessSummary={prompt}
          pageCount={job?.generatedSite?.pages.length ?? 0}
          sectionCount={sectionCount}
          refineInput={refineInput}
          onRefineInput={setRefineInput}
          onRefine={() => void generate(refineInput)}
          siteName={businessName || "Website"}
          domainLabel={job?.preferences.deployment.domain.selectedDomain}
          featureCount={features.length}
          hostingSlot={
            job ? (
              <HostingCheckoutPanel
                instanceType={job.preferences.deployment.ec2.instanceType}
                buildJobId={job.id}
                domain={job.preferences.deployment.domain.selectedDomain}
                onInstanceTypeChange={(instanceType) =>
                  void patchDeployment({ instanceType })
                }
              />
            ) : null
          }
        />
      </div>
    );
  }

  /* ---- Wizard ---- */
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[hsl(222_28%_6%)] md:flex-row">
      <BuildWizardRail
        step={step}
        completed={completed}
        onSelect={(id) => {
          const order = BUILD_WIZARD_STEPS.map((s) => s.id);
          const target = order.indexOf(id);
          const current = order.indexOf(step);
          if (target <= current || completed.has(id)) {
            setStep(id);
            syncLocalCache(job?.id, id);
          }
        }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
          {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

          {step === "about" && (
            <div className="animate-fade-up space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                  About Your Site
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Tell us what your website is all about — AI will understand the business.
                </p>
              </div>

              {(draftJobs.length > 0 || generatedJobs.length > 0) && (
                <div className="rounded-2xl border border-border bg-surface-elevated/70 p-4">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5 text-gold" />
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">
                      Continue where you left off
                    </p>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {[...draftJobs, ...generatedJobs]
                      .filter((item, i, a) => a.findIndex((j) => j.id === item.id) === i)
                      .slice(0, 4)
                      .map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2"
                        >
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => {
                              hydrateFromJob(item);
                              router.replace(`/build?job=${item.id}`);
                            }}
                          >
                            <p className="truncate text-sm font-medium text-foreground">
                              {item.preferences.businessName}
                            </p>
                            <p className="text-[10px] text-dim">
                              {formatDraftTime(item.updatedAt)}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => void discardJob(item.id)}
                            className="rounded-lg p-1.5 text-dim hover:text-foreground"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="We sell handmade wooden toys for kids of all ages. Our toys are safe, educational and fun."
                className="w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base leading-relaxed text-foreground outline-none placeholder:text-dim focus:border-gold/40"
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setPrompt((prev) =>
                        prev.includes(tag) ? prev : prev ? `${prev} (${tag})` : tag
                      )
                    }
                    className="rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs text-muted hover:border-gold/40 hover:text-foreground"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setPrompt(ex.prompt);
                      setBusinessName(ex.prompt.split(/[—–\-:]/)[0]?.trim() || "");
                    }}
                    className="rounded-full border border-border px-3 py-1.5 text-[11px] text-dim hover:text-foreground"
                  >
                    Example: {ex.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={prompt.trim().length < 12}
                  onClick={() => {
                    setStep("name");
                    syncLocalCache(job?.id, "name");
                  }}
                >
                  Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === "name" && (
            <div className="animate-fade-up space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Site Name</h2>
                <p className="mt-2 text-sm text-muted">
                  Name your site — AI will shape logo style, fonts, and brand vibe.
                </p>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1.2fr_0.9fr]">
                <div className="space-y-4">
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Toy Haven"
                    className="w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-lg text-foreground outline-none placeholder:text-dim focus:border-gold/40"
                  />
                  <div className="rounded-2xl border border-border bg-surface-elevated p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-dim">
                      Audience
                    </p>
                    <input
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="Parents, gift buyers…"
                      className="mt-3 w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-dim"
                    />
                  </div>
                  <div className="rounded-2xl border border-border bg-surface-elevated p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-dim">
                      Brand vibe
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TONE_VIBES.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setTone(v.id)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs transition",
                            tone === v.id
                              ? "border-gold bg-gold/15 text-gold-bright"
                              : "border-border text-muted hover:border-gold/35"
                          )}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface-elevated p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-dim">
                    Brand preview
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-black"
                      style={{ background: customTheme.accentColor }}
                    >
                      {(businessName.trim() || "A").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">
                        {businessName.trim() || "Your brand"}
                      </p>
                      <p className="text-xs text-muted">
                        {TONE_VIBES.find((v) => v.id === tone)?.label ?? "Friendly"} · DM Sans
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="text-[10px] uppercase tracking-wide text-dim">Palette</p>
                    <div className="mt-2 flex gap-2">
                      {[
                        customTheme.primaryColor,
                        customTheme.accentColor,
                        customTheme.backgroundColor,
                        "#1A2B48",
                      ].map((color, i) => (
                        <span
                          key={`${color}-${i}`}
                          className="h-8 w-8 rounded-full border border-border"
                          style={{ background: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl border border-border bg-surface-muted px-3 py-3">
                    <p className="text-[10px] uppercase tracking-wide text-dim">Sample headline</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {businessName.trim()
                        ? `${businessName.trim()} — crafted for ${audience.trim() || "your customers"}`
                        : "Your story, designed by AI"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep("about")}>
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={businessName.trim().length < 2}
                  onClick={() => {
                    setStep("goals");
                    syncLocalCache(job?.id, "goals");
                  }}
                >
                  Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === "goals" && (
            <div className="animate-fade-up space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Goals</h2>
                <p className="mt-2 text-sm text-muted">
                  What should this website help you achieve?
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {GOAL_OPTIONS.map((goal) => {
                  const on = goals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setGoals((prev) => toggle(prev, goal))}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition",
                        on
                          ? "border-gold bg-gold/10 ring-1 ring-gold/30"
                          : "border-border bg-surface-elevated hover:border-gold/35"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{goal}</p>
                        {on ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-black">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep("name")}>
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={!goals.length}
                  onClick={() => {
                    setStep("apps");
                    syncLocalCache(job?.id, "apps");
                  }}
                >
                  Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === "apps" && (
            <div className="animate-fade-up space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Add Apps</h2>
                <p className="mt-2 text-sm text-muted">
                  Choose features to include on your site.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {APP_OPTIONS.map((app) => {
                  const on = features.includes(app.id);
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setFeatures((prev) => toggle(prev, app.id))}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition",
                        on
                          ? "border-gold bg-gold/10 ring-1 ring-gold/30"
                          : "border-border bg-surface-elevated hover:border-gold/35"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{app.label}</p>
                          <p className="mt-1 text-xs text-muted">{app.description}</p>
                        </div>
                        {on ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-black">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-foreground"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Inspiration images
                  {screenshots.length ? ` (${screenshots.length})` : ""}
                </button>
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep("goals")}>
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={designsBusy}
                  onClick={() => void proposeDesigns()}
                >
                  {designsBusy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Designing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate designs
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "designs" && (
            <div className="animate-fade-up">
              {designOptions.length ? (
                <DesignOptionsPicker
                  options={designOptions}
                  selectedId={selectedDesignOptionId}
                  busy={busy || designsBusy}
                  onSelect={(id) => {
                    setSelectedDesignOptionId(id);
                    syncLocalCache(job?.id, "designs");
                  }}
                  onConfirm={() => {
                    setStep("domain");
                    syncLocalCache(job?.id, "domain");
                  }}
                  onBack={() => setStep("apps")}
                  confirmLabel="Continue to domain"
                />
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted">No designs yet.</p>
                  <Button type="button" onClick={() => void proposeDesigns()}>
                    Generate designs
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "domain" && (
            <div className="animate-fade-up space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Domain</h2>
                <p className="mt-2 text-sm text-muted">
                  Search for a domain or connect one you already own.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-elevated p-4">
                <DomainPurchasePanel
                  businessName={businessName || "yoursite"}
                  countryBase="UK"
                  domain={
                    job?.preferences.deployment.domain ?? {
                      status: "none",
                      currency: "GBP",
                      autoRenew: true,
                    }
                  }
                  buildJobId={job?.id}
                  onDomainChange={applyDomainChange}
                />
              </div>
              {job ? (
                <div className="rounded-2xl border border-border bg-surface-elevated p-4">
                  <p className="text-sm font-semibold text-foreground">Hosting</p>
                  <p className="mt-1 mb-3 text-xs text-muted">
                    Subscribe to Aarvanta Hosting. Payments run through Stripe Checkout.
                  </p>
                  <HostingCheckoutPanel
                    instanceType={job.preferences.deployment.ec2.instanceType}
                    buildJobId={job.id}
                    domain={job.preferences.deployment.domain.selectedDomain}
                    onInstanceTypeChange={(instanceType) =>
                      void patchDeployment({ instanceType })
                    }
                  />
                </div>
              ) : null}
              <div className="flex justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep("designs")}>
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={busy || !selectedDesignOptionId}
                  onClick={() => void generate()}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Building…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Build website
                    </>
                  )}
                </Button>
              </div>
              <p className="text-center text-[11px] text-dim">
                {usedAi ? "AI-enhanced" : "Demo heuristics available"} · Domain is optional — you
                can skip and build now.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
