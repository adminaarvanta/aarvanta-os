"use client";

import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { compressImageForUpload } from "@/lib/site-builder/compress-image";
import { SITE_MEDIA_MAX_PER_JOB } from "@/lib/site-builder/media-constants";
import type { SiteClientMedia, SiteMediaRole } from "@/types/site-builder";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: Array<{ id: SiteMediaRole; label: string }> = [
  { id: "general", label: "Any slot" },
  { id: "hero", label: "Hero" },
  { id: "gallery", label: "Gallery" },
  { id: "portfolio", label: "Portfolio" },
  { id: "about", label: "About" },
  { id: "product", label: "Product" },
];

export function ClientMediaLibrary({
  jobId,
  items,
  appliedCount = 0,
  compact = false,
  disabled = false,
  onChange,
  onNeedJob,
  onError,
}: {
  jobId?: string;
  items: SiteClientMedia[];
  appliedCount?: number;
  compact?: boolean;
  disabled?: boolean;
  onChange: (items: SiteClientMedia[], job?: import("@/types/site-builder").SiteBuildJob) => void;
  onNeedJob?: () => Promise<string | null>;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function reportError(message: string) {
    setLocalError(message);
    onError?.(message);
  }

  async function resolveJobId(): Promise<string | null> {
    if (jobId) return jobId;
    if (!onNeedJob) {
      reportError("Save a draft first, then add photos.");
      return null;
    }
    return onNeedJob();
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = SITE_MEDIA_MAX_PER_JOB - items.length;
    if (remaining <= 0) {
      reportError(`You can add up to ${SITE_MEDIA_MAX_PER_JOB} photos.`);
      return;
    }

    const id = await resolveJobId();
    if (!id) return;

    setLocalError(null);
    setBusy("upload");
    try {
      let latest = items;
      let latestJob: import("@/types/site-builder").SiteBuildJob | undefined;
      for (const file of Array.from(files).slice(0, remaining)) {
        if (!file.type.startsWith("image/")) continue;
        const compressed = await compressImageForUpload(file);
        const form = new FormData();
        form.set("file", compressed);
        form.set("role", "general");
        const res = await fetch(`/api/build/${id}/media`, {
          method: "POST",
          body: form,
        });
        const data = (await res.json()) as {
          media?: SiteClientMedia;
          job?: import("@/types/site-builder").SiteBuildJob;
          error?: { message?: string };
        };
        if (!res.ok || !data.media) {
          reportError(data.error?.message ?? "Could not upload that photo.");
          continue;
        }
        latest = [...latest, data.media];
        latestJob = data.job;
      }
      onChange(latest, latestJob);
    } finally {
      setBusy(null);
    }
  }

  async function patchItem(item: SiteClientMedia, patch: { role?: SiteMediaRole; caption?: string }) {
    const id = jobId ?? item.jobId;
    setBusy(item.id);
    try {
      const res = await fetch(`/api/build/${id}/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as {
        media?: SiteClientMedia;
        job?: import("@/types/site-builder").SiteBuildJob;
        error?: { message?: string };
      };
      if (!res.ok || !data.media) {
        reportError(data.error?.message ?? "Could not update that photo.");
        return;
      }
      onChange(
        items.map((current) => (current.id === item.id ? data.media! : current)),
        data.job
      );
    } finally {
      setBusy(null);
    }
  }

  async function removeItem(item: SiteClientMedia) {
    const id = jobId ?? item.jobId;
    setBusy(item.id);
    try {
      const res = await fetch(`/api/build/${id}/media/${item.id}`, { method: "DELETE" });
      const data = (await res.json()) as {
        job?: import("@/types/site-builder").SiteBuildJob;
        error?: { message?: string };
      };
      if (!res.ok) {
        reportError(data.error?.message ?? "Could not remove that photo.");
        return;
      }
      onChange(
        items.filter((current) => current.id !== item.id),
        data.job
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {!compact ? (
        <div>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Work photos
          </h2>
          <p className="mt-2 text-sm text-muted">
            Add the client’s real pictures — plaques, products, the workshop. They replace
            stock on the hero, gallery, and portfolio. We never invent photos of the work.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gold">
            Your work photos
          </p>
          <p className="mt-1 text-xs text-muted">
            Real client pictures replace stock. We never generate fake photos of the work.
          </p>
        </div>
      )}

      {items.length ? (
        <p className="text-xs text-muted">
          {items.length} uploaded
          {appliedCount ? ` · ${appliedCount} showing on the site` : " · stock fills empty slots"}
        </p>
      ) : (
        <p className="text-xs text-dim">Optional — skip if you only have stock for now.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          void uploadFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={disabled || busy === "upload" || items.length >= SITE_MEDIA_MAX_PER_JOB}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void uploadFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition",
          compact ? "min-h-[140px] py-6" : "min-h-[220px] py-10",
          dragOver
            ? "border-gold bg-gold/15"
            : "border-gold/50 bg-gold/5 hover:border-gold hover:bg-gold/10",
          (disabled || busy === "upload") && "opacity-70"
        )}
      >
        {busy === "upload" ? (
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        ) : (
          <Upload className={cn("text-gold", compact ? "h-7 w-7" : "h-10 w-10")} />
        )}
        <p className={cn("mt-3 font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
          {busy === "upload" ? "Uploading…" : "Drop work photos here"}
        </p>
        <p className="mt-1 text-xs text-muted">
          or click to browse · JPEG, PNG, WebP · up to {SITE_MEDIA_MAX_PER_JOB}
        </p>
      </button>

      {items.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || busy === "upload" || items.length >= SITE_MEDIA_MAX_PER_JOB}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
            Add more
          </Button>
        </div>
      ) : null}

      {localError ? <p className="text-sm text-red-400">{localError}</p> : null}

      {items.length ? (
        <ul className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3")}>
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption || item.name}
                className="h-36 w-full object-cover"
              />
              <div className="space-y-2 p-2.5">
                <p className="truncate text-[11px] text-muted" title={item.name}>
                  {item.name}
                </p>
                <select
                  value={item.role}
                  disabled={disabled || busy === item.id}
                  onChange={(event) =>
                    void patchItem(item, {
                      role: event.target.value as SiteMediaRole,
                    })
                  }
                  className="w-full rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-xs text-foreground"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  defaultValue={item.caption ?? ""}
                  disabled={disabled || busy === item.id}
                  placeholder="Caption (optional)"
                  className="w-full rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-xs text-foreground placeholder:text-dim"
                  onBlur={(event) => {
                    const next = event.target.value.trim();
                    if (next === (item.caption ?? "")) return;
                    void patchItem(item, { caption: next });
                  }}
                />
                <button
                  type="button"
                  disabled={disabled || busy === item.id}
                  onClick={() => void removeItem(item)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-danger"
                >
                  {busy === item.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
