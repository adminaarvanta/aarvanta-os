import type { TenantScope } from "@/types/communication";

export type SiteTone = "professional" | "friendly" | "bold" | "luxury";
export type SiteType = "landing" | "business" | "store" | "portfolio";
export type SiteDesignStyle = "minimal" | "modern" | "bold" | "classic";
export type SiteColorMood = "warm" | "cool" | "neutral" | "vibrant";
export type SiteCtaGoal = "book_call" | "buy" | "subscribe" | "contact";

export type SiteThemePreset =
  | "gold_navy"
  | "minimal_light"
  | "bold_dark"
  | "ocean_cool"
  | "sunset_warm";

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
  | "newsletter"
  | "analytics"
  | "seo_pack"
  | "booking"
  | "live_chat";

export type SiteReferenceScreenshot = {
  id: string;
  name: string;
  dataUrl: string;
  uploadedAt: string;
};

export type SiteHostingProvider = "vercel" | "self_hosted";

export type SiteDeploymentConfig = {
  hostingProvider: SiteHostingProvider;
  projectName?: string;
  customDomain?: string;
  vercelTeam?: string;
  autoDeployOnApprove?: boolean;
};

export type SitePreferences = {
  businessName: string;
  businessIdea: string;
  targetAudience?: string;
  countryBase: string;
  tone: SiteTone;
  siteType: SiteType;
  designStyle: SiteDesignStyle;
  colorMood: SiteColorMood;
  themePreset: SiteThemePreset;
  pages: SitePageOption[];
  features: SiteFeatureOption[];
  ctaGoal: SiteCtaGoal;
  keyMessages?: string;
  customPrompt?: string;
  referenceUrl?: string;
  referenceScreenshots?: SiteReferenceScreenshot[];
  deployment: SiteDeploymentConfig;
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
  presetId: SiteThemePreset;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontStyle: string;
  styleNotes: string;
};

export type SitePlanDeployment = {
  hostingProvider: SiteHostingProvider;
  projectName?: string;
  customDomain?: string;
  previewUrl: string;
  vercelNotes: Array<{ title: string; body: string }>;
};

export type SitePlan = {
  siteName: string;
  slug: string;
  summary: string;
  theme: SitePlanTheme;
  navigation: SitePlanNavItem[];
  pages: SitePlanPage[];
  deployment: SitePlanDeployment;
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
