import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { runBusinessIntel } from "@/lib/site-builder/agents/business-intel";
import { getFontPack } from "@/lib/site-builder/font-packs";
import { fetchCategoryImages, imageAt } from "@/lib/site-builder/media/unsplash";
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

const DIRECTIONS: DesignDirection[] = [
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
    },
    homeSectionTypes: [
      { type: "hero", label: "Hero", description: "Immersive opening", variantId: "fullBleed" },
      { type: "stats", label: "Proof", description: "Key metrics" },
      { type: "features", label: "Highlights", description: "Why choose us" },
      { type: "products", label: "Featured", description: "Top offerings" },
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
    },
    homeSectionTypes: [
      { type: "hero", label: "Hero", description: "Split value prop", variantId: "split" },
      { type: "logo_cloud", label: "Trusted by", description: "Social proof logos" },
      { type: "features", label: "Benefits", description: "Core differentiators" },
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

const PALETTES: Array<Pick<BrandSystem, "primary" | "secondary" | "background">> = [
  { primary: "#EA580C", secondary: "#FDBA74", background: "#140E0A" },
  { primary: "#2563EB", secondary: "#60A5FA", background: "#0B1220" },
  { primary: "#1A2B48", secondary: "#3D6B9F", background: "#FFFFFF" },
];

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

function fillHomeBlocks(
  sections: SitePlanSection[],
  prefs: SitePreferences,
  business: BusinessProfile,
  images: string[],
  optionId: string
): SiteBlock[] {
  const name = prefs.businessName;
  return sections.map((section, index) => {
    const id = `${optionId}_${section.type}_${index}`;
    const img = imageAt(images, index, `${optionId}-${index}`);
    switch (section.type) {
      case "hero":
        return {
          id,
          type: "hero",
          variantId: section.variantId ?? "default",
          props: {
            layout:
              section.variantId === "fullBleed"
                ? "fullBleed"
                : section.variantId === "split"
                  ? "split"
                  : section.variantId === "centered"
                    ? "centered"
                    : "fullBleed",
            eyebrow: business.subcategory,
            headline: `${name} — ${business.primaryGoal.toLowerCase()}`,
            subheadline: prefs.businessIdea.slice(0, 160),
            cta: business.primaryGoal.includes("Sell") ? "Shop now" : "Get started",
            secondaryCta: "Learn more",
            ctaTarget: "contact",
            imageUrl: img,
          },
        };
      case "features":
        return {
          id,
          type: "features",
          variantId: "default",
          props: {
            title: `Why ${name}`,
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
          props: {
            title: "Trusted partners",
            items: ["Northstar", "Harbor", "Lumen", "Kindred"].map((label) => ({ label })),
          },
        };
      case "products":
      case "gallery":
      case "portfolio_grid":
        return {
          id,
          type: section.type,
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
          props: {
            title: "What people say",
            items: [
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
          props: {
            title: `Ready to ${business.primaryGoal.toLowerCase()}?`,
            subtitle: `Join ${business.audience[0] ?? "customers"} choosing ${name}.`,
            cta: "Get started",
            ctaTarget: "contact",
          },
        };
      case "about_split":
        return {
          id,
          type: "about_split",
          props: {
            title: `About ${name}`,
            body: prefs.businessIdea.slice(0, 220),
            imageUrl: img,
          },
        };
      case "faq_accordion":
        return {
          id,
          type: "faq_accordion",
          props: {
            title: "Questions",
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
          props: {
            title: "Contact",
            subtitle: `Talk to the ${name} team`,
          },
        };
      case "newsletter":
        return {
          id,
          type: "newsletter",
          props: {
            title: "Stay in the loop",
            subtitle: `News from ${name}`,
          },
        };
      case "feature_tabs":
        return {
          id,
          type: "feature_tabs",
          props: {
            title: "How it works",
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
  option: DesignDirection
): GeneratedSite {
  const theme = themeFromBrand(brand, "custom");
  return {
    siteName: prefs.businessName,
    slug: prefs.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "site",
    tagline: option.tagline,
    theme,
    navigation: [{ label: "Home", slug: "home" }],
    pages: [{ slug: "home", title: "Home", blocks }],
    business: prefs.businessProfile,
    brand,
    version: 1,
    generatedAt: crmNow(),
  };
}

function heuristicOptions(
  prefs: SitePreferences,
  business: BusinessProfile,
  images: string[]
): SiteDesignOption[] {
  const base = baseBrand(business, prefs);
  return DIRECTIONS.map((direction, i) => {
    const brand = applyDirectionBrand(base, direction, i);
    const homeSections: SitePlanSection[] = direction.homeSectionTypes.map((s) => ({
      type: s.type,
      label: s.label,
      description: s.description,
      variantId: s.variantId ?? (s.type === "hero" ? direction.heroVariant : "default"),
    }));
    const blocks = fillHomeBlocks(homeSections, prefs, business, images, direction.id);
    return {
      id: direction.id,
      name: direction.name,
      tagline: direction.tagline,
      description: direction.description,
      styleTags: direction.styleTags,
      heroVariant: direction.heroVariant,
      brand,
      homeSections,
      preview: buildPreview(prefs, brand, blocks, direction),
    };
  });
}

/**
 * Generate ≥3 distinct homepage design directions for the user to pick from.
 * Does not build the full multi-page site yet.
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

  const images = await fetchCategoryImages(
    prefs.categoryId ?? "professional",
    [business.industry, business.subcategory, prefs.businessName],
    12
  );

  let options = heuristicOptions(prefs, business, images);
  let usedAi = businessAi;

  if (isAiConfigured()) {
    try {
      const ai = await completeJson<{
        options?: Array<{
          id: string;
          name: string;
          tagline: string;
          description: string;
          styleTags?: string[];
          headline?: string;
          subheadline?: string;
        }>;
      }>({
        system: `You name and describe 3 distinct website design directions for a business.
Return JSON { options: [{ id, name, tagline, description, styleTags, headline, subheadline }] }.
Use ids: design_bold_immersive, design_split_modern, design_editorial_calm.
Make names/taglines specific to the business — not generic.`,
        user: JSON.stringify({
          businessName: prefs.businessName,
          businessIdea: prefs.businessIdea,
          business,
        }),
        temperature: 0.6,
      });

      if (Array.isArray(ai.options) && ai.options.length >= 3) {
        options = options.map((opt, i) => {
          const patch = ai.options![i];
          if (!patch) return opt;
          const hero = opt.preview.pages[0]?.blocks.find((b) => b.type === "hero");
          const nextBlocks =
            opt.preview.pages[0]?.blocks.map((b) =>
              b.type === "hero" && hero
                ? {
                    ...b,
                    props: {
                      ...b.props,
                      headline: patch.headline || b.props.headline,
                      subheadline: patch.subheadline || b.props.subheadline,
                    },
                  }
                : b
            ) ?? [];
          return {
            ...opt,
            name: patch.name || opt.name,
            tagline: patch.tagline || opt.tagline,
            description: patch.description || opt.description,
            styleTags: patch.styleTags?.length ? patch.styleTags : opt.styleTags,
            preview: {
              ...opt.preview,
              tagline: patch.tagline || opt.tagline,
              pages: [{ slug: "home", title: "Home", blocks: nextBlocks }],
            },
          };
        });
        usedAi = true;
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
