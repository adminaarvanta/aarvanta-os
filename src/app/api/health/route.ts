import { NextResponse } from "next/server";
import { getAllChannelStatuses } from "@/lib/channels/config";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import { isProductionMode } from "@/lib/config/app-mode";

export async function GET() {
  const mode = isProductionMode() ? "production" : "demo";
  const channels = getAllChannelStatuses();

  if (!isProductionMode()) {
    return NextResponse.json({
      status: "ok",
      mode,
      datastore: "memory",
      channels,
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        mode,
        datastore: "firestore",
        firestore: "error",
        channels,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
