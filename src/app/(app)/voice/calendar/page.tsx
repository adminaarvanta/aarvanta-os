import Link from "next/link";
import { CalendarSlotPicker } from "@/components/voice/calendar-slot-picker";

export default async function VoiceCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ gcal?: string; leadId?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Calendar</h2>
            <p className="text-xs text-muted sm:text-sm">
              Availability for AI booking — Google Calendar FreeBusy when connected
            </p>
          </div>
          <Link
            href="/api/integrations/google-calendar/oauth/start"
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-gold/40"
          >
            Connect Google Calendar
          </Link>
        </div>
        {params.gcal === "connected" ? (
          <p className="mt-2 text-xs text-gold">Google Calendar connected.</p>
        ) : null}
        {params.gcal === "error" ? (
          <p className="mt-2 text-xs text-red-400">
            Google Calendar connection failed. Check OAuth credentials.
          </p>
        ) : null}
      </header>
      <div className="p-4 sm:p-6">
        <CalendarSlotPicker leadId={params.leadId} />
      </div>
    </>
  );
}

export const metadata = { title: "Voice OS · Calendar" };
