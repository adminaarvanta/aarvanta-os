import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";

type RouteContext = { params: Promise<{ sid: string }> };

/**
 * Authenticated proxy for Twilio recording media (avoids exposing Twilio creds).
 */
export async function GET(_req: Request, context: RouteContext) {
  try {
    await getSessionContext();
  } catch {
    return unauthorized();
  }

  const { sid } = await context.params;
  const recordingSid = sid?.trim();
  if (!recordingSid || !/^RE[a-f0-9]{32}$/i.test(recordingSid)) {
    return NextResponse.json({ error: "Invalid recording id" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
  }

  const mediaUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
  const res = await fetch(mediaUrl, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Twilio media ${res.status}` },
      { status: res.status === 404 ? 404 : 502 }
    );
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
