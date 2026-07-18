import type {
  GeneratedSite,
  GeneratedSitePage,
  SiteBlock,
  SitePlan,
  SitePreferences,
} from "@/types/site-builder";
import { crmNow } from "@/lib/data/crm-helpers";

function ctaLabel(goal: SitePreferences["ctaGoal"]): string {
  switch (goal) {
    case "buy":
      return "Shop now";
    case "subscribe":
      return "Subscribe";
    case "book_call":
      return "Book a call";
    default:
      return "Get in touch";
  }
}

function blockFromSection(
  sectionType: string,
  sectionLabel: string,
  sectionDescription: string,
  preferences: SitePreferences,
  pageTitle: string
): SiteBlock {
  const id = `${sectionType}_${sectionLabel.replace(/\s+/g, "_").toLowerCase()}`;
  const cta = ctaLabel(preferences.ctaGoal);
  const brand = preferences.businessName;

  switch (sectionType) {
    case "hero":
      return {
        id,
        type: "hero",
        props: {
          eyebrow: pageTitle === "Home" ? "Welcome" : pageTitle,
          headline: brand,
          subheadline: preferences.keyMessages ?? preferences.businessIdea.slice(0, 160),
          cta,
        },
      };
    case "features":
    case "services_grid":
      return {
        id,
        type: "features",
        props: {
          title: sectionLabel,
          items: [
            {
              title: "Quality you can trust",
              description: `Crafted for ${preferences.targetAudience ?? "your customers"}.`,
            },
            {
              title: "Fast & reliable",
              description: `Serving ${preferences.countryBase} with care and consistency.`,
            },
            {
              title: "Customer-first",
              description: sectionDescription,
            },
          ],
        },
      };
    case "testimonials":
      return {
        id,
        type: "testimonials",
        props: {
          title: sectionLabel,
          quotes: [
            {
              text: `Absolutely love ${brand} — exceeded our expectations.`,
              author: "Sarah M.",
            },
            {
              text: "Professional, friendly, and great value.",
              author: "James T.",
            },
          ],
        },
      };
    case "products":
      return {
        id,
        type: "products",
        props: {
          title: sectionLabel,
          products: [
            {
              name: "Signature offering",
              description: preferences.businessIdea.slice(0, 80),
              price: preferences.countryBase === "UK" ? "£29.99" : "$29.99",
              emoji: "✨",
            },
            {
              name: "Premium bundle",
              description: "Best value for new customers.",
              price: preferences.countryBase === "UK" ? "£59.99" : "$59.99",
              emoji: "🎁",
            },
            {
              name: "Monthly plan",
              description: "Flexible subscription — cancel anytime.",
              price: preferences.countryBase === "UK" ? "£24.99" : "$24.99",
              emoji: "📦",
            },
          ],
        },
      };
    case "pricing":
      return {
        id,
        type: "pricing",
        props: {
          title: sectionLabel,
          tiers: [
            { name: "Starter", price: "£19/mo", features: ["Core features", "Email support"] },
            { name: "Pro", price: "£49/mo", features: ["Everything in Starter", "Priority support"], highlighted: true },
            { name: "Enterprise", price: "Custom", features: ["Dedicated account manager", "SLA"] },
          ],
        },
      };
    case "contact":
      return {
        id,
        type: "contact",
        props: {
          title: sectionLabel,
          description: sectionDescription,
          showForm: preferences.features.includes("contact_form"),
        },
      };
    case "cta":
    case "cart_cta":
      return {
        id,
        type: "cta",
        props: {
          title: sectionLabel,
          description: sectionDescription,
          cta,
        },
      };
    case "faq":
      return {
        id,
        type: "faq",
        props: {
          title: sectionLabel,
          items: [
            { q: "How do I get started?", a: `Contact ${brand} or use the button above.` },
            { q: "Do you ship internationally?", a: `We serve customers in ${preferences.countryBase} and beyond.` },
            { q: "What makes you different?", a: preferences.keyMessages ?? preferences.businessIdea.slice(0, 100) },
          ],
        },
      };
    case "story":
      return {
        id,
        type: "content",
        props: {
          title: sectionLabel,
          body: `${brand} started with a simple mission: ${preferences.businessIdea}`,
        },
      };
    case "gallery":
      return {
        id,
        type: "gallery",
        props: {
          title: sectionLabel,
          items: ["Project Alpha", "Project Beta", "Project Gamma"],
        },
      };
    case "blog_list":
      return {
        id,
        type: "blog",
        props: {
          title: sectionLabel,
          posts: [
            { title: `Why ${brand} matters`, date: "Recent" },
            { title: "Industry insights", date: "Recent" },
          ],
        },
      };
    default:
      return {
        id,
        type: "content",
        props: {
          title: sectionLabel,
          body: sectionDescription,
        },
      };
  }
}

function pageToBlocks(
  page: SitePlan["pages"][number],
  preferences: SitePreferences
): SiteBlock[] {
  return page.sections.map((section) =>
    blockFromSection(
      section.type,
      section.label,
      section.description,
      preferences,
      page.title
    )
  );
}

export function generateSiteFromPlan(
  plan: SitePlan,
  preferences: SitePreferences
): GeneratedSite {
  const pages: GeneratedSitePage[] = plan.pages.map((page) => ({
    slug: page.slug,
    title: page.title,
    blocks: pageToBlocks(page, preferences),
  }));

  return {
    siteName: plan.siteName,
    slug: plan.slug,
    theme: plan.theme,
    navigation: plan.navigation,
    pages,
    generatedAt: crmNow(),
  };
}
