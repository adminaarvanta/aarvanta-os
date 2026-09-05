import { NextResponse } from "next/server";
import { runCampaignScheduler } from "@/lib/calling/campaign-scheduler";
import { sweepStaleSessions } from "@/lib/calling/sweep-stale-sessions";

export const runtime = "nodejs";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Picks eligible campaign queue leads and initiates outbound AI calls. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sweep = await sweepStaleSessions();
  const results = await runCampaignScheduler(10);
  return NextResponse.json({
    processed: results.length,
    dialed: results.filter((r) => r.ok).length,
    swept: sweep,
    results,
  });
}
