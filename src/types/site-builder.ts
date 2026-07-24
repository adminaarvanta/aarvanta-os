import type { TenantScope } from "@/types/communication";

export type SiteTone = "professional" | "friendly" | "bold" | "luxury";
export type SiteType = "landing" | "business" | "store" | "portfolio";
export type SiteDesignStyle = "minimal" | "modern" | "bold" | "classic";
export type SiteColorMood = "warm" | "cool" | "neutral" | "vibrant";
export type SiteCtaGoal = "book_call" | "buy" | "subscribe" | "contact";

/** Application category — chosen before template selection. */
export type SiteCategoryId =
  | "ecommerce"
  | "saas"
  | "local_service"
  | "professional"
  | "restaurant"
  | "healthcare"
  | "agency"
  | "portfolio"
  | "nonprofit"
  | "blog"
  | "event"
  | "internal_tool_landing"
  | "custom";

/** Visual wireframe style for the template gallery preview. */
export type SiteTemplatePreviewLayout =
  | "saas_split"
  | "store_grid"
  | "editorial_folio"
  | "dining_dark"
  | "clinic_calm"
  | "agency_bold"
  | "magazine"
  | "event_stage"
  | "ops_dashboard"
  | "landing_centered";

/** Known block types the preview renderer understands. */
export type SiteBlockType =
  | "hero"
  | "features"
  | "services_grid"
  | "products"
  | "portfolio_grid"
  | "testimonials"
  | "stats"
  | "pricing_table"
  | "faq_accordion"
  | "logo_cloud"
  | "timeline"
  | "team_grid"
  | "comparison"
  | "cta_banner"
  | "gallery"
  | "menu_list"
  | "booking_cta"
  | "feature_tabs"
  | "rich_text"
  | "contact"
  | "newsletter"
  | "blog_list"
  | "about_split"
  | "content";

export type SiteTemplateSectionRecipe = {
  type: SiteBlockType;
  label: string;
  description: string;
};

export type SiteTemplateDefinition = {
  id: string;
  categoryId: SiteCategoryId;
  name: string;
  description: string;
  bestFor: string[];
  /** Credit / inspiration for open-source landing patterns. */
  inspiredBy: string;
  siteType: SiteType;
  defaultTone: SiteTone;
  defaultTheme: SiteThemePreset;
  defaultPages: SitePageOption[];
  defaultFeatures: SiteFeatureOption[];
  defaultCta: SiteCtaGoal;
  /** Hero layout forced by this template. */
  heroLayout: "fullBleed" | "split" | "centered" | "minimal";
  /** Ordered section recipes keyed by page slug. */
  sectionsByPage: Record<string, SiteTemplateSectionRecipe[]>;
  imageKeywords: string[];
  previewAccent: string;
  previewLayout: SiteTemplatePreviewLayout;
};

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

/** Structured business understanding from the Business Intelligence agent. */
export type BusinessProfile = {
  industry: string;
  subcategory: string;
  audience: string[];
  location: string;
  pricing: "Budget" | "Medium" | "Premium" | "Luxury";
  brandTone: string;
  primaryGoal: string;
  secondaryGoals: string[];
};

/** Coherent design system from the Brand Intelligence agent. */
export type BrandSystem = {
  primary: string;
  secondary: string;
  background: string;
  font: string;
  headingFont?: string;
  fontPackId: SiteFontPackId;
  buttonRadius: string;
  style: string;
  animation: "Minimal" | "Subtle" | "Expressive";
  imageStyle: string;
  spacingScale: "Compact" | "Comfortable" | "Airy";
  iconSet: string;
  toneOfVoice: string;
  googleFontsUrl?: string;
  /** Site chrome / header treatment. */
  navStyle?: "pills" | "underline" | "centered" | "minimal" | "store";
};

/** Page candidate with confidence — only include=true pages are generated. */
export type PagePlanCandidate = {
  slug: SitePageOption | string;
  title: string;
  purpose: string;
  confidence: number;
  include: boolean;
};

export type SiteImagePlan = {
  subject: string;
  aspect: "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
  style: string;
  keywords: string[];
};

export type SiteAssetRef = {
  id: string;
  kind: "image" | "logo" | "icon";
  url: string;
  alt?: string;
  sectionId?: string;
};

/** Default confidence threshold — pages below this are excluded unless forced. */
export const PAGE_CONFIDENCE_THRESHOLD = 70;

export type SiteGenerationStage =
  | "business"
  | "brand"
  | "pages"
  | "layout"
  | "content"
  | "media"
  | "done";

export type SiteGenerationProgress = {
  stage: SiteGenerationStage;
  percent: number;
  message: string;
  updatedAt: string;
};

/** AI-generated design direction — user picks one before full site build. */
export type SiteDesignOption = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  styleTags: string[];
  heroVariant: "fullBleed" | "split" | "centered" | "default";
  brand: BrandSystem;
  /** Homepage section tree that becomes the layout prior for generation. */
  homeSections: SitePlanSection[];
  /** Homepage-only preview site for the picker UI. */
  preview: GeneratedSite;
};

export type SitePreferences = {
  businessName: string;
  businessIdea: string;
  targetAudience?: string;
  countryBase: string;
  /** Optional — application category (ARIA path may infer). */
  categoryId?: SiteCategoryId;
  /** When categoryId is custom — user-written category label. */
  customCategoryLabel?: string;
  /** @deprecated Catalog templates — replaced by AI design options. */
  templateId?: string;
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
  /** Cached business intelligence from last run / draft. */
  businessProfile?: BusinessProfile;
  /** Cached brand system from last run / draft. */
  brandSystem?: BrandSystem;
  /** Page confidence proposals (user can toggle include). */
  pageCandidates?: PagePlanCandidate[];
  /** Min confidence to auto-include pages (default 70). */
  pageConfidenceThreshold?: number;
  /** AI-proposed design directions (homepage previews). */
  designOptions?: SiteDesignOption[];
  /** User-selected design option id. */
  selectedDesignOptionId?: string;
};

export type SiteBlock = {
  id: string;
  type: SiteBlockType | string;
  /** Design-system variant — defaults to "default". */
  variantId?: string;
  props: Record<string, unknown>;
  imagePlan?: SiteImagePlan;
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
  categoryId?: SiteCategoryId;
  templateId?: string;
  business?: BusinessProfile;
  brand?: BrandSystem;
  assets?: SiteAssetRef[];
  /** Blueprint schema version. */
  version?: number;
  generatedAt: string;
};

export type SitePlanSection = {
  type: string;
  label: string;
  description: string;
  variantId?: string;
  imagePlan?: SiteImagePlan;
};

export type SitePlanPage = {
  slug: string;
  title: string;
  purpose: string;
  confidence?: number;
  include?: boolean;
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
  buttonRadius?: string;
  animation?: BrandSystem["animation"];
  imageStyle?: string;
  spacingScale?: BrandSystem["spacingScale"];
  navStyle?: BrandSystem["navStyle"];
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
  business?: BusinessProfile;
  brand?: BrandSystem;
  pageCandidates?: PagePlanCandidate[];
  version?: number;
};

export type SiteBuildJobStatus =
  | "draft"
  | "planning"
  | "plan_ready"
  | "designs_ready"
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
  /** Live generation progress for streaming UI. */
  progress?: SiteGenerationProgress;
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
  status: "completed" | "pending" | "pending_payment" | "failed";
  registrarOrderId: string;
  buildJobId?: string;
  purchasedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  stripeCheckoutSessionId?: string;
};
