import { NextResponse } from "next/server";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import {
  getAllChannelStatuses,
  getPublicWebhookUrls,
  getWhatsAppManagementStatus,
} from "@/lib/channels/config";
import { getVoiceRelayWssUrl } from "@/lib/channels/voice-relay";
import {
  getConversationRelayTts,
  isVoiceRelayBudgetMode,
} from "@/lib/channels/voice-relay-tts";
import {
  checkGmailSyncAccess,
  getEmailInboundConfig,
} from "@/lib/channels/gmail-client";
import { getProductionReadiness } from "@/lib/config/production-readiness";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import { getActiveDatastore, ensureDatastoreReady } from "@/lib/data/datastore";
import { isProductionMode } from "@/lib/config/app-mode";

function voiceRelayPayload() {
  const wssUrl = getVoiceRelayWssUrl();
  const tts = getConversationRelayTts();
  return {
    configured: Boolean(wssUrl),
    wssUrl,
    budgetMode: isVoiceRelayBudgetMode(),
    tts: { provider: tts.provider, voice: tts.voice },
  };
}

export async function GET() {
  const mode = isProductionMode() ? "production" : "demo";
  const channels = getAllChannelStatuses();
  const whatsappManagement = getWhatsAppManagementStatus();
  const webhooks = getPublicWebhookUrls();
  const ai = getAiRuntimeStatus();
  const gmailSyncStatus = await checkGmailSyncAccess();
  const emailInbound = { ...getEmailInboundConfig(), gmailSyncStatus };
  const readiness = getProductionReadiness();
  if (isProductionMode() && gmailSyncStatus === "error") {
    readiness.warnings.push(
      "Gmail login rejected — rotate GMAIL_APP_PASSWORD for GMAIL_USER. Outbound mail and IMAP sync fail until then."
    );
    readiness.items.push({
      id: "gmail_auth",
      label: "Gmail IMAP/SMTP",
      status: "error",
      detail: "Login rejected. Rotate GMAIL_APP_PASSWORD.",
    });
  }

  if (!isProductionMode()) {
    return NextResponse.json({
      status: "ok",
      mode,
      datastore: "memory",
      channels,
      whatsappManagement,
      webhooks,
      voiceRelay: voiceRelayPayload(),
      ai,
      emailSync: gmailSyncStatus,
      emailInbound,
      readiness,
    });
  }

  await ensureDatastoreReady();
  const activeDatastore = getActiveDatastore();

  if (!readiness.ready) {
    return NextResponse.json(
      {
        status: "degraded",
        mode,
        datastore: activeDatastore,
        firestore: isFirebaseConfigured() ? "not_ready" : "not_configured",
        message: `Missing required configuration: ${readiness.requiredMissing.join(", ")}`,
        channels,
        whatsappManagement,
        webhooks,
        voiceRelay: voiceRelayPayload(),
        ai,
        emailSync: gmailSyncStatus,
        emailInbound,
        readiness,
      },
      { status: 503 }
    );
  }

  if (activeDatastore === "memory") {
    return NextResponse.json({
      status: "degraded",
      mode,
      datastore: "memory",
      firestore: "fallback",
      message:
        "Firestore unavailable (quota or connectivity). Serving demo data from memory until Firestore recovers.",
      channels,
      whatsappManagement,
      webhooks,
      voiceRelay: voiceRelayPayload(),
      ai,
      emailSync: gmailSyncStatus,
      emailInbound,
      readiness,
    });
  }

  try {
    const db = getAdminFirestore();
    if (!db || !isFirebaseConfigured()) {
      return NextResponse.json(
        {
          status: "degraded",
          mode,
          datastore: "firestore",
          firestore: "not_configured",
          channels,
          whatsappManagement,
          webhooks,
          voiceRelay: voiceRelayPayload(),
          ai,
          emailSync: gmailSyncStatus,
          emailInbound,
          readiness,
        },
        { status: 503 }
      );
    }

    await db.collection("conversations").limit(1).get();

    return NextResponse.json({
      status: readiness.warnings.length > 0 ? "degraded" : "ok",
      mode,
      datastore: "firestore",
      firestore: "connected",
      channels,
      whatsappManagement,
      webhooks,
      voiceRelay: voiceRelayPayload(),
      ai,
      emailSync: gmailSyncStatus,
      emailInbound,
      readiness,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        mode,
        datastore: "firestore",
        firestore: "error",
        channels,
        whatsappManagement,
        webhooks,
        voiceRelay: voiceRelayPayload(),
        ai,
        emailSync: gmailSyncStatus,
        emailInbound,
        readiness,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
