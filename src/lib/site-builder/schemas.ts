import { z } from "zod";

export const siteToneSchema = z.enum(["professional", "friendly", "bold", "luxury"]);
export const siteTypeSchema = z.enum(["landing", "business", "store", "portfolio"]);
export const siteDesignStyleSchema = z.enum(["minimal", "modern", "bold", "classic"]);
export const siteColorMoodSchema = z.enum(["warm", "cool", "neutral", "vibrant"]);
export const siteCtaGoalSchema = z.enum(["book_call", "buy", "subscribe", "contact"]);

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
]);

export const sitePreferencesSchema = z.object({
  businessName: z.string().min(2).max(80),
  businessIdea: z.string().min(10).max(1000),
  targetAudience: z.string().max(300).optional(),
  countryBase: z.string().min(2).max(8).default("UK"),
  tone: siteToneSchema.default("professional"),
  siteType: siteTypeSchema.default("business"),
  designStyle: siteDesignStyleSchema.default("modern"),
  colorMood: siteColorMoodSchema.default("neutral"),
  pages: z.array(sitePageOptionSchema).min(1).default(["home", "about", "contact"]),
  features: z.array(siteFeatureOptionSchema).default(["contact_form"]),
  ctaGoal: siteCtaGoalSchema.default("contact"),
  keyMessages: z.string().max(500).optional(),
  referenceUrl: z.string().url().optional().or(z.literal("")),
});

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
    primaryColor: z.string(),
    accentColor: z.string(),
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
});
