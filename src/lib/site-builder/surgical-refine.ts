import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { A48_STUDIO_EDITS } from "@/lib/product/flags";
import { applyRefineHeuristics } from "@/lib/site-builder/apply-refine";
import { parseRefineOps } from "@/lib/site-builder/parse-refine-ops";
import { isCopyRefine } from "@/lib/site-builder/refine-history";
import {
  applySiteEdits,
  bumpSiteVersion,
  compactSiteOutline,
  isSiteEditOp,
  summarizeRefineResult,
  type AppliedSiteEdit,
  type SiteEditOp,
  type SkippedSiteEdit,
} from "@/lib/site-builder/site-edits";
import type { GeneratedSite, SiteRefineLastResult } from "@/types/site-builder";

export type SurgicalRefineResult = {
  site: GeneratedSite;
  applied: AppliedSiteEdit[];
  skipped: SkippedSiteEdit[];
  changed: boolean;
  usedAi: boolean;
  summary: string;
  outcome: SiteRefineLastResult;
};

export async function applySurgicalRefine(
  site: GeneratedSite,
  refineText: string,
  context?: { businessName?: string; idea?: string }
): Promise<SurgicalRefineResult> {
  const refine = refineText.trim();
  if (!refine) {
    return emptyResult(site, "Could not apply — empty instruction.");
  }

  if (!A48_STUDIO_EDITS) {
    const next = applyRefineHeuristics(site, refine);
    const changed = next !== site && JSON.stringify(next.pages) !== JSON.stringify(site.pages);
    const summary = changed
      ? "Updated the site from your prompt."
      : "Could not apply — try naming the page or quoting the new text.";
    return {
      site: next,
      applied: changed ? [{ op: { type: "noop", reason: "legacy" }, summary }] : [],
      skipped: changed ? [] : [{ op: { type: "noop", reason: summary }, reason: summary }],
      changed,
      usedAi: false,
      summary,
      outcome: {
        changed,
        summary,
        applied: changed ? [summary] : [],
      },
    };
  }

  const heuristicOps = parseRefineOps(refine);
  let current = applySiteEdits(site, heuristicOps);
  let usedAi = false;

  if (isAiConfigured()) {
    try {
      const aiOps = await requestOutlineOps(current.site, refine, context);
      if (aiOps.length) {
        current = mergeEditResults(current, applySiteEdits(current.site, aiOps));
        usedAi = true;
      }
    } catch {
      /* heuristics already applied */
    }

    // Quoted / exact phrases win over the model.
    current = mergeEditResults(current, applySiteEdits(current.site, heuristicOps));
  }

  if (!current.changed && isAiConfigured() && isCopyRefine(refine)) {
    try {
      const heroUpdated = await applyHeroFallback(current.site, refine, context);
      if (heroUpdated) {
        current = mergeEditResults(current, heroUpdated);
        usedAi = true;
        current = mergeEditResults(current, applySiteEdits(current.site, heuristicOps));
      }
    } catch {
      /* keep honest miss */
    }
  }

  const summary = summarizeRefineResult(current.applied, current.skipped);
  return {
    site: current.changed ? bumpSiteVersion(current.site) : site,
    applied: current.applied,
    skipped: current.skipped,
    changed: current.changed,
    usedAi,
    summary,
    outcome: {
      changed: current.changed,
      summary,
      applied: current.applied.map((item) => item.summary),
    },
  };
}

function emptyResult(site: GeneratedSite, summary: string): SurgicalRefineResult {
  return {
    site,
    applied: [],
    skipped: [{ op: { type: "noop", reason: summary }, reason: summary }],
    changed: false,
    usedAi: false,
    summary,
    outcome: { changed: false, summary, applied: [] },
  };
}

function mergeEditResults(
  first: ReturnType<typeof applySiteEdits>,
  second: ReturnType<typeof applySiteEdits>
) {
  const applied = [...first.applied];
  for (const item of second.applied) {
    if (!applied.some((existing) => existing.summary === item.summary && JSON.stringify(existing.op) === JSON.stringify(item.op))) {
      applied.push(item);
    }
  }
  return {
    site: second.site,
    applied,
    skipped: [...first.skipped, ...second.skipped],
    changed: first.changed || second.changed,
  };
}

async function requestOutlineOps(
  site: GeneratedSite,
  refine: string,
  context?: { businessName?: string; idea?: string }
): Promise<SiteEditOp[]> {
  const result = await completeJson<{ ops?: unknown }>({
    system:
      "You edit an existing website by returning JSON {\"ops\": SiteEditOp[]}. " +
      "Allowed ops: set_text {type,pageSlug,blockId?,blockType?,path,value} " +
      "(path is headline|subheadline|cta|title|body|subtitle|eyebrow|tagline), " +
      "replace_text {type,find,replace,pageSlug?}, " +
      "set_theme {type,primary?,accent?,background?} with hex colours, " +
      "set_meta {type,siteName?,tagline?,footer?}, " +
      "noop {type,reason}. " +
      "Only change what the user asked. Use page slugs and block ids from the outline. " +
      "If you cannot apply the request, return a single noop with a short reason. " +
      "Do not invent pages or images.",
    user: JSON.stringify({
      prompt: refine,
      businessName: context?.businessName,
      idea: context?.idea,
      outline: compactSiteOutline(site),
    }),
    temperature: 0.2,
  });

  const raw = Array.isArray(result.ops) ? result.ops : [];
  return raw.filter(isSiteEditOp);
}

async function applyHeroFallback(
  site: GeneratedSite,
  refine: string,
  context?: { businessName?: string; idea?: string }
) {
  const home = site.pages.find((page) => page.slug === "home" || page.slug === "");
  const hero = home?.blocks.find((block) => block.type === "hero");
  if (!hero || !home) return null;

  const heroCopy = await completeJson<{
    headline?: string;
    subheadline?: string;
    cta?: string;
  }>({
    system: `Update homepage hero copy to satisfy the change request. Return JSON with headline, subheadline, cta. Keep brand voice. Apply exactly: ${refine}`,
    user: JSON.stringify({
      businessName: context?.businessName,
      idea: context?.idea,
      current: {
        headline: hero.props.headline,
        subheadline: hero.props.subheadline,
        cta: hero.props.cta,
      },
    }),
    temperature: 0.5,
  });

  const ops: SiteEditOp[] = [];
  if (heroCopy.headline?.trim()) {
    ops.push({
      type: "set_text",
      pageSlug: home.slug || "home",
      blockId: hero.id,
      blockType: "hero",
      path: "headline",
      value: heroCopy.headline.trim(),
    });
  }
  if (heroCopy.subheadline?.trim()) {
    ops.push({
      type: "set_text",
      pageSlug: home.slug || "home",
      blockId: hero.id,
      blockType: "hero",
      path: "subheadline",
      value: heroCopy.subheadline.trim(),
    });
  }
  if (heroCopy.cta?.trim()) {
    ops.push({
      type: "set_text",
      pageSlug: home.slug || "home",
      blockId: hero.id,
      blockType: "hero",
      path: "cta",
      value: heroCopy.cta.trim(),
    });
  }
  if (!ops.length) return null;
  return applySiteEdits(site, ops);
}
