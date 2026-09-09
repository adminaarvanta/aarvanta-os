export type MaturityStatus = "live" | "beta" | "preview" | "coming_soon";

export type ProductModuleId =
  | "home"
  | "customers"
  | "work"
  | "inbox"
  | "ai"
  | "knowledge"
  | "automations"
  | "finance"
  | "people"
  | "website"
  | "analytics"
  | "voice"
  | "payroll"
  | "outreach"
  | "whatsapp";

export type ProductModule = {
  id: ProductModuleId;
  label: string;
  href: string;
  status: MaturityStatus;
  description: string;
  public: boolean;
};

export const MATURITY_LABELS: Record<MaturityStatus, string> = {
  live: "Live",
  beta: "Beta",
  preview: "Preview",
  coming_soon: "Coming soon",
};

export const PRODUCT_MODULES: ProductModule[] = [
  {
    id: "home",
    label: "Home",
    href: "/dashboard",
    status: "live",
    description: "Daily action centre for the business.",
    public: true,
  },
  {
    id: "customers",
    label: "Customers",
    href: "/crm",
    status: "live",
    description: "Contacts, companies, leads, deals, and Customer 360.",
    public: true,
  },
  {
    id: "work",
    label: "Work",
    href: "/projects",
    status: "beta",
    description: "Projects, tasks, and delivery milestones.",
    public: true,
  },
  {
    id: "inbox",
    label: "Inbox",
    href: "/inbox",
    status: "live",
    description: "WhatsApp, email, SMS, voice, and website chat in one timeline.",
    public: true,
  },
  {
    id: "ai",
    label: "AI",
    href: "/automation?view=ask",
    status: "live",
    description: "Ask Aarvanta, specialist agents, approvals, and activity.",
    public: true,
  },
  {
    id: "knowledge",
    label: "Knowledge",
    href: "/knowledge",
    status: "live",
    description: "Company Brain — documents, citations, and search.",
    public: true,
  },
  {
    id: "automations",
    label: "Automations",
    href: "/workflows",
    status: "live",
    description: "Templates, workflow runs, and approvals.",
    public: true,
  },
  {
    id: "finance",
    label: "Finance",
    href: "/finance",
    status: "beta",
    description: "Operational invoices, expenses, and overviews — not a full ledger replacement.",
    public: true,
  },
  {
    id: "people",
    label: "People",
    href: "/hr",
    status: "beta",
    description: "Employees, leave, and onboarding — not a payroll replacement.",
    public: true,
  },
  {
    id: "website",
    label: "Website",
    href: "/build",
    status: "live",
    description: "Business-connected site builder: forms into CRM.",
    public: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/analytics",
    status: "beta",
    description: "Cross-module outcomes from records already in the OS.",
    public: true,
  },
  {
    id: "voice",
    label: "Voice",
    href: "/voice",
    status: "live",
    description: "AI calling, dialer, and campaign queue.",
    public: true,
  },
  {
    id: "payroll",
    label: "Payroll",
    href: "/payroll",
    status: "preview",
    description: "Payroll preview — not a full payroll engine.",
    public: false,
  },
  {
    id: "outreach",
    label: "Email outreach",
    href: "/outreach",
    status: "preview",
    description: "Gated email campaigns. Not a Marketing OS.",
    public: false,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: "/whatsapp",
    status: "preview",
    description: "Gated WhatsApp business inbox.",
    public: false,
  },
];

const byId = new Map(PRODUCT_MODULES.map((module) => [module.id, module]));

export function getProductModule(id: ProductModuleId): ProductModule {
  const module = byId.get(id);
  if (!module) {
    throw new Error(`Unknown product module: ${id}`);
  }
  return module;
}

export function publicCapabilities(): ProductModule[] {
  return PRODUCT_MODULES.filter((module) => module.public);
}

export function maturityForHref(href: string): ProductModule | undefined {
  const path = href.split("?")[0];
  return PRODUCT_MODULES.find((module) => module.href.split("?")[0] === path);
}

export function containsMarketingOs(text: string): boolean {
  return /marketing[\s_-]*os/i.test(text);
}
