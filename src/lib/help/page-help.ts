export type PageHelp = {
  title: string;
  what: string;
  next: string;
};

export function helpForPath(pathname: string, search = ""): PageHelp {
  if (pathname.startsWith("/dashboard")) {
    return {
      title: "Today",
      what: "This is the Action Centre: pulse, attention, approvals, and next actions from live records.",
      next: "Clear one approval or attention item. Then open the matching customer or inbox thread.",
    };
  }
  if (pathname.startsWith("/crm") || pathname.startsWith("/customers")) {
    return {
      title: "Customers",
      what: "CRM is the canonical customer record. Open a person to see Customer 360.",
      next: "Add or open a contact, then log the next action on their timeline.",
    };
  }
  if (pathname.startsWith("/inbox")) {
    return {
      title: "Inbox",
      what: "Relationship conversations. Unread, owner, sentiment, and AI summary sit on the thread.",
      next: "Open an unread or urgent thread and reply, or assign an owner.",
    };
  }
  if (pathname.startsWith("/knowledge")) {
    return {
      title: "Company Brain",
      what: "Documents you upload become citable answers for Ask Aarvanta.",
      next: "Upload one SOP, then ask a question and check the citation.",
    };
  }
  if (pathname.startsWith("/workforce")) {
    return {
      title: "AI",
      what: "Agents, approvals, and activity. Pause is enforced in execution.",
      next: "Review Waiting for You before anything external runs.",
    };
  }
  if (pathname.startsWith("/automation") && search.includes("view=ask")) {
    return {
      title: "AI",
      what: "Ask Aarvanta. Specialist agents sit behind this command surface.",
      next: "Ask a question, then review Waiting for You before anything external runs.",
    };
  }
  if (pathname.startsWith("/workflows") || pathname.startsWith("/automation")) {
    return {
      title: "Automations",
      what: "Start from a template. Runs and errors stay visible.",
      next: "Enable one preset and inspect a test run.",
    };
  }
  return {
    title: "Aarvanta OS",
    what: "Every screen should answer where you are, what you can do, and what happens next.",
    next: "Use Create for a contextual action, or ⌘K to search.",
  };
}
