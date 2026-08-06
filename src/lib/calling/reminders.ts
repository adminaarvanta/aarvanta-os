import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import type { TenantScope } from "@/types/communication";
import type { MeetingBooking } from "@/types/calling-agent";

const OFFSETS_MS = [
  24 * 60 * 60_000,
  2 * 60 * 60_000,
  30 * 60_000,
] as const;

export async function scheduleMeetingReminders(
  meeting: MeetingBooking,
  scope: TenantScope,
  opts?: { replace?: boolean }
) {
  const repo = getCallingAgentRepository();
  if (opts?.replace) {
    const existing = await repo.listReminders(scope, {
      meetingBookingId: meeting.id,
    });
    for (const r of existing) {
      if (r.status === "pending") {
        await repo.updateReminder(r.id, { status: "cancelled" }, scope);
      }
    }
  }

  const start = new Date(meeting.meetingStart).getTime();
  const now = Date.now();
  for (const offset of OFFSETS_MS) {
    const scheduledFor = new Date(start - offset).toISOString();
    if (new Date(scheduledFor).getTime() <= now) continue;
    await repo.createReminder(
      {
        meetingBookingId: meeting.id,
        channel: "email",
        scheduledFor,
      },
      scope
    );
  }
}
