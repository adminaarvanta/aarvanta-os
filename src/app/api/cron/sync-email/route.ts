import { NextResponse } from "next/server";
import { syncGmailInbox } from "@/lib/channels/gmail-sync";
import { isGmailConfigured } from "@/lib/channels/gmail-client";

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGmailConfigured()) {
    return NextResponse.json(
      { error: "Gmail is not configured" },
      { status: 503 }
    );
  }

  try {
    const result = await syncGmailInbox();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
