import { NextResponse } from "next/server";

/**
 * Twilio SMS/Voice webhook stub.
 * Parse From/Body or CallSid and append to conversation timeline.
 */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let data: Record<string, string> = {};

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    form.forEach((value, key) => {
      data[key] = String(value);
    });
  } else {
    data = await req.json();
  }

  console.info("[twilio webhook]", data);
  return NextResponse.json({ received: true });
}
