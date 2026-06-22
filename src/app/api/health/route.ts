import { NextResponse } from "next/server";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getAllChannelStatuses } from "@/lib/channels/config";
import {
  checkResendReceivingAccess,
  getEmailInboundConfig,
} from "@/lib/channels/resend-client";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import { getActiveDatastore, ensureDatastoreReady } from "@/lib/data/datastore";
import { isProductionMode } from "@/lib/config/app-mode";

export async function GET() {
  const mode = isProductionMode() ? "production" : "demo";
  const channels = getAllChannelStatuses();
  const ai = getAiRuntimeStatus();
  const receivingStatus = await checkResendReceivingAccess();
  const emailInbound = { ...getEmailInboundConfig(), receivingStatus };

  if (!isProductionMode()) {
    return NextResponse.json({
      status: "ok",
      mode,
      datastore: "memory",
      channels,
      ai,
      emailReceiving: receivingStatus,
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
      emailReceiving: receivingStatus,
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
          emailReceiving: receivingStatus,
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
      emailReceiving: receivingStatus,
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
        emailReceiving: receivingStatus,
        emailInbound,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
