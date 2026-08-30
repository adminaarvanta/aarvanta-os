import { NextResponse } from "next/server";
import { processEmailSendQueue } from "@/lib/email-outreach/send-queue";

export const runtime = "nodejs";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Sends pending Email Outreach queue items via Brevo. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processEmailSendQueue(20);
  return NextResponse.json({
    processed: results.length,
    sent: results.filter((r) => r.ok).length,
    simulated: results.filter((r) => r.simulated).length,
    results,
  });
}
