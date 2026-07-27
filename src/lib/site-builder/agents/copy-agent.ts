import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { applyRefineHeuristics } from "@/lib/site-builder/apply-refine";
import { buildContentBrief } from "@/lib/site-builder/content-brief";
import { preferSampleFilledSite } from "@/lib/site-builder/ensure-sample-data";
import { generateSiteFromPlan } from "@/lib/site-builder/generate-site";
import type {
  BrandSystem,
  BusinessProfile,
  GeneratedSite,
  SitePlan,
  SitePreferences,
} from "@/types/site-builder";

/**
 * Copy agent — fills section props.
 * Phase 1 reuses generateSiteFromPlan (heuristic + optional AI), then optionally
 * refreshes hero copy specifically for higher quality.
 */
export async function runCopyAgent(
  plan: SitePlan,
  preferences: SitePreferences,
  business: BusinessProfile,
  brand: BrandSystem
): Promise<{ site: GeneratedSite; usedAi: boolean }> {
  const { site, usedAi } = await generateSiteFromPlan(plan, {
    ...preferences,
    businessProfile: business,
    brandSystem: brand,
    pages: plan.pages.map((p) => p.slug as SitePreferences["pages"][number]),
  });

  let enriched: GeneratedSite = {
    ...site,
    business,
    brand,
    theme: plan.theme,
    version: 1,
  };

  if (!isAiConfigured()) {
    return {
      site: applyRefineHeuristics(enriched, preferences.refineInstructions),
      usedAi,
    };
  }

  try {
    const brief = buildContentBrief(preferences);
    const home = enriched.pages.find((p) => p.slug === "home");
    const hero = home?.blocks.find((b) => b.type === "hero");
    if (!hero) {
      return {
        site: applyRefineHeuristics(enriched, preferences.refineInstructions),
        usedAi,
      };
    }

    const refine = preferences.refineInstructions?.trim();
    const heroCopy = await completeJson<{
      eyebrow?: string;
      headline: string;
      subheadline: string;
      cta: string;
      secondaryCta?: string;
    }>({
      system: `Write conversion-focused hero copy. Return JSON with headline, subheadline, cta, optional eyebrow and secondaryCta. Tone: ${brand.toneOfVoice}.${
        refine
          ? ` CRITICAL: Apply this change request exactly where relevant: ${refine}`
          : ""
      }`,
      user: JSON.stringify({
        businessName: preferences.businessName,
        business,
        idea: preferences.businessIdea,
        refineInstructions: refine,
        brief: { headline: brief.headline, tagline: brief.tagline },
      }),
      temperature: 0.65,
    });

    const nextBlocks = home!.blocks.map((b) =>
      b.id === hero.id
        ? {
            ...b,
            variantId: b.variantId ?? "default",
            props: {
              ...b.props,
              ...heroCopy,
            },
          }
        : b
    );

    const nextPages = enriched.pages.map((p) =>
      p.slug === "home" ? { ...p, blocks: nextBlocks } : p
    );

    enriched = preferSampleFilledSite(enriched, { ...enriched, pages: nextPages });
    return {
      site: applyRefineHeuristics(enriched, preferences.refineInstructions),
      usedAi: true,
    };
  } catch {
    return {
      site: applyRefineHeuristics(enriched, preferences.refineInstructions),
      usedAi,
    };
  }
}
