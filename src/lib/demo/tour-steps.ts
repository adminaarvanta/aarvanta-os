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
      "The Help button in the header gives you the product tour, the 90-second live demo, and quick tips — no extra sidebar items needed.",
    route: "/dashboard",
    target: '[data-demo-tour="help-trigger"]',
    placement: "bottom",
    tip: "Look for the gold Help button with the pulse indicator",
  },
  {
    id: "dashboard",
    title: "Founder Dashboard",
    description:
      "Your command centre: pipeline value, hot leads, open tasks, inbox urgency, and the Founder Copilot for quick answers.",
    route: "/dashboard",
    target: '[data-demo-tour="nav-dashboard"], [data-demo-tour="mobile-nav-dashboard"]',
    placement: "right",
    tip: "Ask Copilot: “What's our pipeline forecast?”",
  },
  {
    id: "inbox",
    title: "Unified Inbox",
    description:
      "WhatsApp, email, SMS, voice, and website chat in one timeline — with AI summaries, sentiment, and tags on every thread.",
    route: "/inbox",
    target: '[data-demo-tour="nav-inbox"], [data-demo-tour="mobile-nav-inbox"]',
    placement: "right",
    tip: "Sarah Chen's Meridian thread is pre-loaded for demo",
  },
  {
    id: "crm",
    title: "CRM & Pipelines",
    description:
      "Manage contacts, companies, deals, and tasks manually. Move deals across stages, assign owners, and log activities.",
    route: "/crm",
    target: '[data-demo-tour="nav-crm"], [data-demo-tour="mobile-nav-crm"]',
    placement: "right",
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
    tip: "Open Sales Manager after running the live demo",
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
    id: "team",
    title: "Team & Collaboration",
    description:
      "Add members, assign roles, invite colleagues, and coordinate on CRM records, tasks, and deals.",
    route: "/team",
    target: '[data-demo-tour="nav-team"], [data-demo-tour="mobile-nav-team"]',
    placement: "right",
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
      "Use Help anytime for the product tour or live demo. Explore modules from the sidebar, or press ⌘K to jump anywhere instantly.",
    route: "/dashboard",
    placement: "center",
  },
];
