import { detectIndustryFromText } from "@/lib/ageb/industries";
import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { buildEc2DeployNotes } from "@/lib/site-builder/ec2-deploy-notes";
import { resolveSiteTheme } from "@/lib/site-builder/resolve-theme";
import { sectionsForPage } from "@/lib/site-builder/template-sections";
import { getUiTemplate } from "@/lib/site-builder/templates";
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

function themeFromPreferences(preferences: SitePreferences): SitePlan["theme"] {
  const theme = resolveSiteTheme(preferences);
  return {
    presetId: theme.presetId,
    themeMode: theme.themeMode,
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    backgroundColor: theme.backgroundColor,
    textColor: theme.textColor,
    fontStyle: theme.fontStyle,
    styleNotes: theme.styleNotes,
    templateId: theme.templateId,
    layout: theme.layout,
  };
}

function heuristicPlan(preferences: SitePreferences): SitePlan {
  const { profile } = detectIndustryFromText(preferences.businessIdea);
  const theme = resolveSiteTheme(preferences);
  const slug = slugify(preferences.businessName) || "my-site";
  const template = getUiTemplate(preferences.templateId);

  const orderedPages = ["home", ...preferences.pages.filter((p) => p !== "home")];
  const uniquePages = [...new Set(orderedPages)];

  const pages = uniquePages.map((pageKey) => ({
    slug: pageKey === "home" ? "" : pageKey,
    title: PAGE_LABELS[pageKey] ?? pageKey,
    purpose:
      pageKey === "home"
        ? `Main landing page for ${preferences.businessName}`
        : `${PAGE_LABELS[pageKey]} page for ${template?.name ?? preferences.niche}`,
    sections: sectionsForPage(pageKey, preferences),
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
    theme.themeMode === "custom" ? "custom niche" : theme.presetId.replace(/_/g, " ");

  return {
    siteName: preferences.businessName,
    slug,
    summary: `A ${themeLabel} ${template?.name ?? preferences.templateId} site for ${preferences.niche.replace(/_/g, " ")} — ${preferences.businessName}, targeting ${preferences.targetAudience ?? "your ideal customers"} in ${preferences.countryBase}. Tone: ${preferences.tone}. Industry: ${profile.label}.${screenshotNote}${promptNote}`,
    theme: themeFromPreferences(preferences),
    navigation,
    pages,
    deployment: buildDeploymentPlan(preferences, slug),
  };
}

function enrichAiPlan(plan: SitePlan, preferences: SitePreferences): SitePlan {
  const slug = plan.slug || slugify(preferences.businessName) || "my-site";
  const resolved = themeFromPreferences(preferences);
  // Custom themes + selected template structure are user-authored — lock them.
  const theme = {
    ...resolved,
    ...(preferences.themeMode === "custom"
      ? {}
      : {
          primaryColor: plan.theme?.primaryColor ?? resolved.primaryColor,
          accentColor: plan.theme?.accentColor ?? resolved.accentColor,
          backgroundColor: plan.theme?.backgroundColor ?? resolved.backgroundColor,
          textColor: plan.theme?.textColor ?? resolved.textColor,
          fontStyle: plan.theme?.fontStyle ?? resolved.fontStyle,
          styleNotes: plan.theme?.styleNotes ?? resolved.styleNotes,
        }),
    templateId: resolved.templateId,
    layout: resolved.layout,
    themeMode: resolved.themeMode,
  };

  const orderedPages = ["home", ...preferences.pages.filter((p) => p !== "home")];
  const uniquePages = [...new Set(orderedPages)];
  const pages = uniquePages.map((pageKey) => {
    const fromAi = plan.pages?.find(
      (p) => p.slug === (pageKey === "home" ? "" : pageKey)
    );
    return {
      slug: pageKey === "home" ? "" : pageKey,
      title: fromAi?.title ?? PAGE_LABELS[pageKey] ?? pageKey,
      purpose:
        fromAi?.purpose ??
        (pageKey === "home"
          ? `Main landing page for ${preferences.businessName}`
          : `${PAGE_LABELS[pageKey]} page`),
      sections: sectionsForPage(pageKey, preferences),
    };
  });

  return {
    ...plan,
    slug,
    theme,
    pages,
    navigation: uniquePages.map((pageKey) => ({
      label: PAGE_LABELS[pageKey] ?? pageKey,
      slug: pageKey === "home" ? "" : pageKey,
    })),
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
The user already chose a niche UI template and theme mode. You fill copy direction and page purposes — you do NOT invent a new layout.
Return JSON matching this shape:
{
  "siteName": string,
  "slug": string (lowercase, hyphenated, max 48 chars),
  "summary": string (2-3 sentences mentioning the template and niche),
  "theme": {
    "presetId": one of gold_navy|minimal_light|bold_dark|ocean_cool|sunset_warm,
    "themeMode": "template" | "custom",
    "primaryColor": hex, "accentColor": hex, "backgroundColor": hex, "textColor": hex optional,
    "fontStyle": string, "styleNotes": string,
    "templateId": string, "layout": hero_centered|hero_split|hero_image_bg|services_grid|store_shelf
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
Respect themeMode: if custom, keep the user's customTheme colors; if template, use the selected themePreset.
Keep templateId and layout exactly as provided in preferences.
Domains may be purchased through Aarvanta OR connected as an existing external domain (user updates DNS at their registrar).
If domain.status is "external", deployNotes must tell the user to add the DNS A/CNAME records shown in Build OS.
deployNotes should be short customer-facing steps with no infrastructure jargon.
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
