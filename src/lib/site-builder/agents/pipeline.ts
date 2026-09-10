import { runBrandIntel } from "@/lib/site-builder/agents/brand-intel";
import { runBusinessIntel } from "@/lib/site-builder/agents/business-intel";
import { runCopyAgent } from "@/lib/site-builder/agents/copy-agent";
import {
  alignHomeToSelectedDesign,
  getSelectedDesignOption,
} from "@/lib/site-builder/agents/design-options";
import { runLayoutPlanner } from "@/lib/site-builder/agents/layout-planner";
import { runMediaPlanner } from "@/lib/site-builder/agents/media-planner";
import {
  includedPageSlugs,
  runPagePlanner,
} from "@/lib/site-builder/agents/page-planner";
import { buildEc2DeployNotes } from "@/lib/site-builder/ec2-deploy-notes";
import { applyClientMediaToSite } from "@/lib/site-builder/apply-client-media";
import { applyBrandRefine, applyRefineHeuristics } from "@/lib/site-builder/apply-refine";
import {
  isImageRefine,
  isStructuralRefine,
} from "@/lib/site-builder/refine-history";
import { applySurgicalRefine } from "@/lib/site-builder/surgical-refine";
import { ensureShareToken } from "@/lib/site-builder/share-token";
import { resolveTemplatePrior } from "@/lib/site-builder/templates/resolve-template";
import { themeFromBrand } from "@/lib/site-builder/theme-presets";
import { crmNow } from "@/lib/data/crm-helpers";
import type {
  BrandSystem,
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
  refine?: import("@/types/site-builder").SiteRefineLastResult;
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
  const priorSite = job.generatedSite;
  const refineText = preferences.refineInstructions?.trim();
  const isRefinePass = Boolean(refineText && priorSite);

  const emit = async (
    stage: SiteGenerationStage,
    percent: number,
    message: string,
    partial?: PipelineProgressEvent["partial"]
  ) => {
    await onProgress?.({ stage, percent, message, partial });
  };

  // Fast path: theme / copy refine on an existing site — keep layout + images.
  if (
    isRefinePass &&
    priorSite &&
    refineText &&
    !isStructuralRefine(refineText) &&
    !isImageRefine(refineText)
  ) {
    await emit("brand", 20, "Applying your changes…", { site: priorSite });

    let workingSite: GeneratedSite = priorSite;
    if (preferences.brandLogo?.dataUrl) {
      workingSite = {
        ...workingSite,
        assets: [
          {
            id: "asset_brand_logo",
            kind: "logo",
            url: preferences.brandLogo.dataUrl,
            alt: `${preferences.businessName} logo`,
          },
          ...(workingSite.assets ?? []).filter((a) => a.kind !== "logo"),
        ],
      };
    }

    await emit("content", 55, "Updating copy & theme…", {
      brand: workingSite.brand,
      site: priorSite,
    });

    const refineResult = await applySurgicalRefine(workingSite, refineText, {
      businessName: preferences.businessName,
      idea: preferences.businessIdea,
    });
    usedAi = usedAi || refineResult.usedAi;

    if (!refineResult.changed) {
      await emit("done", 100, refineResult.summary, {
        brand: priorSite.brand,
        site: priorSite,
      });
      const updatedJob: SiteBuildJob = ensureShareToken({
        ...job,
        status: "generated",
        preferences: job.preferences,
        plan: job.plan,
        generatedSite: priorSite,
        refineLastResult: refineResult.outcome,
        progress: progress("done", 100, refineResult.summary),
        usedAi,
        error: undefined,
        updatedAt: crmNow(),
      });
      return {
        job: updatedJob,
        plan:
          job.plan ??
          emptyPlanFromSite(
            priorSite,
            job.preferences,
            priorSite.brand,
            priorSite.theme
          ),
        site: priorSite,
        preferences: job.preferences,
        usedAi,
        refine: refineResult.outcome,
      };
    }

    const brand = refineResult.site.brand
      ? applyBrandRefine(refineResult.site.brand, refineText)
      : preferences.brandSystem;
    const theme = refineResult.site.theme;
    if (brand) {
      preferences = {
        ...preferences,
        brandSystem: brand,
        themePreset: "custom",
        customTheme: {
          primaryColor: brand.primary,
          accentColor: brand.secondary,
          backgroundColor: brand.background,
          fontPackId: brand.fontPackId,
        },
        designOptions: preferences.designOptions?.map((option) =>
          option.id === preferences.selectedDesignOptionId
            ? { ...option, brand }
            : option
        ),
      };
    }

    const site = overlayClientPhotos(
      {
        ...refineResult.site,
        brand: brand ?? refineResult.site.brand,
        theme,
        business: preferences.businessProfile ?? refineResult.site.business,
      },
      job
    );

    await emit("done", 100, refineResult.summary, {
      brand: site.brand,
      site,
    });

    const plan: SitePlan =
      job.plan ?? emptyPlanFromSite(site, preferences, site.brand, site.theme);

    const updatedJob: SiteBuildJob = ensureShareToken({
      ...job,
      status: "generated",
      preferences,
      plan,
      generatedSite: site,
      refineLastResult: refineResult.outcome,
      progress: progress("done", 100, refineResult.summary),
      usedAi,
      error: undefined,
      updatedAt: crmNow(),
    });

    return {
      job: updatedJob,
      plan,
      site,
      preferences,
      usedAi,
      refine: refineResult.outcome,
    };
  }

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

  const selectedDesign = getSelectedDesignOption(preferences);

  await emit("brand", 22, "Applying your chosen design…");
  let brand: BrandSystem;
  if (selectedDesign) {
    brand = selectedDesign.brand;
    usedAi = true;
  } else {
    const brandResult = await runBrandIntel(preferences, businessResult.profile);
    usedAi = usedAi || brandResult.usedAi;
    brand = brandResult.brand;
  }
  // Studio refine can override colours without changing layout.
  brand = applyBrandRefine(brand, preferences.refineInstructions);
  if (preferences.brandLogo?.dataUrl) {
    brand = { ...brand, logoUrl: preferences.brandLogo.dataUrl };
  }
  preferences = {
    ...preferences,
    brandSystem: brand,
    themePreset: "custom",
    customTheme: {
      primaryColor: brand.primary,
      accentColor: brand.secondary,
      backgroundColor: brand.background,
      fontPackId: brand.fontPackId,
    },
    designOptions: preferences.designOptions?.map((option) =>
      selectedDesign && option.id === selectedDesign.id
        ? { ...option, brand }
        : option
    ),
  };
  await emit("brand", 32, `Brand: ${brand.style}`, {
    business: businessResult.profile,
    brand,
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
    brand,
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
    brand,
    pageCandidates: pageResult.candidates,
  });

  await emit("layout", 55, "Composing layouts from your design…");
  const layoutResult = await runLayoutPlanner(
    preferences,
    businessResult.profile,
    brand,
    pageResult.candidates,
    template,
    selectedDesign?.homeSections
  );
  usedAi = usedAi || layoutResult.usedAi;

  const theme = themeFromBrand(brand, "custom");
  const slug = slugify(preferences.businessName) || "site";
  const plan: SitePlan = {
    siteName: preferences.businessName,
    slug,
    summary: `${businessResult.profile.industry} site for ${preferences.businessName}: ${businessResult.profile.primaryGoal}`,
    theme,
    navigation: layoutResult.pages.map((p) => ({
      label: p.slug === "products" ? "Shop" : p.title,
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
    brand,
    pageCandidates: pageResult.candidates,
    version: 1,
  };

  await emit("layout", 62, "Layout ready", {
    business: businessResult.profile,
    brand,
    pageCandidates: pageResult.candidates,
    plan,
  });

  await emit("content", 70, "Writing copy…");
  const copyResult = await runCopyAgent(
    plan,
    preferences,
    businessResult.profile,
    brand
  );
  usedAi = usedAi || copyResult.usedAi;
  await emit("content", 82, "Copy drafted", {
    business: businessResult.profile,
    brand,
    pageCandidates: pageResult.candidates,
    plan,
    site: copyResult.site,
  });

  await emit("media", 88, "Selecting imagery…");
  const preserveImages =
    isRefinePass && Boolean(priorSite) && !isImageRefine(refineText);
  const mediaResult = await runMediaPlanner(
    copyResult.site,
    preferences,
    businessResult.profile,
    brand,
    { preserveImages, previousSite: priorSite }
  );

  let site: GeneratedSite = {
    ...mediaResult.site,
    theme,
    business: businessResult.profile,
    brand,
    categoryId: preferences.categoryId,
    templateId: preferences.templateId,
    version: isRefinePass ? (priorSite?.version ?? 1) + 1 : 1,
    generatedAt: crmNow(),
  };

  if (preferences.brandLogo?.dataUrl) {
    const logoAsset = {
      id: "asset_brand_logo",
      kind: "logo" as const,
      url: preferences.brandLogo.dataUrl,
      alt: `${preferences.businessName} logo`,
    };
    site = {
      ...site,
      brand: { ...brand, logoUrl: preferences.brandLogo.dataUrl },
      assets: [
        logoAsset,
        ...(site.assets ?? []).filter((a) => a.kind !== "logo"),
      ],
    };
  }

  if (selectedDesign) {
    site = alignHomeToSelectedDesign(site, selectedDesign);
  }

  site = overlayClientPhotos(
    {
      ...applyRefineHeuristics(site, preferences.refineInstructions),
      brand,
      theme,
      generatedAt: crmNow(),
      version: site.version ?? 1,
    },
    job
  );

  await emit("done", 100, "Website ready", {
    business: businessResult.profile,
    brand,
    pageCandidates: pageResult.candidates,
    plan,
    site,
  });

  const updatedJob: SiteBuildJob = ensureShareToken({
    ...job,
    status: "generated",
    preferences,
    plan,
    generatedSite: site,
    progress: progress("done", 100, "Website ready"),
    usedAi,
    error: undefined,
    updatedAt: crmNow(),
  });

  return { job: updatedJob, plan, site, preferences, usedAi };
}

function overlayClientPhotos(site: GeneratedSite, job: SiteBuildJob): GeneratedSite {
  const media = job.clientMedia ?? [];
  return media.length ? applyClientMediaToSite(site, media) : site;
}

function emptyPlanFromSite(
  site: GeneratedSite,
  preferences: SitePreferences,
  brand: BrandSystem | undefined,
  theme: GeneratedSite["theme"]
): SitePlan {
  return {
    siteName: site.siteName,
    slug: site.slug,
    summary: site.tagline ?? site.siteName,
    theme,
    navigation: site.navigation,
    pages: site.pages.map((page) => ({
      slug: page.slug,
      title: page.title,
      purpose: page.title,
      sections: page.blocks.map((block) => ({
        type: String(block.type),
        label: String(block.type),
        description: "",
        variantId: block.variantId,
      })),
    })),
    deployment: {
      hostingProvider: "aws_ec2",
      domain: preferences.deployment.domain,
      ec2: preferences.deployment.ec2,
      previewUrl: `https://${site.slug}.sites.aarvanta.cloud`,
      deployNotes: [],
    },
    business: site.business,
    brand,
    version: 1,
  };
}

function inferCategoryFromIndustry(
  industry: string
): SitePreferences["categoryId"] {
  const i = industry.toLowerCase();
  if (/(manufactur|building materials?|construction|industrial)/.test(i)) return "professional";
  if (/(retail|shop|store|ecommerce)/.test(i)) return "ecommerce";
  if (/(software|saas)/.test(i)) return "saas";
  if (/(health|clinic|dental)/.test(i)) return "healthcare";
  if (/(food|restaurant)/.test(i)) return "restaurant";
  if (/(agency|creative)/.test(i)) return "agency";
  if (/(portfolio)/.test(i)) return "portfolio";
  if (/(nonprofit)/.test(i)) return "nonprofit";
  return "professional";
}
