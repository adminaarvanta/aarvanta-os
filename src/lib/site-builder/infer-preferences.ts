import type {
  SiteCategoryId,
  SiteCtaGoal,
  SiteFeatureOption,
  SitePageOption,
  SitePreferences,
  SiteThemePreset,
  SiteTone,
  SiteType,
} from "@/types/site-builder";
import { DEFAULT_DEPLOYMENT } from "@/lib/site-builder/normalize-preferences";
import { getThemePreset } from "@/lib/site-builder/theme-presets";
import {
  defaultTemplateForCategory,
  getTemplateById,
} from "@/lib/site-builder/templates/resolve-template";

const EXAMPLE_PROMPTS = [
  {
    id: "candles",
    categoryId: "ecommerce" as SiteCategoryId,
    templateId: "ecom_boutique",
    label: "Candle shop",
    prompt:
      "Artisan Candles Co — handmade soy candles for UK homes. Warm, gift-ready shop with subscriptions.",
  },
  {
    id: "dental",
    categoryId: "healthcare" as SiteCategoryId,
    templateId: "health_clinic",
    label: "Family dentist",
    prompt:
      "North Peak Dental — modern family dentist in Manchester. Calm, trustworthy site to book appointments.",
  },
  {
    id: "saas",
    categoryId: "saas" as SiteCategoryId,
    templateId: "saas_launch",
    label: "Bookkeeping app",
    prompt:
      "Ledgerly — simple bookkeeping software for freelancers. Clean product landing with pricing and signup.",
  },
  {
    id: "portfolio",
    categoryId: "portfolio" as SiteCategoryId,
    templateId: "folio_editorial",
    label: "Architecture studio",
    prompt:
      "Maya Chen Studio — architecture portfolio. Editorial, minimal, photography-led with project case studies.",
  },
] as const;

function extractBusinessName(prompt: string): string {
  const beforeDash = prompt.split(/[—–\-:]/)[0]?.trim();
  if (beforeDash && beforeDash.length >= 2 && beforeDash.length <= 60) {
    return beforeDash;
  }
  const words = prompt.trim().split(/\s+/).slice(0, 3);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "My Business";
}

function inferTone(prompt: string): SiteTone {
  const p = prompt.toLowerCase();
  if (/(luxury|premium|editorial|elegant)/.test(p)) return "luxury";
  if (/(bold|loud|statement|vibrant)/.test(p)) return "bold";
  if (/(friendly|warm|cozy|family)/.test(p)) return "friendly";
  return "professional";
}

/**
 * Enrich preferences from a prompt AFTER category + template are chosen.
 * Does not invent category/template — those must be supplied via overrides.
 */
export function inferPreferencesFromPrompt(
  prompt: string,
  overrides: Partial<SitePreferences> & {
    categoryId: SiteCategoryId;
    templateId: string;
  }
): SitePreferences {
  const trimmed = prompt.trim();
  const template =
    getTemplateById(overrides.templateId) ??
    defaultTemplateForCategory(overrides.categoryId);

  const siteType: SiteType = overrides.siteType ?? template.siteType;
  const themePreset: SiteThemePreset =
    overrides.themePreset ?? template.defaultTheme;
  const presetBaseId = themePreset === "custom" ? "gold_navy" : themePreset;
  const preset = getThemePreset(presetBaseId);
  const businessName = overrides.businessName ?? extractBusinessName(trimmed);
  const pages: SitePageOption[] = overrides.pages ?? template.defaultPages;
  const features: SiteFeatureOption[] =
    overrides.features ?? template.defaultFeatures;
  const ctaGoal: SiteCtaGoal = overrides.ctaGoal ?? template.defaultCta;

  return {
    businessName,
    businessIdea: trimmed || overrides.businessIdea || `${businessName} website`,
    targetAudience: overrides.targetAudience,
    countryBase: overrides.countryBase ?? "UK",
    categoryId: overrides.categoryId,
    templateId: template.id,
    tone: overrides.tone ?? template.defaultTone ?? inferTone(trimmed),
    siteType,
    designStyle: overrides.designStyle ?? preset.designStyle,
    colorMood: overrides.colorMood ?? preset.colorMood,
    themePreset,
    customTheme: overrides.customTheme,
    pages,
    features,
    ctaGoal,
    keyMessages: overrides.keyMessages,
    customPrompt: overrides.customPrompt ?? trimmed,
    referenceUrl: overrides.referenceUrl,
    referenceScreenshots: overrides.referenceScreenshots ?? [],
    deployment: {
      ...DEFAULT_DEPLOYMENT,
      ...(overrides.deployment ?? {}),
      domain: {
        ...DEFAULT_DEPLOYMENT.domain,
        ...(overrides.deployment?.domain ?? {}),
      },
      ec2: {
        ...DEFAULT_DEPLOYMENT.ec2,
        stackName:
          overrides.deployment?.ec2?.stackName ??
          businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 48),
        ...(overrides.deployment?.ec2 ?? {}),
      },
    },
  };
}

export { EXAMPLE_PROMPTS };

/** @deprecated Use SITE_CATEGORIES from templates/categories — kept for any legacy imports. */
export const SITE_TYPE_CARDS: Array<{
  id: SiteType;
  label: string;
  description: string;
  examples: string;
}> = [
  {
    id: "store",
    label: "Online store",
    description: "Products, pricing, and checkout-ready pages",
    examples: "Retail · DTC · Subscriptions",
  },
  {
    id: "business",
    label: "Local business",
    description: "Services, trust, and lead capture",
    examples: "Dental · Agency · Trades",
  },
  {
    id: "landing",
    label: "Product / SaaS",
    description: "Conversion-focused landing with pricing",
    examples: "Startups · Apps · Tools",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Work showcase and contact",
    examples: "Creators · Studios · Freelancers",
  },
];
