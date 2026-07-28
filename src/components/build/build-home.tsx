"use client";

import {
  ArrowRight,
  Clock3,
  Globe2,
  LayoutTemplate,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SiteBuildJob } from "@/types/site-builder";
import { cn } from "@/lib/utils";

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

function statusLabel(job: SiteBuildJob): string {
  if (job.generatedSite) return "Generated";
  if (job.status === "designs_ready") return "Designs ready";
  if (job.status === "generating") return "Generating";
  if (job.status === "failed") return "Failed";
  return "Draft";
}

function JobCard({
  job,
  onOpen,
  onDelete,
}: {
  job: SiteBuildJob;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const theme = job.generatedSite?.theme ?? job.preferences.customTheme;
  const primary =
    ("primaryColor" in (theme ?? {})
      ? (theme as { primaryColor?: string }).primaryColor
      : undefined) ??
    job.preferences.brandSystem?.primary ??
    "#B8965D";
  const logoUrl =
    job.preferences.brandLogo?.dataUrl ??
    job.preferences.brandSystem?.logoUrl ??
    job.generatedSite?.assets?.find((a) => a.kind === "logo")?.url;

  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold/40">
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left">
        <div
          className="relative flex h-28 items-end px-4 pb-3"
          style={{
            background: `linear-gradient(135deg, ${primary}33, ${primary}0a 55%, transparent)`,
          }}
        >
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-11 w-11 rounded-xl border border-border bg-white object-contain p-1 shadow-sm"
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-black shadow-sm"
                style={{ background: primary }}
              >
                {(job.preferences.businessName || "S").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {job.preferences.businessName || "Untitled site"}
              </p>
              <p className="text-[11px] text-dim">{statusLabel(job)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-4 py-3">
          <p className="text-[11px] text-muted">{formatDraftTime(job.updatedAt)}</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gold-bright opacity-0 transition group-hover:opacity-100">
            Open <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </button>
      <div className="flex border-t border-border-subtle">
        <button
          type="button"
          onClick={onDelete}
          className="flex w-full items-center justify-center gap-1.5 px-3 py-2 text-[11px] text-dim transition hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </li>
  );
}

export function BuildHome({
  drafts,
  generated,
  hasLocalDraft,
  onCreateNew,
  onResumeLocal,
  onOpenJob,
  onDeleteJob,
}: {
  drafts: SiteBuildJob[];
  generated: SiteBuildJob[];
  hasLocalDraft?: boolean;
  onCreateNew: () => void;
  onResumeLocal?: () => void;
  onOpenJob: (job: SiteBuildJob) => void;
  onDeleteJob: (id: string) => void;
}) {
  const empty = drafts.length === 0 && generated.length === 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-elevated px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
              Build OS
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Your websites
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Open a draft, revisit a generated site, or start a new AI-built experience
              from a short brief.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasLocalDraft && onResumeLocal ? (
              <Button type="button" variant="secondary" onClick={onResumeLocal}>
                <Clock3 className="mr-1.5 h-4 w-4" />
                Resume draft
              </Button>
            ) : null}
            <Button type="button" onClick={onCreateNew}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create new site
            </Button>
          </div>
        </div>
      </div>

      {empty ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-foreground">No sites yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Describe your business, pick a design direction, and Build OS will generate a
            full website you can refine and publish.
          </p>
          <Button type="button" className="mt-6" onClick={onCreateNew}>
            Create your first site
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-gold" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-dim">
                Drafts
              </h2>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-muted">
                {drafts.length}
              </span>
            </div>
            {drafts.length === 0 ? (
              <p className="rounded-2xl border border-border-subtle bg-surface-muted/40 px-4 py-6 text-sm text-muted">
                No drafts in progress.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {drafts.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onOpen={() => onOpenJob(job)}
                    onDelete={() => onDeleteJob(job.id)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-gold" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-dim">
                Generated sites
              </h2>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-muted">
                {generated.length}
              </span>
            </div>
            {generated.length === 0 ? (
              <p className="rounded-2xl border border-border-subtle bg-surface-muted/40 px-4 py-6 text-sm text-muted">
                Generated sites will appear here after you build one.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {generated.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onOpen={() => onOpenJob(job)}
                    onDelete={() => onDeleteJob(job.id)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <p
        className={cn(
          "mt-10 text-center text-xs text-dim",
          empty && "hidden"
        )}
      >
        Tip: upload your product logo on the Site Name step so it appears in the header.
      </p>
    </div>
  );
}
