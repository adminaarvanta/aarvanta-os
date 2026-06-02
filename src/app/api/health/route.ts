import { NextResponse } from "next/server";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import { isProductionMode } from "@/lib/config/app-mode";

export async function GET() {
  const mode = isProductionMode() ? "production" : "demo";

  if (!isProductionMode()) {
    return NextResponse.json({
      status: "ok",
      mode,
      datastore: "memory",
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        mode,
        datastore: "firestore",
        firestore: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
