"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Clock3,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GeneratedSitePreview } from "@/components/build/generated-site-preview";
import { ThemeStylePanel } from "@/components/build/theme-style-panel";
import { Button } from "@/components/ui/button";
import {
  clearComposeDraftCache,
  readComposeDraftCache,
  writeComposeDraftCache,
} from "@/lib/site-builder/compose-draft-cache";
import {
  EXAMPLE_PROMPTS,
  inferPreferencesFromPrompt,
  SITE_TYPE_CARDS,
} from "@/lib/site-builder/infer-preferences";
import {
  defaultCustomThemeFromPreset,
  resolveSiteTheme,
} from "@/lib/site-builder/theme-presets";
import type {
  SiteBuildJob,
  SiteCustomTheme,
  SitePreferences,
  SiteReferenceScreenshot,
  SiteThemePreset,
  SiteType,
} from "@/types/site-builder";

const MAX_SCREENSHOTS = 3;
const MAX_SCREENSHOT_BYTES = 1_500_000;
const DRAFT_AUTOSAVE_MS = 800;

type StudioPhase = "compose" | "studio";

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

export function BuildOsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobParam = searchParams.get("job");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const themeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  const jobRef = useRef<SiteBuildJob | null>(null);

  const [phase, setPhase] = useState<StudioPhase>("compose");
  const [prompt, setPrompt] = useState("");
  const [siteType, setSiteType] = useState<SiteType | null>(null);
  const [themePreset, setThemePreset] = useState<SiteThemePreset>("gold_navy");
  const [customTheme, setCustomTheme] = useState<SiteCustomTheme>(() =>
    defaultCustomThemeFromPreset("gold_navy")
  );
  const [screenshots, setScreenshots] = useState<SiteReferenceScreenshot[]>([]);
  const [refineInput, setRefineInput] = useState("");
  const [job, setJob] = useState<SiteBuildJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<SiteBuildJob[]>([]);
  const [busy, setBusy] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);

  useEffect(() => {
    jobRef.current = job;
  }, [job]);

  const hydrateFromJob = useCallback((next: SiteBuildJob) => {
    setJob(next);
    setUsedAi(next.usedAi ?? false);
    setPrompt(next.preferences.customPrompt ?? next.preferences.businessIdea);
    setSiteType(next.preferences.siteType);
    setThemePreset(next.preferences.themePreset);
    setCustomTheme(
      next.preferences.customTheme ??
        defaultCustomThemeFromPreset(
          next.preferences.themePreset === "custom"
            ? "gold_navy"
            : next.preferences.themePreset
        )
    );
    const cache = readComposeDraftCache();
    if (cache?.jobId === next.id && cache.screenshots?.length) {
      setScreenshots(cache.screenshots);
    } else {
      setScreenshots(next.preferences.referenceScreenshots ?? []);
    }
    setPhase(next.generatedSite ? "studio" : "compose");
    setDraftSavedAt(next.updatedAt);
  }, []);

  const loadJob = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/build/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as { job: SiteBuildJob };
      hydrateFromJob(data.job);
    },
    [hydrateFromJob]
  );

  const refreshJobList = useCallback(async () => {
    const res = await fetch("/api/build");
    if (!res.ok) return;
    const data = (await res.json()) as { jobs: SiteBuildJob[] };
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
      if (cache?.prompt) {
        setPrompt(cache.prompt);
        setSiteType(cache.siteType);
        setThemePreset(cache.themePreset);
        setCustomTheme(cache.customTheme);
        setScreenshots(cache.screenshots ?? []);
        if (cache.jobId) {
          await loadJob(cache.jobId);
          setPhase("compose");
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

  function buildPreferences(extraPrompt?: string): SitePreferences {
    const mergedPrompt = [prompt.trim(), extraPrompt?.trim()].filter(Boolean).join("\n\n");
    const safePrompt = mergedPrompt || "Untitled draft";
    return inferPreferencesFromPrompt(safePrompt, {
      siteType: siteType ?? undefined,
      themePreset,
      customTheme,
      customPrompt: mergedPrompt || undefined,
      referenceScreenshots: screenshots,
      businessName: mergedPrompt ? undefined : "Untitled draft",
    });
  }

  function syncLocalCache(jobId?: string) {
    writeComposeDraftCache({
      jobId: jobId ?? jobRef.current?.id,
      prompt,
      siteType,
      themePreset,
      customTheme,
      screenshots,
      savedAt: new Date().toISOString(),
    });
  }

  const saveDraft = useCallback(async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 3) return;

    const preferences = inferPreferencesFromPrompt(trimmed, {
      siteType: siteType ?? undefined,
      themePreset,
      customTheme,
      customPrompt: trimmed,
      referenceScreenshots: [],
    });

    setDraftSaving(true);
    try {
      const current = jobRef.current;
      if (current) {
        const res = await fetch(`/api/build/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { job: SiteBuildJob };
        setJob((prev) =>
          prev
            ? {
                ...data.job,
                // Keep in-memory generated preview if PATCH slimmed status awkwardly
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
          body: JSON.stringify({ ...preferences, mode: "draft" }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { job: SiteBuildJob };
        setJob(data.job);
        setDraftSavedAt(data.job.updatedAt);
        syncLocalCache(data.job.id);
        router.replace(`/build?job=${data.job.id}`);
      }
      void refreshJobList();
    } finally {
      setDraftSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncLocalCache uses latest state intentionally
  }, [prompt, siteType, themePreset, customTheme, router, refreshJobList]);

  // Debounced auto-save for compose edits.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (phase !== "compose") return;

    syncLocalCache(job?.id);

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      void saveDraft();
    }, DRAFT_AUTOSAVE_MS);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, siteType, themePreset, customTheme, screenshots, phase, saveDraft]);

  async function persistThemeDraft(
    nextPreset: SiteThemePreset,
    nextCustom: SiteCustomTheme
  ) {
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
    const data = (await res.json()) as { job: SiteBuildJob };
    setDraftSavedAt(data.job.updatedAt);
    syncLocalCache(current.id);
  }

  /** Durable-style: change colors/fonts live without regenerating content. */
  function applyThemeLive(nextPreset: SiteThemePreset, nextCustom: SiteCustomTheme) {
    setThemePreset(nextPreset);
    setCustomTheme(nextCustom);
    setJob((current) => {
      if (!current?.generatedSite) return current;
      const preferences = {
        ...current.preferences,
        themePreset: nextPreset,
        customTheme: nextCustom,
      };
      return {
        ...current,
        preferences,
        generatedSite: {
          ...current.generatedSite,
          theme: resolveSiteTheme(preferences),
        },
        plan: current.plan
          ? { ...current.plan, theme: resolveSiteTheme(preferences) }
          : current.plan,
      };
    });

    if (themeTimerRef.current) clearTimeout(themeTimerRef.current);
    themeTimerRef.current = setTimeout(() => {
      void persistThemeDraft(nextPreset, nextCustom);
    }, DRAFT_AUTOSAVE_MS);
  }

  async function generate(extraPrompt?: string) {
    if (!prompt.trim() || prompt.trim().length < 12) {
      setError("Describe your business in a sentence or two — at least a dozen characters.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const preferences = buildPreferences(extraPrompt);
      const endpoint = job ? `/api/build/${job.id}/plan` : "/api/build";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          job ? preferences : { ...preferences, mode: "generate" }
        ),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        setError(body.error?.message ?? "Could not generate your site.");
        return;
      }

      const data = (await res.json()) as { job: SiteBuildJob; usedAi: boolean };
      setJob(data.job);
      setUsedAi(data.usedAi);
      setPhase("studio");
      setRefineInput("");
      setDraftSavedAt(data.job.updatedAt);
      syncLocalCache(data.job.id);
      router.replace(`/build?job=${data.job.id}`);
      void refreshJobList();
    } finally {
      setBusy(false);
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

  async function discardJob(id: string) {
    await fetch(`/api/build/${id}`, { method: "DELETE" });
    if (job?.id === id) {
      clearComposeDraftCache();
      setJob(null);
      setPrompt("");
      setSiteType(null);
      setThemePreset("gold_navy");
      setCustomTheme(defaultCustomThemeFromPreset("gold_navy"));
      setScreenshots([]);
      setPhase("compose");
      router.replace("/build");
    }
    void refreshJobList();
  }

  function startOver() {
    // Keep the previous draft on the server; start a fresh compose session.
    clearComposeDraftCache();
    setPhase("compose");
    setJob(null);
    setPrompt("");
    setSiteType(null);
    setThemePreset("gold_navy");
    setCustomTheme(defaultCustomThemeFromPreset("gold_navy"));
    setScreenshots([]);
    setRefineInput("");
    setError(null);
    setDraftSavedAt(null);
    router.replace("/build");
    void refreshJobList();
  }

  function resumeJob(item: SiteBuildJob) {
    router.replace(`/build?job=${item.id}`);
    hydrateFromJob(item);
  }

  const draftJobs = recentJobs.filter((j) => j.status === "draft" || !j.generatedSite);
  const generatedJobs = recentJobs.filter((j) => Boolean(j.generatedSite));

  if (phase === "studio" && job?.generatedSite) {
    return (
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex max-h-[42vh] w-full shrink-0 flex-col border-b border-border bg-surface lg:max-h-none lg:w-[380px] lg:border-b-0 lg:border-r">
          <div className="border-b border-border-subtle px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              Build OS Studio
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {job.generatedSite.siteName}
            </h2>
            <p className="mt-1 line-clamp-2 text-xs text-muted">
              {job.plan?.summary ?? "Your site preview is ready. Refine with natural language."}
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

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="rounded-xl border border-border bg-surface-muted p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-dim">
                Brief
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{prompt}</p>
            </div>
          </div>

          <div className="flex gap-2 border-t border-border-subtle p-4">
            <Button type="button" variant="secondary" onClick={startOver}>
              New site
            </Button>
            <Link
              href={`/build/preview/${job.id}`}
              target="_blank"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold px-3 py-2.5 text-sm font-semibold text-black hover:bg-gold-bright"
            >
              Full preview
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>

        <div className="min-h-0 flex-1 overflow-y-auto bg-background p-3 sm:p-5">
          <GeneratedSitePreview site={job.generatedSite} compact />
        </div>
      </div>
    );
  }

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

      <div className="relative mx-auto flex max-w-4xl flex-col px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="animate-fade-up text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-primary-soft px-3 py-1 text-[11px] font-medium text-gold-bright">
            <Sparkles className="h-3.5 w-3.5" />
            Build OS — AI website studio
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
            Describe your business.
            <span className="block text-gold-bright">Get a full site preview.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Drafts autosave as you type — leave anytime and come back to finish.
          </p>
        </div>

        {(draftJobs.length > 0 || generatedJobs.length > 0) && (
          <div className="mt-8 animate-fade-up rounded-2xl border border-border bg-surface-elevated/70 p-4">
            <div className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-gold" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">
                Continue where you left off
              </p>
            </div>
            <ul className="mt-3 space-y-2">
              {[...draftJobs, ...generatedJobs]
                .filter(
                  (item, idx, arr) => arr.findIndex((j) => j.id === item.id) === idx
                )
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
                        <p className="truncate text-sm font-medium text-foreground">
                          {label}
                        </p>
                        <p className="text-[10px] text-dim">
                          {isDraft ? "Draft" : "Generated"} ·{" "}
                          {formatDraftTime(item.updatedAt)}
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

        <div className="mt-8 animate-fade-up rounded-2xl border border-border bg-surface-elevated/90 p-3 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.55)] backdrop-blur sm:p-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Artisan Candles Co — handmade soy candles for UK homes. Warm, gift-ready shop with subscriptions and fast delivery."
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
                onClick={() => setPrompt(ex.prompt)}
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
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-muted pl-1 pr-1.5 py-0.5 text-[10px] text-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shot.dataUrl} alt="" className="h-5 w-5 rounded object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove ${shot.name}`}
                    onClick={() =>
                      setScreenshots((prev) => prev.filter((s) => s.id !== shot.id))
                    }
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
              disabled={busy || prompt.trim().length < 12}
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

        {error && (
          <p className="mt-3 text-center text-xs text-red-400">{error}</p>
        )}

        <div className="mt-10 animate-fade-up">
          <p className="text-center text-xs font-medium uppercase tracking-[0.12em] text-dim">
            What kind of site?{" "}
            <span className="font-normal normal-case tracking-normal">(optional)</span>
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SITE_TYPE_CARDS.map((card) => {
              const active = siteType === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSiteType(active ? null : card.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-gold bg-primary-soft"
                      : "border-border bg-surface-elevated/60 hover:border-gold/35"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">{card.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{card.description}</p>
                  <p className="mt-2 text-[10px] text-dim">{card.examples}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 animate-fade-up">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.12em] text-dim">
            Style — presets or your brand
          </p>
          <ThemeStylePanel
            themePreset={themePreset}
            customTheme={customTheme}
            onChange={({ themePreset: nextPreset, customTheme: nextCustom }) => {
              setThemePreset(nextPreset);
              setCustomTheme(nextCustom);
            }}
          />
        </div>
      </div>
    </div>
  );
}
