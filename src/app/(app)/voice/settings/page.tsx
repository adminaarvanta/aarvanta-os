import Link from "next/link";
import { ScheduleDefaultsPanel } from "@/components/voice/schedule-defaults-panel";
import {
  TeamCalendars,
  UserCalendarProvider,
  UserCalendarStatus,
} from "@/components/voice/user-calendar-panel";
import { VoiceConfigPanel } from "@/components/voice/voice-config-panel";
import { VoicePageShell, VoicePrimaryButton } from "@/components/voice/voice-ui";

export default function VoiceSettingsPage() {
  return (
    <VoicePageShell
      title="Settings"
      subtitle="Voice TTS, recording prefs, default call times, and your calendar"
      tone="slate"
      actions={
        <VoicePrimaryButton href="/voice/dialer">Open dialer</VoicePrimaryButton>
      }
    >
      <UserCalendarProvider>
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
          <p className="text-sm text-muted">
            Place outbound calls from{" "}
            <Link href="/voice/dialer" className="font-medium text-gold hover:underline">
              Dialer
            </Link>
            . Any active user can connect their own calendar below or from{" "}
            <Link href="/voice/calendar" className="font-medium text-gold hover:underline">
              Calendar
            </Link>
            .
          </p>
          <UserCalendarStatus />
          <VoiceConfigPanel />
          <ScheduleDefaultsPanel />
          <div className="mt-auto">
            <TeamCalendars />
          </div>
        </div>
      </UserCalendarProvider>
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Settings" };
