import { getFontPack, type SiteFontPackId } from "@/lib/site-builder/font-packs";
import type {
  SiteColorMood,
  SiteCustomTheme,
  SitePreferences,
  SitePlanTheme,
  SiteThemePreset,
} from "@/types/site-builder";

export type SiteThemePresetDefinition = {
  id: Exclude<SiteThemePreset, "custom">;
  label: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontStyle: string;
  fontFamily: string;
  headingFont: string;
  googleFontsUrl: string;
  fontPackId: SiteFontPackId;
  colorMood: SiteColorMood;
  designStyle: "minimal" | "modern" | "bold" | "classic";
};

export const SITE_THEME_PRESETS: SiteThemePresetDefinition[] = [
  {
    id: "gold_navy",
    label: "Gold & Navy",
    description: "Premium dark canvas with gold accents — Aarvanta signature.",
    primaryColor: "#B8965D",
    accentColor: "#C9AA72",
    backgroundColor: "#040608",
    fontStyle: "Modern sans-serif, generous spacing",
    fontFamily: '"DM Sans", system-ui, sans-serif',
    headingFont: '"Fraunces", Georgia, serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap",
    fontPackId: "luxury_serif",
    colorMood: "warm",
    designStyle: "modern",
  },
  {
    id: "minimal_light",
    label: "Minimal Light",
    description: "Clean white layout with subtle navy typography.",
    primaryColor: "#1A2B48",
    accentColor: "#3D6B9F",
    backgroundColor: "#FFFFFF",
    fontStyle: "Light sans-serif, airy whitespace",
    fontFamily: '"Instrument Sans", system-ui, sans-serif',
    headingFont: '"Newsreader", Georgia, serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,700&display=swap",
    fontPackId: "editorial",
    colorMood: "neutral",
    designStyle: "minimal",
  },
  {
    id: "bold_dark",
    label: "Bold Dark",
    description: "High-contrast dark mode with electric accents.",
    primaryColor: "#22D3EE",
    accentColor: "#A5F3FC",
    backgroundColor: "#07070C",
    fontStyle: "Bold sans-serif, large headlines",
    fontFamily: '"Space Grotesk", system-ui, sans-serif',
    headingFont: '"Space Grotesk", system-ui, sans-serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    fontPackId: "tech",
    colorMood: "vibrant",
    designStyle: "bold",
  },
  {
    id: "ocean_cool",
    label: "Ocean Cool",
    description: "Trust-building blues for services and SaaS brands.",
    primaryColor: "#2563EB",
    accentColor: "#60A5FA",
    backgroundColor: "#0B1220",
    fontStyle: "Professional sans-serif",
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    headingFont: '"IBM Plex Sans", system-ui, sans-serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
    fontPackId: "clean_mono",
    colorMood: "cool",
    designStyle: "modern",
  },
  {
    id: "sunset_warm",
    label: "Sunset Warm",
    description: "Warm oranges and deep cocoa for lifestyle and retail.",
    primaryColor: "#EA580C",
    accentColor: "#FDBA74",
    backgroundColor: "#140E0A",
    fontStyle: "Friendly rounded sans-serif",
    fontFamily: '"Nunito Sans", system-ui, sans-serif',
    headingFont: '"Fraunces", Georgia, serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Nunito+Sans:wght@400;600;700;800&display=swap",
    fontPackId: "friendly",
    colorMood: "warm",
    designStyle: "classic",
  },
];

/** Extra quick palettes (applied as custom theme), like Durable’s recommended colors. */
export const QUICK_BRAND_PALETTES: Array<{
  id: string;
  label: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}> = [
  {
    id: "forest",
    label: "Forest",
    primaryColor: "#2F6B4F",
    accentColor: "#8FBC8F",
    backgroundColor: "#0C1410",
  },
  {
    id: "rose",
    label: "Rose",
    primaryColor: "#BE123C",
    accentColor: "#FB7185",
    backgroundColor: "#FFF1F2",
  },
  {
    id: "ink",
    label: "Ink",
    primaryColor: "#111827",
    accentColor: "#6B7280",
    backgroundColor: "#FFFFFF",
  },
  {
    id: "sand",
    label: "Sand",
    primaryColor: "#A16207",
    accentColor: "#D6A15C",
    backgroundColor: "#1C1917",
  },
  {
    id: "violet",
    label: "Violet",
    primaryColor: "#7C3AED",
    accentColor: "#C4B5FD",
    backgroundColor: "#0F0A1A",
  },
];

export function getThemePreset(id: SiteThemePreset): SiteThemePresetDefinition {
  if (id === "custom") return SITE_THEME_PRESETS[0]!;
  return SITE_THEME_PRESETS.find((p) => p.id === id) ?? SITE_THEME_PRESETS[0]!;
}

export function defaultCustomThemeFromPreset(
  presetId: Exclude<SiteThemePreset, "custom"> = "gold_navy"
): SiteCustomTheme {
  const preset = getThemePreset(presetId);
  return {
    primaryColor: preset.primaryColor,
    accentColor: preset.accentColor,
    backgroundColor: preset.backgroundColor,
    fontPackId: preset.fontPackId,
  };
}

export function normalizeHex(value: string, fallback: string): string {
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v.toUpperCase()}`;
  return fallback;
}

/** Resolve final theme tokens from preferences (presets + custom overrides). */
export function resolveSiteTheme(preferences: SitePreferences): SitePlanTheme {
  const base =
    preferences.themePreset === "custom"
      ? getThemePreset("gold_navy")
      : getThemePreset(preferences.themePreset);

  const custom = preferences.customTheme;
  const useCustomColors =
    preferences.themePreset === "custom" ||
    Boolean(
      custom &&
        (custom.primaryColor !== base.primaryColor ||
          custom.accentColor !== base.accentColor ||
          custom.backgroundColor !== base.backgroundColor)
    );

  const primaryColor = normalizeHex(
    custom?.primaryColor ?? base.primaryColor,
    base.primaryColor
  );
  const accentColor = normalizeHex(
    custom?.accentColor ?? base.accentColor,
    base.accentColor
  );
  const backgroundColor = normalizeHex(
    custom?.backgroundColor ?? base.backgroundColor,
    base.backgroundColor
  );

  const fontPack = getFontPack(custom?.fontPackId ?? base.fontPackId);

  return {
    presetId: useCustomColors || preferences.themePreset === "custom" ? "custom" : base.id,
    primaryColor,
    accentColor,
    backgroundColor,
    fontStyle: `${fontPack.label} — ${fontPack.description}`,
    styleNotes: useCustomColors
      ? `Custom brand palette with ${fontPack.label} typography.`
      : base.description,
    fontFamily: fontPack.fontFamily,
    headingFont: fontPack.headingFont,
    googleFontsUrl: fontPack.googleFontsUrl,
  };
}

/** Map a BrandSystem into SitePlanTheme tokens for the renderer. */
export function themeFromBrand(
  brand: import("@/types/site-builder").BrandSystem,
  fallbackPreset: SiteThemePreset = "custom"
): SitePlanTheme {
  const fontPack = getFontPack(brand.fontPackId);
  return {
    presetId: fallbackPreset === "custom" ? "custom" : fallbackPreset,
    primaryColor: normalizeHex(brand.primary, "#3867FF"),
    accentColor: normalizeHex(brand.secondary, "#FFD166"),
    backgroundColor: normalizeHex(brand.background, "#FFFFFF"),
    fontStyle: `${brand.style} · ${brand.toneOfVoice}`,
    styleNotes: `${brand.style} brand · ${brand.animation} motion · ${brand.imageStyle} imagery`,
    fontFamily: brand.font.includes(",") ? brand.font : `"${brand.font}", system-ui, sans-serif`,
    headingFont: brand.headingFont
      ? brand.headingFont.includes(",")
        ? brand.headingFont
        : `"${brand.headingFont}", Georgia, serif`
      : fontPack.headingFont,
    googleFontsUrl: brand.googleFontsUrl ?? fontPack.googleFontsUrl,
    buttonRadius: brand.buttonRadius,
    animation: brand.animation,
    imageStyle: brand.imageStyle,
    spacingScale: brand.spacingScale,
  };
}

/** Prefer brand system on preferences when present. */
export function resolveSiteThemeWithBrand(preferences: SitePreferences): SitePlanTheme {
  if (preferences.brandSystem) {
    return themeFromBrand(preferences.brandSystem, preferences.themePreset);
  }
  return resolveSiteTheme(preferences);
}
