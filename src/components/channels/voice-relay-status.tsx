import { isVoiceRelayConfigured, getVoiceRelayWssUrl } from "@/lib/channels/voice-relay";

/** Server component badge for Voice OS header */
export function VoiceRelayStatusBadge() {
  const configured = isVoiceRelayConfigured();
  const url = getVoiceRelayWssUrl();

  return (
    <p
      className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
        configured
          ? "border-success/30 bg-success/10 text-success"
          : "border-gold/30 bg-gold/10 text-gold-bright"
      }`}
      role="status"
    >
      {configured ? (
        <>
          <span className="font-semibold">Two-way AI voice ready</span>
          {" · "}
          ConversationRelay → {url}
        </>
      ) : (
        <>
          <span className="font-semibold">One-shot TTS only</span>
          {" · "}
          Deploy <code className="text-[10px]">services/voice-relay</code> on EC2 and set{" "}
          <code className="text-[10px]">VOICE_RELAY_WSS_URL</code> for two-way AI.
          See docs/VOICE_RELAY.md.
        </>
      )}
    </p>
  );
}
