import { crmNow } from "@/lib/data/crm-helpers";
import type { LaunchIntentInput } from "@/types/launch";
import type { StoreProduct } from "@/types/store-page";

function defaultProducts(idea: string, currency: string): StoreProduct[] {
  const lower = idea.toLowerCase();
  if (lower.includes("candle")) {
    return [
      {
        id: "prod_1",
        name: "Signature Candle",
        description: "Hand-poured soy candle — 200g, 40-hour burn",
        price: 24.99,
        currency,
        imageEmoji: "🕯️",
      },
      {
        id: "prod_2",
        name: "Gift Box Set",
        description: "Three mini candles in a gift-ready box",
        price: 49.99,
        currency,
        imageEmoji: "🎁",
      },
      {
        id: "prod_3",
        name: "Subscription Box",
        description: "Monthly candle delivery — cancel anytime",
        price: 29.99,
        currency,
        imageEmoji: "📦",
      },
    ];
  }

  return [
    {
      id: "prod_1",
      name: "Starter Product",
      description: "Our flagship offering — crafted with care",
      price: 29.99,
      currency,
      imageEmoji: "✨",
    },
    {
      id: "prod_2",
      name: "Premium Bundle",
      description: "Best value bundle for new customers",
      price: 59.99,
      currency,
      imageEmoji: "🎁",
    },
    {
      id: "prod_3",
      name: "Monthly Subscription",
      description: "Recurring delivery — flexible cancellation",
      price: 24.99,
      currency,
      imageEmoji: "📦",
    },
  ];
}

export function buildStorePageContent(input: {
  brandName: string;
  tagline: string;
  intent: LaunchIntentInput;
  industryProfileId: string;
  slug: string;
  logoDataUrl: string;
  primaryColor: string;
  accentColor: string;
  launchSessionId: string;
  scope: import("@/types/communication").TenantScope;
}) {
  const currency = input.intent.countryBase === "UK" ? "GBP" : "USD";
  const now = crmNow();

  return {
    ...input.scope,
    id: `store_${input.slug}`,
    slug: input.slug,
    brandName: input.brandName,
    tagline: input.tagline,
    description: `${input.brandName} — ${input.intent.businessIdea}. Shop online with secure checkout and fast UK delivery.`,
    logoDataUrl: input.logoDataUrl,
    primaryColor: input.primaryColor,
    accentColor: input.accentColor,
    products: defaultProducts(input.intent.businessIdea, currency),
    heroCta: input.intent.channels.includes("subscription")
      ? "Subscribe & Save"
      : "Shop Now",
    industryProfileId: input.industryProfileId,
    launchSessionId: input.launchSessionId,
    published: true,
    createdAt: now,
    updatedAt: now,
  };
}
