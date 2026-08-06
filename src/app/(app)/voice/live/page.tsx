import { LiveCallsPanel } from "@/components/voice/live-calls-panel";
import { VoicePageShell } from "@/components/voice/voice-ui";

export default function VoiceLivePage() {
  return (
    <VoicePageShell
      title="Live Calls"
      subtitle="Real-time AI agent activity, transcript, and qualification"
      tone="cyan"
    >
      <LiveCallsPanel />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Live Calls" };
