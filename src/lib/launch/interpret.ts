import { buddiesForIndustry } from "@/lib/ageb/buddies";
import { detectIndustryFromText, getIndustryProfile } from "@/lib/ageb/industries";
import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import type {
  LaunchBuddyAssignment,
  LaunchBusinessModel,
  LaunchIndustryDetection,
  LaunchIntentInput,
} from "@/types/launch";

type AiInterpretation = {
  brandName: string;
  primaryIndustry: string;
  secondaryIndustries: string[];
  hybridModel: string;
  industryProfileId: string;
  revenueStreams: string[];
  pricingModel: string;
  customerJourney: string[];
  operationalFlow: string[];
  aiInsight: string;
};

function heuristicInterpret(intent: LaunchIntentInput): AiInterpretation {
  const { profile, confidence } = detectIndustryFromText(intent.businessIdea);
  const idea = intent.businessIdea.trim();
  const brandName = idea
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return {
    brandName: brandName || "New Venture",
    primaryIndustry: profile.primarySector,
    secondaryIndustries: profile.secondarySectors,
    hybridModel: `${profile.label} — ${intent.scale} scale`,
    industryProfileId: profile.id,
    revenueStreams:
      intent.channels.includes("subscription")
        ? ["Direct sales", "Subscription boxes", "Wholesale"]
        : ["Direct online sales", "Repeat customers", "Referrals"],
    pricingModel:
      intent.channels.includes("subscription")
        ? "Subscription + one-time purchases"
        : "Value-based pricing with tiered bundles",
    customerJourney: [
      "Discover via search or social",
      "Browse catalog / services",
      "Purchase or book consultation",
      "Onboarding and support",
      "Retention and upsell",
    ],
    operationalFlow: [
      "Lead capture → CRM qualification",
      "Order / project fulfillment",
      "Invoicing and payment",
      "Customer success follow-up",
    ],
    aiInsight: `Based on your ${profile.label.toLowerCase()} idea in ${intent.countryBase}, focus on ${intent.channels.join(" + ")} channels with ${intent.scale}-stage operations. Detection confidence: ${Math.round(confidence * 100)}%.`,
  };
}

export async function interpretLaunchIntent(intent: LaunchIntentInput): Promise<{
  brandName: string;
  industry: LaunchIndustryDetection;
  businessModel: LaunchBusinessModel;
  buddies: LaunchBuddyAssignment[];
  usedAi: boolean;
}> {
  let data: AiInterpretation;
  let usedAi = false;

  if (isAiConfigured()) {
    try {
      data = await completeJson<AiInterpretation>({
        system: `You are Launch OS — the Aarvanta OS business generation engine (AGEB Volume 11).
Given a business idea, return JSON with: brandName, primaryIndustry, secondaryIndustries (array), hybridModel, industryProfileId (one of: retail_ecommerce, professional_services, restaurant_hospitality, healthcare, manufacturing, construction), revenueStreams (array), pricingModel, customerJourney (array), operationalFlow (array), aiInsight (one strategic sentence).`,
        user: JSON.stringify(intent),
      });
      usedAi = true;
    } catch {
      data = heuristicInterpret(intent);
    }
  } else {
    data = heuristicInterpret(intent);
  }

  const detected = detectIndustryFromText(intent.businessIdea);
  const industryProfile =
    getIndustryProfile(data.industryProfileId) ?? detected.profile;

  const industry: LaunchIndustryDetection = {
    primaryIndustry: data.primaryIndustry,
    secondaryIndustries: data.secondaryIndustries,
    hybridModel: data.hybridModel,
    industryProfileId: industryProfile.id,
    confidence: detected.confidence,
  };

  const businessModel: LaunchBusinessModel = {
    revenueStreams: data.revenueStreams,
    pricingModel: data.pricingModel,
    customerJourney: data.customerJourney,
    operationalFlow: data.operationalFlow,
    aiInsight: data.aiInsight,
  };

  const buddyDefs = buddiesForIndustry(industry.industryProfileId);
  const buddies: LaunchBuddyAssignment[] = buddyDefs.map((b) => ({
    buddyId: b.id,
    name: b.name,
    reason: `Assigned for ${industry.primaryIndustry} operations — ${b.description}`,
  }));

  return {
    brandName: data.brandName,
    industry,
    businessModel,
    buddies,
    usedAi,
  };
}
