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
    id: "inbox",
    title: "Unified Inbox",
    description:
      "WhatsApp, email, SMS, voice, and website chat in one timeline — with AI summaries, sentiment, tags, and HR document automation.",
    route: "/inbox",
    target: '[data-demo-tour="nav-inbox"], [data-demo-tour="mobile-nav-inbox"]',
    placement: "right",
    expandSidebar: true,
    tip: "Sarah Chen's Meridian thread is pre-loaded for demo",
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
