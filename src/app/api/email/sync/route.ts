import { NextResponse } from "next/server";
import { syncInboxEmailIfConfigured } from "@/lib/channels/sync-inbox-email";
import { getTenantScope } from "@/lib/tenant/context";

/** Manual or polled inbox sync for any signed-in workspace member. */
export async function POST() {
  try {
    await getTenantScope();

    const result = await syncInboxEmailIfConfigured();
    if (!result.ran) {
      return NextResponse.json(
        { error: "Gmail is not configured", reason: result.reason },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  return POST();
}
