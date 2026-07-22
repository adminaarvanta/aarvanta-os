import type { SiteCategoryId } from "@/types/site-builder";

export type SiteCategoryCard = {
  id: SiteCategoryId;
  label: string;
  description: string;
  examples: string;
  icon: string;
};

export const SITE_CATEGORIES: SiteCategoryCard[] = [
  {
    id: "ecommerce",
    label: "Online store",
    description: "Product catalogs, merchandising, and checkout-ready journeys",
    examples: "DTC · Retail · Subscriptions",
    icon: "shopping-bag",
  },
  {
    id: "saas",
    label: "SaaS / product",
    description: "Conversion landings with features, pricing, and signup CTAs",
    examples: "B2B tools · Apps · Platforms",
    icon: "layers",
  },
  {
    id: "local_service",
    label: "Local service",
    description: "Trust-led sites for trades and neighbourhood businesses",
    examples: "Plumbing · Cleaning · Coaching",
    icon: "map-pin",
  },
  {
    id: "professional",
    label: "Professional services",
    description: "Authority sites for consultancies and practices",
    examples: "Legal · Finance · Consulting",
    icon: "briefcase",
  },
  {
    id: "restaurant",
    label: "Restaurant & hospitality",
    description: "Menus, ambience, and reservation-focused experiences",
    examples: "Cafés · Fine dining · Bars",
    icon: "utensils",
  },
  {
    id: "healthcare",
    label: "Healthcare & clinics",
    description: "Calm, trustworthy sites for care and booking",
    examples: "Dental · Therapy · Wellness",
    icon: "heart-pulse",
  },
  {
    id: "agency",
    label: "Agency & studio",
    description: "Capability showcases with case studies and leads",
    examples: "Marketing · Design · Dev shops",
    icon: "sparkles",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Editorial work galleries for creators and freelancers",
    examples: "Photography · Architecture · Art",
    icon: "image",
  },
  {
    id: "nonprofit",
    label: "Nonprofit & impact",
    description: "Mission, programmes, and donation journeys",
    examples: "Charity · Community · Causes",
    icon: "hand-heart",
  },
  {
    id: "blog",
    label: "Blog & media",
    description: "Content-first publications and newsletters",
    examples: "Magazines · Newsletters · Guides",
    icon: "book-open",
  },
  {
    id: "event",
    label: "Events",
    description: "Conference and gathering sites with schedules and tickets",
    examples: "Conferences · Workshops · Festivals",
    icon: "calendar",
  },
  {
    id: "internal_tool_landing",
    label: "Internal tool landing",
    description: "Product marketing for internal platforms and ops tools",
    examples: "HR portals · Ops · Intranet apps",
    icon: "layout-dashboard",
  },
  {
    id: "custom",
    label: "Custom category",
    description: "Describe your own niche — templates adapt to your brief",
    examples: "Hybrids · New categories · Anything else",
    icon: "sparkles",
  },
];

export function getCategoryById(id: SiteCategoryId): SiteCategoryCard | undefined {
  return SITE_CATEGORIES.find((c) => c.id === id);
}
