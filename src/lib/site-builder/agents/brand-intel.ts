import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { getFontPack } from "@/lib/site-builder/font-packs";
import { brandSystemSchema } from "@/lib/site-builder/schemas";
import { normalizeHex, resolveSiteTheme } from "@/lib/site-builder/theme-presets";
import type { BrandSystem, BusinessProfile, SitePreferences } from "@/types/site-builder";

function heuristicBrand(
  preferences: SitePreferences,
  business: BusinessProfile
): BrandSystem {
  const base = resolveSiteTheme(preferences);
  const fontPack = getFontPack(
    preferences.customTheme?.fontPackId ??
      (preferences.tone === "luxury"
        ? "luxury_serif"
        : preferences.tone === "friendly"
          ? "friendly"
          : preferences.tone === "bold"
            ? "tech"
            : "modern_sans")
  );

  const radius =
    business.brandTone.toLowerCase().includes("luxury") || preferences.tone === "luxury"
      ? "4"
      : preferences.designStyle === "minimal"
        ? "8"
        : "12";

  return {
    primary: base.primaryColor,
    secondary: base.accentColor,
    background: base.backgroundColor,
    font: fontPack.previewBody,
    headingFont: fontPack.previewHeading,
    fontPackId: fontPack.id,
    buttonRadius: radius,
    style:
      preferences.designStyle === "minimal"
        ? "Minimal"
        : preferences.designStyle === "bold"
          ? "Bold"
          : preferences.tone === "luxury"
            ? "Luxury"
            : "Modern",
    animation: preferences.designStyle === "bold" ? "Expressive" : "Minimal",
    imageStyle:
      business.industry === "Retail" || /product|shop/i.test(business.primaryGoal)
        ? "Lifestyle"
        : business.industry === "Healthcare"
          ? "Calm professional"
          : "Editorial",
    spacingScale: preferences.designStyle === "minimal" ? "Airy" : "Comfortable",
    iconSet: "Lucide outline",
    toneOfVoice: `${business.brandTone} · clear · benefit-led`,
    googleFontsUrl: fontPack.googleFontsUrl,
  };
}

export async function runBrandIntel(
  preferences: SitePreferences,
  business: BusinessProfile
): Promise<{ brand: BrandSystem; usedAi: boolean }> {
  if (preferences.brandSystem) {
    return { brand: preferences.brandSystem, usedAi: false };
  }

  const fallback = heuristicBrand(preferences, business);
  if (!isAiConfigured()) {
    return { brand: fallback, usedAi: false };
  }

  try {
    const raw = await completeJson<BrandSystem>({
      system: `You are a brand designer for a website builder.
Return JSON: primary, secondary, background (6-digit hex with #), font, headingFont, fontPackId (editorial|modern_sans|tech|friendly|luxury_serif|clean_mono), buttonRadius (e.g. "12"), style, animation (Minimal|Subtle|Expressive), imageStyle, spacingScale (Compact|Comfortable|Airy), iconSet, toneOfVoice.
Create a coherent, distinctive palette for this business — not generic purple-on-white.`,
      user: JSON.stringify({
        siteName: preferences.businessName,
        business,
        tone: preferences.tone,
        designStyle: preferences.designStyle,
        colorMood: preferences.colorMood,
      }),
      temperature: 0.5,
    });
    const normalized = {
      ...raw,
      primary: normalizeHex(String(raw.primary ?? ""), fallback.primary),
      secondary: normalizeHex(String(raw.secondary ?? ""), fallback.secondary),
      background: normalizeHex(String(raw.background ?? ""), fallback.background),
      fontPackId: raw.fontPackId ?? fallback.fontPackId,
      googleFontsUrl: raw.googleFontsUrl ?? getFontPack(raw.fontPackId ?? fallback.fontPackId).googleFontsUrl,
    };
    const parsed = brandSystemSchema.safeParse(normalized);
    if (!parsed.success) {
      return { brand: fallback, usedAi: false };
    }
    return { brand: parsed.data, usedAi: true };
  } catch {
    return { brand: fallback, usedAi: false };
  }
}
