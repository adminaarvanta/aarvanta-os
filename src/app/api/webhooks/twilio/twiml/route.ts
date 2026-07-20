import { NextResponse } from "next/server";
import { getVoiceRelayWssUrl } from "@/lib/channels/voice-relay";

/**
 * Twilio fetches this URL when a Voice OS call connects.
 * Default Twilio method is POST — supporting GET + POST avoids the
 * classic "An application error has occurred" 405 failure.
 *
 * When VOICE_RELAY_WSS_URL (or ONBOARDING_SIDECAR_URL host) is set,
 * returns ConversationRelay TwiML for two-way AI voice on EC2.
 * Otherwise falls back to one-shot <Say> TTS.
 */
export async function GET(req: Request) {
  return twimlResponse(req);
}

export async function POST(req: Request) {
  return twimlResponse(req);
}

async function twimlResponse(req: Request) {
  const url = new URL(req.url);
  let message = url.searchParams.get("message");
  const mode = url.searchParams.get("mode"); // "say" forces one-shot TTS

  if (!message && req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") ?? "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = await req.formData();
        const fromBody = form.get("message");
        if (typeof fromBody === "string" && fromBody.trim()) {
          message = fromBody;
        }
      }
    } catch {
      /* fall through */
    }
  }

  const spoken = (message?.trim() || "Hello from Aarvanta Voice OS.").slice(
    0,
    3500
  );

  const relayUrl = mode === "say" ? null : getVoiceRelayWssUrl();

  const twiml = relayUrl
    ? buildConversationRelayTwiml(relayUrl, spoken)
    : buildSayTwiml(spoken);

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function buildSayTwiml(spoken: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(spoken)}</Say>
</Response>`;
}

function buildConversationRelayTwiml(wssUrl: string, welcome: string) {
  // welcomeGreeting is spoken by Twilio; context param seeds the EC2 LLM.
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="${escapeXml(wssUrl)}" welcomeGreeting="${escapeXml(welcome)}" language="en-US" ttsProvider="Amazon" voice="Joanna-Neural" transcriptionProvider="Deepgram" interruptible="any">
      <Parameter name="context" value="${escapeXml(welcome.slice(0, 500))}" />
      <Parameter name="source" value="aarvanta-voice-os" />
    </ConversationRelay>
  </Connect>
</Response>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
