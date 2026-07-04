import { NextResponse } from "next/server";
import { syncGmailInbox } from "@/lib/channels/gmail-sync";
import { isGmailConfigured } from "@/lib/channels/gmail-client";
import { requirePermission } from "@/lib/tenant/context";

/** Manual inbox sync for authenticated workspace admins. */
export async function POST() {
  try {
    await requirePermission("workspace:manage");

    if (!isGmailConfigured()) {
      return NextResponse.json(
        { error: "Gmail is not configured" },
        { status: 503 }
      );
    }

    const result = await syncGmailInbox();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    const status =
      message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
