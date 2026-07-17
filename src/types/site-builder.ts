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
  | "sunset_warm"
  | "custom";

export type SiteFontPackId =
  | "editorial"
  | "modern_sans"
  | "tech"
  | "friendly"
  | "luxury_serif"
  | "clean_mono";

/** Brand colors + font pack — Durable/Hostinger-style custom theme. */
export type SiteCustomTheme = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontPackId: SiteFontPackId;
};

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

/**
 * Domain attachment modes:
 * - purchase via Aarvanta (`selected` / `purchased`)
 * - bring-your-own domain (`external`) — user updates DNS at their registrar
 */
export type DomainPurchaseStatus = "none" | "selected" | "purchased" | "external";

export type DomainDnsVerificationStatus = "pending" | "verified";

export type SiteDnsRecordType = "A" | "AAAA" | "CNAME" | "TXT";

/** One row to paste into the customer's domain provider DNS dashboard. */
export type SiteDnsRecordInstruction = {
  type: SiteDnsRecordType;
  /** Host / name field — `@` for apex, `www`, or a subdomain label. */
  host: string;
  value: string;
  ttl: string;
  purpose: string;
};

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
  /** Set when status is `external` — DNS must be updated at the user's registrar. */
  dnsStatus?: DomainDnsVerificationStatus;
  connectedAt?: string;
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
  /** When set (especially with themePreset=custom), overrides palette + fonts. */
  customTheme?: SiteCustomTheme;
  pages: SitePageOption[];
  features: SiteFeatureOption[];
  ctaGoal: SiteCtaGoal;
  keyMessages?: string;
  customPrompt?: string;
  referenceUrl?: string;
  referenceScreenshots?: SiteReferenceScreenshot[];
  deployment: SiteDeploymentConfig;
};

export type SiteBlock = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

export type GeneratedSitePage = {
  slug: string;
  title: string;
  blocks: SiteBlock[];
};

export type GeneratedSite = {
  siteName: string;
  slug: string;
  tagline?: string;
  footerNote?: string;
  theme: SitePlanTheme;
  navigation: SitePlanNavItem[];
  pages: GeneratedSitePage[];
  generatedAt: string;
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
  fontFamily?: string;
  headingFont?: string;
  googleFontsUrl?: string;
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
  generatedSite?: GeneratedSite;
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
