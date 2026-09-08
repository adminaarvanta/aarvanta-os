export type AccountLifecycleStatus =
  | "active"
  | "paused"
  | "pending_cancel"
  | "deactivated";

export type AccountLifecycleAction =
  | "pause"
  | "cancel"
  | "downgrade"
  | "deactivate"
  | "delete";

export type RetentionAlternativeId =
  | "pause"
  | "downgrade"
  | "keep_plan"
  | "talk_support"
  | "download_data"
  | "change_plan";

export type RetentionAlternative = {
  id: RetentionAlternativeId;
  title: string;
  description: string;
  href?: string;
  primary?: boolean;
};

export type AccountLifecycleRecord = {
  tenantId: string;
  status: AccountLifecycleStatus;
  requestedAction?: AccountLifecycleAction;
  reason?: string;
  selectedAlternative?: RetentionAlternativeId;
  resumeAt?: string;
  createdAt: string;
  updatedAt: string;
};

const LOSS_COPY: Record<AccountLifecycleAction, string> = {
  pause:
    "Your workspace stays intact. Team members can sign in, but paid features pause until you resume.",
  cancel:
    "You keep access until the end of the current billing period. After that you return to Free limits.",
  downgrade:
    "You keep your data. Some live channels, seats, and AI capacity may drop to the lower plan.",
  deactivate:
    "The workspace is hidden from the team. You can reactivate later from this account.",
  delete:
    "This permanently removes workspace access. Download your data first — we cannot recover it later.",
};

export function alternativesForAction(
  action: AccountLifecycleAction
): RetentionAlternative[] {
  const download: RetentionAlternative = {
    id: "download_data",
    title: "Download your data first",
    description: "Export contacts, deals, and account records before you change access.",
    href: "/settings#data-export",
  };
  const support: RetentionAlternative = {
    id: "talk_support",
    title: "Talk to us about an issue",
    description: "Billing, setup, or a missing feature — we can usually fix it without leaving.",
    href: "/contact",
  };
  const changePlan: RetentionAlternative = {
    id: "change_plan",
    title: "Compare plans",
    description: "See what you keep on Launch, Growth, or Scale before you decide.",
    href: "/billing",
    primary: true,
  };

  if (action === "pause") {
    return [
      changePlan,
      {
        id: "keep_plan",
        title: "Keep the current plan",
        description: "Stay on your plan and keep live channels and AI capacity.",
        href: "/billing",
      },
      download,
    ];
  }

  if (action === "downgrade") {
    return [
      changePlan,
      {
        id: "pause",
        title: "Pause instead of downgrading",
        description: "Keep your plan settings and come back later without losing paid setup.",
      },
      download,
      support,
    ];
  }

  if (action === "cancel") {
    return [
      {
        id: "pause",
        title: "Pause for now",
        description: "Stop billing temporarily and keep your workspace ready.",
        primary: true,
      },
      {
        id: "downgrade",
        title: "Switch to a smaller plan",
        description: "Keep CRM and your website draft without paying for unused capacity.",
        href: "/billing",
      },
      download,
      support,
    ];
  }

  if (action === "deactivate") {
    return [
      {
        id: "pause",
        title: "Pause the workspace instead",
        description: "Your team can return later without a full deactivation.",
        primary: true,
      },
      changePlan,
      download,
      support,
    ];
  }

  return [
    download,
    {
      id: "pause",
      title: "Deactivate later — pause today",
      description: "Keep a recovery path. Pause now and decide on deletion after you have your files.",
      primary: true,
    },
    support,
  ];
}

export function lossCopyForAction(action: AccountLifecycleAction): string {
  return LOSS_COPY[action];
}

export function nextStatusForAction(
  action: AccountLifecycleAction
): AccountLifecycleStatus {
  if (action === "pause") return "paused";
  if (action === "cancel") return "pending_cancel";
  if (action === "deactivate" || action === "delete") return "deactivated";
  return "active";
}

export function canProceedWithoutFriction(action: AccountLifecycleAction): boolean {
  return action === "pause" || action === "downgrade" || action === "cancel";
}
