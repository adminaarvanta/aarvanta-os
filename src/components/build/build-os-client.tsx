"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GeneratedSitePreview } from "@/components/build/generated-site-preview";
import { Button } from "@/components/ui/button";
import {
  EXAMPLE_PROMPTS,
  inferPreferencesFromPrompt,
  SITE_TYPE_CARDS,
} from "@/lib/site-builder/infer-preferences";
import { SITE_THEME_PRESETS } from "@/lib/site-builder/theme-presets";
import type {
  SiteBuildJob,
  SitePreferences,
  SiteReferenceScreenshot,
  SiteThemePreset,
  SiteType,
} from "@/types/site-builder";

const MAX_SCREENSHOTS = 3;
const MAX_SCREENSHOT_BYTES = 1_500_000;

type StudioPhase = "compose" | "studio";

export function BuildOsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobParam = searchParams.get("job");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<StudioPhase>("compose");
  const [prompt, setPrompt] = useState("");
  const [siteType, setSiteType] = useState<SiteType | null>(null);
  const [themePreset, setThemePreset] = useState<SiteThemePreset>("gold_navy");
  const [screenshots, setScreenshots] = useState<SiteReferenceScreenshot[]>([]);
  const [refineInput, setRefineInput] = useState("");
  const [job, setJob] = useState<SiteBuildJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);

  const loadJob = useCallback(async (id: string) => {
    const res = await fetch(`/api/build/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { job: SiteBuildJob };
    setJob(data.job);
    setUsedAi(data.job.usedAi ?? false);
    setPrompt(data.job.preferences.customPrompt ?? data.job.preferences.businessIdea);
    setSiteType(data.job.preferences.siteType);
    setThemePreset(data.job.preferences.themePreset);
    setScreenshots(data.job.preferences.referenceScreenshots ?? []);
    if (data.job.generatedSite) setPhase("studio");
  }, []);

  useEffect(() => {
    if (jobParam) void loadJob(jobParam);
  }, [jobParam, loadJob]);

  function buildPreferences(extraPrompt?: string): SitePreferences {
    const mergedPrompt = [prompt.trim(), extraPrompt?.trim()].filter(Boolean).join("\n\n");
    return inferPreferencesFromPrompt(mergedPrompt, {
      siteType: siteType ?? undefined,
      themePreset,
      customPrompt: mergedPrompt,
      referenceScreenshots: screenshots,
    });
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
        body: JSON.stringify(preferences),
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
      router.replace(`/build?job=${data.job.id}`);
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

  function startOver() {
    setPhase("compose");
    setJob(null);
    setRefineInput("");
    setError(null);
    router.replace("/build");
  }

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
            {usedAi && (
              <p className="mt-2 text-[10px] text-dim">AI-enhanced generation</p>
            )}
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Vibe</p>
              <div className="grid grid-cols-2 gap-2">
                {SITE_THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setThemePreset(preset.id)}
                    className={`overflow-hidden rounded-xl border text-left transition ${
                      themePreset === preset.id
                        ? "border-gold ring-1 ring-gold/40"
                        : "border-border hover:border-gold/30"
                    }`}
                  >
                    <div
                      className="h-10 w-full"
                      style={{
                        background: `linear-gradient(135deg, ${preset.backgroundColor}, ${preset.primaryColor} 70%)`,
                      }}
                    />
                    <div className="px-2.5 py-2">
                      <p className="text-[11px] font-medium text-foreground">{preset.label}</p>
                    </div>
                  </button>
                ))}
              </div>
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
              <p className="mt-2 text-[11px] leading-relaxed text-dim">
                Preview includes sample products, team, reviews, FAQ, and imagery so the
                site never looks empty — regenerate after deploy to refresh old jobs.
              </p>
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

      <div className="relative mx-auto flex max-w-3xl flex-col px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
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
            One prompt. Get a real multi-page site preview — hero imagery, offerings,
            social proof, FAQ, and contact — not a thin outline.
          </p>
        </div>

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
          <p className="text-center text-xs font-medium uppercase tracking-[0.12em] text-dim">
            Visual vibe
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SITE_THEME_PRESETS.map((preset) => {
              const active = themePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setThemePreset(preset.id)}
                  className={`group overflow-hidden rounded-2xl border text-left transition ${
                    active
                      ? "border-gold ring-1 ring-gold/50"
                      : "border-border hover:border-gold/35"
                  }`}
                >
                  <div
                    className="relative h-20 w-full transition group-hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(160deg, ${preset.backgroundColor} 0%, ${preset.primaryColor} 55%, ${preset.accentColor} 100%)`,
                    }}
                  >
                    <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/30"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/30"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                    </div>
                  </div>
                  <div className="bg-surface-elevated px-2.5 py-2">
                    <p className="text-[11px] font-medium text-foreground">{preset.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-dim">
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
