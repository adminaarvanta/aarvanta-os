"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { GeneratedSitePreview } from "@/components/build/generated-site-preview";
import { Button } from "@/components/ui/button";
import type { SiteDesignOption } from "@/types/site-builder";

export function DesignOptionsPicker({
  options,
  selectedId,
  busy,
  onSelect,
  onConfirm,
  onBack,
  confirmLabel = "Continue",
}: {
  options: SiteDesignOption[];
  selectedId: string | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  confirmLabel?: string;
}) {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
            Design directions
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
            Pick a homepage look
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            AI proposed {options.length} layouts. Choose one — we&apos;ll build the full site from
            that direction.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onBack} disabled={busy}>
            Back to brief
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={busy || !selectedId}
            className="min-w-[160px]"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Working…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {confirmLabel}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {options.map((option) => {
          const active = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`group overflow-hidden rounded-2xl border text-left transition ${
                active
                  ? "border-gold ring-2 ring-gold/40"
                  : "border-border hover:border-gold/40"
              }`}
            >
              <div className="border-b border-border bg-surface-elevated p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{option.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{option.tagline}</p>
                  </div>
                  {active ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold text-black">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-dim">
                  {option.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {option.styleTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] text-dim"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="max-h-[420px] overflow-hidden bg-background">
                <div className="origin-top scale-[0.55] sm:scale-[0.48]" style={{ width: "181%" }}>
                  <GeneratedSitePreview site={option.preview} className="rounded-none border-0 shadow-none" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
