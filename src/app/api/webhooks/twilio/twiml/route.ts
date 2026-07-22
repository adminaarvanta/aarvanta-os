import { NextResponse } from "next/server";
import { getVoiceRelayWssUrl } from "@/lib/channels/voice-relay";

/**
 * Twilio fetches this URL when a Voice OS call connects (inbound or outbound).
 * Supports GET + POST (Twilio defaults to POST).
 *
 * When VOICE_RELAY_WSS_URL is set → ConversationRelay two-way AI on EC2.
 * Otherwise → one-shot <Say> TTS.
 *
 * Query params:
 * - message / goal — spoken welcome + LLM context
 * - mode=say — force one-shot TTS
 * - direction=inbound|outbound
 * - conversationId — for transcript callback correlation
 */
export async function GET(req: Request) {
  return twimlResponse(req);
}

export async function POST(req: Request) {
  return twimlResponse(req);
}

async function twimlResponse(req: Request) {
  const url = new URL(req.url);
  let message = url.searchParams.get("message") ?? url.searchParams.get("goal");
  const mode = url.searchParams.get("mode");
  let direction = url.searchParams.get("direction") ?? "";
  let conversationId = url.searchParams.get("conversationId") ?? "";

  if (req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") ?? "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = await req.formData();
        const fromBody = form.get("message");
        if (!message && typeof fromBody === "string" && fromBody.trim()) {
          message = fromBody;
        }
        // Inbound calls: Twilio posts CallSid, From, To, Direction, etc.
        const twilioDirection = form.get("Direction");
        if (!direction && typeof twilioDirection === "string") {
          direction = twilioDirection.toLowerCase().startsWith("outbound")
            ? "outbound"
            : "inbound";
        }
        if (!direction) {
          // No Direction on our outbound Url fetch sometimes — default by presence of To/From
          direction = "inbound";
        }
      }
    } catch {
      /* fall through */
    }
  }

  if (!direction) direction = "outbound";

  const defaultWelcome =
    direction === "inbound"
      ? "Thanks for calling Aarvanta. How can I help you today?"
      : "Hello, this is Aarvanta calling. Do you have a moment to talk?";

  const spoken = (message?.trim() || defaultWelcome).slice(0, 3500);
  const relayUrl = mode === "say" ? null : getVoiceRelayWssUrl();

  const twiml = relayUrl
    ? buildConversationRelayTwiml(relayUrl, spoken, {
        direction,
        conversationId,
        goal: spoken,
      })
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

function buildConversationRelayTwiml(
  wssUrl: string,
  welcome: string,
  params: { direction: string; conversationId: string; goal: string }
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="${escapeXml(wssUrl)}" welcomeGreeting="${escapeXml(welcome)}" language="en-US" ttsProvider="Amazon" voice="Joanna-Neural" transcriptionProvider="Deepgram" interruptible="any">
      <Parameter name="goal" value="${escapeXml(params.goal.slice(0, 500))}" />
      <Parameter name="direction" value="${escapeXml(params.direction)}" />
      <Parameter name="conversationId" value="${escapeXml(params.conversationId)}" />
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
