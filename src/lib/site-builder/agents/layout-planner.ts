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
  template: SiteTemplateDefinition
): SiteTemplateSectionRecipe[] {
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
  brand: BrandSystem
): SitePlanPage[] {
  const heroVariant = pickHeroVariant(brand);
  return candidates
    .filter((c) => c.include)
    .map((c) => {
      const recipes = recipesForPage(c.slug, template);
      const sections: SitePlanSection[] = recipes.map((r) => ({
        type: r.type,
        label: r.label,
        description: r.description,
        variantId: r.type === "hero" ? heroVariant : "default",
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
  template: SiteTemplateDefinition
): Promise<{ pages: SitePlanPage[]; usedAi: boolean }> {
  const fallback = heuristicLayout(candidates, template, brand);
  if (!isAiConfigured()) {
    return { pages: fallback, usedAi: false };
  }

  try {
    const raw = await completeJson<{ pages: SitePlanPage[] }>({
      system: `You plan website section layouts.
Return JSON { pages: [{ slug, title, purpose, confidence, include, sections: [{ type, label, description, variantId }] }] }.
Section types must be from: hero, features, services_grid, products, portfolio_grid, testimonials, stats, pricing_table, faq_accordion, logo_cloud, timeline, team_grid, comparison, cta_banner, gallery, menu_list, booking_cta, feature_tabs, rich_text, contact, newsletter, blog_list, about_split, content.
variantId is usually "default"; for hero use default|centered|fullBleed|split.
Keep page order sensible. Only include pages marked include=true.`,
      user: JSON.stringify({
        business,
        brand: { style: brand.style, imageStyle: brand.imageStyle },
        candidates: candidates.filter((c) => c.include),
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
      .map((p) => ({
        ...p,
        include: true,
        sections: (p.sections ?? []).map((s) => ({
          type: s.type,
          label: s.label || s.type,
          description: s.description || s.label || s.type,
          variantId: s.variantId || (s.type === "hero" ? pickHeroVariant(brand) : "default"),
        })),
      }))
      .filter((p) => p.sections.length > 0);

    return { pages: pages.length ? pages : fallback, usedAi: true };
  } catch {
    return { pages: fallback, usedAi: false };
  }
}
