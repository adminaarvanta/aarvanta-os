import type { TenantScope } from "@/types/communication";

export type SiteTone = "professional" | "friendly" | "bold" | "luxury";
export type SiteType = "landing" | "business" | "store" | "portfolio";
export type SiteDesignStyle = "minimal" | "modern" | "bold" | "classic";
export type SiteColorMood = "warm" | "cool" | "neutral" | "vibrant";
export type SiteCtaGoal = "book_call" | "buy" | "subscribe" | "contact";

/** Business niche — drives which UI templates and practical theme suggestions appear. */
export type SiteNiche =
  | "online_shop"
  | "local_service"
  | "agency"
  | "saas"
  | "restaurant"
  | "clinic"
  | "portfolio";

export type SiteTemplateLayout =
  | "hero_centered"
  | "hero_split"
  | "hero_image_bg"
  | "services_grid"
  | "store_shelf";

export type SiteThemeMode = "template" | "custom";

export type SiteFontPairing =
  | "modern_sans"
  | "classic_serif"
  | "friendly_rounded"
  | "editorial";

export type SiteButtonStyle = "solid" | "soft" | "outline";
export type SiteRadiusStyle = "sharp" | "rounded" | "pill";

/** User-authored theme tokens when not using a template preset. */
export type SiteCustomTheme = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontPairing: SiteFontPairing;
  buttonStyle: SiteButtonStyle;
  radius: SiteRadiusStyle;
};

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
  niche: SiteNiche;
  /** Selected UI template id from the niche catalog. */
  templateId: string;
  tone: SiteTone;
  siteType: SiteType;
  designStyle: SiteDesignStyle;
  colorMood: SiteColorMood;
  /** How colors/fonts are chosen: template preset or custom niche theme. */
  themeMode: SiteThemeMode;
  themePreset: SiteThemePreset;
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
  themeMode: SiteThemeMode;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor?: string;
  fontStyle: string;
  styleNotes: string;
  templateId?: string;
  layout?: SiteTemplateLayout;
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
