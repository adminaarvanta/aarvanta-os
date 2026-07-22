import type { SiteCategoryId, SitePreferences, SiteTemplateDefinition } from "@/types/site-builder";
import { getCategoryById } from "@/lib/site-builder/templates/categories";
import { getTemplateById } from "@/lib/site-builder/templates/catalog";

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
      return { primary: "Get in touch", secondary: "View work" };
  }
}

function headlineFor(prefs: SitePreferences, template: SiteTemplateDefinition): string {
  const name = prefs.businessName;
  const idea = prefs.businessIdea.slice(0, 80);
  switch (template.categoryId) {
    case "ecommerce":
      return `${name} — crafted for everyday rituals`;
    case "saas":
      return `${name} makes complex work feel simple`;
    case "healthcare":
      return `Care you can trust at ${name}`;
    case "restaurant":
      return `${name} — a table worth remembering`;
    case "portfolio":
      return `${name} — selected works`;
    case "nonprofit":
      return `${name} — impact that compounds`;
    case "event":
      return `${name} — gather for what’s next`;
    case "agency":
      return `${name} builds brands that move`;
    default:
      return idea.length > 20 ? `${name} — ${idea}` : `${name} — built around your goals`;
  }
}

export function buildContentBrief(preferences: SitePreferences): ContentBrief {
  const template =
    getTemplateById(preferences.templateId) ??
    ({
      id: preferences.templateId,
      name: "Custom",
      categoryId: preferences.categoryId,
      imageKeywords: [preferences.categoryId],
    } as SiteTemplateDefinition);

  const category = getCategoryById(preferences.categoryId);
  const { primary, secondary } = ctaLabels(preferences);

  return {
    categoryId: preferences.categoryId,
    templateId: template.id,
    templateName: template.name,
    categoryLabel: category?.label ?? preferences.categoryId,
    businessName: preferences.businessName,
    idea: preferences.businessIdea,
    audience: preferences.targetAudience || "ambitious customers who value clarity",
    tone: preferences.tone,
    ctaLabel: primary,
    ctaSecondary: secondary,
    headline: headlineFor(preferences, template),
    subheadline:
      preferences.keyMessages ||
      preferences.businessIdea.slice(0, 160) ||
      `A ${category?.label ?? "modern"} experience designed for ${preferences.targetAudience || "your audience"}.`,
    tagline: `${template.name} · ${category?.label ?? "Site"}`,
    imageKeywords: template.imageKeywords?.length
      ? template.imageKeywords
      : [preferences.categoryId, preferences.businessName],
  };
}
