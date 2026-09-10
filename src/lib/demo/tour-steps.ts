export type DemoTourPlacement = "top" | "bottom" | "left" | "right" | "center";

export type DemoTourStep = {
  id: string;
  title: string;
  description: string;
  /** Navigate here before highlighting (if different from current). */
  route?: string;
  /** CSS selector for spotlight; omit for centered modal steps. */
  target?: string;
  placement?: DemoTourPlacement;
  tip?: string;
  /** Expand the desktop sidebar rail during this step. */
  expandSidebar?: boolean;
  /** Open the All tools flyout during this step. */
  openAllTools?: boolean;
};

export type ModuleTourId =
  | "home"
  | "customers"
  | "inbox"
  | "ai"
  | "knowledge"
  | "automations";

export const MODULE_TOUR_IDS: ModuleTourId[] = [
  "home",
  "customers",
  "inbox",
  "ai",
  "knowledge",
  "automations",
];

export const DEMO_TOUR_STORAGE_KEY = "aarvanta_demo_tour_active";
export const DEMO_TOUR_STEP_KEY = "aarvanta_demo_tour_step";
export const DEMO_TOUR_NAME_KEY = "aarvanta_demo_tour_name";
export const WALKTHROUGH_SEEN_STORAGE_PREFIX = "aarvanta.hasSeenWalkthrough";
export const TOURS_COMPLETED_STORAGE_PREFIX = "aarvanta.toursCompleted";

export function walkthroughSeenStorageKey(userId: string) {
  return `${WALKTHROUGH_SEEN_STORAGE_PREFIX}.${userId}`;
}

export function toursCompletedStorageKey(userId: string) {
  return `${TOURS_COMPLETED_STORAGE_PREFIX}.${userId}`;
}

export function tourIdForPath(pathname: string, search = ""): ModuleTourId | null {
  if (pathname.startsWith("/dashboard")) return "home";
  if (pathname.startsWith("/crm") || pathname.startsWith("/customers")) {
    return "customers";
  }
  if (pathname.startsWith("/inbox")) return "inbox";
  if (pathname.startsWith("/knowledge")) return "knowledge";
  if (pathname.startsWith("/workforce")) return "ai";
  if (pathname.startsWith("/automation")) {
    return search.includes("view=ask") ? "ai" : "automations";
  }
  if (pathname.startsWith("/workflows")) return "automations";
  return null;
}

/** Full-product tour (paid / Help replay). */
export const DEMO_TOUR_STEPS: DemoTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Aarvanta OS",
    description:
      "This walkthrough shows Today, Customers, Inbox, AI, Knowledge, and Automations. Use Next and Previous at your own pace.",
    route: "/dashboard",
    placement: "center",
    tip: "Reopen this anytime from Help in the top-right",
  },
  {
    id: "help",
    title: "Help is always here",
    description:
      "The Help button opens this-page guidance, the product tour, and the 90-second live demo. Nothing here is a blocking popup.",
    route: "/dashboard",
    target: '[data-demo-tour="help-trigger"]',
    placement: "bottom",
    tip: "Look for Help in the header",
  },
  {
    id: "sidebar",
    title: "Primary rail",
    description:
      "Home, Customers, Work, Inbox, AI, Knowledge, and Automations stay in the rail. Hover to expand labels.",
    route: "/dashboard",
    target: '[data-demo-tour="sidebar-rail"]',
    placement: "right",
    expandSidebar: true,
    tip: "Voice lives under Inbox and All tools — not as a sixth identity",
  },
  {
    id: "dashboard",
    title: "Today",
    description:
      "The Action Centre: business pulse, needs attention, approvals, and the next useful action from live records.",
    route: "/dashboard",
    target: '[data-demo-tour="nav-dashboard"], [data-demo-tour="mobile-nav-dashboard"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "crm",
    title: "Customers",
    description:
      "CRM is the canonical customer record. Open a person for Customer 360 — timeline, deals, conversations, and tasks.",
    route: "/crm",
    target: '[data-demo-tour="nav-crm"], [data-demo-tour="mobile-nav-crm"]',
    placement: "right",
    expandSidebar: true,
    tip: "Try ⌘K and search a contact name",
  },
  {
    id: "inbox",
    title: "Inbox",
    description:
      "Relationship conversations. Unread, owner, sentiment, and AI summary sit on the thread — channel badges are secondary.",
    route: "/inbox",
    target: '[data-demo-tour="nav-inbox"], [data-demo-tour="mobile-nav-inbox"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "workforce",
    title: "AI",
    description:
      "Ask Aarvanta first. Specialist agents sit behind this command. High-impact actions wait in Approvals.",
    route: "/automation?view=ask",
    target: '[data-demo-tour="nav-automation"], [data-demo-tour="mobile-nav-automation"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "knowledge",
    title: "Company Brain",
    description:
      "Upload SOPs and policies. Answers cite those documents. Index status and freshness stay visible.",
    route: "/knowledge",
    target: '[data-demo-tour="nav-knowledge"], [data-demo-tour="mobile-nav-knowledge"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "automations",
    title: "Automations",
    description:
      "Start from a template. Enable a preset and inspect the run — we do not hide failures.",
    route: "/automation",
    target: '[data-demo-tour="nav-workflows"], [data-demo-tour="mobile-nav-workflows"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "search",
    title: "Command palette",
    description:
      "⌘K (Ctrl+K) navigates, searches customers, creates a record, asks Aarvanta, or opens help.",
    route: "/dashboard",
    target: '[data-demo-tour="global-search"]',
    placement: "bottom",
  },
  {
    id: "finish",
    title: "You're ready",
    description:
      "Use Help on any page for a short module tour. Pause AI from the AI Employees directory when you need a hard stop.",
    route: "/dashboard",
    placement: "center",
  },
];

/**
 * Free-plan first-run walkthrough — only modules Free users can use
 * (full or explore). Skips WhatsApp, Voice, HR, and paid live-demo finale.
 */
export const FREE_TOUR_STEPS: DemoTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to your free workspace",
    description:
      "This short tour shows Today, Customers, Inbox, AI, and Knowledge on Free. Use Next and Previous anytime.",
    route: "/dashboard",
    placement: "center",
    tip: "Reopen this anytime from Help",
  },
  {
    id: "help",
    title: "Help is always here",
    description:
      "The Help button reopens this tour, this-page guidance, and the 90-second live demo.",
    route: "/dashboard",
    target: '[data-demo-tour="help-trigger"]',
    placement: "bottom",
  },
  {
    id: "dashboard",
    title: "Today",
    description:
      "Your Action Centre. Pulse and next actions come from live records — empty lists stay empty.",
    route: "/dashboard",
    target: '[data-demo-tour="nav-dashboard"], [data-demo-tour="mobile-nav-dashboard"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "crm",
    title: "Customers",
    description:
      "Fully unlocked on Free — people, companies, deals, and Customer 360.",
    route: "/crm",
    target: '[data-demo-tour="nav-crm"], [data-demo-tour="mobile-nav-crm"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "inbox",
    title: "Inbox",
    description:
      "Open a thread to reply. Unread, owner, and sentiment are already on the list.",
    route: "/inbox",
    target: '[data-demo-tour="nav-inbox"], [data-demo-tour="mobile-nav-inbox"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "workforce",
    title: "AI",
    description:
      "Ask Aarvanta once, or edit a play. Explore mode on Free includes 1 AI employee. High-impact actions need approval.",
    route: "/automation?view=ask",
    target: '[data-demo-tour="nav-automation"], [data-demo-tour="mobile-nav-automation"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "knowledge",
    title: "Company Brain",
    description:
      "Upload one SOP so answers can cite a real document.",
    route: "/knowledge",
    target: '[data-demo-tour="nav-knowledge"], [data-demo-tour="mobile-nav-knowledge"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "billing",
    title: "Billing & upgrades",
    description:
      "WhatsApp, Voice, People, and live publish unlock on paid plans. Manage Free from Billing.",
    route: "/billing",
    target: '[data-demo-tour="nav-billing"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "finish",
    title: "You're ready to build",
    description:
      "Start with a customer or an inbox reply. Use Help anytime to replay this tour.",
    route: "/dashboard",
    placement: "center",
  },
];

export const MODULE_TOURS: Record<ModuleTourId, DemoTourStep[]> = {
  home: [
    {
      id: "home-1",
      title: "Today is the Action Centre",
      description:
        "Pulse, needs attention, approvals, and recommended next come from live workspace records.",
      route: "/dashboard",
      placement: "center",
    },
    {
      id: "home-2",
      title: "Clear one item",
      description:
        "Open an approval or an attention row. Empty sections stay empty — we do not invent KPIs.",
      route: "/dashboard",
      placement: "center",
      tip: "Ask Aarvanta from the header when you want a draft",
    },
    {
      id: "home-3",
      title: "Then go to the record",
      description:
        "Each row links to the customer, inbox thread, or workflow run that needs you.",
      route: "/dashboard",
      placement: "center",
    },
  ],
  customers: [
    {
      id: "crm-1",
      title: "Customers is the system of record",
      description:
        "Contacts, companies, and deals share one identity. Open a person for Customer 360.",
      route: "/crm",
      placement: "center",
    },
    {
      id: "crm-2",
      title: "Customer 360",
      description:
        "Overview, timeline, deals, conversations, tasks, and notes — tabs stay labelled unavailable when data is missing.",
      route: "/crm",
      placement: "center",
    },
    {
      id: "crm-3",
      title: "Create from context",
      description:
        "Use Create in the header to add a contact or deal, or press ⌘K.",
      route: "/crm",
      placement: "center",
    },
  ],
  inbox: [
    {
      id: "inbox-1",
      title: "Inbox is relationship-first",
      description:
        "Unread count, owner, sentiment, and AI summary sit on each thread.",
      route: "/inbox",
      placement: "center",
    },
    {
      id: "inbox-2",
      title: "Reply as a human",
      description:
        "Open an urgent or unread thread. Channel badges are secondary to the person.",
      route: "/inbox",
      placement: "center",
    },
    {
      id: "inbox-3",
      title: "Voice and WhatsApp",
      description:
        "Calls live under Inbox and All tools. WhatsApp OS stays email-gated — it is not a Marketing OS.",
      route: "/inbox",
      placement: "center",
    },
  ],
  ai: [
    {
      id: "ai-1",
      title: "Ask Aarvanta first",
      description:
        "Specialist agents sit behind this command. Marketing Manager is an agent, not a product.",
      route: "/automation?view=ask",
      placement: "center",
    },
    {
      id: "ai-2",
      title: "Approval required by default",
      description:
        "Outbound, money, permissions, and deletes wait in Waiting for You.",
      route: "/automation?view=ask",
      placement: "center",
    },
    {
      id: "ai-3",
      title: "Pause is real",
      description:
        "Workspace and per-agent pause are checked in execution. Stopped means nothing mutates.",
      route: "/workforce/settings",
      placement: "center",
    },
  ],
  knowledge: [
    {
      id: "kb-1",
      title: "Company Brain",
      description:
        "Documents you upload become citable answers. Index status and freshness stay visible.",
      route: "/knowledge",
      placement: "center",
    },
    {
      id: "kb-2",
      title: "Upload one SOP",
      description:
        "PDF, DOCX, or TXT. Ask a question and check the citation before trusting the answer.",
      route: "/knowledge",
      placement: "center",
    },
    {
      id: "kb-3",
      title: "Failed indexes stay visible",
      description:
        "A failed document is labelled failed — we do not pretend it is ready.",
      route: "/knowledge",
      placement: "center",
    },
  ],
  automations: [
    {
      id: "flow-1",
      title: "Start from a template",
      description:
        "Presets cover chase, follow-up, and won-deal next steps. We did not rebuild the editor.",
      route: "/automation",
      placement: "center",
    },
    {
      id: "flow-2",
      title: "Automatic is off until you say so",
      description:
        "Background plays do not email or call until you switch Automatic on.",
      route: "/automation",
      placement: "center",
    },
    {
      id: "flow-3",
      title: "Inspect the run",
      description:
        "History shows emails sent, calls booked, and failures. Retry from the run.",
      route: "/automation?view=runs",
      placement: "center",
    },
  ],
};

export function tourStepsForPlan(planId: string | null | undefined): DemoTourStep[] {
  return planId === "free" ? FREE_TOUR_STEPS : DEMO_TOUR_STEPS;
}

export function isModuleTourId(value: string): value is ModuleTourId {
  return (MODULE_TOUR_IDS as readonly string[]).includes(value);
}
