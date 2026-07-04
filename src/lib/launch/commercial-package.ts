import {
  buildStoreSlug,
  buildTagline,
  generateLogoDataUrl,
  pickBrandColors,
  suggestDomains,
} from "@/lib/launch/brand";
import { generateLaunchLegalDocs } from "@/lib/launch/legal-docs";
import { getIndustryProfile } from "@/lib/ageb/industries";
import type { TenantScope } from "@/types/communication";
import type {
  LaunchCommercialPackage,
  LaunchIntentInput,
  LaunchProvisioningPlan,
} from "@/types/launch";

export function buildCommercialPackage(input: {
  brandName: string;
  intent: LaunchIntentInput;
  industryProfileId: string;
  workspaceId: string;
}): LaunchCommercialPackage {
  const profile = getIndustryProfile(input.industryProfileId);
  const colors = pickBrandColors(input.industryProfileId);
  const slug = buildStoreSlug(input.brandName, input.workspaceId);
  const logoDataUrl = generateLogoDataUrl(input.brandName, colors.primary);
  const domainSuggestions = suggestDomains(input.brandName, input.intent.countryBase);
  const legalDocs = generateLaunchLegalDocs({
    brandName: input.brandName,
    countryBase: input.intent.countryBase,
    businessIdea: input.intent.businessIdea,
  });

  return {
    branding: {
      slug,
      logoDataUrl,
      primaryColor: colors.primary,
      accentColor: colors.accent,
      tagline: buildTagline(
        input.intent.businessIdea,
        profile?.label ?? "Your business"
      ),
    },
    domainSuggestions,
    selectedDomain: domainSuggestions.find((d) => d.available)?.domain,
    legalDocs,
    storeSlug: slug,
  };
}

export function buildProvisioningPlan(
  industryProfileId: string,
  countryBase: string
): LaunchProvisioningPlan {
  const profile = getIndustryProfile(industryProfileId);
  return {
    workflows: profile?.defaultWorkflows ?? ["lead_nurturing", "customer_onboarding"],
    crmPipeline: true,
    financeBudget: true,
    financeChartOfAccounts: countryBase.toUpperCase() === "UK" || countryBase.toUpperCase() === "GB",
    starterInvoice: true,
    legalDocs: true,
    storePage: true,
    hrHandbook: true,
    projectKickoff: true,
    workspaceIndustry: industryProfileId,
    workspaceCountry: countryBase,
  };
}

export function attachCommercialToSession<
  T extends { commercial?: LaunchCommercialPackage; provisioning?: LaunchProvisioningPlan },
>(session: T, scope: TenantScope, brandName: string, intent: LaunchIntentInput, industryProfileId: string): T {
  const commercial = buildCommercialPackage({
    brandName,
    intent,
    industryProfileId,
    workspaceId: scope.workspaceId,
  });
  const provisioning = buildProvisioningPlan(industryProfileId, intent.countryBase);
  return { ...session, commercial, provisioning };
}
