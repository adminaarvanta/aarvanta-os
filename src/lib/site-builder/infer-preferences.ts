import type {
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

const EXAMPLE_PROMPTS = [
  {
    id: "candles",
    label: "Candle shop",
    prompt:
      "Artisan Candles Co — handmade soy candles for UK homes. Warm, gift-ready shop with subscriptions.",
  },
  {
    id: "dental",
    label: "Family dentist",
    prompt:
      "North Peak Dental — modern family dentist in Manchester. Calm, trustworthy site to book appointments.",
  },
  {
    id: "saas",
    label: "Bookkeeping app",
    prompt:
      "Ledgerly — simple bookkeeping software for freelancers. Clean product landing with pricing and signup.",
  },
  {
    id: "portfolio",
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

function inferSiteType(prompt: string): SiteType {
  const p = prompt.toLowerCase();
  if (/(shop|store|ecommerce|product|candle|retail)/.test(p)) return "store";
  if (/(portfolio|photography|studio|designer|architect)/.test(p)) return "portfolio";
  if (/(saas|software|app|platform|startup)/.test(p)) return "landing";
  return "business";
}

function inferTone(prompt: string): SiteTone {
  const p = prompt.toLowerCase();
  if (/(luxury|premium|editorial|elegant)/.test(p)) return "luxury";
  if (/(bold|loud|statement|vibrant)/.test(p)) return "bold";
  if (/(friendly|warm|cozy|family)/.test(p)) return "friendly";
  return "professional";
}

function inferTheme(prompt: string, siteType: SiteType): SiteThemePreset {
  const p = prompt.toLowerCase();
  if (/(warm|candle|gift|lifestyle|sunset)/.test(p)) return "sunset_warm";
  if (/(minimal|editorial|architecture|clean)/.test(p)) return "minimal_light";
  if (/(bold|dark|neon|startup)/.test(p)) return "bold_dark";
  if (/(trust|dental|clinic|finance|saas|software)/.test(p)) return "ocean_cool";
  if (siteType === "store") return "sunset_warm";
  if (siteType === "landing") return "ocean_cool";
  if (siteType === "portfolio") return "minimal_light";
  return "gold_navy";
}

function inferCta(siteType: SiteType, prompt: string): SiteCtaGoal {
  const p = prompt.toLowerCase();
  if (siteType === "store" || /(shop|buy|purchase|retail)/.test(p)) return "buy";
  if (/(book|appoint|consult)/.test(p)) return "book_call";
  if (siteType === "landing" || /(subscribe|subscription|saas|signup|sign up)/.test(p)) {
    return "subscribe";
  }
  return "contact";
}

function inferPages(siteType: SiteType): SitePageOption[] {
  switch (siteType) {
    case "store":
      return ["home", "about", "products", "contact"];
    case "portfolio":
      return ["home", "about", "portfolio", "contact"];
    case "landing":
      return ["home", "pricing", "about", "contact"];
    default:
      return ["home", "about", "services", "contact"];
  }
}

function inferFeatures(siteType: SiteType, prompt: string): SiteFeatureOption[] {
  const features: SiteFeatureOption[] = ["contact_form", "seo_pack"];
  const p = prompt.toLowerCase();
  if (siteType === "store" || /(shop|buy)/.test(p)) features.push("ecommerce");
  if (/(testimonial|review)/.test(p) || siteType === "business") features.push("testimonials");
  if (/(book|appoint)/.test(p)) features.push("booking");
  if (/(blog|content)/.test(p)) features.push("blog");
  return features;
}

export function inferPreferencesFromPrompt(
  prompt: string,
  overrides?: Partial<SitePreferences>
): SitePreferences {
  const trimmed = prompt.trim();
  const siteType = overrides?.siteType ?? inferSiteType(trimmed);
  const themePreset = overrides?.themePreset ?? inferTheme(trimmed, siteType);
  const preset = getThemePreset(themePreset);
  const businessName = overrides?.businessName ?? extractBusinessName(trimmed);

  return {
    businessName,
    businessIdea: trimmed,
    targetAudience: overrides?.targetAudience,
    countryBase: overrides?.countryBase ?? "UK",
    tone: overrides?.tone ?? inferTone(trimmed),
    siteType,
    designStyle: overrides?.designStyle ?? preset.designStyle,
    colorMood: overrides?.colorMood ?? preset.colorMood,
    themePreset,
    pages: overrides?.pages ?? inferPages(siteType),
    features: overrides?.features ?? inferFeatures(siteType, trimmed),
    ctaGoal: overrides?.ctaGoal ?? inferCta(siteType, trimmed),
    keyMessages: overrides?.keyMessages,
    customPrompt: overrides?.customPrompt ?? trimmed,
    referenceUrl: overrides?.referenceUrl,
    referenceScreenshots: overrides?.referenceScreenshots ?? [],
    deployment: {
      ...DEFAULT_DEPLOYMENT,
      ...(overrides?.deployment ?? {}),
      domain: {
        ...DEFAULT_DEPLOYMENT.domain,
        ...(overrides?.deployment?.domain ?? {}),
      },
      ec2: {
        ...DEFAULT_DEPLOYMENT.ec2,
        stackName:
          overrides?.deployment?.ec2?.stackName ??
          businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 48),
        ...(overrides?.deployment?.ec2 ?? {}),
      },
    },
  };
}

export { EXAMPLE_PROMPTS };

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
