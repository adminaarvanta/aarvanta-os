import { runBrandIntel } from "@/lib/site-builder/agents/brand-intel";
import { runBusinessIntel } from "@/lib/site-builder/agents/business-intel";
import { runCopyAgent } from "@/lib/site-builder/agents/copy-agent";
import { runLayoutPlanner } from "@/lib/site-builder/agents/layout-planner";
import { runMediaPlanner } from "@/lib/site-builder/agents/media-planner";
import {
  includedPageSlugs,
  runPagePlanner,
} from "@/lib/site-builder/agents/page-planner";
import { buildEc2DeployNotes } from "@/lib/site-builder/ec2-deploy-notes";
import { resolveTemplatePrior } from "@/lib/site-builder/templates/resolve-template";
import { themeFromBrand } from "@/lib/site-builder/theme-presets";
import { crmNow } from "@/lib/data/crm-helpers";
import type {
  GeneratedSite,
  SiteBuildJob,
  SiteGenerationProgress,
  SiteGenerationStage,
  SitePlan,
  SitePreferences,
} from "@/types/site-builder";

export type PipelineProgressEvent = {
  stage: SiteGenerationStage;
  percent: number;
  message: string;
  partial?: {
    business?: SitePreferences["businessProfile"];
    brand?: SitePreferences["brandSystem"];
    pageCandidates?: SitePreferences["pageCandidates"];
    plan?: SitePlan;
    site?: GeneratedSite;
  };
};

export type PipelineResult = {
  job: SiteBuildJob;
  plan: SitePlan;
  site: GeneratedSite;
  preferences: SitePreferences;
  usedAi: boolean;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function progress(
  stage: SiteGenerationStage,
  percent: number,
  message: string
): SiteGenerationProgress {
  return { stage, percent, message, updatedAt: crmNow() };
}

export async function runGenerationPipeline(
  job: SiteBuildJob,
  onProgress?: (event: PipelineProgressEvent) => void | Promise<void>
): Promise<PipelineResult> {
  let preferences = { ...job.preferences };
  let usedAi = false;

  const emit = async (
    stage: SiteGenerationStage,
    percent: number,
    message: string,
    partial?: PipelineProgressEvent["partial"]
  ) => {
    await onProgress?.({ stage, percent, message, partial });
  };

  await emit("business", 8, "Understanding your business…");
  const businessResult = await runBusinessIntel(preferences);
  usedAi = usedAi || businessResult.usedAi;
  preferences = {
    ...preferences,
    businessProfile: businessResult.profile,
    categoryId:
      preferences.categoryId ??
      inferCategoryFromIndustry(businessResult.profile.industry),
  };
  await emit("business", 16, `Identified: ${businessResult.profile.industry}`, {
    business: businessResult.profile,
  });

  await emit("brand", 22, "Designing your brand system…");
  const brandResult = await runBrandIntel(preferences, businessResult.profile);
  usedAi = usedAi || brandResult.usedAi;
  preferences = {
    ...preferences,
    brandSystem: brandResult.brand,
    themePreset: "custom",
    customTheme: {
      primaryColor: brandResult.brand.primary,
      accentColor: brandResult.brand.secondary,
      backgroundColor: brandResult.brand.background,
      fontPackId: brandResult.brand.fontPackId,
    },
  };
  await emit("brand", 32, `Brand: ${brandResult.brand.style}`, {
    business: businessResult.profile,
    brand: brandResult.brand,
  });

  const template = resolveTemplatePrior(
    preferences.templateId,
    preferences.categoryId
  );
  preferences = {
    ...preferences,
    templateId: preferences.templateId ?? template.id,
    categoryId: preferences.categoryId ?? template.categoryId,
  };

  await emit("pages", 40, "Planning pages…");
  const pageResult = await runPagePlanner(
    preferences,
    businessResult.profile,
    brandResult.brand,
    template
  );
  usedAi = usedAi || pageResult.usedAi;
  const pages = includedPageSlugs(pageResult.candidates);
  preferences = {
    ...preferences,
    pageCandidates: pageResult.candidates,
    pages: pages.length ? pages : ["home", "about", "contact"],
  };
  await emit("pages", 48, `${pages.length} pages selected`, {
    business: businessResult.profile,
    brand: brandResult.brand,
    pageCandidates: pageResult.candidates,
  });

  await emit("layout", 55, "Composing layouts…");
  const layoutResult = await runLayoutPlanner(
    preferences,
    businessResult.profile,
    brandResult.brand,
    pageResult.candidates,
    template
  );
  usedAi = usedAi || layoutResult.usedAi;

  const theme = themeFromBrand(brandResult.brand, "custom");
  const slug = slugify(preferences.businessName) || "site";
  const plan: SitePlan = {
    siteName: preferences.businessName,
    slug,
    summary: `${businessResult.profile.industry} site for ${preferences.businessName}: ${businessResult.profile.primaryGoal}`,
    theme,
    navigation: layoutResult.pages.map((p) => ({
      label: p.title,
      slug: p.slug,
    })),
    pages: layoutResult.pages,
    deployment: {
      hostingProvider: "aws_ec2",
      domain: preferences.deployment.domain,
      ec2: preferences.deployment.ec2,
      previewUrl: `https://${slug}.sites.aarvanta.cloud`,
      deployNotes: buildEc2DeployNotes(preferences.deployment),
    },
    business: businessResult.profile,
    brand: brandResult.brand,
    pageCandidates: pageResult.candidates,
    version: 1,
  };

  await emit("layout", 62, "Layout ready", {
    business: businessResult.profile,
    brand: brandResult.brand,
    pageCandidates: pageResult.candidates,
    plan,
  });

  await emit("content", 70, "Writing copy…");
  const copyResult = await runCopyAgent(
    plan,
    preferences,
    businessResult.profile,
    brandResult.brand
  );
  usedAi = usedAi || copyResult.usedAi;
  await emit("content", 82, "Copy drafted", {
    business: businessResult.profile,
    brand: brandResult.brand,
    pageCandidates: pageResult.candidates,
    plan,
    site: copyResult.site,
  });

  await emit("media", 88, "Selecting imagery…");
  const mediaResult = await runMediaPlanner(
    copyResult.site,
    preferences,
    businessResult.profile,
    brandResult.brand
  );

  const site: GeneratedSite = {
    ...mediaResult.site,
    theme,
    business: businessResult.profile,
    brand: brandResult.brand,
    categoryId: preferences.categoryId,
    templateId: preferences.templateId,
    version: 1,
    generatedAt: crmNow(),
  };

  await emit("done", 100, "Website ready", {
    business: businessResult.profile,
    brand: brandResult.brand,
    pageCandidates: pageResult.candidates,
    plan,
    site,
  });

  const updatedJob: SiteBuildJob = {
    ...job,
    status: "generated",
    preferences,
    plan,
    generatedSite: site,
    progress: progress("done", 100, "Website ready"),
    usedAi,
    error: undefined,
    updatedAt: crmNow(),
  };

  return { job: updatedJob, plan, site, preferences, usedAi };
}

function inferCategoryFromIndustry(
  industry: string
): SitePreferences["categoryId"] {
  const i = industry.toLowerCase();
  if (/(retail|shop|store|ecommerce)/.test(i)) return "ecommerce";
  if (/(software|saas)/.test(i)) return "saas";
  if (/(health|clinic|dental)/.test(i)) return "healthcare";
  if (/(food|restaurant)/.test(i)) return "restaurant";
  if (/(agency|creative)/.test(i)) return "agency";
  if (/(portfolio)/.test(i)) return "portfolio";
  if (/(nonprofit)/.test(i)) return "nonprofit";
  return "professional";
}
