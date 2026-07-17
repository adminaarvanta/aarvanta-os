import { defaultCustomThemeForNiche } from "@/lib/site-builder/niches";
import { getThemePreset } from "@/lib/site-builder/theme-presets";
import { getUiTemplate } from "@/lib/site-builder/templates";
import type {
  SiteCustomTheme,
  SiteFontPairing,
  SitePreferences,
  SiteTemplateLayout,
  SiteThemePreset,
} from "@/types/site-builder";

export type ResolvedSiteTheme = {
  themeMode: SitePreferences["themeMode"];
  presetId: SiteThemePreset;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontStyle: string;
  fontPairing: SiteFontPairing;
  buttonStyle: SiteCustomTheme["buttonStyle"];
  radius: SiteCustomTheme["radius"];
  styleNotes: string;
  templateId: string;
  layout: SiteTemplateLayout;
  isDark: boolean;
};

const FONT_LABEL: Record<SiteFontPairing, string> = {
  modern_sans: "Modern sans-serif",
  classic_serif: "Classic serif headlines",
  friendly_rounded: "Friendly rounded sans",
  editorial: "Editorial serif + sans body",
};

function isDarkBackground(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return true;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  // Perceived luminance
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

export function ensureCustomTheme(preferences: SitePreferences): SiteCustomTheme {
  return preferences.customTheme ?? defaultCustomThemeForNiche(preferences.niche);
}

/** Resolve template vs custom theme tokens for preview, plan, and generate. */
export function resolveSiteTheme(preferences: SitePreferences): ResolvedSiteTheme {
  const template = getUiTemplate(preferences.templateId);
  const layout = template?.layout ?? "hero_centered";
  const preset = getThemePreset(preferences.themePreset);

  if (preferences.themeMode === "custom") {
    const custom = ensureCustomTheme(preferences);
    return {
      themeMode: "custom",
      presetId: preferences.themePreset,
      primaryColor: custom.primaryColor,
      accentColor: custom.accentColor,
      backgroundColor: custom.backgroundColor,
      textColor: custom.textColor,
      fontStyle: FONT_LABEL[custom.fontPairing],
      fontPairing: custom.fontPairing,
      buttonStyle: custom.buttonStyle,
      radius: custom.radius,
      styleNotes: `Custom ${preferences.niche.replace(/_/g, " ")} theme · ${FONT_LABEL[custom.fontPairing]} · ${custom.buttonStyle} buttons`,
      templateId: preferences.templateId,
      layout,
      isDark: isDarkBackground(custom.backgroundColor),
    };
  }

  return {
    themeMode: "template",
    presetId: preset.id,
    primaryColor: preset.primaryColor,
    accentColor: preset.accentColor,
    backgroundColor: preset.backgroundColor,
    textColor: isDarkBackground(preset.backgroundColor) ? "#F4F7FB" : "#0E1522",
    fontStyle: preset.fontStyle,
    fontPairing: "modern_sans",
    buttonStyle: "solid",
    radius: "rounded",
    styleNotes: `${preset.description} Template: ${template?.name ?? preferences.templateId}.`,
    templateId: preferences.templateId,
    layout,
    isDark: isDarkBackground(preset.backgroundColor),
  };
}

export function radiusClass(radius: SiteCustomTheme["radius"]): string {
  if (radius === "sharp") return "0.25rem";
  if (radius === "pill") return "999px";
  return "0.5rem";
}
