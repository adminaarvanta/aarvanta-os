import type { TenantScope } from "@/types/communication";

export type LaunchScale = "solo" | "startup" | "smb" | "enterprise";

export type LaunchChannel =
  | "online"
  | "retail"
  | "wholesale"
  | "marketplace"
  | "subscription";

export type LaunchIntentInput = {
  businessIdea: string;
  targetMarket?: string;
  countryBase: string;
  scale: LaunchScale;
  channels: LaunchChannel[];
};

export type LaunchIndustryDetection = {
  primaryIndustry: string;
  secondaryIndustries: string[];
  hybridModel: string;
  industryProfileId: string;
  confidence: number;
};

export type LaunchBusinessModel = {
  revenueStreams: string[];
  pricingModel: string;
  customerJourney: string[];
  operationalFlow: string[];
  aiInsight: string;
};

export type LaunchBuddyAssignment = {
  buddyId: string;
  name: string;
  reason: string;
};

export type LaunchProvisioningPlan = {
  workflows: string[];
  crmPipeline: boolean;
  financeBudget: boolean;
  financeChartOfAccounts: boolean;
  starterInvoice: boolean;
  legalDocs: boolean;
  storePage: boolean;
  hrHandbook: boolean;
  projectKickoff: boolean;
  workspaceIndustry: string;
  workspaceCountry: string;
};

export type LaunchBranding = {
  slug: string;
  logoDataUrl: string;
  primaryColor: string;
  accentColor: string;
  tagline: string;
};

export type LaunchDomainSuggestion = {
  domain: string;
  tld: string;
  available: boolean;
  note: string;
};

export type LaunchLegalDocType = "terms" | "privacy" | "cookie_policy";

export type LaunchLegalDoc = {
  type: LaunchLegalDocType;
  title: string;
  content: string;
  knowledgeDocumentId?: string;
};

export type LaunchCommercialPackage = {
  branding: LaunchBranding;
  domainSuggestions: LaunchDomainSuggestion[];
  selectedDomain?: string;
  legalDocs: LaunchLegalDoc[];
  storeSlug: string;
};

export type LaunchDeploymentArtifact = {
  kind:
    | "pipeline"
    | "workflow"
    | "project"
    | "budget"
    | "workspace"
    | "buddy"
    | "store"
    | "domain"
    | "legal"
    | "finance"
    | "hr"
    | "logo";
  id: string;
  label: string;
  href?: string;
};

export type LaunchSessionStatus =
  | "draft"
  | "interpreted"
  | "reviewed"
  | "deployed"
  | "failed";

export type LaunchSession = TenantScope & {
  id: string;
  status: LaunchSessionStatus;
  intent: LaunchIntentInput;
  brandName?: string;
  industry?: LaunchIndustryDetection;
  businessModel?: LaunchBusinessModel;
  buddies?: LaunchBuddyAssignment[];
  provisioning?: LaunchProvisioningPlan;
  commercial?: LaunchCommercialPackage;
  artifacts?: LaunchDeploymentArtifact[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  deployedAt?: string;
};

export type CreateLaunchSessionInput = LaunchIntentInput;

export type LaunchInterpretationResult = {
  session: LaunchSession;
  usedAi: boolean;
};

export type LaunchDeploymentResult = {
  session: LaunchSession;
  artifacts: LaunchDeploymentArtifact[];
};
