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
import {
  BUSINESS_IDEA_MAX,
  CUSTOM_PROMPT_MAX,
} from "@/lib/site-builder/schemas";
import { getThemePreset } from "@/lib/site-builder/theme-presets";
import { resolveTemplatePrior } from "@/lib/site-builder/templates/resolve-template";

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

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

/** True when the brief clearly asks for a product catalog / checkout site. */
export function promptImpliesStore(prompt: string): boolean {
  const p = prompt.toLowerCase();
  if (
    /(online\s+store|e-?commerce|webshop|shopify|add to cart|checkout|product\s+catalog|merchandise)/.test(
      p
    )
  ) {
    return true;
  }
  if (/(boutique|retail\s+shop|gift\s+shop|dtc)\b/.test(p)) return true;
  if (/(sell|selling|sold)\b.{0,48}\b(online|products?|goods|merchandise)\b/.test(p)) {
    return true;
  }
  if (/\b(shop|store)\b/.test(p) && /(product|retail|buy|purchase)/.test(p)) {
    return true;
  }
  return false;
}

/**
 * Category prior inferred straight from the raw prompt, before any template is
 * resolved. Defaults stay non-store unless the brief clearly asks for retail.
 */
export function inferCategoryFromPrompt(prompt: string): SiteCategoryId | undefined {
  const p = prompt.toLowerCase();
  if (
    /(cement|concrete|pre-?cast|construction|building materials?|industrial|manufactur)/.test(p)
  ) {
    return "professional";
  }
  if (promptImpliesStore(p)) return "ecommerce";
  if (/(saas|software|\bapp\b|platform|bookkeeping|startup)/.test(p)) return "saas";
  if (/(portfolio|photographer|architect|illustrator|freelancer|case stud)/.test(p)) {
    return "portfolio";
  }
  if (/(clinic|dental|dentist|health|therapy|wellness|doctor|physio)/.test(p)) {
    return "healthcare";
  }
  if (/(restaurant|cafe|café|bistro|dining|bakery|bar\b)/.test(p)) return "restaurant";
  if (/(agency|marketing firm|design studio|creative studio)/.test(p)) return "agency";
  if (/(nonprofit|charity|foundation|ngo)\b/.test(p)) return "nonprofit";
  if (/(blog|newsletter|magazine|publisher)/.test(p)) return "blog";
  if (/(conference|festival|workshop|event\b)/.test(p)) return "event";
  if (
    /(plumber|cleaner|electrician|landscap|coach|consultant|lawyer|solicitor|accountant|local service|book appointment)/.test(
      p
    )
  ) {
    return "local_service";
  }
  // Simple / generic business websites → professional services, not store.
  if (/(simple\s+website|business\s+website|company\s+website|landing\s+page)/.test(p)) {
    return "professional";
  }
  return undefined;
}

function featuresImplyStore(features?: SiteFeatureOption[]): boolean {
  return Boolean(features?.includes("ecommerce"));
}

function goalsImplyStore(keyMessages?: string): boolean {
  if (!keyMessages) return false;
  return /sell more products|online store|checkout|product sales/i.test(keyMessages);
}

/**
 * Enrich preferences from a prompt.
 * Category/template are optional priors — the ARIA pipeline can infer them.
 * Unspecified briefs default to a simple business site (not a store).
 */
export function inferPreferencesFromPrompt(
  prompt: string,
  overrides: Partial<SitePreferences> & {
    categoryId?: SiteCategoryId;
    templateId?: string;
  } = {}
): SitePreferences {
  const trimmed = prompt.trim();
  const storeFromBrief =
    promptImpliesStore(trimmed) ||
    featuresImplyStore(overrides.features) ||
    goalsImplyStore(overrides.keyMessages);

  // Prior store classification must not stick when the brief/apps are no longer a store
  // (common after resuming an old ecommerce-default draft).
  const priorForcesStore =
    (overrides.siteType === "store" || overrides.categoryId === "ecommerce") &&
    featuresImplyStore(overrides.features);

  const keepStore = storeFromBrief || priorForcesStore;

  const categoryPrior =
    (keepStore || overrides.categoryId !== "ecommerce"
      ? overrides.categoryId
      : undefined) ??
    inferCategoryFromPrompt(trimmed) ??
    (keepStore ? "ecommerce" : "professional");

  const template = resolveTemplatePrior(
    keepStore || overrides.siteType !== "store"
      ? overrides.templateId
      : undefined,
    categoryPrior
  );

  const siteType: SiteType = keepStore
    ? overrides.siteType === "landing" || overrides.siteType === "portfolio"
      ? overrides.siteType
      : "store"
    : overrides.siteType && overrides.siteType !== "store"
      ? overrides.siteType
      : template.siteType === "store"
        ? "business"
        : template.siteType;

  const themePreset: SiteThemePreset =
    overrides.themePreset ?? template.defaultTheme;
  const presetBaseId = themePreset === "custom" ? "minimal_light" : themePreset;
  const preset = getThemePreset(presetBaseId);
  const businessName = overrides.businessName ?? extractBusinessName(trimmed);

  const pages: SitePageOption[] =
    overrides.pages ??
    (siteType === "store"
      ? template.defaultPages
      : template.defaultPages.filter((p) => p !== "products"));

  const features: SiteFeatureOption[] = overrides.features
    ? keepStore
      ? overrides.features
      : overrides.features.filter((f) => f !== "ecommerce")
    : siteType === "store"
      ? template.defaultFeatures
      : template.defaultFeatures.filter((f) => f !== "ecommerce");

  const ctaGoal: SiteCtaGoal =
    overrides.ctaGoal ??
    (siteType === "store"
      ? template.defaultCta
      : template.defaultCta === "buy"
        ? "contact"
        : template.defaultCta);

  const resolvedTemplateId =
    keepStore && overrides.templateId
      ? overrides.templateId
      : template.siteType === "store" && siteType !== "store"
        ? resolveTemplatePrior(undefined, categoryPrior).id
        : (overrides.templateId && template.siteType !== "store"
            ? overrides.templateId
            : template.id);

  const fullIdea =
    trimmed || overrides.businessIdea || `${businessName} website`;
  const fullPrompt = overrides.customPrompt ?? trimmed;

  return {
    businessName,
    businessIdea: clip(fullIdea, BUSINESS_IDEA_MAX),
    targetAudience: overrides.targetAudience,
    countryBase: overrides.countryBase ?? "UK",
    categoryId: categoryPrior ?? template.categoryId,
    customCategoryLabel: overrides.customCategoryLabel,
    templateId: resolvedTemplateId,
    tone: overrides.tone ?? template.defaultTone ?? inferTone(trimmed),
    siteType,
    designStyle: overrides.designStyle ?? preset.designStyle,
    colorMood: overrides.colorMood ?? preset.colorMood,
    themePreset,
    customTheme: overrides.customTheme,
    pages: pages.length ? pages : ["home", "about", "contact"],
    features: features.length ? features : ["contact_form"],
    ctaGoal,
    keyMessages: overrides.keyMessages,
    customPrompt: fullPrompt ? clip(fullPrompt, CUSTOM_PROMPT_MAX) : undefined,
    refineInstructions: overrides.refineInstructions,
    referenceUrl: overrides.referenceUrl,
    referenceScreenshots: overrides.referenceScreenshots ?? [],
    brandLogo: overrides.brandLogo,
    businessProfile: overrides.businessProfile,
    brandSystem: overrides.brandSystem,
    pageCandidates: overrides.pageCandidates,
    pageConfidenceThreshold: overrides.pageConfidenceThreshold,
    designOptions: overrides.designOptions,
    selectedDesignOptionId: overrides.selectedDesignOptionId,
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
