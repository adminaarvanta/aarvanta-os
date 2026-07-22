import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { crmNow } from "@/lib/data/crm-helpers";
import { buildContentBrief, type ContentBrief } from "@/lib/site-builder/content-brief";
import { preferSampleFilledSite } from "@/lib/site-builder/ensure-sample-data";
import {
  dicebearAvatar,
  fetchCategoryImages,
  imageAt,
} from "@/lib/site-builder/media/unsplash";
import { requireTemplate } from "@/lib/site-builder/templates/resolve-template";
import { resolveSiteTheme } from "@/lib/site-builder/theme-presets";
import type {
  GeneratedSite,
  GeneratedSitePage,
  SiteBlock,
  SiteBlockType,
  SitePlan,
  SitePreferences,
  SiteTemplateDefinition,
  SiteTemplateSectionRecipe,
} from "@/types/site-builder";

let blockSeq = 0;
function blockId(type: string, label: string): string {
  blockSeq += 1;
  return `${type}_${label.replace(/\s+/g, "_").toLowerCase()}_${blockSeq}`;
}

function titleCase(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function partnerNames(seed: number, nouns: string[]): string[] {
  const base = ["Northstar", "Field & Co", "Lumen", "Harbor", "Orbit", "Kindred", "Parcel", "Summit"];
  const fromPrompt = nouns.slice(0, 3).map((n) => titleCase(n));
  const mixed = [...fromPrompt, ...base];
  return Array.from({ length: 6 }, (_, i) => mixed[(seed + i * 3) % mixed.length]!);
}

function fillBlock(
  recipe: SiteTemplateSectionRecipe,
  brief: ContentBrief,
  prefs: SitePreferences,
  template: SiteTemplateDefinition,
  images: string[],
  index: number
): SiteBlock {
  const name = brief.businessName;
  const e = brief.entities;
  const img = (i: number) =>
    imageAt(images, index + i, `${brief.templateId}-${e.seed}-${i}`);
  const ctaTarget = prefs.ctaGoal === "book_call" ? "booking" : "contact";

  switch (recipe.type as SiteBlockType) {
    case "hero":
      return {
        id: blockId("hero", recipe.label),
        type: "hero",
        props: {
          layout: template.heroLayout === "minimal" ? "split" : template.heroLayout,
          eyebrow: brief.categoryLabel,
          headline: brief.headline,
          subheadline: brief.subheadline,
          cta: brief.ctaLabel,
          secondaryCta: brief.ctaSecondary,
          ctaTarget,
          imageUrl: img(0),
        },
      };
    case "logo_cloud":
      return {
        id: blockId("logo_cloud", recipe.label),
        type: "logo_cloud",
        props: {
          title: `Trusted around ${e.audienceHint}`,
          items: partnerNames(e.seed, e.nouns).map((label) => ({ label })),
        },
      };
    case "features":
      return {
        id: blockId("features", recipe.label),
        type: "features",
        props: {
          title: `Why ${name}`,
          subtitle: `Specific to ${brief.idea.slice(0, 100)}`,
          items: e.featureTitles.map((title, i) => ({
            title: title.slice(0, 48),
            description:
              e.phrases[i] ||
              `${titleCase(e.nouns[i] ?? "Focus")} for ${e.audienceHint} — not generic filler.`,
            icon: ["sparkles", "compass", "users", "chart"][i % 4],
          })),
        },
      };
    case "services_grid":
      return {
        id: blockId("services_grid", recipe.label),
        type: "services_grid",
        props: {
          title: `${name} offerings`,
          items: e.serviceNames.map((title, i) => ({
            title,
            description:
              e.phrases[i] ||
              `Hands-on ${title.toLowerCase()} shaped for ${e.audienceHint}.`,
            icon: ["star", "message", "refresh", "zap"][i % 4],
          })),
        },
      };
    case "products":
      return {
        id: blockId("products", recipe.label),
        type: "products",
        props: {
          title: `From ${name}`,
          products: e.productNames.map((productName, n) => ({
            name: productName,
            price: `£${(18 + ((e.seed + n * 7) % 40)).toFixed(2)}`,
            description:
              e.phrases[n] ||
              `${productName} — built for ${e.audienceHint}.`,
            imageUrl: img(n + 1),
          })),
        },
      };
    case "portfolio_grid":
      return {
        id: blockId("portfolio_grid", recipe.label),
        type: "portfolio_grid",
        props: {
          title: `Selected ${brief.categoryLabel.toLowerCase()} work`,
          items: e.nouns.slice(0, 6).map((noun, n) => ({
            title: `${titleCase(noun)} study`,
            category: brief.categoryLabel,
            imageUrl: img(n + 1),
            summary: e.phrases[n % Math.max(e.phrases.length, 1)] || `A ${prefs.tone} piece for ${e.audienceHint}.`,
          })).concat(
            e.nouns.length < 6
              ? Array.from({ length: 6 - e.nouns.length }, (_, i) => ({
                  title: `${name} project ${i + 1}`,
                  category: brief.categoryLabel,
                  imageUrl: img(i + 4),
                  summary: `Work grounded in ${brief.idea.slice(0, 80)}.`,
                }))
              : []
          ),
        },
      };
    case "testimonials":
      return {
        id: blockId("testimonials", recipe.label),
        type: "testimonials",
        props: {
          title: `What ${e.audienceHint} say`,
          quotes: e.testimonialHooks.map((quote, i) => ({
            quote,
            name: ["Amelia Hart", "Jordan Lee", "Priya Shah"][i]!,
            role: ["Founder", "Ops lead", "Director"][i]!,
            avatarUrl: dicebearAvatar(`${name}-${i}-${e.seed}`),
          })),
        },
      };
    case "stats":
      return {
        id: blockId("stats", recipe.label),
        type: "stats",
        props: {
          title: `${name} by the numbers`,
          items: e.proofStats,
        },
      };
    case "pricing_table": {
      const [a, b, c] = e.pricingNames;
      const prices = [29 + (e.seed % 20), 79 + (e.seed % 40), 199 + (e.seed % 80)];
      return {
        id: blockId("pricing_table", recipe.label),
        type: "pricing_table",
        props: {
          title: `${name} pricing`,
          tiers: [
            {
              name: a,
              price: `£${prices[0]}`,
              period: "/mo",
              description: `Start with ${e.nouns[0] ?? "the basics"}`,
              features: [e.featureTitles[0], "Email support", "1 workspace"].map(String),
              cta: brief.ctaLabel,
              highlighted: false,
            },
            {
              name: b,
              price: `£${prices[1]}`,
              period: "/mo",
              description: `For ${e.audienceHint}`,
              features: [e.featureTitles[1], e.featureTitles[2], "Priority support"].map(String),
              cta: brief.ctaLabel,
              highlighted: true,
            },
            {
              name: c,
              price: `£${prices[2]}`,
              period: "/mo",
              description: `Serious ${brief.categoryLabel.toLowerCase()} scale`,
              features: [e.featureTitles[3] || e.featureTitles[0], "SSO", "Dedicated success"].map(String),
              cta: "Talk to sales",
              highlighted: false,
            },
          ],
        },
      };
    }
    case "faq_accordion":
      return {
        id: blockId("faq_accordion", recipe.label),
        type: "faq_accordion",
        props: {
          title: `Questions about ${name}`,
          items: e.faqPairs,
        },
      };
    case "timeline":
      return {
        id: blockId("timeline", recipe.label),
        type: "timeline",
        props: {
          title: `How ${name} works`,
          items: [
            { title: "Discover", description: e.phrases[0] || `Align on ${e.nouns[0] ?? "goals"} and success metrics.` },
            { title: "Shape", description: e.phrases[1] || `Design the ${e.nouns[1] ?? "experience"} with your team.` },
            { title: "Deliver", description: `Ship ${e.nouns[2] ?? "milestones"} with visible weekly progress.` },
            { title: "Grow", description: `Measure outcomes for ${e.audienceHint} and iterate.` },
          ],
        },
      };
    case "team_grid":
      return {
        id: blockId("team_grid", recipe.label),
        type: "team_grid",
        props: {
          title: `People behind ${name}`,
          members: ["Alex Morgan", "Sam Rivera", "Casey Nguyen", "Riley Brooks"].map(
            (memberName, i) => ({
              name: memberName,
              role: i === 0 ? "Founder" : i === 1 ? `Lead ${titleCase(e.nouns[0] ?? "delivery")}` : "Specialist",
              bio: `Focused on ${e.nouns[i] ?? e.audienceHint}.`,
              avatarUrl: dicebearAvatar(`${memberName}-${e.seed}`),
            })
          ),
        },
      };
    case "comparison":
      return {
        id: blockId("comparison", recipe.label),
        type: "comparison",
        props: {
          title: `${name} vs the usual path`,
          columns: [
            {
              name: "Status quo",
              items: [
                `Generic ${brief.categoryLabel.toLowerCase()} noise`,
                `Vague ${e.nouns[0] ?? "offers"}`,
                "Slow, unclear ownership",
              ],
            },
            {
              name,
              highlighted: true,
              items: [
                e.featureTitles[0],
                e.featureTitles[1],
                `Built for ${e.audienceHint}`,
              ],
            },
          ],
        },
      };
    case "cta_banner":
      return {
        id: blockId("cta_banner", recipe.label),
        type: "cta_banner",
        props: {
          title: `Ready for ${e.nouns[0] ? titleCase(e.nouns[0]) : name}?`,
          body: brief.subheadline,
          cta: brief.ctaLabel,
          ctaTarget,
        },
      };
    case "gallery":
      return {
        id: blockId("gallery", recipe.label),
        type: "gallery",
        props: {
          title: `${name} in the wild`,
          items: [0, 1, 2, 3, 4, 5].map((i) => ({
            imageUrl: img(i + 2),
            caption: `${titleCase(e.nouns[i % Math.max(e.nouns.length, 1)] ?? name)} ${i + 1}`,
          })),
        },
      };
    case "menu_list":
      return {
        id: blockId("menu_list", recipe.label),
        type: "menu_list",
        props: {
          title: `${name} menu`,
          sections: [
            { name: "Signatures", items: e.menuItems },
            {
              name: "Also on",
              items: [
                {
                  name: `${titleCase(e.nouns[0] ?? "House")} pour`,
                  description: `Paired for ${e.audienceHint}.`,
                  price: `£${8 + (e.seed % 5)}`,
                },
              ],
            },
          ],
        },
      };
    case "booking_cta":
      return {
        id: blockId("booking_cta", recipe.label),
        type: "booking_cta",
        props: {
          id: "booking",
          title: `Book ${name}`,
          description: `Tell us about ${e.nouns[0] ?? "your goals"} — we’ll confirm a slot.`,
          cta: brief.ctaLabel,
          slots: ["Tue 10:00", "Tue 14:30", "Wed 11:00", "Thu 16:00"],
        },
      };
    case "feature_tabs":
      return {
        id: blockId("feature_tabs", recipe.label),
        type: "feature_tabs",
        props: {
          title: `Inside ${name}`,
          tabs: [0, 1, 2].map((i) => ({
            label: titleCase(e.nouns[i] ?? ["Overview", "Workflow", "Insights"][i]!),
            title: e.featureTitles[i] || `Path ${i + 1}`,
            body: e.phrases[i] || `${name} helps ${e.audienceHint} with ${e.nouns[i] ?? "clarity"}.`,
            imageUrl: img(i + 1),
          })),
        },
      };
    case "about_split":
      return {
        id: blockId("about_split", recipe.label),
        type: "about_split",
        props: {
          title: `The story of ${name}`,
          body: prefs.businessIdea,
          imageUrl: img(1),
          bullets: [
            e.featureTitles[0],
            `For ${e.audienceHint}`,
            prefs.customCategoryLabel || brief.categoryLabel,
          ],
        },
      };
    case "newsletter":
      return {
        id: blockId("newsletter", recipe.label),
        type: "newsletter",
        props: {
          title: `Updates from ${name}`,
          description: `Notes on ${e.nouns[0] ?? brief.categoryLabel.toLowerCase()} — no spam.`,
          cta: "Subscribe",
          placeholder: "you@company.com",
        },
      };
    case "blog_list":
      return {
        id: blockId("blog_list", recipe.label),
        type: "blog_list",
        props: {
          title: `${name} insights`,
          posts: e.blogTitles.map((title, n) => ({
            title,
            excerpt: e.phrases[n] || `Perspectives for ${e.audienceHint}.`,
            date: `2026-0${(n % 9) + 1}-12`,
            imageUrl: img(n + 1),
          })),
        },
      };
    case "contact":
      return {
        id: blockId("contact", recipe.label),
        type: "contact",
        props: {
          id: "contact",
          title: `Talk to ${name}`,
          description: `Tell us about ${e.nouns[0] ?? "your project"} — we reply within two business days.`,
          showForm: prefs.features.includes("contact_form"),
          email: `hello@${name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "studio"}.co`,
          phone: "+44 20 0000 0000",
        },
      };
    case "rich_text":
    case "content":
    default:
      return {
        id: blockId(recipe.type, recipe.label),
        type: recipe.type,
        props: {
          title: recipe.label,
          body: e.phrases[0] || recipe.description || brief.subheadline,
        },
      };
  }
}

function buildPageFromRecipes(
  slug: string,
  recipes: SiteTemplateSectionRecipe[],
  brief: ContentBrief,
  prefs: SitePreferences,
  template: SiteTemplateDefinition,
  images: string[]
): GeneratedSitePage {
  return {
    slug,
    title: titleCase(slug),
    blocks: recipes.map((recipe, index) =>
      fillBlock(recipe, brief, prefs, template, images, index)
    ),
  };
}

async function heuristicGenerate(
  plan: SitePlan,
  preferences: SitePreferences
): Promise<GeneratedSite> {
  blockSeq = 0;
  const template = requireTemplate(preferences.templateId);
  const brief = buildContentBrief(preferences);
  const theme = resolveSiteTheme(preferences);
  const images = await fetchCategoryImages(template.categoryId, brief.imageKeywords, 12);

  const pageSlugs = preferences.pages.length
    ? preferences.pages
    : (Object.keys(template.sectionsByPage) as typeof preferences.pages);

  const pages = pageSlugs.map((slug) => {
    const recipes =
      template.sectionsByPage[slug] ??
      plan.pages.find((p) => p.slug === slug)?.sections.map((s) => ({
        type: s.type as SiteBlockType,
        label: s.label,
        description: s.description,
      })) ??
      [{ type: "rich_text" as const, label: titleCase(slug), description: brief.subheadline }];

    return buildPageFromRecipes(slug, recipes, brief, preferences, template, images);
  });

  return {
    siteName: preferences.businessName,
    slug: plan.slug,
    tagline: brief.tagline,
    footerNote: `© ${new Date().getFullYear()} ${preferences.businessName}. Built with Aarvanta Build OS · ${template.inspiredBy}`,
    theme: {
      ...plan.theme,
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      backgroundColor: theme.backgroundColor,
      fontFamily: theme.fontFamily,
      headingFont: theme.headingFont,
      googleFontsUrl: theme.googleFontsUrl,
    },
    navigation: pages.map((p) => ({ label: p.title, slug: p.slug })),
    pages,
    categoryId: preferences.categoryId,
    templateId: preferences.templateId,
    generatedAt: crmNow(),
  };
}

export async function generateSiteFromPlan(
  plan: SitePlan,
  preferences: SitePreferences
): Promise<{ site: GeneratedSite; usedAi: boolean }> {
  const sampleSite = await heuristicGenerate(plan, preferences);

  if (!isAiConfigured()) {
    return { site: sampleSite, usedAi: false };
  }

  try {
    const brief = buildContentBrief(preferences);
    const template = requireTemplate(preferences.templateId);
    const aiSite = await completeJson<GeneratedSite>({
      system: `You are Build OS, an expert website copywriter.
Return JSON for a complete multi-page marketing website.
CRITICAL RULES:
1. Preserve every page slug and every block id/type/order from the skeleton exactly.
2. Rewrite ALL text props so they are SPECIFIC to the user's businessIdea — never reuse generic SaaS filler like "Clarity first" or "Proven process".
3. Product names, services, FAQs, testimonials, and headlines must mention concrete details from the brief.
4. Keep imageUrl values from the skeleton.
5. Tone: ${preferences.tone}. Category: ${brief.categoryLabel}. Template: ${template.name} (${template.inspiredBy}).`,
      user: JSON.stringify({
        brief: {
          businessName: preferences.businessName,
          businessIdea: preferences.businessIdea,
          targetAudience: preferences.targetAudience,
          customCategoryLabel: preferences.customCategoryLabel,
          keyMessages: preferences.keyMessages,
          customPrompt: preferences.customPrompt,
          categoryId: preferences.categoryId,
          templateId: preferences.templateId,
          entities: brief.entities,
        },
        skeleton: sampleSite,
      }),
      temperature: 0.7,
    });

    const merged = preferSampleFilledSite(sampleSite, {
      ...aiSite,
      categoryId: preferences.categoryId,
      templateId: preferences.templateId,
      theme: sampleSite.theme,
      navigation: sampleSite.navigation,
    });

    return { site: merged, usedAi: true };
  } catch (err) {
    console.warn("[generate-site] AI fill failed, using prompt-derived heuristic", err);
    return { site: sampleSite, usedAi: false };
  }
}
