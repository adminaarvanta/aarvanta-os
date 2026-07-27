import type { BrandSystem, GeneratedSite, SitePlanTheme } from "@/types/site-builder";
import { normalizeHex } from "@/lib/site-builder/theme-presets";

const NAMED_PALETTES: Record<
  string,
  { primary: string; secondary: string; background?: string }
> = {
  green: { primary: "#16A34A", secondary: "#86EFAC" },
  emerald: { primary: "#059669", secondary: "#6EE7B7" },
  teal: { primary: "#0D9488", secondary: "#5EEAD4" },
  blue: { primary: "#2563EB", secondary: "#93C5FD" },
  navy: { primary: "#1A2B48", secondary: "#3D6B9F", background: "#F8FAFC" },
  red: { primary: "#DC2626", secondary: "#FCA5A5" },
  rose: { primary: "#E11D48", secondary: "#FDA4AF" },
  pink: { primary: "#DB2777", secondary: "#F9A8D4" },
  purple: { primary: "#7C3AED", secondary: "#C4B5FD" },
  violet: { primary: "#6D28D9", secondary: "#DDD6FE" },
  orange: { primary: "#EA580C", secondary: "#FDBA74" },
  amber: { primary: "#D97706", secondary: "#FCD34D" },
  gold: { primary: "#B8965D", secondary: "#C9AA72" },
  yellow: { primary: "#CA8A04", secondary: "#FDE047" },
  black: { primary: "#111827", secondary: "#6B7280", background: "#FFFFFF" },
  dark: { primary: "#0F172A", secondary: "#64748B", background: "#F8FAFC" },
  white: { primary: "#111827", secondary: "#9CA3AF", background: "#FFFFFF" },
  warm: { primary: "#C2410C", secondary: "#FDBA74", background: "#FFF7ED" },
  cool: { primary: "#0284C7", secondary: "#7DD3FC", background: "#F0F9FF" },
};

function extractHex(text: string): string | undefined {
  const m = text.match(/#([0-9A-Fa-f]{6})\b/);
  return m ? normalizeHex(`#${m[1]}`, "#2563EB") : undefined;
}

function extractNamedPalette(text: string) {
  const lower = text.toLowerCase();
  for (const name of Object.keys(NAMED_PALETTES)) {
    if (new RegExp(`\\b${name}\\b`, "i").test(lower)) {
      return NAMED_PALETTES[name]!;
    }
  }
  // softer matches
  if (/green(?:er)?|forest|mint/.test(lower)) return NAMED_PALETTES.green;
  if (/blu(?:e|ish)|ocean|sky/.test(lower)) return NAMED_PALETTES.blue;
  if (/purpl|lilac|lavender/.test(lower)) return NAMED_PALETTES.purple;
  return undefined;
}

export function isThemeRefine(refineInstructions?: string): boolean {
  if (!refineInstructions?.trim()) return false;
  const lower = refineInstructions.toLowerCase();
  return (
    /theme|palett|brand\s*colou?r|primary\s*colou?r|accent|background\s*colou?r|#([0-9a-f]{6})\b/.test(
      lower
    ) ||
    /\b(make|use|change|switch|set).{0,40}\b(green|blue|red|purple|orange|teal|pink|gold|navy|dark)\b/.test(
      lower
    ) ||
    /\b(greener|bluer|warmer|cooler)\b/.test(lower)
  );
}

/** Apply color/theme instructions onto a brand system. */
export function applyBrandRefine(
  brand: BrandSystem,
  refineInstructions?: string
): BrandSystem {
  const refine = refineInstructions?.trim();
  if (!refine || !isThemeRefine(refine)) return brand;

  const hex = extractHex(refine);
  const named = extractNamedPalette(refine);
  const lower = refine.toLowerCase();

  let primary = brand.primary;
  let secondary = brand.secondary;
  let background = brand.background;

  if (hex) {
    primary = hex;
    // Keep secondary related unless named palette also present
    if (!named) {
      secondary = brand.secondary;
    }
  }
  if (named) {
    primary = named.primary;
    secondary = named.secondary;
    if (named.background) background = named.background;
  }

  // Explicit channel hints
  if (/accent|secondary/.test(lower) && hex && !named) {
    secondary = hex;
    primary = brand.primary;
  }
  if (/background|bg\b/.test(lower) && hex) {
    background = hex;
    if (!/primary|accent|theme|palette/.test(lower)) {
      primary = brand.primary;
      secondary = brand.secondary;
    }
  }

  return {
    ...brand,
    primary: normalizeHex(primary, brand.primary),
    secondary: normalizeHex(secondary, brand.secondary),
    background: normalizeHex(background, brand.background),
  };
}

function themeFromPartialBrand(
  theme: SitePlanTheme,
  brand: BrandSystem
): SitePlanTheme {
  return {
    ...theme,
    primaryColor: brand.primary,
    accentColor: brand.secondary,
    backgroundColor: brand.background,
    presetId: "custom",
  };
}

/**
 * Apply common refine phrases without AI so studio updates always reflect.
 * Supports copy edits and theme/color changes.
 */
export function applyRefineHeuristics(
  site: GeneratedSite,
  refineInstructions?: string
): GeneratedSite {
  const refine = refineInstructions?.trim();
  if (!refine) return site;

  let next: GeneratedSite = { ...site };

  if (isThemeRefine(refine) && site.brand) {
    const brand = applyBrandRefine(site.brand, refine);
    next = {
      ...next,
      brand,
      theme: themeFromPartialBrand(site.theme, brand),
    };
  }

  const quoted =
    refine.match(/["“']([^"”']{3,120})["”']/)?.[1]?.trim() ?? undefined;

  const lower = refine.toLowerCase();
  const themeish = isThemeRefine(refine);
  const wantsHeadline =
    !themeish &&
    (/headline|title|hero\s*text|main\s*heading/.test(lower) ||
      (!/cta|button|subhead|sub-?headline|tagline/.test(lower) && Boolean(quoted)));
  const wantsSub = !themeish && /subhead|sub-?headline|tagline|supporting/.test(lower);
  const wantsCta =
    !themeish &&
    /\bcta\b|call to action|button\s*label|shop now|get started/.test(lower);

  if (!wantsHeadline && !wantsSub && !wantsCta) {
    return {
      ...next,
      generatedAt: new Date().toISOString(),
      version: (next.version ?? 1) + 1,
    };
  }

  const patch = quoted ?? refine.slice(0, 90);

  const pages = next.pages.map((page) => {
    if (page.slug !== "home" && page.slug !== "") return page;
    return {
      ...page,
      blocks: page.blocks.map((block) => {
        if (block.type !== "hero") return block;
        const props = { ...block.props };
        if (wantsHeadline && patch) props.headline = patch;
        if (wantsSub && patch) props.subheadline = patch;
        if (wantsCta && patch) {
          const ctaMatch = refine.match(
            /(?:cta|button|call to action)\s+(?:to|as|:)\s*[“"']?([^"”'.!\n]{2,40})/i
          );
          props.cta = (ctaMatch?.[1] ?? patch).slice(0, 40);
        }
        return { ...block, props };
      }),
    };
  });

  return {
    ...next,
    pages,
    generatedAt: new Date().toISOString(),
    version: (next.version ?? 1) + 1,
  };
}
