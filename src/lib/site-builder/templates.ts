import type {
  SiteCtaGoal,
  SiteFeatureOption,
  SiteNiche,
  SitePageOption,
  SiteTemplateLayout,
  SiteThemePreset,
  SiteTone,
  SiteType,
} from "@/types/site-builder";

export type SiteUiTemplate = {
  id: string;
  niche: SiteNiche;
  name: string;
  tagline: string;
  layout: SiteTemplateLayout;
  defaultThemePreset: SiteThemePreset;
  siteType: SiteType;
  tone: SiteTone;
  ctaGoal: SiteCtaGoal;
  pages: SitePageOption[];
  features: SiteFeatureOption[];
  /** Section labels shown in the mini thumbnail + preview. */
  highlightSections: string[];
};

export const SITE_UI_TEMPLATES: SiteUiTemplate[] = [
  {
    id: "shop_shelf",
    niche: "online_shop",
    name: "Product shelf",
    tagline: "Grid of products under a clear shop hero",
    layout: "store_shelf",
    defaultThemePreset: "sunset_warm",
    siteType: "store",
    tone: "friendly",
    ctaGoal: "buy",
    pages: ["home", "about", "products", "faq", "contact"],
    features: ["ecommerce", "contact_form", "testimonials", "seo_pack"],
    highlightSections: ["Hero", "Featured products", "Trust bar"],
  },
  {
    id: "shop_editorial",
    niche: "online_shop",
    name: "Editorial shop",
    tagline: "Story-led merchandising for branded retail",
    layout: "hero_split",
    defaultThemePreset: "minimal_light",
    siteType: "store",
    tone: "luxury",
    ctaGoal: "buy",
    pages: ["home", "about", "products", "blog", "contact"],
    features: ["ecommerce", "newsletter", "testimonials", "seo_pack"],
    highlightSections: ["Split hero", "Collection", "Story"],
  },
  {
    id: "service_book",
    niche: "local_service",
    name: "Book & trust",
    tagline: "Services list, reviews, and a strong book CTA",
    layout: "services_grid",
    defaultThemePreset: "ocean_cool",
    siteType: "business",
    tone: "professional",
    ctaGoal: "book_call",
    pages: ["home", "about", "services", "pricing", "contact"],
    features: ["contact_form", "booking", "testimonials", "seo_pack"],
    highlightSections: ["Hero CTA", "Services", "Reviews"],
  },
  {
    id: "service_local",
    niche: "local_service",
    name: "Local presence",
    tagline: "Area-focused landing with contact-first layout",
    layout: "hero_centered",
    defaultThemePreset: "minimal_light",
    siteType: "business",
    tone: "friendly",
    ctaGoal: "contact",
    pages: ["home", "services", "testimonials", "faq", "contact"],
    features: ["contact_form", "live_chat", "seo_pack"],
    highlightSections: ["Centered hero", "Coverage", "Contact"],
  },
  {
    id: "agency_cases",
    niche: "agency",
    name: "Case grid",
    tagline: "Work-first portfolio with studio energy",
    layout: "hero_image_bg",
    defaultThemePreset: "bold_dark",
    siteType: "portfolio",
    tone: "bold",
    ctaGoal: "contact",
    pages: ["home", "about", "portfolio", "services", "contact"],
    features: ["contact_form", "testimonials", "analytics"],
    highlightSections: ["Full-bleed hero", "Selected work", "Process"],
  },
  {
    id: "agency_studio",
    niche: "agency",
    name: "Studio strip",
    tagline: "Minimal strip layout for strategy studios",
    layout: "hero_split",
    defaultThemePreset: "minimal_light",
    siteType: "portfolio",
    tone: "professional",
    ctaGoal: "book_call",
    pages: ["home", "portfolio", "about", "contact"],
    features: ["contact_form", "analytics"],
    highlightSections: ["Split intro", "Work", "Capabilities"],
  },
  {
    id: "saas_launch",
    niche: "saas",
    name: "Launch landing",
    tagline: "Problem → product → pricing for launches",
    layout: "hero_centered",
    defaultThemePreset: "gold_navy",
    siteType: "landing",
    tone: "professional",
    ctaGoal: "subscribe",
    pages: ["home", "pricing", "faq", "contact"],
    features: ["contact_form", "newsletter", "analytics", "seo_pack"],
    highlightSections: ["Hero", "Features", "Pricing"],
  },
  {
    id: "saas_product",
    niche: "saas",
    name: "Product demo",
    tagline: "Split hero with product frame and social proof",
    layout: "hero_split",
    defaultThemePreset: "ocean_cool",
    siteType: "landing",
    tone: "friendly",
    ctaGoal: "book_call",
    pages: ["home", "about", "pricing", "contact"],
    features: ["contact_form", "analytics", "seo_pack"],
    highlightSections: ["Demo frame", "Benefits", "CTA"],
  },
  {
    id: "resto_menu",
    niche: "restaurant",
    name: "Menu & reserve",
    tagline: "Atmosphere hero, menu highlights, reserve CTA",
    layout: "hero_image_bg",
    defaultThemePreset: "sunset_warm",
    siteType: "business",
    tone: "luxury",
    ctaGoal: "book_call",
    pages: ["home", "about", "services", "contact"],
    features: ["booking", "contact_form", "testimonials"],
    highlightSections: ["Atmosphere", "Menu", "Reserve"],
  },
  {
    id: "clinic_care",
    niche: "clinic",
    name: "Care & book",
    tagline: "Calm services grid with appointment CTA",
    layout: "services_grid",
    defaultThemePreset: "ocean_cool",
    siteType: "business",
    tone: "professional",
    ctaGoal: "book_call",
    pages: ["home", "about", "services", "faq", "contact"],
    features: ["booking", "contact_form", "seo_pack"],
    highlightSections: ["Welcome", "Treatments", "Book"],
  },
  {
    id: "folio_work",
    niche: "portfolio",
    name: "Work gallery",
    tagline: "Sparse chrome so projects stay front and center",
    layout: "hero_centered",
    defaultThemePreset: "minimal_light",
    siteType: "portfolio",
    tone: "professional",
    ctaGoal: "contact",
    pages: ["home", "portfolio", "about", "contact"],
    features: ["contact_form"],
    highlightSections: ["Intro", "Selected work", "About"],
  },
];

export function getUiTemplate(id: string): SiteUiTemplate | undefined {
  return SITE_UI_TEMPLATES.find((t) => t.id === id);
}

export function templatesForNiche(niche: SiteNiche): SiteUiTemplate[] {
  return SITE_UI_TEMPLATES.filter((t) => t.niche === niche);
}

export function defaultTemplateForNiche(niche: SiteNiche): SiteUiTemplate {
  return templatesForNiche(niche)[0] ?? SITE_UI_TEMPLATES[0]!;
}
