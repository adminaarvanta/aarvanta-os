import { getAiRuntimeStatus } from "@/lib/ai/config";
import { isSsoConfigured } from "@/lib/auth/sso-oidc";
import { getAllChannelStatuses } from "@/lib/channels/config";
import type { GmailSyncAccess } from "@/lib/channels/gmail-client";
import {
  getVoiceRelayWssUrl,
  isVoiceRelayConfigured,
} from "@/lib/channels/voice-relay";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
import { isProductionMode } from "@/lib/config/app-mode";
import { getNameComRuntimeStatus } from "@/lib/registrars/namecom-config";
import { getOpenSrsRuntimeStatus } from "@/lib/registrars/opensrs-config";
import { getStripePublishableKey, getStripeRuntimeStatus } from "@/lib/stripe/config";

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

/**
 * channels.email=live only means GMAIL_* env is set.
 * emailSync is the real mailbox-login check for outbound mail.
 */
export function withGmailAuthReadiness(
  readiness: ProductionReadiness,
  gmailSyncStatus: GmailSyncAccess
): ProductionReadiness {
  if (!isProductionMode() || gmailSyncStatus !== "error") return readiness;
  if (readiness.items.some((item) => item.id === "gmail_auth")) {
    return readiness;
  }
  return {
    ...readiness,
    warnings: [
      ...readiness.warnings,
      "Gmail login rejected — set GMAIL_APP_PASSWORD for admin@aarvanta.co. channels.email can stay live (env set) while emailSync=error; outbound mail fails until then.",
    ],
    items: [
      ...readiness.items,
      {
        id: "gmail_auth",
        label: "Gmail IMAP/SMTP",
        status: "error",
        detail:
          "Login rejected. Set GMAIL_APP_PASSWORD for admin@aarvanta.co. Do not treat channels.email=live as mail working.",
      },
    ],
  };
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
    warnings.push(
      "CRON_SECRET not set — cron endpoints (email, scheduled calls, campaigns, reminders) are unauthenticated"
    );
    items.push({
      id: "cron_secret",
      label: "CRON_SECRET",
      status: "warning",
      detail: "Set to protect /api/cron/*",
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

  // WhatsApp OS — outbound + webhook secrets
  const waOutbound = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
  const waWebhook = Boolean(
    process.env.WHATSAPP_VERIFY_TOKEN?.trim() &&
      process.env.WHATSAPP_APP_SECRET?.trim()
  );
  if (channels.whatsapp === "live") {
    items.push({
      id: "whatsapp_os",
      label: "WhatsApp OS",
      status: "ok",
      detail: "Outbound Graph API + inbound webhooks ready",
    });
  } else if (waOutbound && !waWebhook) {
    warnings.push(
      "WhatsApp outbound token set but WHATSAPP_VERIFY_TOKEN / WHATSAPP_APP_SECRET missing — inbound webhooks will fail in production"
    );
    items.push({
      id: "whatsapp_os",
      label: "WhatsApp OS",
      status: "warning",
      detail: "Add verify token + app secret for production webhooks",
    });
  } else if (!waOutbound) {
    items.push({
      id: "whatsapp_os",
      label: "WhatsApp OS",
      status: "warning",
      detail: "Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID",
    });
  }

  // Voice OS — Twilio + public URL for TwiML / signatures
  if (channels.voice === "live") {
    const relay = isVoiceRelayConfigured();
    items.push({
      id: "voice_os",
      label: "Voice OS",
      status: "ok",
      detail: relay
        ? `Twilio Voice + ConversationRelay (${getVoiceRelayWssUrl()})`
        : "Twilio Voice + one-shot TTS (set VOICE_RELAY_WSS_URL for two-way AI)",
    });
    if (!relay) {
      warnings.push(
        "VOICE_RELAY_WSS_URL not set — Voice OS uses one-shot TTS; deploy voice-relay on EC2 for two-way AI"
      );
      items.push({
        id: "voice_relay",
        label: "Voice Relay",
        status: "warning",
        detail:
          "Deploy services/voice-relay on EC2 and set VOICE_RELAY_WSS_URL=wss://…/voice-relay/ws",
      });
    } else {
      items.push({
        id: "voice_relay",
        label: "Voice Relay",
        status: "ok",
        detail: "ConversationRelay WebSocket configured",
      });
    }
  } else if (
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_PHONE_NUMBER?.trim() &&
    !process.env.NEXT_PUBLIC_APP_URL?.trim()
  ) {
    warnings.push(
      "Twilio credentials set but NEXT_PUBLIC_APP_URL missing — Voice OS TwiML and signature checks will fail"
    );
    items.push({
      id: "voice_os",
      label: "Voice OS",
      status: "warning",
      detail: "Set NEXT_PUBLIC_APP_URL for TwiML and Twilio signatures",
    });
  } else {
    items.push({
      id: "voice_os",
      label: "Voice OS",
      status: "warning",
      detail: "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER",
    });
  }

  const gcalClient =
    has(process.env.GOOGLE_CALENDAR_CLIENT_ID) ||
    has(process.env.SSO_GOOGLE_CLIENT_ID);
  const gcalSecret =
    has(process.env.GOOGLE_CALENDAR_CLIENT_SECRET) ||
    has(process.env.SSO_GOOGLE_CLIENT_SECRET);
  if (gcalClient && gcalSecret) {
    items.push({
      id: "google_calendar",
      label: "Google Calendar",
      status: "ok",
      detail: "OAuth client configured for AI meeting booking",
    });
  } else {
    warnings.push(
      "Google Calendar OAuth not set — AI booking uses local availability until GOOGLE_CALENDAR_CLIENT_ID/SECRET are configured"
    );
    items.push({
      id: "google_calendar",
      label: "Google Calendar",
      status: "warning",
      detail: "Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET",
    });
  }

  const stripe = getStripeRuntimeStatus();
  if (stripe.status !== "live") {
    warnings.push("STRIPE_SECRET_KEY not set — Billing and Build OS checkout use demo fallback");
    items.push({
      id: "stripe",
      label: "Stripe",
      status: "warning",
      detail: stripe.reason,
    });
  } else {
    items.push({
      id: "stripe",
      label: "Stripe",
      status: "ok",
      detail: stripe.mode,
    });
    if (!has(process.env.STRIPE_WEBHOOK_SECRET)) {
      warnings.push("STRIPE_WEBHOOK_SECRET not set — renewals and dunning will not sync");
      items.push({
        id: "stripe_webhook",
        label: "STRIPE_WEBHOOK_SECRET",
        status: "error",
        detail: "Required for production billing",
      });
    }
    if (!getStripePublishableKey()) {
      warnings.push("Stripe publishable key missing — Checkout still works server-side");
      items.push({
        id: "stripe_pk",
        label: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        status: "warning",
      });
    }
  }

  const namecom = getNameComRuntimeStatus();
  if (namecom.status !== "live") {
    warnings.push(
      "name.com not configured — Build OS domain search/purchase uses demo catalog unless OpenSRS is set"
    );
    items.push({
      id: "namecom",
      label: "name.com domain reseller",
      status: "warning",
      detail: namecom.reason,
    });
  } else {
    items.push({
      id: "namecom",
      label: "name.com domain reseller",
      status: "ok",
      detail: namecom.env,
    });
  }

  const opensrs = getOpenSrsRuntimeStatus();
  if (opensrs.status !== "live") {
    if (namecom.status !== "live") {
      warnings.push(
        "No live domain registrar — Build OS domain search/purchase uses the demo catalog (no real registrations)"
      );
    }
    items.push({
      id: "opensrs",
      label: "OpenSRS domain reseller (fallback)",
      status: namecom.status === "live" ? "ok" : "warning",
      detail:
        namecom.status === "live"
          ? "Idle — name.com is primary"
          : opensrs.reason,
    });
  } else {
    items.push({
      id: "opensrs",
      label: "OpenSRS domain reseller (fallback)",
      status: "ok",
      detail:
        namecom.status === "live"
          ? `${opensrs.env} (name.com preferred)`
          : opensrs.env,
    });
  }

  const googleSso =
    isSsoConfigured("google") &&
    has(process.env.SSO_GOOGLE_CLIENT_SECRET);
  if (!googleSso) {
    warnings.push(
      "Google OAuth not set — Continue with Google is hidden until SSO_GOOGLE_ISSUER, SSO_GOOGLE_CLIENT_ID, and SSO_GOOGLE_CLIENT_SECRET are configured"
    );
    items.push({
      id: "google_sso",
      label: "Google sign-in / sign-up",
      status: "warning",
      detail:
        "Set SSO_GOOGLE_ISSUER, SSO_GOOGLE_CLIENT_ID, SSO_GOOGLE_CLIENT_SECRET",
    });
  } else {
    items.push({
      id: "google_sso",
      label: "Google sign-in / sign-up",
      status: "ok",
    });
  }

  const ready = requiredMissing.length === 0;

  return { ready, requiredMissing, warnings, items };
}
