"use client";

import { getNiche } from "@/lib/site-builder/niches";
import type {
  SiteButtonStyle,
  SiteCustomTheme,
  SiteFontPairing,
  SiteNiche,
  SiteRadiusStyle,
} from "@/types/site-builder";

const FONT_OPTIONS: { value: SiteFontPairing; label: string }[] = [
  { value: "modern_sans", label: "Modern sans" },
  { value: "classic_serif", label: "Classic serif" },
  { value: "friendly_rounded", label: "Friendly rounded" },
  { value: "editorial", label: "Editorial" },
];

const BUTTON_OPTIONS: { value: SiteButtonStyle; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "soft", label: "Soft" },
  { value: "outline", label: "Outline" },
];

const RADIUS_OPTIONS: { value: SiteRadiusStyle; label: string }[] = [
  { value: "sharp", label: "Sharp" },
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
];

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
    <label className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-muted">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent"
        />
        <input
          value={value}
          onChange={(e) => {
            const next = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{0,6}$/.test(next)) onChange(next.toUpperCase());
          }}
          className="w-[5.5rem] rounded border border-border bg-surface-elevated px-2 py-1 font-mono text-[11px] text-foreground"
        />
      </span>
    </label>
  );
}

export function CustomThemeBuilder({
  niche,
  theme,
  onChange,
}: {
  niche: SiteNiche;
  theme: SiteCustomTheme;
  onChange: (theme: SiteCustomTheme) => void;
}) {
  const nicheDef = getNiche(niche);

  function patch<K extends keyof SiteCustomTheme>(key: K, value: SiteCustomTheme[K]) {
    onChange({ ...theme, [key]: value });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gold/30 bg-primary-soft p-3">
        <p className="text-xs font-medium text-foreground">
          Custom theme for {nicheDef.label}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">{nicheDef.themeGuidance}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">Practical palettes for this niche</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {nicheDef.suggestedPalettes.map((palette) => {
            const active =
              theme.primaryColor === palette.theme.primaryColor &&
              theme.backgroundColor === palette.theme.backgroundColor &&
              theme.accentColor === palette.theme.accentColor;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => onChange(palette.theme)}
                className={`overflow-hidden rounded-lg border text-left transition-colors ${
                  active ? "border-gold ring-1 ring-gold/40" : "border-border hover:border-gold/40"
                }`}
              >
                <div
                  className="flex h-12 items-end gap-1.5 px-3 pb-2"
                  style={{ backgroundColor: palette.theme.backgroundColor }}
                >
                  <span
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ backgroundColor: palette.theme.primaryColor }}
                  />
                  <span
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ backgroundColor: palette.theme.accentColor }}
                  />
                  <span
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ backgroundColor: palette.theme.textColor }}
                  />
                </div>
                <div className="bg-surface-muted px-3 py-2">
                  <p className="text-xs font-medium text-foreground">{palette.label}</p>
                  <p className="mt-0.5 text-[10px] text-dim">{palette.why}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ColorField
          label="Primary"
          value={theme.primaryColor}
          onChange={(v) => patch("primaryColor", v)}
        />
        <ColorField
          label="Accent"
          value={theme.accentColor}
          onChange={(v) => patch("accentColor", v)}
        />
        <ColorField
          label="Background"
          value={theme.backgroundColor}
          onChange={(v) => patch("backgroundColor", v)}
        />
        <ColorField
          label="Text"
          value={theme.textColor}
          onChange={(v) => patch("textColor", v)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1 text-xs text-muted">
          Font pairing
          <select
            value={theme.fontPairing}
            onChange={(e) => patch("fontPairing", e.target.value as SiteFontPairing)}
            className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs text-muted">
          Buttons
          <select
            value={theme.buttonStyle}
            onChange={(e) => patch("buttonStyle", e.target.value as SiteButtonStyle)}
            className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {BUTTON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs text-muted">
          Corners
          <select
            value={theme.radius}
            onChange={(e) => patch("radius", e.target.value as SiteRadiusStyle)}
            className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {RADIUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
