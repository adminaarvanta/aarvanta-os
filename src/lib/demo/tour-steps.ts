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

export const DEMO_TOUR_STORAGE_KEY = "aarvanta_demo_tour_active";
export const DEMO_TOUR_STEP_KEY = "aarvanta_demo_tour_step";
export const WALKTHROUGH_SEEN_STORAGE_PREFIX = "aarvanta.hasSeenWalkthrough";

export function walkthroughSeenStorageKey(userId: string) {
  return `${WALKTHROUGH_SEEN_STORAGE_PREFIX}.${userId}`;
}

/** Full-product tour (paid / Help replay). */
export const DEMO_TOUR_STEPS: DemoTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Aarvanta OS",
    description:
      "This guided walkthrough shows how teams run revenue, operations, and AI workforce from one place. Use Next and Previous to move at your own pace.",
    route: "/dashboard",
    placement: "center",
    tip: "You can reopen this anytime from Help in the top-right corner",
  },
  {
    id: "help",
    title: "Help is always here",
    description:
      "The Help button in the header gives you the product tour, the 90-second live demo, and quick tips.",
    route: "/dashboard",
    target: '[data-demo-tour="help-trigger"]',
    placement: "bottom",
    tip: "Look for the gold Help button with the pulse indicator",
  },
  {
    id: "sidebar",
    title: "Sidebar navigation",
    description:
      "The left rail keeps your workspace uncluttered. Hover to expand and read full labels — icons stay fixed so nothing jumps around.",
    route: "/dashboard",
    target: '[data-demo-tour="sidebar-rail"]',
    placement: "right",
    expandSidebar: true,
    tip: "Hover the rail to expand · move away to collapse",
  },
  {
    id: "dashboard",
    title: "Founder Dashboard",
    description:
      "Your command centre: pipeline value, hot leads, open tasks, inbox urgency, and the Founder Copilot for quick answers.",
    route: "/dashboard",
    target: '[data-demo-tour="nav-dashboard"], [data-demo-tour="mobile-nav-dashboard"]',
    placement: "right",
    expandSidebar: true,
    tip: "Ask Copilot: “What's our pipeline forecast?”",
  },
  {
    id: "whatsapp",
    title: "WhatsApp OS",
    description:
      "WhatsApp business messaging with inbound webhooks, outbound replies, AI summaries, identity detection, and start-thread by phone.",
    route: "/whatsapp",
    target: '[data-demo-tour="nav-whatsapp"], [data-demo-tour="mobile-nav-whatsapp"]',
    placement: "right",
    expandSidebar: true,
    tip: "Open a WhatsApp thread to see identity and AI insights",
  },
  {
    id: "voice",
    title: "Voice OS",
    description:
      "AI calling inbox — outbound Twilio TTS, dialer, call log, and status webhooks when Twilio is configured.",
    route: "/voice",
    target: '[data-demo-tour="nav-voice"], [data-demo-tour="mobile-nav-voice"]',
    placement: "right",
    expandSidebar: true,
    tip: "Open Dialer from Voice OS to place a spoken-message call",
  },
  {
    id: "crm",
    title: "CRM & Pipelines",
    description:
      "Manage contacts, companies, deals, and tasks. Move deals across stages, assign owners, and log activities.",
    route: "/crm",
    target: '[data-demo-tour="nav-crm"], [data-demo-tour="mobile-nav-crm"]',
    placement: "right",
    expandSidebar: true,
    tip: "Try ⌘K and search “Meridian”",
  },
  {
    id: "workforce",
    title: "AI Workforce",
    description:
      "Seven AI executives — Sales, Marketing, COO, HR, and more. Each has memory, chat, and the ability to create tasks.",
    route: "/workforce",
    target: '[data-demo-tour="nav-workforce"], [data-demo-tour="mobile-nav-workforce"]',
    placement: "right",
    expandSidebar: true,
    tip: "Open Sales Manager after running the live demo",
  },
  {
    id: "all-tools",
    title: "All tools",
    description:
      "Every module in one searchable panel — Team, Finance, Billing, Writing, Analytics, Integrations, and 30+ more. Grouped by Manage, Revenue, Intelligence, and Enterprise.",
    route: "/dashboard",
    target: '[data-demo-tour="all-tools-panel"]',
    placement: "right",
    expandSidebar: true,
    openAllTools: true,
    tip: "Click All tools below the main tabs · panel stays open until you close it or pick another sidebar item",
  },
  {
    id: "search",
    title: "Global Search",
    description:
      "Jump anywhere instantly — contacts, deals, projects, knowledge docs, and inbox threads. Press ⌘K (or Ctrl+K) from any screen.",
    route: "/dashboard",
    target: '[data-demo-tour="global-search"]',
    placement: "bottom",
  },
  {
    id: "settings",
    title: "Settings & workspace",
    description:
      "Organizations, workspaces, roles, and sign-out live at the bottom of the sidebar. Extended modules are in All tools, not duplicated here.",
    route: "/settings",
    target: '[data-demo-tour="nav-settings"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "live-demo",
    title: "90-Second Live Demo",
    description:
      "Open Help → “90-second live demo” to simulate the full journey: inbound lead → AI qualify → human alert → deal won → invoice → portal → project.",
    route: "/dashboard",
    target: '[data-demo-tour="help-trigger"]',
    placement: "bottom",
    tip: "Perfect finale for client presentations",
  },
  {
    id: "finish",
    title: "You're ready to go",
    description:
      "Use Help anytime for the product tour or live demo. Hover the sidebar for quick tabs, open All tools for everything else, or press ⌘K to jump anywhere.",
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
      "This short tour shows what you can do on Free — CRM, projects, Build OS, and your AI team. Use Next and Previous anytime.",
    route: "/dashboard",
    placement: "center",
    tip: "Reopen this anytime from Help in the top-right",
  },
  {
    id: "help",
    title: "Help is always here",
    description:
      "The Help button reopens this tour, tips, and the 90-second live demo whenever you need a refresher.",
    route: "/dashboard",
    target: '[data-demo-tour="help-trigger"]',
    placement: "bottom",
    tip: "Look for the Help button in the header",
  },
  {
    id: "sidebar",
    title: "Sidebar navigation",
    description:
      "The left rail keeps your workspace uncluttered. Hover to expand labels — icons stay fixed so nothing jumps around.",
    route: "/dashboard",
    target: '[data-demo-tour="sidebar-rail"]',
    placement: "right",
    expandSidebar: true,
    tip: "Hover the rail to expand · move away to collapse",
  },
  {
    id: "dashboard",
    title: "Home",
    description:
      "Your home base: pipeline signals, quick actions, and a map of the operating systems available to your workspace.",
    route: "/dashboard",
    target: '[data-demo-tour="nav-dashboard"], [data-demo-tour="mobile-nav-dashboard"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "crm",
    title: "CRM & pipelines",
    description:
      "Fully unlocked on Free — manage people, companies, deals, and tasks. Capture leads and move deals across stages.",
    route: "/crm",
    target: '[data-demo-tour="nav-crm"], [data-demo-tour="mobile-nav-crm"]',
    placement: "right",
    expandSidebar: true,
    tip: "Try ⌘K to jump to a contact or deal",
  },
  {
    id: "projects",
    title: "Projects",
    description:
      "Also unlocked on Free — Kanban boards and tasks to deliver work for clients and your team.",
    route: "/projects",
    target: '[data-demo-tour="nav-projects"], [data-demo-tour="mobile-nav-projects"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "build",
    title: "Build OS",
    description:
      "Draft your business website with AI — unlimited pages while drafting. Preview on Aarvanta; custom-domain go-live is on paid plans.",
    route: "/build",
    target: '[data-demo-tour="nav-build"]',
    placement: "right",
    expandSidebar: true,
    tip: "Shortcuts → Website Builder opens the studio",
  },
  {
    id: "workforce",
    title: "AI Team",
    description:
      "Explore mode on Free includes 1 AI employee with chat and tasks. Upgrade later for a full AI workforce.",
    route: "/workforce",
    target: '[data-demo-tour="nav-workforce"], [data-demo-tour="mobile-nav-workforce"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "all-tools",
    title: "More tools & search",
    description:
      "Open More for Finance, Knowledge, Insights, and more. Press ⌘K (Ctrl+K) anytime to jump across the OS.",
    route: "/dashboard",
    target: '[data-demo-tour="all-tools-panel"]',
    placement: "right",
    expandSidebar: true,
    openAllTools: true,
    tip: "Global search lives in the header",
  },
  {
    id: "billing",
    title: "Billing & upgrades",
    description:
      "WhatsApp, Voice, HR, and live publish unlock on paid plans. Manage your Free plan and upgrade from Billing when you’re ready.",
    route: "/billing",
    target: '[data-demo-tour="nav-billing"]',
    placement: "right",
    expandSidebar: true,
  },
  {
    id: "finish",
    title: "You're ready to build",
    description:
      "Start with CRM or Build OS. Use Help anytime to replay this tour. Welcome to Aarvanta.",
    route: "/dashboard",
    placement: "center",
  },
];

export function tourStepsForPlan(planId: string | null | undefined): DemoTourStep[] {
  return planId === "free" ? FREE_TOUR_STEPS : DEMO_TOUR_STEPS;
}
