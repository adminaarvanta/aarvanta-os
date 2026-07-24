import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import type {
  BrandSystem,
  BusinessProfile,
  PagePlanCandidate,
  SitePlanPage,
  SitePlanSection,
  SitePreferences,
  SiteTemplateDefinition,
  SiteTemplateSectionRecipe,
} from "@/types/site-builder";

const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  about: "About",
  services: "Services",
  pricing: "Pricing",
  products: "Products",
  portfolio: "Portfolio",
  testimonials: "Testimonials",
  faq: "FAQ",
  blog: "Blog",
  contact: "Contact",
};

function recipesForPage(
  slug: string,
  template: SiteTemplateDefinition,
  preferences?: SitePreferences
): SiteTemplateSectionRecipe[] {
  const ecommerce =
    preferences?.features.includes("ecommerce") ||
    preferences?.categoryId === "ecommerce" ||
    preferences?.ctaGoal === "buy";

  if (slug === "products" && ecommerce) {
    return [
      {
        type: "hero",
        label: "Shop hero",
        description: "Catalog introduction",
      },
      {
        type: "products",
        label: "Catalog",
        description: "Category filters, search, and pagination",
      },
      {
        type: "faq_accordion",
        label: "Shipping & returns",
        description: "Shop FAQ",
      },
    ];
  }
  if (template.sectionsByPage[slug]) return template.sectionsByPage[slug]!;
  if (slug === "contact") {
    return [
      { type: "contact", label: "Contact", description: "Contact form and details" },
      { type: "faq_accordion", label: "FAQ", description: "Quick answers" },
    ];
  }
  if (slug === "about") {
    return [
      { type: "about_split", label: "About", description: "Story and mission" },
      { type: "team_grid", label: "Team", description: "People behind the brand" },
      { type: "cta_banner", label: "CTA", description: "Next step" },
    ];
  }
  return [
    { type: "rich_text", label: PAGE_LABELS[slug] ?? slug, description: "Page content" },
    { type: "cta_banner", label: "CTA", description: "Conversion band" },
  ];
}

function pickHeroVariant(brand: BrandSystem): string {
  if (brand.style === "Luxury" || brand.style === "Minimal") return "centered";
  if (brand.style === "Bold") return "fullBleed";
  return "default";
}

function heuristicLayout(
  candidates: PagePlanCandidate[],
  template: SiteTemplateDefinition,
  brand: BrandSystem,
  homeSectionsOverride?: SitePlanSection[],
  preferences?: SitePreferences
): SitePlanPage[] {
  const heroVariant = pickHeroVariant(brand);
  const ecommerce =
    preferences?.features.includes("ecommerce") ||
    preferences?.categoryId === "ecommerce" ||
    preferences?.ctaGoal === "buy";

  return candidates
    .filter((c) => c.include)
    .map((c) => {
      const recipes =
        c.slug === "home" && homeSectionsOverride?.length
          ? homeSectionsOverride.map((s) => ({
              type: s.type as SiteTemplateSectionRecipe["type"],
              label: s.label,
              description: s.description,
            }))
          : recipesForPage(c.slug, template, preferences);
      const sections: SitePlanSection[] = recipes.map((r, i) => ({
        type: r.type,
        label: r.label,
        description: r.description,
        variantId:
          c.slug === "home" && homeSectionsOverride?.[i]?.variantId
            ? homeSectionsOverride[i]!.variantId
            : r.type === "hero"
              ? heroVariant === "default"
                ? brand.style === "Bold"
                  ? "fullBleed"
                  : brand.style === "Minimal" || brand.style === "Luxury"
                    ? "centered"
                    : "split"
                : heroVariant
              : r.type === "products" && ecommerce
                ? c.slug === "products"
                  ? "catalog"
                  : "featured"
                : r.type === "features"
                  ? brand.spacingScale === "Airy"
                    ? "row"
                    : "cards"
                  : "default",
      }));
      return {
        slug: c.slug,
        title: c.title,
        purpose: c.purpose,
        confidence: c.confidence,
        include: true,
        sections,
      };
    });
}

export async function runLayoutPlanner(
  preferences: SitePreferences,
  business: BusinessProfile,
  brand: BrandSystem,
  candidates: PagePlanCandidate[],
  template: SiteTemplateDefinition,
  homeSectionsOverride?: SitePlanSection[]
): Promise<{ pages: SitePlanPage[]; usedAi: boolean }> {
  const fallback = heuristicLayout(
    candidates,
    template,
    brand,
    homeSectionsOverride,
    preferences
  );
  if (!isAiConfigured()) {
    return { pages: fallback, usedAi: false };
  }

  try {
    const raw = await completeJson<{ pages: SitePlanPage[] }>({
      system: `You plan website section layouts.
Return JSON { pages: [{ slug, title, purpose, confidence, include, sections: [{ type, label, description, variantId }] }] }.
Section types must be from: hero, features, services_grid, products, portfolio_grid, testimonials, stats, pricing_table, faq_accordion, logo_cloud, timeline, team_grid, comparison, cta_banner, gallery, menu_list, booking_cta, feature_tabs, rich_text, contact, newsletter, blog_list, about_split, content.
variantId is usually "default"; for hero use default|centered|fullBleed|split.
Keep page order sensible. Only include pages marked include=true.
If a homepageSections prior is provided, keep that section order/types for home.`,
      user: JSON.stringify({
        business,
        brand: { style: brand.style, imageStyle: brand.imageStyle },
        candidates: candidates.filter((c) => c.include),
        homepageSections: homeSectionsOverride,
        templatePrior: template.sectionsByPage,
        siteName: preferences.businessName,
      }),
      temperature: 0.4,
    });

    if (!Array.isArray(raw.pages) || raw.pages.length === 0) {
      return { pages: fallback, usedAi: false };
    }

    const pages = raw.pages
      .filter((p) => p.include !== false)
      .map((p) => {
        if (p.slug === "home" && homeSectionsOverride?.length) {
          return {
            ...p,
            include: true,
            sections: homeSectionsOverride,
          };
        }
        return {
          ...p,
          include: true,
          sections: (p.sections ?? []).map((s) => ({
            type: s.type,
            label: s.label || s.type,
            description: s.description || s.label || s.type,
            variantId: s.variantId || (s.type === "hero" ? pickHeroVariant(brand) : "default"),
          })),
        };
      })
      .filter((p) => p.sections.length > 0);

    return { pages: pages.length ? pages : fallback, usedAi: true };
  } catch {
    return { pages: fallback, usedAi: false };
  }
}
