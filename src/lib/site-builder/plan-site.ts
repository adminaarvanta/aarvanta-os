import { detectIndustryFromText } from "@/lib/ageb/industries";
import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { resolveSiteTheme } from "@/lib/site-builder/theme-presets";
import { buildEc2DeployNotes } from "@/lib/site-builder/ec2-deploy-notes";
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
          description: `Full-bleed hero introducing ${preferences.businessName} with primary CTA: ${cta}.`,
        },
        {
          type: "stats",
          label: "Proof metrics",
          description: "Three trust-building metrics for the brand.",
        },
        {
          type: "features",
          label: "Value proposition",
          description: "Three concrete benefits aligned with the business idea — never generic filler.",
        },
        ...(preferences.siteType === "store" || preferences.siteType === "landing"
          ? [
              {
                type: "products",
                label: preferences.siteType === "landing" ? "Plans" : "Featured offerings",
                description: "Specific products or plans with prices and imagery.",
              },
            ]
          : []),
        ...(preferences.siteType === "portfolio"
          ? [
              {
                type: "gallery",
                label: "Selected work",
                description: "Photography-led project showcase.",
              },
            ]
          : [
              {
                type: "gallery",
                label: "Inside the brand",
                description: "Atmosphere and craft imagery.",
              },
            ]),
        {
          type: "testimonials",
          label: "Social proof",
          description: "Specific customer quotes with roles — not placeholder names only.",
        },
        {
          type: "faq",
          label: "FAQ",
          description: "Four common questions answered in the brand voice.",
        },
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
          label: PAGE_LABELS[page] ?? page,
          description: `Content section for ${PAGE_LABELS[page] ?? page}.`,
        },
      ];
  }
}

function buildDeploymentPlan(preferences: SitePreferences, slug: string): SitePlan["deployment"] {
  const domain = preferences.deployment.domain.selectedDomain;
  const liveUrl = domain ? `https://${domain}` : undefined;
  const previewUrl = domain
    ? liveUrl!
    : `https://${slug}.sites.aarvanta.cloud`;

  return {
    hostingProvider: "aws_ec2",
    domain: preferences.deployment.domain,
    ec2: preferences.deployment.ec2,
    previewUrl,
    liveUrl,
    deployNotes: buildEc2DeployNotes(preferences.deployment),
  };
}

function heuristicPlan(preferences: SitePreferences): SitePlan {
  const { profile } = detectIndustryFromText(preferences.businessIdea);
  const theme = resolveSiteTheme(preferences);
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

  const screenshotNote = preferences.referenceScreenshots?.length
    ? ` Reference screenshots (${preferences.referenceScreenshots.length}) inform layout direction.`
    : "";

  const promptNote = preferences.customPrompt?.trim()
    ? ` Custom brief: ${preferences.customPrompt.trim().slice(0, 160)}`
    : "";

  const themeLabel =
    preferences.themePreset === "custom" ? "custom brand" : preferences.themePreset.replace(/_/g, " ");

  return {
    siteName: preferences.businessName,
    slug,
    summary: `A ${themeLabel} themed ${preferences.siteType} site for ${preferences.businessName} targeting ${preferences.targetAudience ?? "your ideal customers"} in ${preferences.countryBase}. Tone: ${preferences.tone}. Industry: ${profile.label}.${screenshotNote}${promptNote}`,
    theme,
    navigation,
    pages,
    deployment: buildDeploymentPlan(preferences, slug),
  };
}

function enrichAiPlan(plan: SitePlan, preferences: SitePreferences): SitePlan {
  const slug = plan.slug || slugify(preferences.businessName) || "my-site";
  // User custom/brand theme always wins over AI-suggested colors.
  const theme = resolveSiteTheme(preferences);

  return {
    ...plan,
    slug,
    theme,
    deployment: buildDeploymentPlan(preferences, slug),
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
  "theme": {
    "presetId": one of gold_navy|minimal_light|bold_dark|ocean_cool|sunset_warm,
    "primaryColor": hex, "accentColor": hex, "backgroundColor": hex,
    "fontStyle": string, "styleNotes": string
  },
  "navigation": [{ "label": string, "slug": string }],
  "pages": [{
    "slug": string (empty string for home),
    "title": string,
    "purpose": string,
    "sections": [{ "type": string, "label": string, "description": string }]
  }],
  "deployment": {
    "hostingProvider": "aws_ec2",
    "domain": { "status": string, "selectedDomain": string, ... },
    "ec2": { "region": string, "instanceType": string, "sslEnabled": boolean },
    "previewUrl": string,
    "liveUrl": string optional,
    "deployNotes": [{ "title": string, "body": string }]
  }
}
Domains may be purchased through Aarvanta OR connected as an existing external domain (user updates DNS at their registrar). Hosting is managed by Aarvanta (do not mention cloud vendor names in deployNotes).
If domain.status is "external", deployNotes must tell the user to add the DNS A/CNAME records shown in Build OS.
deployNotes should be short customer-facing steps (domain, hosting, publish, monitoring) with no infrastructure jargon.
Respect ALL user preferences including themePreset, customTheme (brand hex colors + fontPackId), customPrompt, referenceScreenshots, deployment config, pages, and features.
When customTheme is provided, use those exact colors — do not invent a different palette.
Honor the user's customPrompt as hard constraints when planning sections and copy direction.
If referenceScreenshots are provided, note layout inspiration from them in styleNotes.
Include only pages the user selected. Home page slug must be empty string.`,
        user: JSON.stringify(preferences),
        temperature: 0.3,
      });
      return { plan: enrichAiPlan(plan, preferences), usedAi: true };
    } catch {
      return { plan: heuristicPlan(preferences), usedAi: false };
    }
  }

  return { plan: heuristicPlan(preferences), usedAi: false };
}
