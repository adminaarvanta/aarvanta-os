/**
 * Support assistant knowledge — routes & help topics for navigation + answers.
 * Kept human-readable (no technical IDs or API paths).
 */

export type SupportDestination = {
  id: string;
  title: string;
  href: string;
  keywords: string[];
  blurb: string;
};

export const SUPPORT_DESTINATIONS: SupportDestination[] = [
  {
    id: "dashboard",
    title: "Command Center",
    href: "/dashboard",
    keywords: ["home", "dashboard", "overview", "command", "start"],
    blurb: "Your main overview of the business OS.",
  },
  {
    id: "inbox",
    title: "Inbox",
    href: "/inbox",
    keywords: ["inbox", "email", "whatsapp", "voice", "messages", "chat", "sms"],
    blurb: "All customer messages in one place — email, WhatsApp, voice, and more.",
  },
  {
    id: "crm",
    title: "CRM",
    href: "/crm",
    keywords: ["crm", "customers", "deals", "pipeline", "sales"],
    blurb: "Manage contacts, companies, deals, and your sales pipeline.",
  },
  {
    id: "leads",
    title: "Lead pipeline",
    href: "/crm/leads",
    keywords: ["leads", "lead", "prospect", "qualify"],
    blurb: "Capture and qualify new leads.",
  },
  {
    id: "contacts",
    title: "Contacts",
    href: "/crm/contacts",
    keywords: ["contacts", "people", "customers"],
    blurb: "Your contact directory.",
  },
  {
    id: "workforce",
    title: "AI Workforce",
    href: "/workforce",
    keywords: ["ai", "agents", "workforce", "employees", "copilot"],
    blurb: "Your AI team — sales, marketing, ops, HR, and more.",
  },
  {
    id: "projects",
    title: "Projects",
    href: "/projects",
    keywords: ["projects", "kanban", "tasks", "delivery"],
    blurb: "Track delivery work on a project board.",
  },
  {
    id: "workflows",
    title: "Workflows",
    href: "/workflows",
    keywords: ["workflows", "automation", "automate", "rules"],
    blurb: "Automate repetitive business processes.",
  },
  {
    id: "hr",
    title: "HR",
    href: "/hr",
    keywords: ["hr", "people", "employees", "leave", "payroll"],
    blurb: "HR documents, people ops, and related tools.",
  },
  {
    id: "finance",
    title: "Finance",
    href: "/finance",
    keywords: ["finance", "money", "billing", "invoices", "cash"],
    blurb: "Finance overview and money tools.",
  },
  {
    id: "analytics",
    title: "Analytics",
    href: "/analytics",
    keywords: ["analytics", "reports", "metrics", "kpi", "dashboard"],
    blurb: "Reports and performance insights.",
  },
  {
    id: "knowledge",
    title: "Knowledge Hub",
    href: "/knowledge",
    keywords: ["knowledge", "docs", "documentation", "faq", "brain", "help docs"],
    blurb: "Company knowledge, FAQs, and documents.",
  },
  {
    id: "build",
    title: "Build sites",
    href: "/build",
    keywords: ["website", "build", "site", "landing", "page"],
    blurb: "Create and publish websites.",
  },
  {
    id: "settings",
    title: "Settings",
    href: "/settings",
    keywords: ["settings", "account", "profile", "preferences", "theme"],
    blurb: "Workspace and account preferences.",
  },
  {
    id: "team",
    title: "Team",
    href: "/team",
    keywords: ["team", "invite", "members", "roles"],
    blurb: "Manage people on your workspace.",
  },
  {
    id: "billing",
    title: "Billing",
    href: "/billing",
    keywords: ["billing", "plan", "subscription", "payment"],
    blurb: "Plans and billing details.",
  },
];

export type SupportFaq = {
  question: string;
  answer: string;
  href?: string;
};

export const SUPPORT_FAQS: SupportFaq[] = [
  {
    question: "How do I add a new lead?",
    answer:
      "Open CRM → Leads, then use Quick Action → Add New Lead from the top bar. You can also go straight to the lead pipeline.",
    href: "/crm/leads",
  },
  {
    question: "Where do customer messages go?",
    answer:
      "Everything lands in Inbox — WhatsApp, email, voice, SMS, and website chat are unified there.",
    href: "/inbox",
  },
  {
    question: "How do I change the theme?",
    answer:
      "Use the sun/moon toggle in the top header to switch between light and dark mode. Your choice is saved automatically.",
  },
  {
    question: "How do I change the language?",
    answer:
      "Click the language icon in the top header and pick any language. The whole OS will refresh in that language.",
  },
  {
    question: "What is the AI Workforce?",
    answer:
      "AI Workforce is your team of AI employees (CEO, sales, marketing, HR, finance, and more). Open AI Workforce to browse and chat with them.",
    href: "/workforce",
  },
  {
    question: "Where can I find help docs?",
    answer:
      "Open the Knowledge Hub for documents and FAQs, or use the Help menu in the header for a product tour.",
    href: "/knowledge",
  },
];

function scoreDestination(query: string, dest: SupportDestination) {
  const q = query.toLowerCase();
  let score = 0;
  if (dest.title.toLowerCase().includes(q)) score += 8;
  for (const kw of dest.keywords) {
    if (q.includes(kw) || kw.includes(q)) score += 5;
  }
  if (dest.blurb.toLowerCase().includes(q)) score += 2;
  return score;
}

export function matchDestinations(query: string, limit = 3) {
  return SUPPORT_DESTINATIONS.map((d) => ({ d, score: scoreDestination(query, d) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.d);
}

export function matchFaqs(query: string, limit = 2) {
  const q = query.toLowerCase();
  return SUPPORT_FAQS.map((faq) => {
    let score = 0;
    if (faq.question.toLowerCase().includes(q)) score += 6;
    for (const word of q.split(/\s+/).filter(Boolean)) {
      if (faq.question.toLowerCase().includes(word)) score += 2;
      if (faq.answer.toLowerCase().includes(word)) score += 1;
    }
    return { faq, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.faq);
}

export function buildHeuristicSupportReply(question: string): {
  answer: string;
  links: { title: string; href: string }[];
} {
  const destinations = matchDestinations(question);
  const faqs = matchFaqs(question);
  const links = [
    ...faqs.filter((f) => f.href).map((f) => ({ title: f.question, href: f.href! })),
    ...destinations.map((d) => ({ title: d.title, href: d.href })),
  ].filter(
    (link, index, arr) => arr.findIndex((x) => x.href === link.href) === index
  );

  if (faqs.length > 0) {
    const primary = faqs[0];
    const extra =
      destinations.length > 0
        ? `\n\nI can also take you to: ${destinations.map((d) => d.title).join(", ")}.`
        : "";
    return {
      answer: `${primary.answer}${extra}`,
      links: links.slice(0, 4),
    };
  }

  if (destinations.length > 0) {
    const top = destinations[0];
    return {
      answer: `${top.blurb}\n\nI can open ${top.title} for you, or pick another related area below.`,
      links: links.slice(0, 4),
    };
  }

  return {
    answer:
      "I can help you find your way around Aarvanta OS — try asking about Inbox, CRM, AI Workforce, projects, settings, language, or theme. You can also open Knowledge Hub for deeper docs.",
    links: [
      { title: "Command Center", href: "/dashboard" },
      { title: "Knowledge Hub", href: "/knowledge" },
      { title: "Settings", href: "/settings" },
    ],
  };
}
