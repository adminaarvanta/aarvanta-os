import type {
  CustomerCountRange,
  OnboardingUseCase,
  StartingWorkflow,
} from "@/types/tenant";

export const ONBOARDING_USE_CASES: {
  id: OnboardingUseCase;
  label: string;
  description: string;
}[] = [
  {
    id: "own_business",
    label: "I run my own business",
    description: "CRM, AI Team, and operations for my company",
  },
  {
    id: "agency",
    label: "I run an agency or consultancy",
    description: "Manage clients, pipelines, and delivery in one place",
  },
  {
    id: "internal_team",
    label: "I am setting this up for my team",
    description: "A shared workspace for sales, people, and knowledge",
  },
  {
    id: "exploring",
    label: "I am exploring Aarvanta",
    description: "I want to see what the OS can do first",
  },
];

export const ONBOARDING_INDUSTRIES = [
  "Professional services",
  "Marketing & agencies",
  "SaaS & technology",
  "Real estate",
  "Healthcare & wellness",
  "Education",
  "Retail & e-commerce",
  "Finance & insurance",
  "Construction & trades",
  "Hospitality",
  "Manufacturing",
  "Non-profit",
  "Other",
] as const;

export const ONBOARDING_CUSTOMER_COUNTS: {
  id: CustomerCountRange;
  label: string;
}[] = [
  { id: "1-10", label: "1–10" },
  { id: "11-50", label: "11–50" },
  { id: "51-200", label: "51–200" },
  { id: "200+", label: "200+" },
  { id: "none_yet", label: "None yet" },
];

export const ONBOARDING_STARTING_WORKFLOWS: {
  id: StartingWorkflow;
  label: string;
  description: string;
}[] = [
  {
    id: "sales_crm",
    label: "Sales / CRM",
    description: "Capture leads, run a pipeline, and keep one customer record.",
  },
  {
    id: "customer_communication",
    label: "Customer communication",
    description: "Put inbox, WhatsApp, email, and voice in one timeline.",
  },
  {
    id: "projects_operations",
    label: "Projects / operations",
    description: "Track delivery work and overdue tasks.",
  },
  {
    id: "ai_assistance",
    label: "AI assistance",
    description: "Ask Aarvanta and keep high-impact actions on approval.",
  },
  {
    id: "website",
    label: "Website",
    description: "Publish a business site whose forms land in CRM.",
  },
];

export const ONBOARDING_TIMEZONES = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;

export const ONBOARDING_CURRENCIES = ["GBP", "USD", "EUR", "AED", "INR"] as const;

export const ONBOARDING_TOOLS = [
  "Google Workspace",
  "Microsoft 365",
  "Slack",
  "HubSpot",
  "Salesforce",
  "WhatsApp Business",
  "WordPress",
  "Wix",
  "Calendly",
  "Excel / Sheets",
  "Other",
] as const;

export const CONSUMER_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

export function guessWebsiteFromEmail(email: string): string {
  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain || CONSUMER_EMAIL_DOMAINS.has(domain)) return "";
  return `https://${domain}`;
}

export function isOnboardingPending(
  org: { onboarding?: { status?: string } } | null | undefined
): boolean {
  return org?.onboarding?.status === "pending";
}

export function shouldShowLaunchpad(
  org: {
    onboarding?: { status?: string; launchpadDismissedAt?: string };
  } | null | undefined
): boolean {
  if (org?.onboarding?.launchpadDismissedAt) return false;
  if (org?.onboarding?.status === "pending") return false;
  return true;
}
