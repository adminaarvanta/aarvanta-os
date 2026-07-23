import { isAiConfigured } from "@/lib/ai/config";
import { completeJson } from "@/lib/ai/provider";
import { businessProfileSchema } from "@/lib/site-builder/schemas";
import type { BusinessProfile, SitePreferences } from "@/types/site-builder";

function heuristicBusiness(preferences: SitePreferences): BusinessProfile {
  const idea = preferences.businessIdea.toLowerCase();
  const audience =
    preferences.targetAudience
      ?.split(/[,;/]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4) ?? [];

  let industry = "Business Services";
  let subcategory = "General";
  let primaryGoal = "Generate Leads";
  let pricing: BusinessProfile["pricing"] = "Medium";

  if (/(toy|shop|store|ecommerce|retail|product)/.test(idea)) {
    industry = "Retail";
    subcategory = /toy/.test(idea) ? "Educational Toys" : "Online Store";
    primaryGoal = "Sell Products";
  } else if (/(saas|software|app|platform)/.test(idea)) {
    industry = "Software";
    subcategory = "SaaS";
    primaryGoal = "Acquire Users";
  } else if (/(clinic|dental|health|care|therapy)/.test(idea)) {
    industry = "Healthcare";
    subcategory = "Clinic";
    primaryGoal = "Book Appointments";
  } else if (/(restaurant|cafe|food|dining)/.test(idea)) {
    industry = "Food & Beverage";
    subcategory = "Restaurant";
    primaryGoal = "Drive Reservations";
  } else if (/(agency|studio|design|marketing)/.test(idea)) {
    industry = "Creative Agency";
    subcategory = "Services";
    primaryGoal = "Win Clients";
  } else if (/(portfolio|photographer|architect)/.test(idea)) {
    industry = "Creative Portfolio";
    subcategory = "Personal Brand";
    primaryGoal = "Showcase Work";
  }

  if (/(luxury|premium|haute)/.test(idea)) pricing = "Premium";
  if (/(budget|affordable|cheap)/.test(idea)) pricing = "Budget";

  const toneMap: Record<string, string> = {
    professional: "Professional",
    friendly: "Friendly",
    bold: "Bold",
    luxury: "Luxury",
  };

  return {
    industry,
    subcategory,
    audience:
      audience.length > 0
        ? audience
        : ["Customers", "Local community", "Online visitors"],
    location: preferences.countryBase || "UK",
    pricing,
    brandTone: toneMap[preferences.tone] ?? "Professional",
    primaryGoal,
    secondaryGoals: ["Brand Awareness", "Trust"],
  };
}

export async function runBusinessIntel(
  preferences: SitePreferences
): Promise<{ profile: BusinessProfile; usedAi: boolean }> {
  if (preferences.businessProfile) {
    return { profile: preferences.businessProfile, usedAi: false };
  }

  const fallback = heuristicBusiness(preferences);
  if (!isAiConfigured()) {
    return { profile: fallback, usedAi: false };
  }

  try {
    const raw = await completeJson<BusinessProfile>({
      system: `You are a business intelligence analyst for a website builder.
Return JSON matching: industry, subcategory, audience (array), location, pricing (Budget|Medium|Premium|Luxury), brandTone, primaryGoal, secondaryGoals (array).
Infer from the user's description — be specific, not generic.`,
      user: JSON.stringify({
        businessName: preferences.businessName,
        businessIdea: preferences.businessIdea,
        targetAudience: preferences.targetAudience,
        countryBase: preferences.countryBase,
        categoryHint: preferences.categoryId,
        keyMessages: preferences.keyMessages,
      }),
      temperature: 0.3,
    });
    const parsed = businessProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return { profile: fallback, usedAi: false };
    }
    return { profile: parsed.data, usedAi: true };
  } catch {
    return { profile: fallback, usedAi: false };
  }
}
