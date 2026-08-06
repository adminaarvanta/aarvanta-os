import { VoiceOsNav } from "@/components/voice/voice-os-nav";

export default function VoiceOsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[rgba(26,47,89,0.04)] via-background to-[rgba(168,137,79,0.05)]">
      <VoiceOsNav />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
    </div>
  );
}
