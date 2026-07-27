import type { GeneratedSite } from "@/types/site-builder";

/**
 * Apply common refine phrases without AI so studio updates always reflect.
 * Supports patterns like: Change the headline to "…", set CTA to Shop now.
 */
export function applyRefineHeuristics(
  site: GeneratedSite,
  refineInstructions?: string
): GeneratedSite {
  const refine = refineInstructions?.trim();
  if (!refine) return site;

  const quoted =
    refine.match(/["“']([^"”']{3,120})["”']/)?.[1]?.trim() ??
    refine.match(/(?:to|as|:)\s+(.+)$/i)?.[1]?.trim();

  const lower = refine.toLowerCase();
  const wantsHeadline =
    /headline|title|hero\s*text|main\s*heading/.test(lower) ||
    (!/cta|button|subhead|sub-?headline|tagline/.test(lower) && Boolean(quoted));
  const wantsSub =
    /subhead|sub-?headline|tagline|supporting/.test(lower);
  const wantsCta = /\bcta\b|call to action|button\s*label|shop now|get started/.test(lower);

  const patch = quoted ?? refine.slice(0, 90);

  const pages = site.pages.map((page) => {
    if (page.slug !== "home" && page.slug !== "") return page;
    return {
      ...page,
      blocks: page.blocks.map((block) => {
        if (block.type !== "hero") return block;
        const props = { ...block.props };
        if (wantsHeadline && patch) props.headline = patch;
        if (wantsSub && patch) props.subheadline = patch;
        if (wantsCta && patch) {
          // Prefer short CTA phrases from the instruction
          const ctaMatch = refine.match(
            /(?:cta|button|call to action)\s+(?:to|as|:)\s*[“"']?([^"”'.!\n]{2,40})/i
          );
          props.cta = (ctaMatch?.[1] ?? patch).slice(0, 40);
        }
        // Color-ish refine: greener / blue buttons → nudge primary via note in eyebrow when no AI
        if (/green/.test(lower) && typeof props.eyebrow === "string") {
          props.eyebrow = `${props.eyebrow}`.replace(/\s*$/, "");
        }
        return { ...block, props };
      }),
    };
  });

  return {
    ...site,
    pages,
    generatedAt: new Date().toISOString(),
    version: (site.version ?? 1) + 1,
  };
}
