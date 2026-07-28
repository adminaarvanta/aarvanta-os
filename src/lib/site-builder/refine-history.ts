import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import type { SiteBuildJob, SiteRefineTurn } from "@/types/site-builder";

const MAX_REFINE_TURNS = 80;

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

export function isImageRefine(refineInstructions?: string): boolean {
  if (!refineInstructions?.trim()) return false;
  return /\b(image|photo|picture|imagery|hero\s*image|stock|unsplash|gallery|lookbook)\b/i.test(
    refineInstructions
  );
}

export function isStructuralRefine(refineInstructions?: string): boolean {
  if (!refineInstructions?.trim()) return false;
  return /\b(add\s+(a\s+)?page|remove\s+(a\s+)?page|new\s+page|reorder|section\s+order|layout|split\s+hero|full[\s-]?bleed|centered\s+hero|nav\s*style|add\s+(a\s+)?section)\b/i.test(
    refineInstructions
  );
}

export function isCopyRefine(refineInstructions?: string): boolean {
  if (!refineInstructions?.trim()) return false;
  const lower = refineInstructions.toLowerCase();
  if (isThemeRefine(refineInstructions) && !/headline|subhead|cta|copy|text|tagline|button/.test(lower)) {
    return false;
  }
  return (
    /headline|title|hero\s*text|main\s*heading|subhead|sub-?headline|tagline|supporting|\bcta\b|call to action|button\s*label|copy|wording|rewrite|change\s+the\s+text/.test(
      lower
    ) || /["“']([^"”']{3,120})["”']/.test(refineInstructions)
  );
}

/** Join applied user turns so multi-step studio edits compound. */
export function accumulateRefineInstructions(
  chat: SiteRefineTurn[] | undefined,
  latest?: string
): string | undefined {
  const prior = (chat ?? [])
    .filter((t) => t.role === "user" && t.applied && t.status !== "failed")
    .map((t) => t.content.trim())
    .filter(Boolean);
  const next = latest?.trim();
  const parts = next ? [...prior, next] : prior;
  // Dedupe consecutive duplicates
  const unique: string[] = [];
  for (const part of parts) {
    if (unique[unique.length - 1] !== part) unique.push(part);
  }
  if (!unique.length) return undefined;
  // Keep the last several so the prompt stays bounded
  return unique.slice(-8).join("\n");
}

export function appendRefineTurn(
  job: SiteBuildJob,
  turn: Omit<SiteRefineTurn, "id" | "createdAt"> &
    Partial<Pick<SiteRefineTurn, "id" | "createdAt">>
): SiteBuildJob {
  const entry: SiteRefineTurn = {
    id: turn.id ?? crmNewId("refine"),
    role: turn.role,
    content: turn.content.trim(),
    createdAt: turn.createdAt ?? crmNow(),
    applied: turn.applied,
    resultVersion: turn.resultVersion,
    status: turn.status,
  };
  if (!entry.content) return job;
  const next = [...(job.refineChat ?? []), entry].slice(-MAX_REFINE_TURNS);
  return { ...job, refineChat: next, updatedAt: crmNow() };
}

export function markLatestUserRefine(
  job: SiteBuildJob,
  patch: Partial<Pick<SiteRefineTurn, "status" | "resultVersion" | "applied">>
): SiteBuildJob {
  const chat = [...(job.refineChat ?? [])];
  for (let i = chat.length - 1; i >= 0; i--) {
    if (chat[i]?.role === "user") {
      chat[i] = { ...chat[i]!, ...patch };
      break;
    }
  }
  return { ...job, refineChat: chat, updatedAt: crmNow() };
}
