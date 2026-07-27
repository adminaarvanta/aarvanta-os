import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { runBusinessIntel } from "@/lib/site-builder/agents/business-intel";
import { getFontPack, type SiteFontPackId } from "@/lib/site-builder/font-packs";
import { fetchCategoryImages, imageAt } from "@/lib/site-builder/media/unsplash";
import {
  aiDesignOptionsResponseSchema,
  type AiDesignOptionSpec,
} from "@/lib/site-builder/schemas";
import { themeFromBrand } from "@/lib/site-builder/theme-presets";
import { crmNow } from "@/lib/data/crm-helpers";
import type {
  BrandSystem,
  BusinessProfile,
  GeneratedSite,
  SiteBlock,
  SiteDesignOption,
  SitePlanSection,
  SitePreferences,
} from "@/types/site-builder";

type DesignDirection = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  styleTags: string[];
  heroVariant: SiteDesignOption["heroVariant"];
  brandOverrides: Partial<BrandSystem>;
  homeSectionTypes: Array<{ type: string; label: string; description: string; variantId?: string }>;
};

type CopySeeds = { headline?: string; subheadline?: string };

const STORE_DIRECTIONS: DesignDirection[] = [
  {
    id: "design_store_immersive",
    name: "Store Immersive",
    tagline: "Lifestyle hero + featured picks",
    description: "Full-bleed product photography, social proof, and a strong shop CTA.",
    styleTags: ["Commerce", "Lifestyle", "Bold"],
    heroVariant: "fullBleed",
    brandOverrides: {
      style: "Bold",
      animation: "Expressive",
      spacingScale: "Compact",
      buttonRadius: "9999",
      imageStyle: "Lifestyle",
      fontPackId: "tech",
      navStyle: "store",
    },
    homeSectionTypes: [
      { type: "hero", label: "Hero", description: "Immersive shop opening", variantId: "fullBleed" },
      { type: "stats", label: "Proof", description: "Trust metrics" },
      { type: "products", label: "Featured", description: "Top products", variantId: "featured" },
      { type: "features", label: "Why us", description: "Buying reasons", variantId: "cards" },
      { type: "testimonials", label: "Reviews", description: "Customer voices" },
      { type: "cta_banner", label: "CTA", description: "Shop CTA" },
    ],
  },
  {
    id: "design_store_grid",
    name: "Catalog Forward",
    tagline: "Clean merchandising grid",
    description: "Split hero, category storytelling, and a product-first homepage.",
    styleTags: ["Commerce", "Grid", "Clear"],
    heroVariant: "split",
    brandOverrides: {
      style: "Modern",
      animation: "Subtle",
      spacingScale: "Comfortable",
      buttonRadius: "12",
      imageStyle: "Editorial",
      fontPackId: "modern_sans",
      navStyle: "underline",
    },
    homeSectionTypes: [
      { type: "hero", label: "Hero", description: "Split value prop", variantId: "split" },
      { type: "logo_cloud", label: "As seen in", description: "Press / partners" },
      { type: "products", label: "Bestsellers", description: "Merch grid", variantId: "featured" },
      { type: "feature_tabs", label: "Collections", description: "How to shop" },
      { type: "testimonials", label: "Reviews", description: "Quotes" },
      { type: "newsletter", label: "List", description: "Email capture" },
    ],
  },
  {
    id: "design_store_boutique",
    name: "Boutique Editorial",
    tagline: "Quiet luxury storefront",
    description: "Centered typography, story-led about, gallery mood, refined product cards.",
    styleTags: ["Boutique", "Editorial", "Premium"],
    heroVariant: "centered",
    brandOverrides: {
      style: "Minimal",
      animation: "Minimal",
      spacingScale: "Airy",
      buttonRadius: "4",
      imageStyle: "Editorial",
      fontPackId: "luxury_serif",
      navStyle: "centered",
    },
    homeSectionTypes: [
      { type: "hero", label: "Hero", description: "Centered statement", variantId: "centered" },
      { type: "about_split", label: "Story", description: "Brand narrative" },
      { type: "gallery", label: "Lookbook", description: "Visual mood" },
      { type: "products", label: "Edit", description: "Curated picks", variantId: "list" },
      { type: "faq_accordion", label: "FAQ", description: "Shipping answers" },
      { type: "contact", label: "Contact", description: "Get in touch" },
    ],
  },
];

const SERVICE_DIRECTIONS: DesignDirection[] = [
  {
    id: "design_bold_immersive",
    name: "Bold Immersive",
    tagline: "Full-bleed hero, high energy",
    description: "Dramatic photography, strong CTAs, and a conversion-first homepage.",
    styleTags: ["Bold", "Lifestyle", "High contrast"],
    heroVariant: "fullBleed",
    brandOverrides: {
      style: "Bold",
      animation: "Expressive",
      spacingScale: "Compact",
      buttonRadius: "9999",
      imageStyle: "Lifestyle",
      fontPackId: "tech",
      navStyle: "pills",
    },
    homeSectionTypes: [
      { type: "hero", label: "Hero", description: "Immersive opening", variantId: "fullBleed" },
      { type: "stats", label: "Proof", description: "Key metrics" },
      { type: "features", label: "Highlights", description: "Why choose us", variantId: "cards" },
      { type: "testimonials", label: "Stories", description: "Customer voices" },
      { type: "cta_banner", label: "CTA", description: "Final conversion" },
    ],
  },
  {
    id: "design_split_modern",
    name: "Split Modern",
    tagline: "Clean product storytelling",
    description: "Split hero, feature grid, and structured sections for clarity.",
    styleTags: ["Modern", "Product", "Clear"],
    heroVariant: "split",
    brandOverrides: {
      style: "Modern",
      animation: "Subtle",
      spacingScale: "Comfortable",
      buttonRadius: "12",
      imageStyle: "Editorial",
      fontPackId: "modern_sans",
      navStyle: "underline",
    },
    homeSectionTypes: [
      { type: "hero", label: "Hero", description: "Split value prop", variantId: "split" },
      { type: "logo_cloud", label: "Trusted by", description: "Social proof logos" },
      { type: "features", label: "Benefits", description: "Core differentiators", variantId: "row" },
      { type: "feature_tabs", label: "How it works", description: "Tabbed detail" },
      { type: "testimonials", label: "Reviews", description: "Quotes" },
      { type: "newsletter", label: "Stay close", description: "Email capture" },
      { type: "cta_banner", label: "CTA", description: "Next step" },
    ],
  },
  {
    id: "design_editorial_calm",
    name: "Editorial Calm",
    tagline: "Centered, premium whitespace",
    description: "Quiet luxury — centered typography, generous space, refined gallery.",
    styleTags: ["Minimal", "Luxury", "Editorial"],
    heroVariant: "centered",
    brandOverrides: {
      style: "Minimal",
      animation: "Minimal",
      spacingScale: "Airy",
      buttonRadius: "4",
      imageStyle: "Editorial",
      fontPackId: "luxury_serif",
      navStyle: "minimal",
    },
    homeSectionTypes: [
      { type: "hero", label: "Hero", description: "Centered statement", variantId: "centered" },
      { type: "about_split", label: "Story", description: "Brand narrative" },
      { type: "gallery", label: "Gallery", description: "Visual mood" },
      { type: "testimonials", label: "Voices", description: "Quiet social proof" },
      { type: "faq_accordion", label: "FAQ", description: "Answers" },
      { type: "contact", label: "Contact", description: "Get in touch" },
    ],
  },
];

function directionsFor(
  business: BusinessProfile,
  prefs: SitePreferences
): DesignDirection[] {
  const store =
    prefs.features.includes("ecommerce") ||
    prefs.categoryId === "ecommerce" ||
    prefs.ctaGoal === "buy" ||
    /(sell|retail|shop|store)/i.test(`${business.primaryGoal} ${business.industry}`);
  return store ? STORE_DIRECTIONS : SERVICE_DIRECTIONS;
}

const PALETTES: Array<Pick<BrandSystem, "primary" | "secondary" | "background">> = [
  { primary: "#EA580C", secondary: "#FDBA74", background: "#140E0A" },
  { primary: "#2563EB", secondary: "#60A5FA", background: "#0B1220" },
  { primary: "#1A2B48", secondary: "#3D6B9F", background: "#FFFFFF" },
  { primary: "#B8965D", secondary: "#C9AA72", background: "#040608" },
  { primary: "#0F766E", secondary: "#5EEAD4", background: "#042F2E" },
];

function normalizeHex(value: string, fallback: string): string {
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v.toUpperCase()}`;
  return fallback;
}

function baseBrand(business: BusinessProfile, prefs: SitePreferences): BrandSystem {
  const pack = getFontPack(
    prefs.tone === "luxury" ? "luxury_serif" : prefs.tone === "bold" ? "tech" : "modern_sans"
  );
  return {
    primary: "#3867FF",
    secondary: "#FFD166",
    background: "#FFFFFF",
    font: pack.previewBody,
    headingFont: pack.previewHeading,
    fontPackId: pack.id,
    buttonRadius: "12",
    style: "Modern",
    animation: "Minimal",
    imageStyle: "Lifestyle",
    spacingScale: "Comfortable",
    iconSet: "Lucide outline",
    toneOfVoice: `${business.brandTone} · clear · benefit-led`,
    googleFontsUrl: pack.googleFontsUrl,
  };
}

function applyDirectionBrand(
  base: BrandSystem,
  direction: DesignDirection,
  paletteIndex: number
): BrandSystem {
  const palette = PALETTES[paletteIndex % PALETTES.length]!;
  const pack = getFontPack(direction.brandOverrides.fontPackId ?? base.fontPackId);
  return {
    ...base,
    ...palette,
    ...direction.brandOverrides,
    font: pack.previewBody,
    headingFont: pack.previewHeading,
    fontPackId: pack.id,
    googleFontsUrl: pack.googleFontsUrl,
    toneOfVoice: base.toneOfVoice,
  };
}

function brandFromAiSpec(
  base: BrandSystem,
  spec: AiDesignOptionSpec["brand"],
  business: BusinessProfile
): BrandSystem {
  const pack = getFontPack(spec.fontPackId as SiteFontPackId);
  return {
    ...base,
    primary: normalizeHex(spec.primary, base.primary),
    secondary: normalizeHex(spec.secondary, base.secondary),
    background: normalizeHex(spec.background, base.background),
    fontPackId: pack.id,
    font: pack.previewBody,
    headingFont: pack.previewHeading,
    googleFontsUrl: pack.googleFontsUrl,
    buttonRadius: spec.buttonRadius,
    style: spec.style,
    animation: spec.animation,
    imageStyle: spec.imageStyle,
    spacingScale: spec.spacingScale,
    navStyle: spec.navStyle,
    toneOfVoice: spec.toneOfVoice || `${business.brandTone} · clear · benefit-led`,
    iconSet: "Lucide outline",
  };
}

function ensureHeroFirst(sections: SitePlanSection[], heroVariant: SiteDesignOption["heroVariant"]): SitePlanSection[] {
  const withHero = [...sections];
  if (!withHero.some((s) => s.type === "hero")) {
    withHero.unshift({
      type: "hero",
      label: "Hero",
      description: "Opening statement",
      variantId: heroVariant === "default" ? "fullBleed" : heroVariant,
    });
  }
  return withHero.slice(0, 8);
}

function fillHomeBlocks(
  sections: SitePlanSection[],
  prefs: SitePreferences,
  business: BusinessProfile,
  images: string[],
  optionId: string,
  seeds?: CopySeeds
): SiteBlock[] {
  const name = prefs.businessName;
  // Cap preview to above-the-fold for readable thumbnails
  const previewSections = sections.slice(0, 5);

  return previewSections.map((section, index) => {
    const id = `${optionId}_${section.type}_${index}`;
    const img = imageAt(images, index, `${optionId}-${index}`);
    const variantId = section.variantId ?? "default";

    switch (section.type) {
      case "hero": {
        const layout =
          variantId === "fullBleed" || variantId === "split" || variantId === "centered"
            ? variantId
            : "fullBleed";
        return {
          id,
          type: "hero",
          variantId: layout,
          props: {
            layout,
            eyebrow: business.subcategory,
            headline: seeds?.headline || `${name} — ${business.primaryGoal.toLowerCase()}`,
            subheadline: seeds?.subheadline || prefs.businessIdea.slice(0, 160),
            cta: business.primaryGoal.includes("Sell") ? "Shop now" : "Get started",
            secondaryCta: "Learn more",
            ctaTarget: "contact",
            imageUrl: img,
            // Centered heroes still get a supporting visual band in the picker
            supportImageUrl: layout === "centered" ? imageAt(images, index + 1, `${optionId}-support`) : undefined,
          },
        };
      }
      case "features":
        return {
          id,
          type: "features",
          variantId: variantId === "row" ? "row" : "cards",
          props: {
            title: section.label || `Why ${name}`,
            subtitle: `Built for ${business.audience[0] ?? "your customers"}`,
            items: business.audience.slice(0, 3).map((a, i) => ({
              title: a,
              description: `${business.subcategory} designed with ${a.toLowerCase()} in mind.`,
              icon: ["sparkles", "compass", "users"][i % 3],
            })),
          },
        };
      case "stats":
        return {
          id,
          type: "stats",
          variantId,
          props: {
            items: [
              { label: "Customers", value: "2k+" },
              { label: "Satisfaction", value: "98%" },
              { label: "Years", value: "5+" },
            ],
          },
        };
      case "logo_cloud":
        return {
          id,
          type: "logo_cloud",
          variantId,
          props: {
            title: section.label || "Trusted partners",
            items: ["Northstar", "Harbor", "Lumen", "Kindred"].map((label) => ({ label })),
          },
        };
      case "products": {
        const catalogItems = [0, 1, 2, 3].map((i) => ({
          id: `${optionId}_p_${i}`,
          name: `${business.subcategory} ${i + 1}`,
          price: `£${(19 + i * 6).toFixed(2)}`,
          description: prefs.businessIdea.slice(0, 80),
          category: business.subcategory.split(/\s+/)[0] || "Shop",
          imageUrl: imageAt(images, index + i + 1, `${optionId}-p-${i}`),
        }));
        return {
          id,
          type: "products",
          variantId: variantId === "list" || variantId === "catalog" ? variantId : "featured",
          props: {
            title: section.label,
            subtitle: `Picks for ${business.audience[0] ?? "your customers"}`,
            products: catalogItems,
            categories: Array.from(new Set(catalogItems.map((p) => p.category))),
          },
        };
      }
      case "gallery":
      case "portfolio_grid":
        return {
          id,
          type: section.type,
          variantId,
          props: {
            title: section.label,
            items: [0, 1, 2].map((i) => ({
              title: `${business.subcategory} ${i + 1}`,
              description: prefs.businessIdea.slice(0, 80),
              imageUrl: imageAt(images, index + i + 1, `${optionId}-g-${i}`),
            })),
          },
        };
      case "testimonials":
        return {
          id,
          type: "testimonials",
          variantId,
          props: {
            title: section.label || "What people say",
            quotes: [
              {
                quote: `${name} made ${business.subcategory.toLowerCase()} feel effortless.`,
                author: business.audience[0] ?? "Customer",
                role: "Verified buyer",
              },
            ],
          },
        };
      case "cta_banner":
        return {
          id,
          type: "cta_banner",
          variantId,
          props: {
            title: section.label || `Ready to ${business.primaryGoal.toLowerCase()}?`,
            subtitle: `Join ${business.audience[0] ?? "customers"} choosing ${name}.`,
            cta: "Get started",
            ctaTarget: "contact",
          },
        };
      case "about_split":
        return {
          id,
          type: "about_split",
          variantId,
          props: {
            title: section.label || `About ${name}`,
            body: prefs.businessIdea.slice(0, 220),
            imageUrl: img,
          },
        };
      case "faq_accordion":
        return {
          id,
          type: "faq_accordion",
          variantId,
          props: {
            title: section.label || "Questions",
            items: [
              {
                question: `What is ${name}?`,
                answer: prefs.businessIdea.slice(0, 160),
              },
              {
                question: "Who is it for?",
                answer: (business.audience ?? []).join(", ") || "Our customers",
              },
            ],
          },
        };
      case "contact":
        return {
          id,
          type: "contact",
          variantId,
          props: {
            title: section.label || "Contact",
            subtitle: `Talk to the ${name} team`,
          },
        };
      case "newsletter":
        return {
          id,
          type: "newsletter",
          variantId,
          props: {
            title: section.label || "Stay in the loop",
            subtitle: `News from ${name}`,
          },
        };
      case "feature_tabs":
        return {
          id,
          type: "feature_tabs",
          variantId,
          props: {
            title: section.label || "How it works",
            tabs: [
              { label: "Discover", body: prefs.businessIdea.slice(0, 100) },
              { label: "Choose", body: `Options tailored for ${business.audience[0] ?? "you"}.` },
              { label: "Enjoy", body: `${business.primaryGoal} with ${name}.` },
            ],
          },
        };
      default:
        return {
          id,
          type: section.type,
          variantId,
          props: {
            title: section.label,
            body: section.description,
          },
        };
    }
  });
}

function buildPreview(
  prefs: SitePreferences,
  brand: BrandSystem,
  blocks: SiteBlock[],
  tagline: string
): GeneratedSite {
  const theme = themeFromBrand(brand, "custom");
  return {
    siteName: prefs.businessName,
    slug: prefs.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "site",
    tagline,
    theme,
    navigation: [{ label: "Home", slug: "home" }],
    pages: [{ slug: "home", title: "Home", blocks }],
    business: prefs.businessProfile,
    brand,
    version: 1,
    generatedAt: crmNow(),
  };
}

async function imagesForOption(
  prefs: SitePreferences,
  business: BusinessProfile,
  optionId: string,
  styleHint: string,
  optionIndex = 0
): Promise<string[]> {
  const urls = await fetchCategoryImages(
    prefs.categoryId ?? "professional",
    [
      business.industry,
      business.subcategory,
      prefs.businessName,
      styleHint,
      optionId,
      `opt${optionIndex}`,
      ...prefs.businessIdea.split(/\s+/).filter(Boolean).slice(0, 4),
    ],
    12
  );
  // Rotate so each card's hero starts on a different image even when buckets overlap.
  if (urls.length <= 1) return urls;
  const rotate = (optionIndex * 3 + optionId.length) % urls.length;
  return [...urls.slice(rotate), ...urls.slice(0, rotate)];
}

function optionFromDirection(
  prefs: SitePreferences,
  business: BusinessProfile,
  direction: DesignDirection,
  paletteIndex: number,
  images: string[],
  seeds?: CopySeeds
): SiteDesignOption {
  const base = baseBrand(business, prefs);
  const brand = applyDirectionBrand(base, direction, paletteIndex);
  const homeSections: SitePlanSection[] = ensureHeroFirst(
    direction.homeSectionTypes.map((s) => ({
      type: s.type,
      label: s.label,
      description: s.description,
      variantId: s.variantId ?? (s.type === "hero" ? direction.heroVariant : "default"),
    })),
    direction.heroVariant
  );
  const blocks = fillHomeBlocks(homeSections, prefs, business, images, direction.id, seeds);
  return {
    id: direction.id,
    name: direction.name,
    tagline: direction.tagline,
    description: direction.description,
    styleTags: direction.styleTags,
    heroVariant: direction.heroVariant,
    brand,
    homeSections,
    preview: buildPreview(prefs, brand, blocks, direction.tagline),
  };
}

async function heuristicOptions(
  prefs: SitePreferences,
  business: BusinessProfile
): Promise<SiteDesignOption[]> {
  const directions = directionsFor(business, prefs);
  const results: SiteDesignOption[] = [];
  for (let i = 0; i < directions.length; i++) {
    const direction = directions[i]!;
    const images = await imagesForOption(
      prefs,
      business,
      direction.id,
      direction.brandOverrides.imageStyle ?? "Lifestyle",
      i
    );
    results.push(optionFromDirection(prefs, business, direction, i, images));
  }
  return results;
}

function optionFromAiSpec(
  prefs: SitePreferences,
  business: BusinessProfile,
  spec: AiDesignOptionSpec,
  images: string[],
  fallback: DesignDirection,
  paletteIndex: number
): SiteDesignOption {
  const base = baseBrand(business, prefs);
  const brand = brandFromAiSpec(base, spec.brand, business);
  const heroVariant =
    spec.heroVariant === "default" ? fallback.heroVariant : spec.heroVariant;
  const homeSections = ensureHeroFirst(
    spec.homeSections.map((s) => ({
      type: s.type,
      label: s.label,
      description: s.description,
      variantId:
        s.type === "hero"
          ? s.variantId ?? heroVariant
          : s.variantId ?? "default",
    })),
    heroVariant
  );
  const blocks = fillHomeBlocks(homeSections, prefs, business, images, spec.id, {
    headline: spec.headline,
    subheadline: spec.subheadline,
  });
  return {
    id: spec.id || fallback.id,
    name: spec.name,
    tagline: spec.tagline,
    description: spec.description,
    styleTags: spec.styleTags,
    heroVariant,
    brand,
    homeSections,
    preview: buildPreview(prefs, brand, blocks, spec.tagline),
  };
}

/**
 * Generate exactly 3 distinct homepage design directions from the user brief.
 * AI authors full specs when configured; DIRECTIONS are fallback only.
 */
export async function generateDesignOptions(
  preferences: SitePreferences
): Promise<{
  preferences: SitePreferences;
  options: SiteDesignOption[];
  usedAi: boolean;
}> {
  const { profile: business, usedAi: businessAi } = await runBusinessIntel(preferences);
  let prefs: SitePreferences = {
    ...preferences,
    businessProfile: business,
  };

  const fallbacks = directionsFor(business, prefs);
  let options = await heuristicOptions(prefs, business);
  let usedAi = businessAi;

  if (isAiConfigured()) {
    try {
      const raw = await completeJson<unknown>({
        system: `You are a senior web designer. Create exactly 3 DISTINCT homepage design directions for this business.
Return JSON: { options: [ { id, name, tagline, description, styleTags, heroVariant, brand, homeSections, headline, subheadline } ] }.

Rules:
- Make each option feel like a different product (different layout order, heroVariant, palette, fonts, navStyle).
- heroVariant must be one of: fullBleed, split, centered — use each once across the 3 options.
- brand must include: primary, secondary, background (6-digit #hex), fontPackId (editorial|modern_sans|tech|friendly|luxury_serif|clean_mono), buttonRadius, style, animation (Minimal|Subtle|Expressive), imageStyle, spacingScale (Compact|Comfortable|Airy), navStyle (pills|underline|centered|minimal|store), toneOfVoice.
- homeSections: 4–7 sections; first must be hero; types from hero, features, products, stats, testimonials, cta_banner, about_split, gallery, logo_cloud, feature_tabs, faq_accordion, newsletter, contact, portfolio_grid.
- Names/taglines/headline/subheadline must be specific to THIS business — not generic.
- Use ids: design_ai_a, design_ai_b, design_ai_c.`,
        user: JSON.stringify({
          businessName: prefs.businessName,
          businessIdea: prefs.businessIdea,
          targetAudience: prefs.targetAudience,
          tone: prefs.tone,
          features: prefs.features,
          goals: prefs.keyMessages,
          business,
        }),
        temperature: 0.7,
      });

      const parsed = aiDesignOptionsResponseSchema.safeParse(raw);
      if (parsed.success) {
        const built: SiteDesignOption[] = [];
        for (let i = 0; i < 3; i++) {
          const spec = parsed.data.options[i]!;
          const fallback = fallbacks[i] ?? fallbacks[0]!;
          try {
            const images = await imagesForOption(
              prefs,
              business,
              spec.id,
              spec.brand.imageStyle,
              i
            );
            built.push(optionFromAiSpec(prefs, business, spec, images, fallback, i));
          } catch {
            const images = await imagesForOption(
              prefs,
              business,
              fallback.id,
              fallback.brandOverrides.imageStyle ?? "Lifestyle",
              i
            );
            built.push(
              optionFromDirection(prefs, business, fallback, i, images, {
                headline: spec.headline,
                subheadline: spec.subheadline,
              })
            );
          }
        }
        if (built.length === 3) {
          options = built;
          usedAi = true;
        }
      }
    } catch {
      /* keep heuristics */
    }
  }

  prefs = {
    ...prefs,
    designOptions: options,
    selectedDesignOptionId: undefined,
    brandSystem: undefined,
  };

  return { preferences: prefs, options, usedAi };
}

export function getSelectedDesignOption(
  preferences: SitePreferences
): SiteDesignOption | undefined {
  const id = preferences.selectedDesignOptionId;
  if (!id || !preferences.designOptions?.length) return undefined;
  return preferences.designOptions.find((o) => o.id === id);
}

/** Repair home page blocks to match selected design section order/types. */
export function alignHomeToSelectedDesign(
  site: GeneratedSite,
  selected: SiteDesignOption
): GeneratedSite {
  const home = site.pages.find((p) => p.slug === "home" || p.slug === "");
  if (!home) return site;

  const byType = new Map<string, (typeof home.blocks)[number]>();
  for (const block of home.blocks) {
    if (!byType.has(String(block.type))) byType.set(String(block.type), block);
  }

  const aligned = selected.homeSections.map((section, i) => {
    const existing = home.blocks[i]?.type === section.type
      ? home.blocks[i]
      : byType.get(section.type) ?? home.blocks[i];
    if (!existing) {
      return {
        id: `aligned_${section.type}_${i}`,
        type: section.type,
        variantId: section.variantId ?? "default",
        props: { title: section.label, body: section.description },
      };
    }
    const variantId = section.variantId ?? existing.variantId ?? "default";
    const props =
      existing.type === "hero" &&
      (variantId === "fullBleed" || variantId === "split" || variantId === "centered")
        ? { ...existing.props, layout: variantId }
        : existing.props;
    return {
      ...existing,
      type: section.type,
      variantId,
      props,
    };
  });

  return {
    ...site,
    brand: selected.brand,
    theme: {
      ...site.theme,
      ...themeFromBrand(selected.brand, "custom"),
    },
    pages: site.pages.map((p) =>
      p.slug === "home" || p.slug === "" ? { ...p, blocks: aligned } : p
    ),
  };
}
