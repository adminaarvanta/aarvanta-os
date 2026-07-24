import type { SiteCategoryId, SitePreferences, SiteTemplateDefinition } from "@/types/site-builder";
import { getCategoryById } from "@/lib/site-builder/templates/categories";
import { resolveTemplatePrior } from "@/lib/site-builder/templates/resolve-template";
import {
  extractPromptEntities,
  promptHeadline,
} from "@/lib/site-builder/prompt-copy";

export type ContentBrief = {
  categoryId: SiteCategoryId;
  templateId: string;
  templateName: string;
  categoryLabel: string;
  businessName: string;
  idea: string;
  audience: string;
  tone: string;
  ctaLabel: string;
  ctaSecondary: string;
  headline: string;
  subheadline: string;
  tagline: string;
  imageKeywords: string[];
  /** Prompt-derived entities — drives unique heuristic copy. */
  entities: ReturnType<typeof extractPromptEntities>;
};

function ctaLabels(prefs: SitePreferences): { primary: string; secondary: string } {
  switch (prefs.ctaGoal) {
    case "buy":
      return { primary: "Shop now", secondary: "Browse collection" };
    case "subscribe":
      return { primary: "Start free", secondary: "See pricing" };
    case "book_call":
      return { primary: "Book a call", secondary: "Learn more" };
    default:
      return { primary: "Get in touch", secondary: "View details" };
  }
}

export function buildContentBrief(preferences: SitePreferences): ContentBrief {
  const template: SiteTemplateDefinition = resolveTemplatePrior(
    preferences.templateId,
    preferences.categoryId
  );

  const categoryId = preferences.categoryId ?? template.categoryId;
  const category = getCategoryById(categoryId);
  const categoryLabel =
    categoryId === "custom" && preferences.customCategoryLabel
      ? preferences.customCategoryLabel
      : category?.label ?? categoryId;

  const entities = extractPromptEntities(preferences);
  const { primary, secondary } = ctaLabels(preferences);

  const ideaKeywords = [
    ...entities.nouns.slice(0, 5),
    ...preferences.businessIdea.split(/\s+/).filter((w) => w.length > 3).slice(0, 4),
  ];
  // Prefer idea nouns over generic template keywords so media buckets match the business.
  const imageKeywords = [
    ...ideaKeywords,
    preferences.businessName,
    ...template.imageKeywords.slice(0, 1),
  ].filter(Boolean);

  return {
    categoryId,
    templateId: template.id,
    templateName: template.name,
    categoryLabel,
    businessName: preferences.businessName,
    idea: preferences.businessIdea,
    audience: preferences.targetAudience || entities.audienceHint,
    tone: preferences.tone,
    ctaLabel: primary,
    ctaSecondary: secondary,
    headline: promptHeadline(preferences, entities),
    subheadline:
      preferences.keyMessages ||
      entities.phrases[1] ||
      preferences.businessIdea.slice(0, 180) ||
      `A ${categoryLabel.toLowerCase()} experience designed for ${entities.audienceHint}.`,
    tagline: `${template.name} · ${categoryLabel}`,
    imageKeywords,
    entities,
  };
}
