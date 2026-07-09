import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getAllChannelStatuses } from "@/lib/channels/config";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
import { isProductionMode } from "@/lib/config/app-mode";

export type ReadinessItem = {
  id: string;
  label: string;
  status: "ok" | "warning" | "error";
  detail?: string;
};

export type ProductionReadiness = {
  ready: boolean;
  requiredMissing: string[];
  warnings: string[];
  items: ReadinessItem[];
};

function has(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

/** Non-secret production checklist for /api/health and settings. */
export function getProductionReadiness(): ProductionReadiness {
  if (!isProductionMode()) {
    return {
      ready: true,
      requiredMissing: [],
      warnings: [],
      items: [
        {
          id: "mode",
          label: "App mode",
          status: "ok",
          detail: "demo",
        },
      ],
    };
  }

  const required: Array<{ key: string; label: string }> = [
    { key: "AUTH_SECRET", label: "AUTH_SECRET" },
    { key: "AUTH_EMAIL", label: "AUTH_EMAIL" },
    { key: "AUTH_PASSWORD", label: "AUTH_PASSWORD" },
    { key: "TENANT_ID", label: "TENANT_ID" },
    { key: "WORKSPACE_ID", label: "WORKSPACE_ID" },
    { key: "COMPANY_ID", label: "COMPANY_ID" },
    { key: "NEXT_PUBLIC_APP_URL", label: "NEXT_PUBLIC_APP_URL" },
  ];

  const requiredMissing = required
    .filter(({ key }) => !has(process.env[key]))
    .map(({ label }) => label);

  const firebaseOk = isFirebaseConfigured();
  if (!firebaseOk) {
    requiredMissing.push(
      "FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY"
    );
  }

  const warnings: string[] = [];
  const items: ReadinessItem[] = [
    {
      id: "mode",
      label: "App mode",
      status: "ok",
      detail: "production",
    },
    ...required.map(({ key, label }) => ({
      id: key.toLowerCase(),
      label,
      status: has(process.env[key]) ? ("ok" as const) : ("error" as const),
    })),
    {
      id: "firebase",
      label: "Firebase Admin",
      status: firebaseOk ? "ok" : "error",
    },
  ];

  const ai = getAiRuntimeStatus();
  if (ai.status !== "live") {
    warnings.push("OPENAI_API_KEY not set — AI summaries and scoring disabled");
    items.push({
      id: "openai",
      label: "OpenAI",
      status: "warning",
      detail: ai.status === "disabled" ? ai.reason : ai.reason,
    });
  } else {
    items.push({
      id: "openai",
      label: "OpenAI",
      status: "ok",
      detail: ai.model,
    });
  }

  if (!has(process.env.CRON_SECRET)) {
    warnings.push("CRON_SECRET not set — email sync cron endpoint is unauthenticated");
    items.push({
      id: "cron_secret",
      label: "CRON_SECRET",
      status: "warning",
      detail: "Set to protect /api/cron/sync-email",
    });
  } else {
    items.push({
      id: "cron_secret",
      label: "CRON_SECRET",
      status: "ok",
    });
  }

  const channels = getAllChannelStatuses();
  const liveChannels = Object.entries(channels).filter(([, s]) => s === "live");
  if (liveChannels.length === 0) {
    warnings.push("No communication channels configured — inbox will be empty until webhooks run");
    items.push({
      id: "channels",
      label: "Communication channels",
      status: "warning",
      detail: "Configure WhatsApp, Twilio, or Gmail",
    });
  } else {
    items.push({
      id: "channels",
      label: "Communication channels",
      status: "ok",
      detail: liveChannels.map(([name]) => name).join(", "),
    });
  }

  const ready = requiredMissing.length === 0;

  return { ready, requiredMissing, warnings, items };
}
