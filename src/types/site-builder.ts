import type { TenantScope } from "@/types/communication";

export type SiteTone = "professional" | "friendly" | "bold" | "luxury";
export type SiteType = "landing" | "business" | "store" | "portfolio";
export type SiteDesignStyle = "minimal" | "modern" | "bold" | "classic";
export type SiteColorMood = "warm" | "cool" | "neutral" | "vibrant";
export type SiteCtaGoal = "book_call" | "buy" | "subscribe" | "contact";

export type SitePageOption =
  | "home"
  | "about"
  | "services"
  | "pricing"
  | "products"
  | "portfolio"
  | "testimonials"
  | "faq"
  | "blog"
  | "contact";

export type SiteFeatureOption =
  | "contact_form"
  | "chat_widget"
  | "blog"
  | "ecommerce"
  | "testimonials"
  | "newsletter";

export type SitePreferences = {
  businessName: string;
  businessIdea: string;
  targetAudience?: string;
  countryBase: string;
  tone: SiteTone;
  siteType: SiteType;
  designStyle: SiteDesignStyle;
  colorMood: SiteColorMood;
  pages: SitePageOption[];
  features: SiteFeatureOption[];
  ctaGoal: SiteCtaGoal;
  keyMessages?: string;
  referenceUrl?: string;
};

export type SitePlanSection = {
  type: string;
  label: string;
  description: string;
};

export type SitePlanPage = {
  slug: string;
  title: string;
  purpose: string;
  sections: SitePlanSection[];
};

export type SitePlanNavItem = {
  label: string;
  slug: string;
};

export type SitePlanTheme = {
  primaryColor: string;
  accentColor: string;
  fontStyle: string;
  styleNotes: string;
};

export type SitePlan = {
  siteName: string;
  slug: string;
  summary: string;
  theme: SitePlanTheme;
  navigation: SitePlanNavItem[];
  pages: SitePlanPage[];
};

export type SiteBuildJobStatus =
  | "draft"
  | "planning"
  | "plan_ready"
  | "approved"
  | "generating"
  | "generated"
  | "failed";

export type SiteBuildJob = TenantScope & {
  id: string;
  status: SiteBuildJobStatus;
  preferences: SitePreferences;
  plan?: SitePlan;
  usedAi?: boolean;
  error?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSiteBuildJobInput = SitePreferences;
