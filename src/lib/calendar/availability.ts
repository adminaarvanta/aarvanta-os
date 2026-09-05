import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { isDemoMode } from "@/lib/config/app-mode";
import type { TenantScope } from "@/types/communication";
import {
  fetchTeamGoogleFreeBusy,
  hasLiveGoogleCalendar,
} from "@/lib/calendar/google-calendar";

export type DayAvailability = {
  date: string;
  label: string;
  slotCount: number;
};

export type TimeSlot = {
  start: string;
  end: string;
  label: string;
  available: boolean;
};

function addBusinessDays(from: Date, count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function formatDayLabel(date: Date, index: number): string {
  if (index === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  }
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export async function getAvailabilityDays(input: {
  scope: TenantScope;
  timezone: string;
  days?: number;
  userId?: string;
}): Promise<DayAvailability[]> {
  const count = input.days ?? 3;
  const dates = addBusinessDays(new Date(), count);
  const meetings = await getCallingAgentRepository().listMeetings(input.scope, {
    status: "scheduled",
  });

  let busy: { start: string; end: string }[] = [];
  if (
    !isDemoMode() &&
    (await hasLiveGoogleCalendar(input.scope, input.userId))
  ) {
    try {
      const timeMin = dates[0].toISOString();
      const timeMax = new Date(dates[dates.length - 1]);
      timeMax.setHours(23, 59, 59, 999);
      busy = await fetchTeamGoogleFreeBusy(
        input.scope,
        timeMin,
        timeMax.toISOString(),
        input.userId
      );
    } catch (err) {
      console.warn("[calendar] FreeBusy failed, using local meetings", err);
    }
  }

  return dates.map((date, index) => {
    const slots = buildDaySlots(date, meetings, busy);
    return {
      date: date.toISOString().slice(0, 10),
      label: formatDayLabel(date, index),
      slotCount: slots.filter((s) => s.available).length,
    };
  });
}

export async function getDaySlots(input: {
  scope: TenantScope;
  date: string;
  timezone: string;
  userId?: string;
}): Promise<TimeSlot[]> {
  const day = new Date(`${input.date}T12:00:00.000Z`);
  const meetings = await getCallingAgentRepository().listMeetings(input.scope, {
    status: "scheduled",
  });

  let busy: { start: string; end: string }[] = [];
  if (
    !isDemoMode() &&
    (await hasLiveGoogleCalendar(input.scope, input.userId))
  ) {
    try {
      const start = new Date(input.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(input.date);
      end.setHours(23, 59, 59, 999);
      busy = await fetchTeamGoogleFreeBusy(
        input.scope,
        start.toISOString(),
        end.toISOString(),
        input.userId
      );
    } catch {
      /* local fallback */
    }
  }

  return buildDaySlots(day, meetings, busy);
}

function buildDaySlots(
  date: Date,
  meetings: { meetingStart: string; meetingEnd: string }[],
  busy: { start: string; end: string }[]
): TimeSlot[] {
  const hours = [10, 10.5, 11, 14, 14.5, 15, 16];
  return hours.map((h) => {
    const hour = Math.floor(h);
    const minute = h % 1 ? 30 : 0;
    const local = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      minute,
      0,
      0
    );
    const end = new Date(local.getTime() + 30 * 60_000);
    const conflict =
      meetings.some(
        (m) =>
          new Date(m.meetingStart) < end && new Date(m.meetingEnd) > local
      ) ||
      busy.some((b) => new Date(b.start) < end && new Date(b.end) > local);

    const label = local.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return {
      start: local.toISOString(),
      end: end.toISOString(),
      label,
      available: !conflict,
    };
  });
}
