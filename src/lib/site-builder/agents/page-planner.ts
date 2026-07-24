import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { pagePlanCandidateSchema } from "@/lib/site-builder/schemas";
import type {
  BusinessProfile,
  BrandSystem,
  PagePlanCandidate,
  SitePageOption,
  SitePreferences,
  SiteTemplateDefinition,
} from "@/types/site-builder";
import { PAGE_CONFIDENCE_THRESHOLD } from "@/types/site-builder";
import { z } from "zod";

const PAGE_META: Record<
  string,
  { title: string; purpose: string; baseConfidence: number }
> = {
  home: { title: "Home", purpose: "Primary landing and conversion", baseConfidence: 98 },
  about: { title: "About", purpose: "Story, mission, and trust", baseConfidence: 88 },
  services: { title: "Services", purpose: "Offerings overview", baseConfidence: 80 },
  products: { title: "Products", purpose: "Catalog and merchandising", baseConfidence: 75 },
  pricing: { title: "Pricing", purpose: "Plans and packages", baseConfidence: 55 },
  portfolio: { title: "Portfolio", purpose: "Work samples and case studies", baseConfidence: 70 },
  testimonials: { title: "Testimonials", purpose: "Social proof", baseConfidence: 65 },
  faq: { title: "FAQ", purpose: "Common questions", baseConfidence: 60 },
  blog: { title: "Blog", purpose: "Content marketing", baseConfidence: 40 },
  contact: { title: "Contact", purpose: "Get in touch", baseConfidence: 95 },
};

function scoreForBusiness(slug: string, business: BusinessProfile): number {
  const meta = PAGE_META[slug];
  if (!meta) return 50;
  let score = meta.baseConfidence;
  const goal = `${business.primaryGoal} ${business.industry} ${business.subcategory}`.toLowerCase();

  if (slug === "products" && /(sell|retail|shop|store|ecommerce)/.test(goal)) score = 96;
  if (slug === "pricing" && /(saas|subscribe|software|plan)/.test(goal)) score = 92;
  if (slug === "pricing" && /(retail|toy|shop)/.test(goal)) score = 25;
  if (slug === "services" && /(agency|clinic|service|consult)/.test(goal)) score = 94;
  if (slug === "portfolio" && /(portfolio|studio|architect|agency|creative)/.test(goal))
    score = 93;
  if (slug === "blog" && /(content|media|nonprofit)/.test(goal)) score = 70;
  if (slug === "faq" && /(book|appointment|health|saas)/.test(goal)) score = 78;

  return Math.max(0, Math.min(100, score));
}

function heuristicPages(
  preferences: SitePreferences,
  business: BusinessProfile,
  template: SiteTemplateDefinition,
  threshold: number
): PagePlanCandidate[] {
  const pool = new Set<string>([
    ...template.defaultPages,
    ...preferences.pages,
    "home",
    "about",
    "contact",
  ]);

  if (/(sell|retail|shop)/i.test(business.primaryGoal)) pool.add("products");
  if (
    preferences.features.includes("ecommerce") ||
    preferences.categoryId === "ecommerce" ||
    preferences.ctaGoal === "buy"
  ) {
    pool.add("products");
  }
  if (/(saas|software)/i.test(business.industry)) pool.add("pricing");
  if (/(agency|service|clinic)/i.test(business.industry)) pool.add("services");

  const candidates: PagePlanCandidate[] = [...pool].map((slug) => {
    const meta = PAGE_META[slug] ?? {
      title: slug.charAt(0).toUpperCase() + slug.slice(1),
      purpose: `${slug} page`,
      baseConfidence: 50,
    };
    let confidence = scoreForBusiness(slug, business);
    if (
      slug === "products" &&
      (preferences.features.includes("ecommerce") ||
        preferences.categoryId === "ecommerce" ||
        preferences.ctaGoal === "buy")
    ) {
      confidence = 98;
    }
    return {
      slug,
      title: meta.title,
      purpose: meta.purpose,
      confidence,
      include: confidence >= threshold,
    };
  });

  // Always keep home + contact when present
  for (const c of candidates) {
    if (c.slug === "home" || c.slug === "contact") {
      c.include = true;
      c.confidence = Math.max(c.confidence, 95);
    }
    if (
      c.slug === "products" &&
      (preferences.features.includes("ecommerce") ||
        preferences.categoryId === "ecommerce" ||
        preferences.ctaGoal === "buy")
    ) {
      c.include = true;
      c.confidence = Math.max(c.confidence, 98);
      c.title = "Shop";
      c.purpose = "Product catalog with categories and filters";
    }
  }

  // Honor explicit user page toggles from prior candidates
  if (preferences.pageCandidates?.length) {
    for (const prev of preferences.pageCandidates) {
      const match = candidates.find((c) => c.slug === prev.slug);
      if (match && typeof prev.include === "boolean") {
        match.include = prev.include;
        match.confidence = prev.confidence ?? match.confidence;
      }
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

export async function runPagePlanner(
  preferences: SitePreferences,
  business: BusinessProfile,
  _brand: BrandSystem,
  template: SiteTemplateDefinition
): Promise<{ candidates: PagePlanCandidate[]; usedAi: boolean }> {
  const threshold =
    preferences.pageConfidenceThreshold ?? PAGE_CONFIDENCE_THRESHOLD;
  const fallback = heuristicPages(preferences, business, template, threshold);

  if (!isAiConfigured()) {
    return { candidates: fallback, usedAi: false };
  }

  try {
    const raw = await completeJson<{ pages: PagePlanCandidate[] }>({
      system: `You plan which website pages a business needs.
Return JSON { pages: [{ slug, title, purpose, confidence (0-100), include }] }.
Use slugs from: home, about, services, pricing, products, portfolio, testimonials, faq, blog, contact.
Set include=true only when confidence >= ${threshold}. Always include home and contact.`,
      user: JSON.stringify({
        business,
        siteName: preferences.businessName,
        siteType: preferences.siteType,
        features: preferences.features,
        templateDefaultPages: template.defaultPages,
      }),
      temperature: 0.3,
    });

    const listSchema = z.array(pagePlanCandidateSchema).min(2);
    const parsed = listSchema.safeParse(raw.pages);
    if (!parsed.success) {
      return { candidates: fallback, usedAi: false };
    }

    const candidates = parsed.data.map((c) => ({
      ...c,
      include:
        c.slug === "home" || c.slug === "contact"
          ? true
          : c.include && c.confidence >= threshold,
    }));

    return { candidates, usedAi: true };
  } catch {
    return { candidates: fallback, usedAi: false };
  }
}

export function includedPageSlugs(
  candidates: PagePlanCandidate[]
): SitePageOption[] {
  return candidates
    .filter((c) => c.include)
    .map((c) => c.slug as SitePageOption);
}
