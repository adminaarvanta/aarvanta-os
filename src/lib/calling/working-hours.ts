import type { CallCampaign, WorkingHoursWindow } from "@/types/calling-agent";

/** Best-effort local parts in a timezone using Intl. */
export function localPartsInTimezone(
  date: Date,
  timeZone: string
): { dayOfWeek: number; hour: number; minute: number; dateKey: string } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value])
  );
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const hour = Number(parts.hour === "24" ? "0" : parts.hour);
  return {
    dayOfWeek: weekdayMap[parts.weekday ?? "Mon"] ?? 1,
    hour,
    minute: Number(parts.minute ?? 0),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function isWithinWorkingHours(
  campaign: CallCampaign,
  at: Date = new Date()
): boolean {
  const local = localPartsInTimezone(at, campaign.timezone);
  if (!campaign.weekendCalling && (local.dayOfWeek === 0 || local.dayOfWeek === 6)) {
    return false;
  }

  const windows = campaign.workingHours.filter(
    (w) => w.dayOfWeek === local.dayOfWeek
  );
  if (!windows.length) return false;

  const minutes = local.hour * 60 + local.minute;
  return windows.some((w) => inWindow(minutes, w));
}

function inWindow(minutes: number, window: WorkingHoursWindow) {
  const [sh, sm] = window.start.split(":").map(Number);
  const [eh, em] = window.end.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return minutes >= start && minutes < end;
}

export function countCallsToday(
  attemptTimestamps: string[],
  timezone: string,
  now: Date = new Date()
): number {
  const today = localPartsInTimezone(now, timezone).dateKey;
  return attemptTimestamps.filter((iso) => {
    try {
      return localPartsInTimezone(new Date(iso), timezone).dateKey === today;
    } catch {
      return false;
    }
  }).length;
}
