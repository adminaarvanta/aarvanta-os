import { PLAN_CATALOG } from "@/lib/billing/plan-catalog";

export const PRICING_TIERS = PLAN_CATALOG.map((plan) => ({
  id: plan.id,
  name: plan.name,
  price:
    plan.priceMonthly === 0
      ? "£0"
      : plan.priceMonthly === null
        ? "Custom"
        : `£${plan.priceMonthly}`,
  period: plan.priceMonthly === 0 || plan.priceMonthly === null ? "" : "/month",
  description: plan.tagline,
  features: plan.highlights,
  cta: plan.id === "enterprise" ? "Contact us" : plan.cta,
  highlighted: Boolean(plan.highlighted),
}));

export const COMPANY = {
  name: "Aarvanta Limited",
  tagline: "Run your business from one intelligent operating system.",
  subtagline:
    "Customers, work, communications, knowledge, AI and automation connected in one place.",
  email: "hello@aarvanta.com",
  location: "United Kingdom",
};
