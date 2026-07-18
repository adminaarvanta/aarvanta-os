"use client";

import { SITE_FONT_PACKS, type SiteFontPackId } from "@/lib/site-builder/font-packs";
import {
  QUICK_BRAND_PALETTES,
  SITE_THEME_PRESETS,
  defaultCustomThemeFromPreset,
} from "@/lib/site-builder/theme-presets";
import type { SiteCustomTheme, SiteThemePreset } from "@/types/site-builder";

type ThemeStylePanelProps = {
  themePreset: SiteThemePreset;
  customTheme: SiteCustomTheme;
  onChange: (next: {
    themePreset: SiteThemePreset;
    customTheme: SiteCustomTheme;
  }) => void;
  /** compact = studio sidebar; full = compose screen */
  compact?: boolean;
  showPresets?: boolean;
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (/^#?[0-9A-Fa-f]{0,6}$/.test(v)) {
              onChange(v.startsWith("#") ? v.toUpperCase() : v ? `#${v.toUpperCase()}` : "#");
            }
          }}
          onBlur={() => {
            if (!/^#[0-9A-Fa-f]{6}$/i.test(value)) onChange("#000000");
          }}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-2.5 py-2 font-mono text-xs text-foreground"
          spellCheck={false}
        />
      </div>
    </label>
  );
}

export function ThemeStylePanel({
  themePreset,
  customTheme,
  onChange,
  compact = false,
  showPresets = true,
}: ThemeStylePanelProps) {
  const isCustom = themePreset === "custom";

  function patchCustom(partial: Partial<SiteCustomTheme>) {
    onChange({
      themePreset: "custom",
      customTheme: { ...customTheme, ...partial },
    });
  }

  function selectPreset(id: Exclude<SiteThemePreset, "custom">) {
    onChange({
      themePreset: id,
      customTheme: defaultCustomThemeFromPreset(id),
    });
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {showPresets ? (
        <div>
          <p
            className={
              compact
                ? "mb-2 text-[10px] font-medium uppercase tracking-wide text-dim"
                : "mb-3 text-center text-xs font-medium uppercase tracking-[0.12em] text-dim"
            }
          >
            Style presets
          </p>
          <div
            className={
              compact
                ? "grid grid-cols-2 gap-2"
                : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
            }
          >
            {SITE_THEME_PRESETS.map((preset) => {
              const active = themePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset.id)}
                  className={`group overflow-hidden rounded-xl border text-left transition ${
                    active
                      ? "border-gold ring-1 ring-gold/50"
                      : "border-border hover:border-gold/35"
                  }`}
                >
                  <div
                    className={compact ? "h-12 w-full" : "relative h-20 w-full"}
                    style={{
                      background: `linear-gradient(160deg, ${preset.backgroundColor} 0%, ${preset.primaryColor} 55%, ${preset.accentColor} 100%)`,
                    }}
                  />
                  <div className="bg-surface-elevated px-2 py-1.5">
                    <p className="text-[11px] font-medium text-foreground">{preset.label}</p>
                  </div>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onChange({ themePreset: "custom", customTheme })}
              className={`overflow-hidden rounded-xl border text-left transition ${
                isCustom
                  ? "border-gold ring-1 ring-gold/50"
                  : "border-border hover:border-gold/35"
              }`}
            >
              <div
                className={`flex items-center justify-center ${compact ? "h-12" : "h-20"} bg-surface-muted`}
                style={{
                  background: `linear-gradient(135deg, ${customTheme.primaryColor}, ${customTheme.accentColor}, ${customTheme.backgroundColor})`,
                }}
              >
                <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Custom
                </span>
              </div>
              <div className="bg-surface-elevated px-2 py-1.5">
                <p className="text-[11px] font-medium text-foreground">Your brand</p>
              </div>
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={`rounded-2xl border border-border bg-surface-elevated/80 ${compact ? "p-3" : "p-4"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Brand colors</p>
            <p className="mt-0.5 text-[11px] text-muted">
              Like Durable — pick a palette or enter your hex codes
            </p>
          </div>
          {!isCustom ? (
            <button
              type="button"
              onClick={() => onChange({ themePreset: "custom", customTheme })}
              className="shrink-0 rounded-lg border border-border px-2 py-1 text-[11px] text-muted hover:border-gold/40 hover:text-foreground"
            >
              Customize
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK_BRAND_PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              title={palette.label}
              onClick={() =>
                patchCustom({
                  primaryColor: palette.primaryColor,
                  accentColor: palette.accentColor,
                  backgroundColor: palette.backgroundColor,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-[10px] text-muted hover:border-gold/40 hover:text-foreground"
            >
              <span
                className="h-3 w-3 rounded-full border border-white/20"
                style={{
                  background: `linear-gradient(135deg, ${palette.primaryColor}, ${palette.accentColor})`,
                }}
              />
              {palette.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              patchCustom({
                backgroundColor: "#FFFFFF",
                primaryColor: customTheme.primaryColor === "#FFFFFF" ? "#1A2B48" : customTheme.primaryColor,
              })
            }
            className="rounded-full border border-border px-2 py-1 text-[10px] text-muted hover:border-gold/40"
          >
            Light canvas
          </button>
          <button
            type="button"
            onClick={() =>
              patchCustom({
                backgroundColor: "#0A0A0F",
              })
            }
            className="rounded-full border border-border px-2 py-1 text-[10px] text-muted hover:border-gold/40"
          >
            Dark canvas
          </button>
        </div>

        <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-3"}`}>
          <ColorField
            label="Primary"
            value={customTheme.primaryColor}
            onChange={(primaryColor) => patchCustom({ primaryColor })}
          />
          <ColorField
            label="Accent"
            value={customTheme.accentColor}
            onChange={(accentColor) => patchCustom({ accentColor })}
          />
          <ColorField
            label="Background"
            value={customTheme.backgroundColor}
            onChange={(backgroundColor) => patchCustom({ backgroundColor })}
          />
        </div>

        <div
          className="mt-4 overflow-hidden rounded-xl border border-border"
          style={{
            background: customTheme.backgroundColor,
            color: customTheme.backgroundColor.toLowerCase() === "#ffffff" ? "#101828" : "#F8FAFC",
          }}
        >
          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] opacity-70">Live preview</p>
            <p
              className="mt-1 text-lg font-semibold"
              style={{ color: customTheme.primaryColor }}
            >
              Your brand headline
            </p>
            <p className="mt-1 text-xs opacity-70">Body text with your palette</p>
            <button
              type="button"
              className="mt-3 rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{
                backgroundColor: customTheme.primaryColor,
                color: customTheme.backgroundColor,
              }}
            >
              Primary button
            </button>
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border border-border bg-surface-elevated/80 ${compact ? "p-3" : "p-4"}`}
      >
        <p className="text-sm font-semibold text-foreground">Font pack</p>
        <p className="mt-0.5 text-[11px] text-muted">
          One click restyles headings and body — same idea as Durable font packs
        </p>
        <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {SITE_FONT_PACKS.map((pack) => {
            const active = customTheme.fontPackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => patchCustom({ fontPackId: pack.id as SiteFontPackId })}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-gold bg-primary-soft"
                    : "border-border hover:border-gold/35"
                }`}
              >
                <p
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: pack.headingFont }}
                >
                  {pack.label}
                </p>
                <p className="mt-0.5 text-[10px] text-dim" style={{ fontFamily: pack.fontFamily }}>
                  {pack.previewHeading} / {pack.previewBody}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
