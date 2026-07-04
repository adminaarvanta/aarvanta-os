import { NextResponse } from "next/server";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getAllChannelStatuses } from "@/lib/channels/config";
import {
  checkGmailSyncAccess,
  getEmailInboundConfig,
} from "@/lib/channels/gmail-client";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import { getActiveDatastore, ensureDatastoreReady } from "@/lib/data/datastore";
import { isProductionMode } from "@/lib/config/app-mode";

export async function GET() {
  const mode = isProductionMode() ? "production" : "demo";
  const channels = getAllChannelStatuses();
  const ai = getAiRuntimeStatus();
  const gmailSyncStatus = await checkGmailSyncAccess();
  const emailInbound = { ...getEmailInboundConfig(), gmailSyncStatus };

  if (!isProductionMode()) {
    return NextResponse.json({
      status: "ok",
      mode,
      datastore: "memory",
      channels,
      ai,
      emailSync: gmailSyncStatus,
      emailInbound,
    });
  }

  await ensureDatastoreReady();
  const activeDatastore = getActiveDatastore();

  if (activeDatastore === "memory") {
    return NextResponse.json({
      status: "degraded",
      mode,
      datastore: "memory",
      firestore: "fallback",
      message:
        "Firestore unavailable (quota or connectivity). Serving demo data from memory until Firestore recovers.",
      channels,
      ai,
      emailSync: gmailSyncStatus,
      emailInbound,
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
          ai,
          emailSync: gmailSyncStatus,
          emailInbound,
        },
        { status: 503 }
      );
    }

    await db.collection("conversations").limit(1).get();

    return NextResponse.json({
      status: "ok",
      mode,
      datastore: "firestore",
      firestore: "connected",
      channels,
      ai,
      emailSync: gmailSyncStatus,
      emailInbound,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        mode,
        datastore: "firestore",
        firestore: "error",
        channels,
        ai,
        emailSync: gmailSyncStatus,
        emailInbound,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
