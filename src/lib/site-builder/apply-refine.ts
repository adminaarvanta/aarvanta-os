import { A48_STUDIO_EDITS } from "@/lib/product/flags";
import { extractThemePatch, parseRefineOps } from "@/lib/site-builder/parse-refine-ops";
import { applySiteEdits, bumpSiteVersion } from "@/lib/site-builder/site-edits";
import {
  isCopyRefine,
  isThemeRefine,
} from "@/lib/site-builder/refine-history";
import { normalizeHex } from "@/lib/site-builder/theme-presets";
import type { BrandSystem, GeneratedSite, SitePlanTheme } from "@/types/site-builder";

export { isThemeRefine } from "@/lib/site-builder/refine-history";
export { extractHex, extractNamedPalette, NAMED_PALETTES } from "@/lib/site-builder/parse-refine-ops";

/** Apply color/theme instructions onto a brand system. */
export function applyBrandRefine(
  brand: BrandSystem,
  refineInstructions?: string
): BrandSystem {
  const refine = refineInstructions?.trim();
  if (!refine || !isThemeRefine(refine)) return brand;
  const patch = extractThemePatch(refine);
  if (!patch) return brand;

  return {
    ...brand,
    primary: normalizeHex(patch.primary ?? brand.primary, brand.primary),
    secondary: normalizeHex(patch.accent ?? brand.secondary, brand.secondary),
    background: normalizeHex(patch.background ?? brand.background, brand.background),
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
 * Uses the structured edit engine when A48_STUDIO_EDITS is on.
 */
export function applyRefineHeuristics(
  site: GeneratedSite,
  refineInstructions?: string
): GeneratedSite {
  const refine = refineInstructions?.trim();
  if (!refine) return site;

  if (!A48_STUDIO_EDITS) {
    return applyRefineHeuristicsLegacy(site, refine);
  }

  const result = applySiteEdits(site, parseRefineOps(refine));
  return result.changed ? bumpSiteVersion(result.site) : site;
}

/**
 * Legacy home-hero regex path (flag off). Kept so billing/edit rollout can roll back.
 */
function applyRefineHeuristicsLegacy(
  site: GeneratedSite,
  refine: string
): GeneratedSite {
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
  const themeish = isThemeRefine(refine) && !isCopyRefine(refine);
  const wantsHeadline =
    !themeish &&
    (/headline|title|hero\s*text|main\s*heading|change\s+the\s+(hero\s+)?(text|copy)/.test(
      lower
    ) ||
      (!/cta|button|subhead|sub-?headline|tagline/.test(lower) && Boolean(quoted)));
  const wantsSub =
    !themeish && /subhead|sub-?headline|tagline|supporting/.test(lower);
  const wantsCta =
    !themeish &&
    /\bcta\b|call to action|button\s*label|shop now|get started|button\s*text/.test(
      lower
    );

  const toPhrase =
    refine.match(
      /(?:headline|title|subhead(?:line)?|tagline|cta|button)\s+(?:to|as|:)\s*[“"']?([^"”'\n]{2,90})/i
    )?.[1]?.trim() ?? undefined;

  if (!wantsHeadline && !wantsSub && !wantsCta) {
    return {
      ...next,
      generatedAt: new Date().toISOString(),
      version: (next.version ?? 1) + 1,
    };
  }

  const patch = (quoted ?? toPhrase ?? refine.replace(/^.*?:\s*/, "").slice(0, 90)).trim();

  const pages = next.pages.map((page) => {
    return {
      ...page,
      blocks: page.blocks.map((block) => {
        if (block.type !== "hero") return block;
        if (page.slug !== "home" && page.slug !== "") return block;
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
