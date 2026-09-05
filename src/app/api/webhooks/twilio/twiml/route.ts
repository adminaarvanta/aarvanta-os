import { NextResponse } from "next/server";
import { resolveCallVoiceAgent } from "@/lib/calling/resolve-voice-agent";
import { liveClonedVoiceId } from "@/lib/channels/cloned-voice";
import { resolveVoiceCallingConfig } from "@/lib/channels/voice-calling-config";
import { getVoiceRelayWssUrl } from "@/lib/channels/voice-relay";
import { isVoiceRelayBudgetMode } from "@/lib/channels/voice-relay-tts";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { getWebhookTenantScope } from "@/lib/tenant/context";

/**
 * Twilio fetches this URL when a Voice OS call connects (inbound or outbound).
 * Supports GET + POST (Twilio defaults to POST).
 *
 * When VOICE_RELAY_WSS_URL is set → ConversationRelay two-way AI on EC2.
 * Otherwise → one-shot <Say> TTS.
 *
 * Query params:
 * - message / goal — briefing (topic/context) for the AI; never spoken verbatim
 *   (capped at 1000 chars for ConversationRelay). In one-shot <Say> fallback
 *   (no relay) it IS spoken, since there is no AI.
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
  const conversationId = url.searchParams.get("conversationId") ?? "";
  const campaignId = url.searchParams.get("campaignId") ?? "";
  const queueId = url.searchParams.get("queueId") ?? "";
  const sessionId = url.searchParams.get("sessionId") ?? "";
  const contactId = url.searchParams.get("contactId") ?? "";
  const voiceAgentId = url.searchParams.get("voiceAgentId") ?? "";

  if (req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") ?? "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = await req.formData();
        const fromBody = form.get("message");
        if (!message && typeof fromBody === "string" && fromBody.trim()) {
          message = fromBody;
        }
        const twilioDirection = form.get("Direction");
        if (!direction && typeof twilioDirection === "string") {
          direction = twilioDirection.toLowerCase().startsWith("outbound")
            ? "outbound"
            : "inbound";
        }
        if (!direction) {
          direction = "inbound";
        }
      }
    } catch {
      /* fall through */
    }
  }

  if (!direction) direction = "outbound";

  const scope = getWebhookTenantScope();
  const settings = await getWorkspaceSettings(scope.workspaceId);
  const voice = resolveVoiceCallingConfig(settings);

  const agent = await resolveCallVoiceAgent(scope, {
    voiceAgentId,
    campaignId,
  });
  const resolvedAgentId = agent?.id ?? "";
  const clonedOnCall = Boolean(liveClonedVoiceId(agent));
  // Workspace Relay locale — never the agent picker. An agent language like
  // `multi` or an unsupported code with Amazon/Google ends the Twilio session.
  const language = voice.language;

  const businessName = settings.businessName?.trim() || "Aarvanta";
  const defaultWelcome =
    direction === "inbound"
      ? `Hi, thanks for calling ${businessName}. How can I help?`
      : `Hi, this is ${businessName}. Do you have a moment?`;

  const brief = message?.trim() ?? "";
  const goal = brief.slice(0, 1000);
  const relayUrl =
    mode === "say" || isVoiceRelayBudgetMode() ? null : getVoiceRelayWssUrl();

  let welcome = direction === "inbound" ? defaultWelcome : "";
  if (clonedOnCall) {
    // Cloned playback is ConversationRelay `play` from the EC2 relay.
    // Skip catalog welcomeGreeting so the first spoken audio is the clone.
    welcome = "";
  } else if (voice.callRecordingEnabled && voice.callRecordingAnnounce) {
    welcome = welcome
      ? `${voice.recordingNotice} ${welcome}`
      : voice.recordingNotice;
  }

  const twiml = relayUrl
    ? buildConversationRelayTwiml(relayUrl, welcome, {
        direction,
        conversationId,
        goal,
        businessName,
        language,
        provider: voice.provider,
        voiceId: voice.voice,
        elevenlabsTextNormalization: voice.elevenlabsTextNormalization,
        campaignId,
        queueId,
        sessionId,
        contactId,
        voiceAgentId: resolvedAgentId,
        skipOpening: Boolean(welcome),
      })
    : buildSayTwiml(
        (brief || welcome || defaultWelcome).slice(0, 280),
        voice.provider === "Amazon" ? voice.voice : "Polly.Joanna"
      );

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function buildSayTwiml(spoken: string, pollyVoice: string) {
  const voiceAttr = pollyVoice.startsWith("Polly.")
    ? pollyVoice
    : `Polly.${pollyVoice.replace(/-Neural$/, "")}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${escapeXml(voiceAttr)}">${escapeXml(spoken)}</Say>
</Response>`;
}

function buildConversationRelayTwiml(
  wssUrl: string,
  welcome: string,
  params: {
    direction: string;
    conversationId: string;
    goal: string;
    businessName: string;
    language: string;
    provider: string;
    voiceId: string;
    elevenlabsTextNormalization: string;
    campaignId?: string;
    queueId?: string;
    sessionId?: string;
    contactId?: string;
    voiceAgentId?: string;
    skipOpening?: boolean;
  }
) {
  const elevenNorm =
    params.provider === "ElevenLabs"
      ? ` elevenlabsTextNormalization="${escapeXml(params.elevenlabsTextNormalization)}"`
      : "";
  const welcomeAttr = welcome ? ` welcomeGreeting="${escapeXml(welcome)}"` : "";
  const extra = [
    params.campaignId
      ? `<Parameter name="campaignId" value="${escapeXml(params.campaignId)}" />`
      : "",
    params.queueId
      ? `<Parameter name="queueId" value="${escapeXml(params.queueId)}" />`
      : "",
    params.sessionId
      ? `<Parameter name="sessionId" value="${escapeXml(params.sessionId)}" />`
      : "",
    params.contactId
      ? `<Parameter name="contactId" value="${escapeXml(params.contactId)}" />`
      : "",
    params.voiceAgentId
      ? `<Parameter name="voiceAgentId" value="${escapeXml(params.voiceAgentId)}" />`
      : "",
    params.skipOpening
      ? `<Parameter name="skipOpening" value="true" />`
      : "",
  ]
    .filter(Boolean)
    .join("\n      ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="${escapeXml(wssUrl)}"${welcomeAttr} language="${escapeXml(params.language)}" ttsProvider="${escapeXml(params.provider)}" voice="${escapeXml(params.voiceId)}"${elevenNorm} transcriptionProvider="Deepgram" interruptible="any">
      <Parameter name="goal" value="${escapeXml(params.goal)}" />
      <Parameter name="direction" value="${escapeXml(params.direction)}" />
      <Parameter name="conversationId" value="${escapeXml(params.conversationId)}" />
      <Parameter name="businessName" value="${escapeXml(params.businessName)}" />
      <Parameter name="language" value="${escapeXml(params.language)}" />
      <Parameter name="source" value="aarvanta-voice-os" />
      ${extra}
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
