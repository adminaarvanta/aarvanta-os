"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
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

  async function resolveJobId(): Promise<string | null> {
    if (jobId) return jobId;
    if (!onNeedJob) {
      onError?.("Save a draft first, then add photos.");
      return null;
    }
    return onNeedJob();
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = SITE_MEDIA_MAX_PER_JOB - items.length;
    if (remaining <= 0) {
      onError?.(`You can add up to ${SITE_MEDIA_MAX_PER_JOB} photos.`);
      return;
    }

    const id = await resolveJobId();
    if (!id) return;

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
          onError?.(data.error?.message ?? "Could not upload that photo.");
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
        onError?.(data.error?.message ?? "Could not update that photo.");
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
        onError?.(data.error?.message ?? "Could not remove that photo.");
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
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-dim">
          Your work photos
        </p>
        <p className={cn("mt-1 text-muted", compact ? "text-[11px]" : "text-xs")}>
          Upload real photos of the work — plaques, products, the workshop. They replace
          stock on the hero, gallery, and portfolio. We never invent pictures of your work.
        </p>
        {items.length ? (
          <p className="mt-1 text-[11px] text-dim">
            {items.length} uploaded
            {appliedCount
              ? ` · ${appliedCount} showing on the site`
              : " · stock fills empty slots"}
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-dim">
            No client photos yet — the draft uses stock until you add some.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || busy === "upload" || items.length >= SITE_MEDIA_MAX_PER_JOB}
          onClick={() => inputRef.current?.click()}
        >
          {busy === "upload" ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
          )}
          {items.length ? "Add photos" : "Upload photos"}
        </Button>
        <span className="text-[11px] text-dim">
          JPEG, PNG, or WebP · up to {SITE_MEDIA_MAX_PER_JOB}
        </span>
      </div>

      {items.length ? (
        <ul className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-1")}>
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption || item.name}
                className="h-28 w-full object-cover"
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
