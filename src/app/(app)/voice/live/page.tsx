import { LiveCallsPanel } from "@/components/voice/live-calls-panel";
import { VoicePageShell } from "@/components/voice/voice-ui";

export default function VoiceLivePage() {
  return (
    <VoicePageShell
      title="Live Calls"
      subtitle="Who is ringing, connecting, or on the line — plus stuck sessions that never connected"
      tone="cyan"
    >
      <LiveCallsPanel />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Live Calls" };
