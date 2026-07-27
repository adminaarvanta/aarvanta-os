"use client";

import { Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { GeneratedSitePreview } from "@/components/build/generated-site-preview";
import { Button } from "@/components/ui/button";
import type { SiteDesignOption } from "@/types/site-builder";
import { cn } from "@/lib/utils";

const THUMB_WIDTH = 1200;
const THUMB_SCALE = 0.38;
const THUMB_FRAME_HEIGHT = 320;

export function DesignOptionsPicker({
  options,
  selectedId,
  busy,
  onSelect,
  onConfirm,
  onBack,
  onRefresh,
  confirmLabel = "Continue",
}: {
  options: SiteDesignOption[];
  selectedId: string | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  onRefresh?: () => void;
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
            3 AI designs from your brief — pick one to build the full site.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onBack} disabled={busy}>
            Back to brief
          </Button>
          {onRefresh ? (
            <Button type="button" variant="secondary" onClick={onRefresh} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh designs
                </>
              )}
            </Button>
          ) : null}
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

      <div
        className={cn(
          "grid gap-5 lg:grid-cols-3",
          busy && "pointer-events-none opacity-60"
        )}
      >
        {options.map((option) => {
          const active = selectedId === option.id;
          return (
            <div
              key={option.id}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              onClick={() => onSelect(option.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(option.id);
                }
              }}
              className={cn(
                "group cursor-pointer overflow-hidden rounded-2xl border text-left transition",
                active
                  ? "border-gold ring-2 ring-gold/40"
                  : "border-border hover:border-gold/40"
              )}
            >
              <div className="border-b border-border bg-surface-elevated p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{option.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{option.tagline}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                      active
                        ? "border-gold bg-gold text-black"
                        : "border-border text-transparent"
                    )}
                    aria-hidden
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
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
                <div className="mt-2 flex items-center gap-2">
                  {[
                    option.brand.primary,
                    option.brand.secondary,
                    option.brand.background,
                  ].map((color) => (
                    <span
                      key={color}
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ background: color }}
                      title={color}
                    />
                  ))}
                  <span className="text-[10px] uppercase tracking-wide text-dim">
                    {option.heroVariant}
                  </span>
                </div>
              </div>

              <div
                className="relative overflow-hidden bg-background"
                style={{ height: THUMB_FRAME_HEIGHT }}
              >
                <div
                  className="origin-top-left"
                  style={{
                    width: THUMB_WIDTH,
                    transform: `scale(${THUMB_SCALE})`,
                    height: THUMB_FRAME_HEIGHT / THUMB_SCALE,
                  }}
                >
                  <GeneratedSitePreview
                    site={option.preview}
                    interactive={false}
                    thumbnail
                    className="rounded-none border-0 shadow-none"
                  />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 to-transparent" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
