import Link from "next/link";
import { CalendarSlotPicker } from "@/components/voice/calendar-slot-picker";
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
      subtitle="Availability for AI booking — Google Calendar FreeBusy when connected"
      tone="amber"
      actions={
        <Link
          href="/api/integrations/google-calendar/oauth/start"
          className="rounded-xl bg-[var(--navy)] px-3 py-2 text-sm font-semibold text-white dark:bg-gold dark:text-[var(--navy)]"
        >
          Connect Google Calendar
        </Link>
      }
    >
      <div className="space-y-3 p-4 sm:p-6">
        {params.gcal === "connected" ? (
          <p className="rounded-xl border border-[rgba(18,163,106,0.3)] bg-[var(--chart-ai-soft)] px-3 py-2 text-sm text-[var(--chart-ai)]">
            Google Calendar connected.
          </p>
        ) : null}
        {params.gcal === "error" ? (
          <p className="rounded-xl border border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.08)] px-3 py-2 text-sm text-[var(--chart-lost)]">
            Google Calendar connection failed. Check OAuth credentials.
          </p>
        ) : null}
        <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
          <CalendarSlotPicker leadId={params.leadId} />
        </div>
      </div>
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Calendar" };
