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

function fillBlock(
  recipe: SiteTemplateSectionRecipe,
  brief: ContentBrief,
  prefs: SitePreferences,
  images: string[],
  index: number
): SiteBlock {
  const name = brief.businessName;
  const img = (i: number) => imageAt(images, index + i, `${brief.templateId}-${i}`);

  switch (recipe.type as SiteBlockType) {
    case "hero":
      return {
        id: blockId("hero", recipe.label),
        type: "hero",
        props: {
          layout: index % 2 === 0 ? "fullBleed" : "split",
          eyebrow: brief.categoryLabel,
          headline: brief.headline,
          subheadline: brief.subheadline,
          cta: brief.ctaLabel,
          secondaryCta: brief.ctaSecondary,
          ctaTarget: prefs.ctaGoal === "book_call" ? "booking" : "contact",
          imageUrl: img(0),
        },
      };
    case "logo_cloud":
      return {
        id: blockId("logo_cloud", recipe.label),
        type: "logo_cloud",
        props: {
          title: "Trusted by teams who care about craft",
          items: ["Northstar", "Field & Co", "Lumen", "Harbor", "Orbit", "Kindred"].map(
            (label) => ({ label })
          ),
        },
      };
    case "features":
      return {
        id: blockId("features", recipe.label),
        type: "features",
        props: {
          title: "Why people choose us",
          subtitle: `Built around ${brief.audience}`,
          items: [
            {
              title: "Clarity first",
              description: `Every touchpoint for ${name} is designed to answer the next question.`,
              icon: "sparkles",
            },
            {
              title: "Proven process",
              description: "A repeatable journey from first visit to confident decision.",
              icon: "compass",
            },
            {
              title: "Human support",
              description: "Real people, clear timelines, no black-box handoffs.",
              icon: "users",
            },
            {
              title: "Measurable outcomes",
              description: "We track the moments that matter — not vanity metrics.",
              icon: "chart",
            },
          ],
        },
      };
    case "services_grid":
      return {
        id: blockId("services_grid", recipe.label),
        type: "services_grid",
        props: {
          title: "What we offer",
          items: [
            { title: "Core engagement", description: `Flagship work for ${name} clients.`, icon: "star" },
            { title: "Advisory", description: "Strategic guidance tailored to your stage.", icon: "message" },
            { title: "Retainer", description: "Ongoing partnership with predictable cadence.", icon: "refresh" },
            { title: "Workshops", description: "Focused sessions to unblock teams quickly.", icon: "zap" },
          ],
        },
      };
    case "products":
      return {
        id: blockId("products", recipe.label),
        type: "products",
        props: {
          title: "Featured products",
          products: [1, 2, 3, 4].map((n) => ({
            name: `${name} Collection ${n}`,
            price: `£${(n * 18 + 9).toFixed(2)}`,
            description: `A standout pick from the ${brief.templateName} lineup.`,
            imageUrl: img(n),
          })),
        },
      };
    case "portfolio_grid":
      return {
        id: blockId("portfolio_grid", recipe.label),
        type: "portfolio_grid",
        props: {
          title: "Selected work",
          items: [1, 2, 3, 4, 5, 6].map((n) => ({
            title: `Project ${String.fromCharCode(64 + n)}`,
            category: brief.categoryLabel,
            imageUrl: img(n),
            summary: `A ${prefs.tone} case study for ${brief.audience}.`,
          })),
        },
      };
    case "testimonials":
      return {
        id: blockId("testimonials", recipe.label),
        type: "testimonials",
        props: {
          title: "What clients say",
          quotes: [
            {
              quote: `${name} changed how we show up — clearer, faster, more confident.`,
              name: "Amelia Hart",
              role: "Founder",
              avatarUrl: dicebearAvatar("amelia-hart"),
            },
            {
              quote: "The experience feels premium without being precious. Exactly what we needed.",
              name: "Jordan Lee",
              role: "Operations lead",
              avatarUrl: dicebearAvatar("jordan-lee"),
            },
            {
              quote: "From first click to follow-up, everything felt intentional.",
              name: "Priya Shah",
              role: "Marketing director",
              avatarUrl: dicebearAvatar("priya-shah"),
            },
          ],
        },
      };
    case "stats":
      return {
        id: blockId("stats", recipe.label),
        type: "stats",
        props: {
          title: "By the numbers",
          items: [
            { value: "120+", label: "Projects delivered" },
            { value: "4.9★", label: "Average rating" },
            { value: "48h", label: "Typical response" },
            { value: "12", label: "Markets served" },
          ],
        },
      };
    case "pricing_table":
      return {
        id: blockId("pricing_table", recipe.label),
        type: "pricing_table",
        props: {
          title: "Simple pricing",
          tiers: [
            {
              name: "Starter",
              price: "£29",
              period: "/mo",
              description: "For getting started",
              features: ["Core features", "Email support", "1 workspace"],
              cta: brief.ctaLabel,
              highlighted: false,
            },
            {
              name: "Growth",
              price: "£79",
              period: "/mo",
              description: "For scaling teams",
              features: ["Everything in Starter", "Priority support", "Automations"],
              cta: brief.ctaLabel,
              highlighted: true,
            },
            {
              name: "Scale",
              price: "£199",
              period: "/mo",
              description: "For complex orgs",
              features: ["Everything in Growth", "SSO", "Dedicated success"],
              cta: "Talk to sales",
              highlighted: false,
            },
          ],
        },
      };
    case "faq_accordion":
      return {
        id: blockId("faq_accordion", recipe.label),
        type: "faq_accordion",
        props: {
          title: "Frequently asked questions",
          items: [
            {
              question: `How does ${name} get started with new clients?`,
              answer: "A short discovery call, a clear proposal, then a kickoff with milestones.",
            },
            {
              question: "What does pricing include?",
              answer: "Scope is transparent up front — no surprise change orders for agreed deliverables.",
            },
            {
              question: "Can you work remotely / on-site?",
              answer: `We support ${prefs.countryBase}-based clients with flexible engagement models.`,
            },
            {
              question: "How quickly can we begin?",
              answer: "Most engagements start within 1–2 weeks depending on capacity.",
            },
          ],
        },
      };
    case "timeline":
      return {
        id: blockId("timeline", recipe.label),
        type: "timeline",
        props: {
          title: "How it works",
          items: [
            { title: "Discover", description: "Align on goals, constraints, and success metrics." },
            { title: "Design", description: "Shape the experience and validate with stakeholders." },
            { title: "Deliver", description: "Ship in stages with visible progress every week." },
            { title: "Grow", description: "Measure outcomes and iterate with confidence." },
          ],
        },
      };
    case "team_grid":
      return {
        id: blockId("team_grid", recipe.label),
        type: "team_grid",
        props: {
          title: "People behind the work",
          members: ["Alex Morgan", "Sam Rivera", "Casey Nguyen", "Riley Brooks"].map(
            (memberName, i) => ({
              name: memberName,
              role: i === 0 ? "Founder" : i === 1 ? "Lead" : "Specialist",
              bio: `Helping ${brief.audience} get better outcomes.`,
              avatarUrl: dicebearAvatar(memberName),
            })
          ),
        },
      };
    case "comparison":
      return {
        id: blockId("comparison", recipe.label),
        type: "comparison",
        props: {
          title: "A clearer way forward",
          columns: [
            {
              name: "Status quo",
              items: ["Scattered tools", "Slow handoffs", "Unclear ownership"],
            },
            {
              name: name,
              highlighted: true,
              items: ["One coherent journey", "Faster decisions", "Accountable delivery"],
            },
          ],
        },
      };
    case "cta_banner":
      return {
        id: blockId("cta_banner", recipe.label),
        type: "cta_banner",
        props: {
          title: `Ready to work with ${name}?`,
          body: brief.subheadline,
          cta: brief.ctaLabel,
          ctaTarget: prefs.ctaGoal === "book_call" ? "booking" : "contact",
        },
      };
    case "gallery":
      return {
        id: blockId("gallery", recipe.label),
        type: "gallery",
        props: {
          title: "Inside the experience",
          items: [0, 1, 2, 3, 4, 5].map((i) => ({
            imageUrl: img(i + 2),
            caption: `${name} moment ${i + 1}`,
          })),
        },
      };
    case "menu_list":
      return {
        id: blockId("menu_list", recipe.label),
        type: "menu_list",
        props: {
          title: "Menu highlights",
          sections: [
            {
              name: "Signatures",
              items: [
                { name: "House favourite", description: "Seasonal ingredients, careful technique.", price: "£14" },
                { name: "Chef’s pick", description: "A plate built for sharing.", price: "£18" },
                { name: "Weekend special", description: "Limited run — ask your host.", price: "£22" },
              ],
            },
            {
              name: "Drinks",
              items: [
                { name: "House pour", description: "Local producers, thoughtful pairings.", price: "£8" },
                { name: "Zero-proof", description: "Complex, botanical, celebratory.", price: "£7" },
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
          title: "Book your next step",
          description: `Pick a time that works — the ${name} team will confirm shortly.`,
          cta: brief.ctaLabel,
          slots: ["Tue 10:00", "Tue 14:30", "Wed 11:00", "Thu 16:00"],
        },
      };
    case "feature_tabs":
      return {
        id: blockId("feature_tabs", recipe.label),
        type: "feature_tabs",
        props: {
          title: "Explore the platform",
          tabs: [
            {
              label: "Overview",
              title: "See the whole journey",
              body: `${name} connects discovery to delivery without losing the plot.`,
              imageUrl: img(1),
            },
            {
              label: "Workflows",
              title: "Automate the busywork",
              body: "Reusable playbooks keep quality high as you scale.",
              imageUrl: img(2),
            },
            {
              label: "Insights",
              title: "Know what moved the needle",
              body: "Dashboards that explain outcomes in plain language.",
              imageUrl: img(3),
            },
          ],
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
            "Customer-obsessed delivery",
            "Transparent communication",
            `Rooted in ${prefs.countryBase}`,
          ],
        },
      };
    case "newsletter":
      return {
        id: blockId("newsletter", recipe.label),
        type: "newsletter",
        props: {
          title: "Stay in the loop",
          description: "Practical updates — no spam, unsubscribe anytime.",
          cta: "Subscribe",
          placeholder: "you@company.com",
        },
      };
    case "blog_list":
      return {
        id: blockId("blog_list", recipe.label),
        type: "blog_list",
        props: {
          title: "Latest insights",
          posts: [1, 2, 3].map((n) => ({
            title: `${name} notes #${n}`,
            excerpt: `Perspectives for ${brief.audience}.`,
            date: `2026-0${n}-12`,
            imageUrl: img(n),
          })),
        },
      };
    case "contact":
      return {
        id: blockId("contact", recipe.label),
        type: "contact",
        props: {
          id: "contact",
          title: "Let’s talk",
          description: `Tell us about your goals — ${name} will respond within two business days.`,
          showForm: prefs.features.includes("contact_form"),
          email: `hello@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.co`,
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
          body: recipe.description || brief.subheadline,
        },
      };
  }
}

function buildPageFromRecipes(
  slug: string,
  recipes: SiteTemplateSectionRecipe[],
  brief: ContentBrief,
  prefs: SitePreferences,
  images: string[]
): GeneratedSitePage {
  return {
    slug,
    title: titleCase(slug),
    blocks: recipes.map((recipe, index) => fillBlock(recipe, brief, prefs, images, index)),
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
  const images = await fetchCategoryImages(
    template.categoryId,
    brief.imageKeywords,
    12
  );

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

    return buildPageFromRecipes(slug, recipes, brief, preferences, images);
  });

  return {
    siteName: preferences.businessName,
    slug: plan.slug,
    tagline: brief.tagline,
    footerNote: `© ${new Date().getFullYear()} ${preferences.businessName}. Built with Aarvanta Build OS.`,
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
      system: `You are Build OS, an expert website copywriter and IA designer.
Return JSON for a complete multi-page marketing website.
CRITICAL: Preserve every page slug and every block type/id/order from the skeleton.
Only rewrite props copy (headlines, descriptions, quotes, product names) to match the brief.
Keep imageUrl values from the skeleton. Tone: ${preferences.tone}. Category: ${template.categoryId}. Template: ${template.name}.`,
      user: JSON.stringify({
        preferences: {
          businessName: preferences.businessName,
          businessIdea: preferences.businessIdea,
          targetAudience: preferences.targetAudience,
          keyMessages: preferences.keyMessages,
          customPrompt: preferences.customPrompt,
          categoryId: preferences.categoryId,
          templateId: preferences.templateId,
        },
        brief,
        skeleton: sampleSite,
      }),
      temperature: 0.55,
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
    console.warn("[generate-site] AI fill failed, using template heuristic", err);
    return { site: sampleSite, usedAi: false };
  }
}
