import { detectIndustryFromText } from "@/lib/ageb/industries";
import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import type { SitePlan, SitePreferences } from "@/types/site-builder";

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

const COLOR_MOODS: Record<
  SitePreferences["colorMood"],
  { primary: string; accent: string; notes: string }
> = {
  warm: {
    primary: "#B8965D",
    accent: "#C9AA72",
    notes: "Warm gold accents with dark backgrounds for premium feel.",
  },
  cool: {
    primary: "#3B82F6",
    accent: "#60A5FA",
    notes: "Cool blue palette conveying trust and professionalism.",
  },
  neutral: {
    primary: "#64748B",
    accent: "#94A3B8",
    notes: "Balanced neutral palette suitable for most industries.",
  },
  vibrant: {
    primary: "#8B5CF6",
    accent: "#A78BFA",
    notes: "Vibrant purple accents for bold, modern brands.",
  },
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function defaultSectionsForPage(
  page: string,
  preferences: SitePreferences
): SitePlan["pages"][number]["sections"] {
  const cta =
    preferences.ctaGoal === "buy"
      ? "Shop now"
      : preferences.ctaGoal === "subscribe"
        ? "Subscribe"
        : preferences.ctaGoal === "book_call"
          ? "Book a call"
          : "Get in touch";

  switch (page) {
    case "home":
      return [
        {
          type: "hero",
          label: "Hero",
          description: `Headline introducing ${preferences.businessName} with primary CTA: ${cta}.`,
        },
        {
          type: "features",
          label: "Value proposition",
          description: "Three key benefits aligned with the business idea.",
        },
        ...(preferences.features.includes("testimonials")
          ? [
              {
                type: "testimonials",
                label: "Social proof",
                description: "Customer quotes and trust signals.",
              },
            ]
          : []),
        {
          type: "cta",
          label: "Call to action",
          description: `Conversion section driving visitors to ${cta.toLowerCase()}.`,
        },
      ];
    case "about":
      return [
        {
          type: "story",
          label: "Our story",
          description: `Brand narrative for ${preferences.businessName}.`,
        },
        {
          type: "team",
          label: "Team / values",
          description: "Mission, values, and why customers should trust you.",
        },
      ];
    case "services":
      return [
        {
          type: "services_grid",
          label: "Services",
          description: "Core offerings with short descriptions.",
        },
        {
          type: "cta",
          label: "Get started",
          description: `Prompt visitors to ${cta.toLowerCase()}.`,
        },
      ];
    case "pricing":
      return [
        {
          type: "pricing",
          label: "Pricing tiers",
          description: "Clear packages with feature comparison.",
        },
        {
          type: "faq",
          label: "Pricing FAQ",
          description: "Common questions about plans and billing.",
        },
      ];
    case "products":
      return [
        {
          type: "products",
          label: "Product catalog",
          description: "Featured products with prices and descriptions.",
        },
        ...(preferences.features.includes("ecommerce")
          ? [
              {
                type: "cart_cta",
                label: "Shop CTA",
                description: "Add to cart and checkout prompts.",
              },
            ]
          : []),
      ];
    case "portfolio":
      return [
        {
          type: "gallery",
          label: "Work gallery",
          description: "Showcase of projects or case studies.",
        },
      ];
    case "testimonials":
      return [
        {
          type: "testimonials",
          label: "Customer stories",
          description: "Reviews and case study highlights.",
        },
      ];
    case "faq":
      return [
        {
          type: "faq",
          label: "FAQ",
          description: "Answers to common customer questions.",
        },
      ];
    case "blog":
      return [
        {
          type: "blog_list",
          label: "Latest articles",
          description: "Recent posts and thought leadership content.",
        },
      ];
    case "contact":
      return [
        {
          type: "contact",
          label: "Contact form",
          description: preferences.features.includes("contact_form")
            ? "Lead capture form with email and message fields."
            : "Contact details and location information.",
        },
        ...(preferences.features.includes("chat_widget")
          ? [
              {
                type: "chat",
                label: "Live chat",
                description: "Website chat widget connected to unified inbox.",
              },
            ]
          : []),
      ];
    default:
      return [
        {
          type: "content",
          label: PAGE_LABELS[page] ?? page,
          description: `Content section for ${PAGE_LABELS[page] ?? page}.`,
        },
      ];
  }
}

function heuristicPlan(preferences: SitePreferences): SitePlan {
  const { profile } = detectIndustryFromText(preferences.businessIdea);
  const mood = COLOR_MOODS[preferences.colorMood];
  const slug = slugify(preferences.businessName) || "my-site";

  const orderedPages = ["home", ...preferences.pages.filter((p) => p !== "home")];
  const uniquePages = [...new Set(orderedPages)];

  const pages = uniquePages.map((pageKey) => ({
    slug: pageKey === "home" ? "" : pageKey,
    title: PAGE_LABELS[pageKey] ?? pageKey,
    purpose:
      pageKey === "home"
        ? `Main landing page for ${preferences.businessName}`
        : `${PAGE_LABELS[pageKey]} page supporting the ${preferences.siteType} site`,
    sections: defaultSectionsForPage(pageKey, preferences),
  }));

  const navigation = uniquePages.map((pageKey) => ({
    label: PAGE_LABELS[pageKey] ?? pageKey,
    slug: pageKey === "home" ? "" : pageKey,
  }));

  return {
    siteName: preferences.businessName,
    slug,
    summary: `A ${preferences.designStyle} ${preferences.siteType} site for ${preferences.businessName} targeting ${preferences.targetAudience ?? "your ideal customers"} in ${preferences.countryBase}. Tone: ${preferences.tone}. Industry: ${profile.label}.`,
    theme: {
      primaryColor: mood.primary,
      accentColor: mood.accent,
      fontStyle:
        preferences.designStyle === "classic"
          ? "Serif headings, clean sans body"
          : preferences.designStyle === "bold"
            ? "Bold sans-serif, high contrast"
            : "Modern sans-serif, generous spacing",
      styleNotes: `${mood.notes} Design style: ${preferences.designStyle}.`,
    },
    navigation,
    pages,
  };
}

export async function planSiteFromPreferences(preferences: SitePreferences): Promise<{
  plan: SitePlan;
  usedAi: boolean;
}> {
  if (isAiConfigured()) {
    try {
      const plan = await completeJson<SitePlan>({
        system: `You are Build OS — the Aarvanta OS website planning engine.
Given site creation preferences, return JSON matching this shape:
{
  "siteName": string,
  "slug": string (lowercase, hyphenated, max 48 chars),
  "summary": string (2-3 sentences),
  "theme": { "primaryColor": hex, "accentColor": hex, "fontStyle": string, "styleNotes": string },
  "navigation": [{ "label": string, "slug": string }],
  "pages": [{
    "slug": string (empty string for home),
    "title": string,
    "purpose": string,
    "sections": [{ "type": string, "label": string, "description": string }]
  }]
}
Respect ALL user preferences: tone, siteType, designStyle, colorMood, pages, features, ctaGoal, keyMessages.
Include only pages the user selected. Home page slug must be empty string.
Section types: hero, features, testimonials, cta, story, team, services_grid, pricing, faq, products, gallery, blog_list, contact, chat, newsletter.`,
        user: JSON.stringify(preferences),
        temperature: 0.3,
      });
      return { plan, usedAi: true };
    } catch {
      return { plan: heuristicPlan(preferences), usedAi: false };
    }
  }

  return { plan: heuristicPlan(preferences), usedAi: false };
}
