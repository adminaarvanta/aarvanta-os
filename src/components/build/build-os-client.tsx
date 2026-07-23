"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  Clock3,
  Heart,
  ImagePlus,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Loader2,
  MapPin,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
  Wand2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { DomainPurchasePanel } from "@/components/build/domain-purchase-panel";
import { GeneratedSitePreview } from "@/components/build/generated-site-preview";
import { HostingCheckoutPanel } from "@/components/build/hosting-checkout-panel";
import { ThemeStylePanel } from "@/components/build/theme-style-panel";
import { TemplateLayoutPreview } from "@/components/build/template-layout-preview";
import { Button } from "@/components/ui/button";
import {
  clearComposeDraftCache,
  readComposeDraftCache,
  writeComposeDraftCache,
  type ComposeStep,
} from "@/lib/site-builder/compose-draft-cache";
import { buildEc2DeployNotes } from "@/lib/site-builder/ec2-deploy-notes";
import { EXAMPLE_PROMPTS, inferPreferencesFromPrompt } from "@/lib/site-builder/infer-preferences";
import { SITE_CATEGORIES } from "@/lib/site-builder/templates/categories";
import {
  getTemplateById,
  getTemplatesForCategory,
} from "@/lib/site-builder/templates/catalog";
import {
  defaultCustomThemeFromPreset,
  resolveSiteThemeWithBrand,
} from "@/lib/site-builder/theme-presets";
import type {
  AwsEc2InstanceType,
  PagePlanCandidate,
  SiteCategoryId,
  SiteCustomTheme,
  SiteDomainPurchase,
  SiteFeatureOption,
  SiteGenerationStage,
  SitePageOption,
  SitePreferences,
  SiteReferenceScreenshot,
  SiteThemePreset,
  SiteTone,
} from "@/types/site-builder";

const MAX_SCREENSHOTS = 3;
const MAX_SCREENSHOT_BYTES = 1_500_000;
const DRAFT_AUTOSAVE_MS = 800;

type StudioPhase = "compose" | "studio";

const GENERATION_STAGES: Array<{ id: SiteGenerationStage; label: string }> = [
  { id: "business", label: "Business" },
  { id: "brand", label: "Brand" },
  { id: "pages", label: "Pages" },
  { id: "layout", label: "Layout" },
  { id: "content", label: "Copy" },
  { id: "media", label: "Images" },
  { id: "done", label: "Done" },
];

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "shopping-bag": ShoppingBag,
  layers: Layers,
  "map-pin": MapPin,
  briefcase: Briefcase,
  utensils: Utensils,
  "heart-pulse": Activity,
  sparkles: Sparkles,
  image: ImageIcon,
  "hand-heart": Heart,
  "book-open": BookOpen,
  calendar: Calendar,
  "layout-dashboard": LayoutDashboard,
};

const TONE_OPTIONS: Array<{ id: SiteTone; label: string }> = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "bold", label: "Bold" },
  { id: "luxury", label: "Luxury" },
];

const PAGE_OPTIONS: Array<{ id: SitePageOption; label: string }> = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "pricing", label: "Pricing" },
  { id: "products", label: "Products" },
  { id: "portfolio", label: "Portfolio" },
  { id: "testimonials", label: "Testimonials" },
  { id: "faq", label: "FAQ" },
  { id: "blog", label: "Blog" },
  { id: "contact", label: "Contact" },
];

const FEATURE_OPTIONS: Array<{ id: SiteFeatureOption; label: string }> = [
  { id: "contact_form", label: "Contact form" },
  { id: "booking", label: "Booking" },
  { id: "ecommerce", label: "Ecommerce" },
  { id: "newsletter", label: "Newsletter" },
  { id: "testimonials", label: "Testimonials" },
  { id: "blog", label: "Blog" },
  { id: "live_chat", label: "Live chat" },
  { id: "analytics", label: "Analytics" },
  { id: "seo_pack", label: "SEO pack" },
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

export function BuildOsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobParam = searchParams.get("job");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const themeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  const jobRef = useRef<import("@/types/site-builder").SiteBuildJob | null>(null);

  const [phase, setPhase] = useState<StudioPhase>("compose");
  const [step, setStep] = useState<ComposeStep>("brief");

  const [categoryId, setCategoryId] = useState<SiteCategoryId | null>(null);
  const [customCategoryLabel, setCustomCategoryLabel] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<SiteTone>("professional");
  const [pages, setPages] = useState<SitePageOption[]>(["home", "about", "contact"]);
  const [features, setFeatures] = useState<SiteFeatureOption[]>(["contact_form"]);
  const [pageCandidates, setPageCandidates] = useState<PagePlanCandidate[]>([]);

  const [themePreset, setThemePreset] = useState<SiteThemePreset>("gold_navy");
  const [customTheme, setCustomTheme] = useState<SiteCustomTheme>(() =>
    defaultCustomThemeFromPreset("gold_navy")
  );
  const [screenshots, setScreenshots] = useState<SiteReferenceScreenshot[]>([]);

  const [refineInput, setRefineInput] = useState("");
  const [job, setJob] = useState<import("@/types/site-builder").SiteBuildJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<import("@/types/site-builder").SiteBuildJob[]>([]);
  const [busy, setBusy] = useState(false);
  const [genProgress, setGenProgress] = useState<{
    stage: SiteGenerationStage;
    percent: number;
    message: string;
  } | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);

  useEffect(() => {
    jobRef.current = job;
  }, [job]);

  const hydrateFromJob = useCallback((next: import("@/types/site-builder").SiteBuildJob) => {
    setJob(next);
    setUsedAi(next.usedAi ?? false);
    setPrompt(next.preferences.customPrompt ?? next.preferences.businessIdea);
    setBusinessName(next.preferences.businessName ?? "");
    setAudience(next.preferences.targetAudience ?? "");
    setTone(next.preferences.tone);
    setPages(next.preferences.pages ?? ["home", "about", "contact"]);
    setFeatures(next.preferences.features ?? ["contact_form"]);
    setPageCandidates(next.preferences.pageCandidates ?? next.plan?.pageCandidates ?? []);
    setCategoryId(next.preferences.categoryId ?? null);
    setCustomCategoryLabel(next.preferences.customCategoryLabel ?? "");
    setTemplateId(next.preferences.templateId ?? null);
    setThemePreset(next.preferences.themePreset);
    setCustomTheme(
      next.preferences.customTheme ??
        defaultCustomThemeFromPreset(
          next.preferences.themePreset === "custom" ? "gold_navy" : next.preferences.themePreset
        )
    );
    const cache = readComposeDraftCache();
    if (cache?.jobId === next.id && cache.screenshots?.length) {
      setScreenshots(cache.screenshots);
    } else {
      setScreenshots(next.preferences.referenceScreenshots ?? []);
    }
    if (next.generatedSite) {
      setPhase("studio");
    } else {
      setPhase("compose");
      setStep(next.preferences.categoryId && next.preferences.templateId ? "brief" : "category");
    }
    setDraftSavedAt(next.updatedAt);
  }, []);

  const loadJob = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/build/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as { job: import("@/types/site-builder").SiteBuildJob };
      hydrateFromJob(data.job);
    },
    [hydrateFromJob]
  );

  const refreshJobList = useCallback(async () => {
    const res = await fetch("/api/build");
    if (!res.ok) return;
    const data = (await res.json()) as { jobs: import("@/types/site-builder").SiteBuildJob[] };
    setRecentJobs(data.jobs.slice(0, 8));
  }, []);

  // Initial hydrate: URL job, else local cache + recent drafts list.
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
      if (cache?.prompt || cache?.categoryId) {
        setPrompt(cache.prompt);
        setCategoryId(cache.categoryId);
        setCustomCategoryLabel(cache.customCategoryLabel ?? "");
        setTemplateId(cache.templateId);
        setStep(cache.step ?? "category");
        setThemePreset(cache.themePreset);
        setCustomTheme(cache.customTheme);
        setScreenshots(cache.screenshots ?? []);
        if (cache.jobId) {
          await loadJob(cache.jobId);
          setPhase("compose");
          setStep(cache.step ?? "brief");
        }
      }
    })();
  }, [jobParam, loadJob, refreshJobList]);

  // Keep URL job in sync when navigating with ?job=
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (jobParam && jobParam !== jobRef.current?.id) {
      void loadJob(jobParam);
    }
  }, [jobParam, loadJob]);

  /** Build preferences — category/template optional (ARIA auto-infers). */
  const buildPreferences = useCallback(
    (extraPrompt?: string): SitePreferences => {
      const mergedPrompt = [prompt.trim(), extraPrompt?.trim()].filter(Boolean).join("\n\n");
      const safePrompt = mergedPrompt || "Untitled draft";
      const includedFromCandidates = pageCandidates
        .filter((c) => c.include)
        .map((c) => c.slug as SitePageOption);
      return inferPreferencesFromPrompt(safePrompt, {
        categoryId: categoryId ?? undefined,
        templateId: templateId ?? undefined,
        customCategoryLabel:
          categoryId === "custom" && customCategoryLabel.trim().length >= 2
            ? customCategoryLabel.trim()
            : undefined,
        businessName: businessName.trim() || undefined,
        targetAudience: audience.trim() || undefined,
        tone,
        pages: includedFromCandidates.length
          ? includedFromCandidates
          : pages.length
            ? pages
            : undefined,
        features,
        themePreset,
        customTheme,
        customPrompt: mergedPrompt || undefined,
        referenceScreenshots: screenshots,
        pageCandidates: pageCandidates.length ? pageCandidates : undefined,
        deployment: jobRef.current?.preferences.deployment,
        businessProfile: jobRef.current?.preferences.businessProfile,
        brandSystem: jobRef.current?.preferences.brandSystem,
      });
    },
    [
      categoryId,
      templateId,
      customCategoryLabel,
      prompt,
      businessName,
      audience,
      tone,
      pages,
      features,
      themePreset,
      customTheme,
      screenshots,
      pageCandidates,
    ]
  );

  const syncLocalCache = useCallback(
    (jobId?: string, nextStep?: ComposeStep) => {
      writeComposeDraftCache({
        jobId: jobId ?? jobRef.current?.id,
        prompt,
        siteType: null,
        categoryId,
        customCategoryLabel: customCategoryLabel || undefined,
        templateId,
        step: nextStep ?? step,
        themePreset,
        customTheme,
        screenshots,
        savedAt: new Date().toISOString(),
      });
    },
    [prompt, categoryId, customCategoryLabel, templateId, step, themePreset, customTheme, screenshots]
  );

  const saveDraft = useCallback(async () => {
    if (prompt.trim().length < 3) return;

    const preferences = buildPreferences();

    setDraftSaving(true);
    try {
      const current = jobRef.current;
      if (current) {
        const res = await fetch(`/api/build/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...preferences, referenceScreenshots: [] }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { job: import("@/types/site-builder").SiteBuildJob };
        setJob((prev) =>
          prev
            ? {
                ...data.job,
                generatedSite: prev.generatedSite ?? data.job.generatedSite,
                plan: prev.plan ?? data.job.plan,
              }
            : data.job
        );
        setDraftSavedAt(data.job.updatedAt);
        syncLocalCache(data.job.id);
      } else {
        const res = await fetch("/api/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...preferences, referenceScreenshots: [], mode: "draft" }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { job: import("@/types/site-builder").SiteBuildJob };
        setJob(data.job);
        setDraftSavedAt(data.job.updatedAt);
        syncLocalCache(data.job.id);
        router.replace(`/build?job=${data.job.id}`);
      }
      void refreshJobList();
    } finally {
      setDraftSaving(false);
    }
  }, [categoryId, templateId, prompt, buildPreferences, syncLocalCache, router, refreshJobList]);

  // Debounced auto-save for the brief step.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (phase !== "compose" || step !== "brief") return;

    syncLocalCache(job?.id);

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      void saveDraft();
    }, DRAFT_AUTOSAVE_MS);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, businessName, audience, tone, pages, features, themePreset, customTheme, screenshots, phase, step]);

  async function persistThemeDraft(nextPreset: SiteThemePreset, nextCustom: SiteCustomTheme) {
    const current = jobRef.current;
    if (!current) return;
    const preferences = {
      ...current.preferences,
      themePreset: nextPreset,
      customTheme: nextCustom,
      referenceScreenshots: [],
    };
    const res = await fetch(`/api/build/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { job: import("@/types/site-builder").SiteBuildJob };
    setDraftSavedAt(data.job.updatedAt);
    syncLocalCache(current.id);
  }

  async function persistDomainDraft(domain: SiteDomainPurchase) {
    const current = jobRef.current;
    if (!current) return;
    const preferences = {
      ...current.preferences,
      deployment: { ...current.preferences.deployment, domain },
      referenceScreenshots: [],
    };
    const res = await fetch(`/api/build/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { job: import("@/types/site-builder").SiteBuildJob };
    setDraftSavedAt(data.job.updatedAt);
    syncLocalCache(current.id);
  }

  /** Attach buy / bring-your-own domain without regenerating the site preview. */
  function applyDomainChange(domain: SiteDomainPurchase) {
    setJob((current) => {
      if (!current) return current;
      const deployment = { ...current.preferences.deployment, domain };
      const preferences = { ...current.preferences, deployment };
      const businessSlug = current.preferences.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48);
      const slug = current.generatedSite?.slug || businessSlug || "my-site";
      const liveUrl = domain.selectedDomain ? `https://${domain.selectedDomain}` : undefined;
      const previewUrl = liveUrl ?? `https://${slug}.sites.aarvanta.cloud`;
      return {
        ...current,
        preferences,
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
    void persistDomainDraft(domain);
  }

  /** Change colors/fonts live without regenerating content. */
  function applyThemeLive(nextPreset: SiteThemePreset, nextCustom: SiteCustomTheme) {
    setThemePreset(nextPreset);
    setCustomTheme(nextCustom);
    setJob((current) => {
      if (!current?.generatedSite) return current;
      const preferences = { ...current.preferences, themePreset: nextPreset, customTheme: nextCustom };
      return {
        ...current,
        preferences,
        generatedSite: { ...current.generatedSite, theme: resolveSiteThemeWithBrand(preferences) },
        plan: current.plan ? { ...current.plan, theme: resolveSiteThemeWithBrand(preferences) } : current.plan,
      };
    });

    if (themeTimerRef.current) clearTimeout(themeTimerRef.current);
    themeTimerRef.current = setTimeout(() => {
      void persistThemeDraft(nextPreset, nextCustom);
    }, DRAFT_AUTOSAVE_MS);
  }

  async function generate(extraPrompt?: string) {
    if (categoryId === "custom" && customCategoryLabel.trim().length < 2) {
      setError("Name your custom category before generating.");
      return;
    }
    if (!prompt.trim() || prompt.trim().length < 12) {
      setError("Describe your business in a sentence or two — at least a dozen characters.");
      return;
    }

    const preferences = buildPreferences(extraPrompt);

    setBusy(true);
    setError(null);
    setGenProgress({ stage: "business", percent: 0, message: "Starting…" });
    try {
      // Ensure we have a job id for the streaming generate endpoint
      let jobId = job?.id;
      if (!jobId) {
        const createRes = await fetch("/api/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...preferences, mode: "draft" }),
        });
        if (!createRes.ok) {
          const body = (await createRes.json()) as { error?: { message?: string } };
          setError(body.error?.message ?? "Could not create build job.");
          return;
        }
        const created = (await createRes.json()) as {
          job: import("@/types/site-builder").SiteBuildJob;
        };
        jobId = created.job.id;
        setJob(created.job);
      }

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
      let finalUsedAi = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            const payload = JSON.parse(line.slice(6)) as {
              type: string;
              stage?: SiteGenerationStage;
              percent?: number;
              message?: string;
              job?: import("@/types/site-builder").SiteBuildJob;
              usedAi?: boolean;
              partial?: {
                pageCandidates?: PagePlanCandidate[];
                site?: import("@/types/site-builder").GeneratedSite;
                business?: SitePreferences["businessProfile"];
                brand?: SitePreferences["brandSystem"];
              };
            };

            if (payload.type === "progress") {
              setGenProgress({
                stage: payload.stage ?? "business",
                percent: payload.percent ?? 0,
                message: payload.message ?? "",
              });
              if (payload.partial?.pageCandidates) {
                setPageCandidates(payload.partial.pageCandidates);
              }
              if (payload.partial?.site) {
                setJob((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: "generating",
                        generatedSite: payload.partial!.site,
                        preferences: {
                          ...prev.preferences,
                          businessProfile:
                            payload.partial?.business ?? prev.preferences.businessProfile,
                          brandSystem: payload.partial?.brand ?? prev.preferences.brandSystem,
                          pageCandidates:
                            payload.partial?.pageCandidates ?? prev.preferences.pageCandidates,
                        },
                      }
                    : prev
                );
                setPhase("studio");
              }
            } else if (payload.type === "complete" && payload.job) {
              finalJob = payload.job;
              finalUsedAi = payload.usedAi ?? false;
            } else if (payload.type === "error") {
              setError(
                (payload as { message?: string }).message ?? "Generation failed."
              );
              if (payload.job) setJob(payload.job);
            }
          } catch {
            /* ignore malformed SSE */
          }
        }
      }

      if (finalJob) {
        setJob(finalJob);
        setUsedAi(finalUsedAi);
        setPageCandidates(
          finalJob.preferences.pageCandidates ?? finalJob.plan?.pageCandidates ?? []
        );
        setPhase("studio");
        setRefineInput("");
        setDraftSavedAt(finalJob.updatedAt);
        syncLocalCache(finalJob.id);
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
    setError(null);
    const remaining = MAX_SCREENSHOTS - screenshots.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_SCREENSHOTS} reference images.`);
      return;
    }

    const toAdd: SiteReferenceScreenshot[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_SCREENSHOT_BYTES) {
        setError("Each image must be under 1.5 MB.");
        continue;
      }
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

  function resetComposeState() {
    setJob(null);
    setCategoryId(null);
    setTemplateId(null);
    setPrompt("");
    setBusinessName("");
    setAudience("");
    setTone("professional");
    setPages(["home", "about", "contact"]);
    setFeatures(["contact_form"]);
    setPageCandidates([]);
    setThemePreset("gold_navy");
    setCustomTheme(defaultCustomThemeFromPreset("gold_navy"));
    setScreenshots([]);
    setRefineInput("");
    setError(null);
    setDraftSavedAt(null);
    setGenProgress(null);
    setStep("brief");
    setPhase("compose");
  }

  async function discardJob(id: string) {
    await fetch(`/api/build/${id}`, { method: "DELETE" });
    if (job?.id === id) {
      clearComposeDraftCache();
      resetComposeState();
      router.replace("/build");
    }
    void refreshJobList();
  }

  function startOver() {
    clearComposeDraftCache();
    resetComposeState();
    router.replace("/build");
    void refreshJobList();
  }

  function resumeJob(item: import("@/types/site-builder").SiteBuildJob) {
    router.replace(`/build?job=${item.id}`);
    hydrateFromJob(item);
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
    try {
      const res = await fetch(`/api/build/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextPreferences),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { job: import("@/types/site-builder").SiteBuildJob };
      const merged = {
        ...data.job,
        generatedSite: data.job.generatedSite ?? current.generatedSite,
        plan: data.job.plan ?? current.plan,
      };
      setJob(merged);
      jobRef.current = merged;
    } catch {
      // Keep optimistic local state; draft autosave may retry later.
    }
  }

  /* ---- Step transitions ---- */

  function selectCategory(id: SiteCategoryId) {
    setCategoryId(id);
    setTemplateId(null);
    if (id !== "custom") {
      setCustomCategoryLabel("");
      setStep("template");
      syncLocalCache(job?.id, "template");
      return;
    }
    // Stay on category step so the user can name their niche first.
    setStep("category");
    syncLocalCache(job?.id, "category");
  }

  function continueCustomCategory() {
    if (customCategoryLabel.trim().length < 2) return;
    setStep("template");
    syncLocalCache(job?.id, "template");
  }

  function selectTemplate(id: string) {
    const tpl = getTemplateById(id);
    setTemplateId(id);
    if (tpl) {
      setTone(tpl.defaultTone);
      setPages(tpl.defaultPages);
      setFeatures(tpl.defaultFeatures);
      const preset = tpl.defaultTheme;
      setThemePreset(preset);
      setCustomTheme(defaultCustomThemeFromPreset(preset === "custom" ? "gold_navy" : preset));
    }
    setStep("brief");
    syncLocalCache(job?.id, "brief");
  }

  function applyExample(example: (typeof EXAMPLE_PROMPTS)[number]) {
    const tpl = getTemplateById(example.templateId);
    setCategoryId(example.categoryId);
    setCustomCategoryLabel("");
    setTemplateId(example.templateId);
    setPrompt(example.prompt);
    if (tpl) {
      setTone(tpl.defaultTone);
      setPages(tpl.defaultPages);
      setFeatures(tpl.defaultFeatures);
      const preset = tpl.defaultTheme;
      setThemePreset(preset);
      setCustomTheme(defaultCustomThemeFromPreset(preset === "custom" ? "gold_navy" : preset));
    }
    setStep("brief");
    syncLocalCache(job?.id, "brief");
  }

  const draftJobs = recentJobs.filter((j) => j.status === "draft" || !j.generatedSite);
  const generatedJobs = recentJobs.filter((j) => Boolean(j.generatedSite));
  const canGenerate = Boolean(
    prompt.trim().length >= 12 &&
      (categoryId !== "custom" || customCategoryLabel.trim().length >= 2)
  );

  /* ================================================================ */
  /* Studio                                                            */
  /* ================================================================ */

  if (phase === "studio" && (job?.generatedSite || busy)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex max-h-[42vh] w-full shrink-0 flex-col border-b border-border bg-surface lg:max-h-none lg:w-[380px] lg:border-b-0 lg:border-r">
          <div className="border-b border-border-subtle px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              Build OS Studio
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {job?.generatedSite?.siteName ?? (businessName || "Building your site")}
            </h2>
            <p className="mt-1 line-clamp-2 text-xs text-muted">
              {job?.plan?.summary ??
                job?.preferences.businessProfile?.industry ??
                "Your site preview is ready. Refine with natural language."}
            </p>
            <p className="mt-2 text-[10px] text-dim">
              {draftSaving
                ? "Saving draft…"
                : draftSavedAt
                  ? `Draft saved · ${formatDraftTime(draftSavedAt)}`
                  : usedAi
                    ? "AI-enhanced generation"
                    : "Autosave on"}
            </p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {genProgress || busy ? (
              <div className="rounded-xl border border-border bg-surface-muted p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-dim">
                  Generating
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {genProgress?.message ?? "Working…"}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-500"
                    style={{ width: `${genProgress?.percent ?? 8}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {GENERATION_STAGES.filter((s) => s.id !== "done").map((s) => {
                    const active = genProgress?.stage === s.id;
                    const doneIdx = GENERATION_STAGES.findIndex(
                      (x) => x.id === genProgress?.stage
                    );
                    const thisIdx = GENERATION_STAGES.findIndex((x) => x.id === s.id);
                    const complete = doneIdx > thisIdx;
                    return (
                      <span
                        key={s.id}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          active
                            ? "bg-gold/20 text-gold"
                            : complete
                              ? "text-foreground"
                              : "text-dim"
                        }`}
                      >
                        {s.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {pageCandidates.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-foreground">Pages</p>
                <p className="mb-2 text-[11px] text-dim">
                  Confidence-scored plan — toggle pages, then regenerate to apply.
                </p>
                <div className="space-y-1.5">
                  {pageCandidates.map((c) => (
                    <label
                      key={c.slug}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-2 text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={c.include}
                          onChange={() => {
                            setPageCandidates((prev) =>
                              prev.map((p) =>
                                p.slug === c.slug ? { ...p, include: !p.include } : p
                              )
                            );
                          }}
                        />
                        <span className="text-foreground">{c.title}</span>
                      </span>
                      <span className="tabular-nums text-dim">{Math.round(c.confidence)}%</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {job?.preferences.businessProfile ? (
              <div className="rounded-xl border border-border bg-surface-muted p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-dim">
                  Business intel
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {job.preferences.businessProfile.industry} ·{" "}
                  {job.preferences.businessProfile.subcategory}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Goal: {job.preferences.businessProfile.primaryGoal} · Tone:{" "}
                  {job.preferences.businessProfile.brandTone}
                </p>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Customize theme</p>
              <ThemeStylePanel
                compact
                themePreset={themePreset}
                customTheme={customTheme}
                onChange={({ themePreset: nextPreset, customTheme: nextCustom }) =>
                  applyThemeLive(nextPreset, nextCustom)
                }
              />
              <p className="mt-2 text-[11px] text-dim">
                Colors and fonts update instantly and stay saved with this draft.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Refine with AI</p>
              <textarea
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                rows={3}
                placeholder="Make the hero warmer… Add pricing… More luxury tone…"
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-dim"
              />
              <Button
                type="button"
                className="mt-2 w-full"
                onClick={() => void generate(refineInput)}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Update preview
                  </>
                )}
              </Button>
            </div>

            {job ? (
              <>
                <div>
                  <p className="mb-2 text-xs font-medium text-foreground">Domain</p>
                  <p className="mb-3 text-[11px] text-dim">
                    Buy through Aarvanta, or connect a domain you already own — we&apos;ll show the DNS
                    records for your provider.
                  </p>
                  <DomainPurchasePanel
                    businessName={
                      job.preferences.businessName || job.generatedSite?.siteName || "yoursite"
                    }
                    countryBase={job.preferences.countryBase}
                    domain={job.preferences.deployment.domain}
                    buildJobId={job.id}
                    onDomainChange={applyDomainChange}
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div>
                  <p className="mb-2 text-xs font-medium text-foreground">Hosting</p>
                  <p className="mb-3 text-[11px] text-muted">
                    Subscribe to Aarvanta Hosting. Payments run through Stripe Checkout.
                  </p>
                  <HostingCheckoutPanel
                    instanceType={job.preferences.deployment.ec2.instanceType}
                    buildJobId={job.id}
                    domain={job.preferences.deployment.domain.selectedDomain}
                    onInstanceTypeChange={(instanceType) => void patchDeployment({ instanceType })}
                  />
                </div>
              </>
            ) : null}

            <div className="rounded-xl border border-border bg-surface-muted p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-dim">Brief</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{prompt}</p>
            </div>
          </div>

          <div className="flex gap-2 border-t border-border-subtle p-4">
            <Button type="button" variant="secondary" onClick={startOver}>
              New site
            </Button>
            {job ? (
              <Link
                href={`/build/preview/${job.id}`}
                target="_blank"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold px-3 py-2.5 text-sm font-semibold text-black hover:bg-gold-bright"
              >
                Full preview
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </aside>

        <div className="min-h-0 flex-1 overflow-y-auto bg-background p-3 sm:p-5">
          {job?.generatedSite ? (
            <GeneratedSitePreview site={job.generatedSite} />
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
              <p className="mt-4 text-sm text-foreground">
                {genProgress?.message ?? "Building your website…"}
              </p>
              <p className="mt-1 text-xs text-dim">
                Business → Brand → Pages → Layout → Copy → Images
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /* Compose wizard                                                    */
  /* ================================================================ */

  const templatesForCategory = categoryId ? getTemplatesForCategory(categoryId) : [];
  const activeCategory = categoryId ? SITE_CATEGORIES.find((c) => c.id === categoryId) : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184,150,93,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 20%, rgba(77,166,255,0.08), transparent 45%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="animate-fade-up text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-primary-soft px-3 py-1 text-[11px] font-medium text-gold-bright">
            <Sparkles className="h-3.5 w-3.5" />
            Build OS — AI website studio
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {step === "category"
              ? "Optional: pick a style category"
              : step === "template"
                ? "Optional: pick a layout prior"
                : "What is your site all about?"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            {step === "category"
              ? "Skip this if you want — AI will infer industry and pages from your brief."
              : step === "template"
                ? `Templates seed section layouts for ${activeCategory?.label ?? "your category"}. Or skip and let AI plan.`
                : "Tell us about the business. AI builds brand, pages, copy, and imagery — templates are optional."}
          </p>
        </div>

        {/* Stepper */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium">
          {(["brief", "category", "template"] as ComposeStep[]).map((s, i) => {
            const order = ["brief", "category", "template"] as ComposeStep[];
            const idx = order.indexOf(step);
            const done = i < idx;
            const on = s === step;
            return (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
                    on
                      ? "bg-gold text-black"
                      : done
                        ? "bg-primary-soft text-gold-bright"
                        : "border border-border text-dim"
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                  {s === "category" ? "Category" : s === "template" ? "Template" : "Brief"}
                </span>
                {i < 2 ? <span className="text-dim">·</span> : null}
              </div>
            );
          })}
        </div>

        {/* Resume list — on brief (primary entry) */}
        {step === "brief" && (draftJobs.length > 0 || generatedJobs.length > 0) && (
          <div className="mt-8 animate-fade-up rounded-2xl border border-border bg-surface-elevated/70 p-4">
            <div className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-gold" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">
                Continue where you left off
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              {[...draftJobs, ...generatedJobs]
                .filter((item, idx, a) => a.findIndex((j) => j.id === item.id) === idx)
                .slice(0, 5)
                .map((item) => {
                  const label =
                    item.preferences.businessName ||
                    item.preferences.businessIdea.slice(0, 48) ||
                    "Untitled draft";
                  const isDraft = item.status === "draft" || !item.generatedSite;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted/60 px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => resumeJob(item)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-medium text-foreground">{label}</p>
                        <p className="text-[10px] text-dim">
                          {isDraft ? "Draft" : "Generated"} · {formatDraftTime(item.updatedAt)}
                        </p>
                      </button>
                      <button
                        type="button"
                        aria-label={`Discard ${label}`}
                        onClick={() => void discardJob(item.id)}
                        className="rounded-lg p-1.5 text-dim hover:bg-surface hover:text-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

        {/* STEP: Category */}
        {step === "category" && (
          <div className="mt-8 animate-fade-up space-y-4">
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => setStep("brief")}>
                Skip — use AI planning
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SITE_CATEGORIES.map((card) => {
                const Icon = CATEGORY_ICONS[card.icon] ?? Sparkles;
                const active = categoryId === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => selectCategory(card.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active ? "border-gold bg-primary-soft" : "border-border bg-surface-elevated/60 hover:border-gold/35"
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-gold-bright">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">{card.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{card.description}</p>
                    <p className="mt-2 text-[10px] text-dim">{card.examples}</p>
                  </button>
                );
              })}
            </div>

            {categoryId === "custom" ? (
              <div className="rounded-2xl border border-border bg-surface-elevated/80 p-4">
                <p className="text-sm font-medium text-foreground">Name your category</p>
                <p className="mt-1 text-xs text-muted">
                  e.g. Pet grooming marketplace, B2B logistics directory, yoga retreat brand
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={customCategoryLabel}
                    onChange={(e) => setCustomCategoryLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") continueCustomCategory();
                    }}
                    placeholder="Your niche or category"
                    className="min-w-0 flex-1 rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-dim"
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={continueCustomCategory}
                    disabled={customCategoryLabel.trim().length < 2}
                  >
                    Choose template
                    <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* STEP: Template */}
        {step === "template" && (
          <div className="mt-8 animate-fade-up">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep("category")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to categories
              </button>
              <Button type="button" variant="secondary" onClick={() => setStep("brief")}>
                Skip to brief
              </Button>
            </div>
            {activeCategory ? (
              <p className="mb-4 text-sm text-muted">
                Templates for{" "}
                <span className="font-medium text-foreground">
                  {categoryId === "custom" && customCategoryLabel.trim()
                    ? customCategoryLabel.trim()
                    : activeCategory.label}
                </span>
                <span className="text-dim"> — open-source-inspired layouts with structural previews</span>
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {templatesForCategory.map((tpl) => {
                const active = templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => selectTemplate(tpl.id)}
                    className={`overflow-hidden rounded-2xl border text-left transition ${
                      active ? "border-gold ring-1 ring-gold/50" : "border-border hover:border-gold/35"
                    }`}
                  >
                    <TemplateLayoutPreview template={tpl} className="min-h-[140px]" />
                    <div className="bg-surface-elevated p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                        {active ? <Check className="h-4 w-4 text-gold" /> : null}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{tpl.description}</p>
                      <p className="mt-2 text-[10px] text-dim">{tpl.inspiredBy}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tpl.bestFor.map((b) => (
                          <span
                            key={b}
                            className="rounded-full border border-border px-2 py-0.5 text-[10px] text-dim"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP: Brief */}
        {step === "brief" && (
          <div className="mt-8 animate-fade-up space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("category")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground"
              >
                Optional: choose a style template
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              {activeCategory && templateId ? (
                <p className="text-xs text-dim">
                  <span className="text-muted">
                    {categoryId === "custom" && customCategoryLabel.trim()
                      ? customCategoryLabel.trim()
                      : activeCategory.label}
                  </span>{" "}
                  · <span className="text-muted">{getTemplateById(templateId)?.name}</span>
                </p>
              ) : (
                <p className="text-xs text-dim">No template selected — AI will plan structure</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface-elevated/90 p-3 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.55)] backdrop-blur sm:p-4">
              <label className="px-2 text-[11px] font-medium uppercase tracking-wide text-dim">
                Site name
              </label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Toy Haven"
                className="mb-3 w-full rounded-xl border-0 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-dim"
              />
              <label className="px-2 text-[11px] font-medium uppercase tracking-wide text-dim">
                What is your site all about?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. We sell educational toys online for parents and schools in India. Friendly brand, medium pricing."
                className="w-full resize-none rounded-xl border-0 bg-transparent px-2 py-2 text-base leading-relaxed text-foreground outline-none placeholder:text-dim sm:text-[15px]"
              />

              <div className="mt-2 flex flex-wrap gap-2 px-1">
                <span className="self-center text-[10px] font-medium uppercase tracking-wide text-dim">
                  Example briefs
                </span>
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => applyExample(ex)}
                    className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[11px] text-muted transition hover:border-gold/40 hover:text-foreground"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
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
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:border-gold/40 hover:text-foreground"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Inspiration
                    {screenshots.length > 0 ? ` (${screenshots.length})` : ""}
                  </button>
                  {screenshots.map((shot) => (
                    <span
                      key={shot.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-muted py-0.5 pl-1 pr-1.5 text-[10px] text-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shot.dataUrl} alt="" className="h-5 w-5 rounded object-cover" />
                      <button
                        type="button"
                        aria-label={`Remove ${shot.name}`}
                        onClick={() => setScreenshots((prev) => prev.filter((s) => s.id !== shot.id))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <span className="text-[10px] text-dim">
                    {draftSaving
                      ? "Saving draft…"
                      : draftSavedAt
                        ? `Draft saved · ${formatDraftTime(draftSavedAt)}`
                        : prompt.trim().length >= 3
                          ? "Draft will autosave"
                          : "Start typing to save a draft"}
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={() => void generate()}
                  disabled={busy || !canGenerate}
                  className="min-w-[140px]"
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate site
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && <p className="text-center text-xs text-red-400">{error}</p>}

            {/* Business details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground">Business name (optional)</span>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Auto-detected from your brief"
                  className="rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-dim"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground">Audience (optional)</span>
                <input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. UK homeowners, early-stage founders"
                  className="rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-dim"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground">Tone</span>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as SiteTone)}
                  className="rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Pages */}
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Pages</p>
              <div className="flex flex-wrap gap-2">
                {PAGE_OPTIONS.map((opt) => {
                  const on = pages.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPages((prev) => toggle(prev, opt.id))}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                        on ? "border-gold bg-primary-soft text-gold-bright" : "border-border text-muted hover:border-gold/40"
                      }`}
                    >
                      {on ? <Check className="h-3 w-3" /> : null}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Features</p>
              <div className="flex flex-wrap gap-2">
                {FEATURE_OPTIONS.map((opt) => {
                  const on = features.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFeatures((prev) => toggle(prev, opt.id))}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                        on ? "border-gold bg-primary-soft text-gold-bright" : "border-border text-muted hover:border-gold/40"
                      }`}
                    >
                      {on ? <Check className="h-3 w-3" /> : null}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme — secondary; template already set layout */}
            <details className="rounded-2xl border border-border bg-surface-elevated/50 open:pb-4">
              <summary className="cursor-pointer list-none px-4 py-3 text-xs font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                Optional colors & fonts
                <span className="ml-2 font-normal text-dim">
                  Template layout is fixed — tweak palette only if you want
                </span>
              </summary>
              <div className="px-4">
                <ThemeStylePanel
                  themePreset={themePreset}
                  customTheme={customTheme}
                  onChange={({ themePreset: nextPreset, customTheme: nextCustom }) => {
                    setThemePreset(nextPreset);
                    setCustomTheme(nextCustom);
                  }}
                />
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
