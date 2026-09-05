import { CalendarSlotPicker } from "@/components/voice/calendar-slot-picker";
import { UserCalendarPanel } from "@/components/voice/user-calendar-panel";
import { VoicePageShell } from "@/components/voice/voice-ui";

export default async function VoiceCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ gcal?: string; leadId?: string }>;
}) {
  const params = await searchParams;

  return (
    <VoicePageShell
      title="Calendar"
      subtitle="Connect your own calendar, sync availability, and book AI meetings"
      tone="amber"
    >
      <div className="space-y-4 p-4 sm:p-6">
        {params.gcal === "connected" ? (
          <p className="rounded-xl border border-[rgba(18,163,106,0.3)] bg-[var(--chart-ai-soft)] px-3 py-2 text-sm text-[var(--chart-ai)]">
            Your Google Calendar is connected and syncing with Voice OS.
          </p>
        ) : null}
        {params.gcal === "error" ? (
          <p className="rounded-xl border border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.08)] px-3 py-2 text-sm text-[var(--chart-lost)]">
            Google Calendar connection failed. Check OAuth credentials or try
            again.
          </p>
        ) : null}
        <UserCalendarPanel />
        <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
          <p className="text-sm font-semibold text-foreground">
            Availability preview
          </p>
          <p className="mt-0.5 mb-4 text-xs text-muted">
            Slots respect your connected calendar when Google is live; demo
            mode uses local Voice OS meetings.
          </p>
          <CalendarSlotPicker leadId={params.leadId} />
        </div>
      </div>
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Calendar" };
