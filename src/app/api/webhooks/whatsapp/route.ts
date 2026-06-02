import { NextResponse } from "next/server";

/**
 * WhatsApp Cloud API webhook stub.
 * Verify token + ingest inbound messages once Meta credentials are configured.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  const payload = await req.json();
  // TODO: map payload → conversation/message in Firestore
  console.info("[whatsapp webhook]", JSON.stringify(payload).slice(0, 500));
  return NextResponse.json({ received: true });
}
