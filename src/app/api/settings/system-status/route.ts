import { NextResponse } from "next/server";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getAllChannelStatuses } from "@/lib/channels/config";
import { checkGmailSyncAccess } from "@/lib/channels/gmail-client";
import { getActiveDatastore } from "@/lib/data/datastore";
import { getProductionReadiness } from "@/lib/config/production-readiness";
import { isProductionMode } from "@/lib/config/app-mode";
import { getSessionContext } from "@/lib/tenant/context";

/** On-demand system status for Settings — not loaded by default. */
export async function GET() {
  try {
    await getSessionContext();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [emailSync] = await Promise.all([checkGmailSyncAccess()]);

  return NextResponse.json({
    mode: isProductionMode() ? "production" : "demo",
    datastore: getActiveDatastore(),
    ai: getAiRuntimeStatus(),
    channels: getAllChannelStatuses(),
    emailSync,
    readiness: getProductionReadiness(),
  });
}
