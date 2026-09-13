import { CalendarSlotPicker } from "@/components/voice/calendar-slot-picker";
import {
  TeamCalendars,
  UserCalendarProvider,
  UserCalendarStatus,
} from "@/components/voice/user-calendar-panel";
import { VoicePageShell } from "@/components/voice/voice-ui";

export default async function VoiceCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ gcal?: "connected" | "error" | "denied"; leadId?: string }>;
}) {
  const params = await searchParams;

  return (
    <VoicePageShell
      title="Calendar"
      subtitle="Connect your own calendar, sync availability, and book AI meetings"
      tone="amber"
    >
      <UserCalendarProvider>
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
          {params.gcal === "connected" ? (
            <p className="rounded-xl border border-[rgba(18,163,106,0.3)] bg-[var(--chart-ai-soft)] px-3 py-2 text-sm text-[var(--chart-ai)]">
              Your Google Calendar is connected and syncing with Voice OS.
            </p>
          ) : null}
          {params.gcal === "denied" ? (
            <p className="rounded-xl border border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.08)] px-3 py-2 text-sm text-[var(--chart-lost)]">
              Google blocked the sign-in because Aarvanta has not finished
              Google’s verification. Paste your secret iCal link below to sync
              availability without that Google screen.
            </p>
          ) : null}
          {params.gcal === "error" ? (
            <p className="rounded-xl border border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.08)] px-3 py-2 text-sm text-[var(--chart-lost)]">
              Google Calendar sign-in failed. Try again, or paste your secret
              iCal link below.
            </p>
          ) : null}
          <UserCalendarStatus />
          <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
            <p className="text-sm font-semibold text-foreground">
              Availability preview
            </p>
            <p className="mt-0.5 mb-4 text-xs text-muted">
              Slots respect a connected Google account or secret iCal link.
              Demo mode uses local Voice OS meetings until a live feed is
              connected.
            </p>
            <CalendarSlotPicker leadId={params.leadId} />
          </div>
          <div className="mt-auto">
            <TeamCalendars />
          </div>
        </div>
      </UserCalendarProvider>
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Calendar" };
