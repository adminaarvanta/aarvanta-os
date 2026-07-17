import { getUiTemplate, type SiteUiTemplate } from "@/lib/site-builder/templates";
import type { SitePlan, SitePreferences } from "@/types/site-builder";

type Section = SitePlan["pages"][number]["sections"][number];

function ctaLabel(preferences: SitePreferences): string {
  if (preferences.ctaGoal === "buy") return "Shop now";
  if (preferences.ctaGoal === "subscribe") return "Subscribe";
  if (preferences.ctaGoal === "book_call") return "Book a call";
  return "Get in touch";
}

/** Home-page sections driven by the selected UI template layout (not generic siteType). */
export function homeSectionsForTemplate(
  template: SiteUiTemplate,
  preferences: SitePreferences
): Section[] {
  const cta = ctaLabel(preferences);
  const brand = preferences.businessName || "your brand";

  switch (template.layout) {
    case "store_shelf":
      return [
        {
          type: "hero",
          label: template.highlightSections[0] ?? "Hero",
          description: `Shop hero for ${brand} with primary CTA: ${cta}. Layout: store shelf.`,
        },
        {
          type: "products",
          label: template.highlightSections[1] ?? "Featured products",
          description: "Product grid with prices and quick-add prompts.",
        },
        {
          type: "trust",
          label: template.highlightSections[2] ?? "Trust bar",
          description: "Shipping, returns, and payment trust signals.",
        },
        {
          type: "cta",
          label: "Shop CTA",
          description: `Conversion band driving visitors to ${cta.toLowerCase()}.`,
        },
      ];
    case "hero_split":
      return [
        {
          type: "hero_split",
          label: template.highlightSections[0] ?? "Split hero",
          description: `Split intro for ${brand}: copy left, media right, CTA: ${cta}.`,
        },
        {
          type: "features",
          label: template.highlightSections[1] ?? "Highlights",
          description: "Three value points aligned to the niche template.",
        },
        {
          type: "story",
          label: template.highlightSections[2] ?? "Story",
          description: "Short narrative or collection story section.",
        },
        {
          type: "cta",
          label: "Call to action",
          description: `Close with ${cta.toLowerCase()}.`,
        },
      ];
    case "services_grid":
      return [
        {
          type: "hero",
          label: template.highlightSections[0] ?? "Hero CTA",
          description: `Service hero for ${brand} with booking-focused CTA: ${cta}.`,
        },
        {
          type: "services_grid",
          label: template.highlightSections[1] ?? "Services",
          description: "Grid of core services with short descriptions.",
        },
        ...(preferences.features.includes("testimonials")
          ? [
              {
                type: "testimonials",
                label: template.highlightSections[2] ?? "Reviews",
                description: "Local trust and customer reviews.",
              },
            ]
          : []),
        {
          type: "cta",
          label: "Book CTA",
          description: `Prompt visitors to ${cta.toLowerCase()}.`,
        },
      ];
    case "hero_image_bg":
      return [
        {
          type: "hero_image",
          label: template.highlightSections[0] ?? "Full-bleed hero",
          description: `Atmospheric full-bleed hero for ${brand} with CTA: ${cta}.`,
        },
        {
          type: "features",
          label: template.highlightSections[1] ?? "Highlights",
          description: "Signature offerings or selected work strip.",
        },
        {
          type: "process",
          label: template.highlightSections[2] ?? "Process",
          description: "How it works or dining/experience steps.",
        },
        {
          type: "cta",
          label: "Call to action",
          description: `Drive ${cta.toLowerCase()}.`,
        },
      ];
    case "hero_centered":
    default:
      return [
        {
          type: "hero",
          label: template.highlightSections[0] ?? "Centered hero",
          description: `Centered landing hero for ${brand} with CTA: ${cta}.`,
        },
        {
          type: "features",
          label: template.highlightSections[1] ?? "Features",
          description: "Three benefit blocks under the hero.",
        },
        {
          type: "content",
          label: template.highlightSections[2] ?? "Details",
          description: "Supporting content block (pricing teaser, work, or about).",
        },
        {
          type: "cta",
          label: "Call to action",
          description: `Conversion section for ${cta.toLowerCase()}.`,
        },
      ];
  }
}

export function sectionsForPage(
  page: string,
  preferences: SitePreferences
): Section[] {
  const template = getUiTemplate(preferences.templateId);
  const cta = ctaLabel(preferences);

  if (page === "home" && template) {
    return homeSectionsForTemplate(template, preferences);
  }

  switch (page) {
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
        ...(preferences.features.includes("chat_widget") ||
        preferences.features.includes("live_chat")
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
          label: page,
          description: `Content section for ${page}.`,
        },
      ];
  }
}
