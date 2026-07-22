import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { resolveSiteTheme } from "@/lib/site-builder/theme-presets";
import { buildEc2DeployNotes } from "@/lib/site-builder/ec2-deploy-notes";
import { requireTemplate } from "@/lib/site-builder/templates/resolve-template";
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

function heuristicPlan(preferences: SitePreferences): SitePlan {
  const template = requireTemplate(preferences.templateId);
  const theme = resolveSiteTheme(preferences);
  const slug = slugify(preferences.businessName) || "site";
  const pages = preferences.pages.map((pageKey) => {
    const recipes =
      template.sectionsByPage[pageKey] ??
      (pageKey === "contact"
        ? [{ type: "contact" as const, label: "Contact", description: "Contact form" }]
        : [{ type: "rich_text" as const, label: PAGE_LABELS[pageKey] ?? pageKey, description: "Page content" }]);

    return {
      slug: pageKey,
      title: PAGE_LABELS[pageKey] ?? pageKey,
      purpose: `${PAGE_LABELS[pageKey] ?? pageKey} for ${preferences.businessName}`,
      sections: recipes.map((r) => ({
        type: r.type,
        label: r.label,
        description: r.description,
      })),
    };
  });

  return {
    siteName: preferences.businessName,
    slug,
    summary: `${template.name} (${template.categoryId}) site for ${preferences.businessName}: ${preferences.businessIdea.slice(0, 160)}`,
    theme: {
      presetId: theme.presetId,
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      backgroundColor: theme.backgroundColor,
      fontStyle: theme.fontStyle,
      styleNotes: `${template.name} template · ${preferences.tone} tone`,
      fontFamily: theme.fontFamily,
      headingFont: theme.headingFont,
      googleFontsUrl: theme.googleFontsUrl,
    },
    navigation: pages.map((p) => ({ label: p.title, slug: p.slug })),
    pages,
    deployment: {
      hostingProvider: "aws_ec2",
      domain: preferences.deployment.domain,
      ec2: preferences.deployment.ec2,
      previewUrl: `https://${slug}.sites.aarvanta.cloud`,
      deployNotes: buildEc2DeployNotes(preferences.deployment),
    },
  };
}

export async function planSiteFromPreferences(
  preferences: SitePreferences
): Promise<{ plan: SitePlan; usedAi: boolean }> {
  const base = heuristicPlan(preferences);

  if (!isAiConfigured()) {
    return { plan: base, usedAi: false };
  }

  try {
    const template = requireTemplate(preferences.templateId);
    const ai = await completeJson<{
      summary?: string;
      styleNotes?: string;
      pages?: Array<{
        slug: string;
        purpose?: string;
        sections?: Array<{ type: string; label: string; description: string }>;
      }>;
    }>({
      system: `You are Build OS, an expert website planner.
Return JSON refining the plan summary and section descriptions for a ${template.categoryId} site using template "${template.name}".
Keep the same pages and section types/order — only improve purpose and description copy. Do not invent new section types.`,
      user: JSON.stringify({
        preferences,
        template: { id: template.id, name: template.name, categoryId: template.categoryId },
        plan: base,
      }),
      temperature: 0.4,
    });

    const pages = base.pages.map((page) => {
      const aiPage = ai.pages?.find((p) => p.slug === page.slug);
      if (!aiPage) return page;
      return {
        ...page,
        purpose: aiPage.purpose || page.purpose,
        sections: page.sections.map((section, idx) => {
          const aiSec = aiPage.sections?.[idx];
          if (!aiSec || aiSec.type !== section.type) return section;
          return {
            ...section,
            label: aiSec.label || section.label,
            description: aiSec.description || section.description,
          };
        }),
      };
    });

    return {
      plan: {
        ...base,
        summary: ai.summary || base.summary,
        theme: {
          ...base.theme,
          styleNotes: ai.styleNotes || base.theme.styleNotes,
        },
        pages,
      },
      usedAi: true,
    };
  } catch (err) {
    console.warn("[plan-site] AI plan refine failed, using template plan", err);
    return { plan: base, usedAi: false };
  }
}
