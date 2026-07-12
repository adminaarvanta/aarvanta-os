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

/** Domains are purchased exclusively through Aarvanta — no external registrar. */
export type DomainPurchaseStatus = "none" | "selected" | "purchased";

export type SiteDomainListing = {
  domain: string;
  tld: string;
  available: boolean;
  priceAnnual: number;
  currency: string;
  note: string;
};

export type SiteDomainPurchase = {
  status: DomainPurchaseStatus;
  selectedDomain?: string;
  tld?: string;
  priceAnnual?: number;
  currency: string;
  autoRenew: boolean;
  registrarOrderId?: string;
  purchasedAt?: string;
  expiresAt?: string;
};

export type AwsEc2InstanceType = "t3.micro" | "t3.small" | "t3.medium";
export type AwsRegion = "eu-west-2" | "eu-west-1" | "us-east-1" | "ap-south-1";

export type SiteEc2Config = {
  region: AwsRegion;
  instanceType: AwsEc2InstanceType;
  stackName?: string;
  sslEnabled: boolean;
  autoDeployOnApprove: boolean;
};

export type SiteHostingProvider = "aws_ec2";

export type SiteDeploymentConfig = {
  hostingProvider: SiteHostingProvider;
  domain: SiteDomainPurchase;
  ec2: SiteEc2Config;
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

export type SiteDeployNote = {
  title: string;
  body: string;
};

export type SitePlanDeployment = {
  hostingProvider: SiteHostingProvider;
  domain: SiteDomainPurchase;
  ec2: SiteEc2Config;
  previewUrl: string;
  liveUrl?: string;
  deployNotes: SiteDeployNote[];
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

export type DomainOrder = TenantScope & {
  id: string;
  domain: string;
  tld: string;
  priceAnnual: number;
  currency: string;
  status: "completed" | "pending" | "failed";
  registrarOrderId: string;
  buildJobId?: string;
  purchasedAt: string;
  expiresAt: string;
  autoRenew: boolean;
};
