import { z } from "zod";

export const siteToneSchema = z.enum(["professional", "friendly", "bold", "luxury"]);
export const siteTypeSchema = z.enum(["landing", "business", "store", "portfolio"]);
export const siteDesignStyleSchema = z.enum(["minimal", "modern", "bold", "classic"]);
export const siteColorMoodSchema = z.enum(["warm", "cool", "neutral", "vibrant"]);
export const siteCtaGoalSchema = z.enum(["book_call", "buy", "subscribe", "contact"]);
export const siteCategoryIdSchema = z.enum([
  "ecommerce",
  "saas",
  "local_service",
  "professional",
  "restaurant",
  "healthcare",
  "agency",
  "portfolio",
  "nonprofit",
  "blog",
  "event",
  "internal_tool_landing",
]);
export const siteThemePresetSchema = z.enum([
  "gold_navy",
  "minimal_light",
  "bold_dark",
  "ocean_cool",
  "sunset_warm",
  "custom",
]);

export const siteFontPackIdSchema = z.enum([
  "editorial",
  "modern_sans",
  "tech",
  "friendly",
  "luxury_serif",
  "clean_mono",
]);

const hexColorSchema = z
  .string()
  .regex(/^#?[0-9A-Fa-f]{6}$/, "Expected a 6-digit hex color");

export const siteCustomThemeSchema = z.object({
  primaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  fontPackId: siteFontPackIdSchema.default("modern_sans"),
});

export const sitePageOptionSchema = z.enum([
  "home",
  "about",
  "services",
  "pricing",
  "products",
  "portfolio",
  "testimonials",
  "faq",
  "blog",
  "contact",
]);

export const siteFeatureOptionSchema = z.enum([
  "contact_form",
  "chat_widget",
  "blog",
  "ecommerce",
  "testimonials",
  "newsletter",
  "analytics",
  "seo_pack",
  "booking",
  "live_chat",
]);

export const siteReferenceScreenshotSchema = z.object({
  id: z.string(),
  name: z.string().max(120),
  dataUrl: z.string().startsWith("data:image/").max(2_500_000),
  uploadedAt: z.string(),
});

export const siteDomainPurchaseSchema = z.object({
  status: z.enum(["none", "selected", "purchased", "external"]).default("none"),
  selectedDomain: z.string().max(120).optional(),
  tld: z.string().max(12).optional(),
  priceAnnual: z.number().positive().optional(),
  currency: z.enum(["GBP", "USD"]).default("GBP"),
  autoRenew: z.boolean().default(true),
  registrarOrderId: z.string().optional(),
  purchasedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  dnsStatus: z.enum(["pending", "verified"]).optional(),
  connectedAt: z.string().optional(),
});

export const siteEc2ConfigSchema = z.object({
  region: z.enum(["eu-west-2", "eu-west-1", "us-east-1", "ap-south-1"]).default("eu-west-2"),
  instanceType: z.enum(["t3.micro", "t3.small", "t3.medium"]).default("t3.small"),
  stackName: z.string().max(80).optional(),
  sslEnabled: z.boolean().default(true),
  autoDeployOnApprove: z.boolean().default(false),
});

export const siteDeploymentConfigSchema = z.object({
  hostingProvider: z.literal("aws_ec2").default("aws_ec2"),
  domain: siteDomainPurchaseSchema.default({ status: "none", currency: "GBP", autoRenew: true }),
  ec2: siteEc2ConfigSchema.default({
    region: "eu-west-2",
    instanceType: "t3.small",
    sslEnabled: true,
    autoDeployOnApprove: false,
  }),
});

export const sitePreferencesSchema = z.object({
  businessName: z.string().min(2).max(80),
  businessIdea: z.string().min(10).max(1000),
  targetAudience: z.string().max(300).optional(),
  countryBase: z.string().min(2).max(8).default("UK"),
  categoryId: siteCategoryIdSchema,
  templateId: z.string().min(2).max(80),
  tone: siteToneSchema.default("professional"),
  siteType: siteTypeSchema.default("business"),
  designStyle: siteDesignStyleSchema.default("modern"),
  colorMood: siteColorMoodSchema.default("neutral"),
  themePreset: siteThemePresetSchema.default("gold_navy"),
  customTheme: siteCustomThemeSchema.optional(),
  pages: z.array(sitePageOptionSchema).min(1).default(["home", "about", "contact"]),
  features: z.array(siteFeatureOptionSchema).default(["contact_form"]),
  ctaGoal: siteCtaGoalSchema.default("contact"),
  keyMessages: z.string().max(500).optional(),
  customPrompt: z.string().max(2000).optional(),
  referenceUrl: z.union([z.string().url(), z.literal("")]).optional(),
  referenceScreenshots: z.array(siteReferenceScreenshotSchema).max(3).optional(),
  deployment: siteDeploymentConfigSchema,
});

/** Looser schema for auto-saved drafts (user may not have finished the brief yet). */
export const siteDraftPreferencesSchema = sitePreferencesSchema.extend({
  businessName: z.string().min(1).max(80),
  businessIdea: z.string().min(1).max(1000),
  categoryId: siteCategoryIdSchema.optional(),
  templateId: z.string().max(80).optional(),
});

export const siteBuildWriteSchema = z
  .object({
    mode: z.enum(["draft", "generate"]).default("generate"),
  })
  .passthrough();

export const sitePlanSectionSchema = z.object({
  type: z.string(),
  label: z.string(),
  description: z.string(),
});

export const sitePlanPageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  purpose: z.string(),
  sections: z.array(sitePlanSectionSchema),
});

export const sitePlanSchema = z.object({
  siteName: z.string(),
  slug: z.string(),
  summary: z.string(),
  theme: z.object({
    presetId: siteThemePresetSchema,
    primaryColor: z.string(),
    accentColor: z.string(),
    backgroundColor: z.string(),
    fontStyle: z.string(),
    styleNotes: z.string(),
  }),
  navigation: z.array(
    z.object({
      label: z.string(),
      slug: z.string(),
    })
  ),
  pages: z.array(sitePlanPageSchema),
  deployment: z.object({
    hostingProvider: z.literal("aws_ec2"),
    domain: siteDomainPurchaseSchema,
    ec2: siteEc2ConfigSchema,
    previewUrl: z.string(),
    liveUrl: z.string().optional(),
    deployNotes: z.array(
      z.object({
        title: z.string(),
        body: z.string(),
      })
    ),
  }),
});
