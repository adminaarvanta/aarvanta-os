import { LiveCallsPanel } from "@/components/voice/live-calls-panel";

export default function VoiceLivePage() {
  return (
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-foreground">Live Calls</h2>
        <p className="text-xs text-muted sm:text-sm">
          Real-time AI agent activity, transcript, and qualification
        </p>
      </header>
      <LiveCallsPanel />
    </>
  );
}

export const metadata = { title: "Voice OS · Live Calls" };
