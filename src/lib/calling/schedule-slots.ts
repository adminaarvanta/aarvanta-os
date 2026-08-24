import { localPartsInTimezone } from "@/lib/calling/working-hours";
import {
  DEFAULT_AFTERNOON_HOUR,
  DEFAULT_CALLBACK_TIMEZONE,
  DEFAULT_MORNING_HOUR,
  DEFAULT_SCHEDULE_SLOTS,
  DEFAULT_WORKING_HOURS,
  type DefaultScheduleSlot,
  type DefaultScheduleSlotId,
  type WorkingHoursWindow,
} from "@/types/calling-agent";
import type { WorkspaceSettings } from "@/types/workspace-settings";

export type SlotResolveOptions = {
  timeZone?: string;
  morningHour?: number;
  afternoonHour?: number;
  workingHours?: WorkingHoursWindow[];
  weekendCalling?: boolean;
  now?: Date;
  enabledSlotIds?: DefaultScheduleSlotId[];
};

const WEEKDAY_NAMES: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatWall(year: number, month: number, day: number, hour: number, minute: number) {
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
}

/** Convert a wall-clock time in `timeZone` to a UTC Date. */
export function zonedWallTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const desired = formatWall(year, month, day, hour, minute);
  let utcMs = Date.parse(`${desired}Z`);
  for (let i = 0; i < 4; i += 1) {
    const local = localPartsInTimezone(new Date(utcMs), timeZone);
    const localWall = formatWall(
      Number(local.dateKey.slice(0, 4)),
      Number(local.dateKey.slice(5, 7)),
      Number(local.dateKey.slice(8, 10)),
      local.hour,
      local.minute
    );
    utcMs += Date.parse(`${desired}Z`) - Date.parse(`${localWall}Z`);
  }
  return new Date(utcMs);
}

function splitDateKey(dateKey: string) {
  return {
    year: Number(dateKey.slice(0, 4)),
    month: Number(dateKey.slice(5, 7)),
    day: Number(dateKey.slice(8, 10)),
  };
}

function addCalendarDays(dateKey: string, days: number): string {
  const { year, month, day } = splitDateKey(dateKey);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

function isWeekend(dateKey: string) {
  const { year, month, day } = splitDateKey(dateKey);
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return dow === 0 || dow === 6;
}

function nextBusinessDateKey(dateKey: string, weekendCalling: boolean) {
  let key = dateKey;
  while (!weekendCalling && isWeekend(key)) {
    key = addCalendarDays(key, 1);
  }
  return key;
}

function windowForDay(
  workingHours: WorkingHoursWindow[],
  dateKey: string
): WorkingHoursWindow | undefined {
  const { year, month, day } = splitDateKey(dateKey);
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return workingHours.find((w) => w.dayOfWeek === dow);
}

function clampHourToWindow(hour: number, window?: WorkingHoursWindow) {
  if (!window) return hour;
  const start = Number(window.start.split(":")[0]);
  const end = Number(window.end.split(":")[0]);
  if (hour < start) return start;
  if (hour >= end) return Math.max(start, end - 1);
  return hour;
}

export function slotsFromSettings(
  settings?: Pick<
    WorkspaceSettings,
    | "voiceCallbackTimezone"
    | "voiceMorningHour"
    | "voiceAfternoonHour"
    | "voiceScheduleSlotIds"
  > | null
): Required<Pick<SlotResolveOptions, "timeZone" | "morningHour" | "afternoonHour">> & {
  enabledSlotIds: DefaultScheduleSlotId[];
  slots: DefaultScheduleSlot[];
} {
  const enabled =
    settings?.voiceScheduleSlotIds?.length
      ? settings.voiceScheduleSlotIds
      : DEFAULT_SCHEDULE_SLOTS.filter((s) => s.enabled).map((s) => s.id);
  return {
    timeZone: settings?.voiceCallbackTimezone?.trim() || DEFAULT_CALLBACK_TIMEZONE,
    morningHour: settings?.voiceMorningHour ?? DEFAULT_MORNING_HOUR,
    afternoonHour: settings?.voiceAfternoonHour ?? DEFAULT_AFTERNOON_HOUR,
    enabledSlotIds: enabled,
    slots: DEFAULT_SCHEDULE_SLOTS.map((slot) => ({
      ...slot,
      enabled: enabled.includes(slot.id),
    })),
  };
}

export function resolveScheduleSlot(
  slotId: DefaultScheduleSlotId,
  options: SlotResolveOptions = {}
): { at: string; slotId: DefaultScheduleSlotId } {
  const timeZone = options.timeZone || DEFAULT_CALLBACK_TIMEZONE;
  const now = options.now ?? new Date();
  const morningHour = options.morningHour ?? DEFAULT_MORNING_HOUR;
  const afternoonHour = options.afternoonHour ?? DEFAULT_AFTERNOON_HOUR;
  const workingHours = options.workingHours ?? DEFAULT_WORKING_HOURS;
  const weekendCalling = Boolean(options.weekendCalling);
  const local = localPartsInTimezone(now, timeZone);

  if (slotId === "in_2_hours") {
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const laterLocal = localPartsInTimezone(later, timeZone);
    const dateKey = nextBusinessDateKey(laterLocal.dateKey, weekendCalling);
    if (dateKey !== laterLocal.dateKey) {
      return resolveScheduleSlot("next_morning", { ...options, now });
    }
    const window = windowForDay(workingHours, dateKey);
    const hour = clampHourToWindow(laterLocal.hour, window);
    const { year, month, day } = splitDateKey(dateKey);
    return {
      slotId,
      at: zonedWallTimeToUtc(timeZone, year, month, day, hour, laterLocal.minute).toISOString(),
    };
  }

  if (slotId === "tomorrow_same") {
    const dateKey = nextBusinessDateKey(addCalendarDays(local.dateKey, 1), weekendCalling);
    const window = windowForDay(workingHours, dateKey);
    const hour = clampHourToWindow(local.hour, window);
    const { year, month, day } = splitDateKey(dateKey);
    return {
      slotId,
      at: zonedWallTimeToUtc(timeZone, year, month, day, hour, local.minute).toISOString(),
    };
  }

  const hour = slotId === "next_afternoon" ? afternoonHour : morningHour;
  let dateKey = local.dateKey;
  const alreadyPassed =
    local.hour > hour || (local.hour === hour && local.minute >= 15);
  if (alreadyPassed) {
    dateKey = addCalendarDays(dateKey, 1);
  }
  dateKey = nextBusinessDateKey(dateKey, weekendCalling);
  const window = windowForDay(workingHours, dateKey);
  const clamped = clampHourToWindow(hour, window);
  const { year, month, day } = splitDateKey(dateKey);
  return {
    slotId,
    at: zonedWallTimeToUtc(timeZone, year, month, day, clamped, 0).toISOString(),
  };
}

export function defaultSlotForCallback(now: Date, timeZone: string): DefaultScheduleSlotId {
  const local = localPartsInTimezone(now, timeZone);
  return local.hour < 12 ? "next_afternoon" : "next_morning";
}

export function snapIsoToWorkingHours(
  iso: string,
  options: SlotResolveOptions = {}
): string {
  const timeZone = options.timeZone || DEFAULT_CALLBACK_TIMEZONE;
  const weekendCalling = Boolean(options.weekendCalling);
  const workingHours = options.workingHours ?? DEFAULT_WORKING_HOURS;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return resolveScheduleSlot(defaultSlotForCallback(options.now ?? new Date(), timeZone), options)
      .at;
  }
  const local = localPartsInTimezone(date, timeZone);
  const dateKey = nextBusinessDateKey(local.dateKey, weekendCalling);
  if (dateKey !== local.dateKey) {
    const morning = options.morningHour ?? DEFAULT_MORNING_HOUR;
    const { year, month, day } = splitDateKey(dateKey);
    return zonedWallTimeToUtc(timeZone, year, month, day, morning, 0).toISOString();
  }
  const window = windowForDay(workingHours, dateKey);
  const hour = clampHourToWindow(local.hour, window);
  const { year, month, day } = splitDateKey(dateKey);
  return zonedWallTimeToUtc(timeZone, year, month, day, hour, local.minute).toISOString();
}

function parseClock(match: RegExpMatchArray): { hour: number; minute: number } | null {
  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const ampm = match[3]?.toLowerCase();
  if (Number.isNaN(hour) || hour > 23) return null;
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  return { hour, minute };
}

/** Extract a promised callback time from call transcript / summary. */
export function extractPromisedAtFromText(
  text: string,
  options: SlotResolveOptions = {}
): { at: string; slotId?: DefaultScheduleSlotId } | null {
  const timeZone = options.timeZone || DEFAULT_CALLBACK_TIMEZONE;
  const now = options.now ?? new Date();
  const local = localPartsInTimezone(now, timeZone);
  const blob = text.toLowerCase().replace(/\s+/g, " ");

  if (/\bin\s+(\d+)\s+hours?\b/.test(blob) || /\bin two hours\b/.test(blob)) {
    return resolveScheduleSlot("in_2_hours", options);
  }

  const clock =
    blob.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ??
    blob.match(/\bat\s+(\d{1,2})(?::(\d{2}))\b/);

  let dayOffset: number | null = null;
  let slotHint: DefaultScheduleSlotId | undefined;

  if (/\btomorrow\b/.test(blob)) {
    dayOffset = 1;
  } else if (/\bnext week\b/.test(blob)) {
    const { year, month, day } = splitDateKey(local.dateKey);
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    dayOffset = ((1 - dow + 7) % 7) || 7;
  } else {
    for (const [name, dow] of Object.entries(WEEKDAY_NAMES)) {
      if (new RegExp(`\\b${name}\\b`).test(blob)) {
        const { year, month, day } = splitDateKey(local.dateKey);
        const todayDow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
        dayOffset = (dow - todayDow + 7) % 7 || 7;
        break;
      }
    }
  }

  if (/\bafternoon\b/.test(blob) || /\bevening\b/.test(blob)) {
    slotHint = "next_afternoon";
  } else if (/\bmorning\b/.test(blob)) {
    slotHint = "next_morning";
  }

  if (clock) {
    const parsed = parseClock(clock);
    if (parsed) {
      let dateKey = local.dateKey;
      if (dayOffset != null) {
        dateKey = addCalendarDays(dateKey, dayOffset);
      } else if (
        parsed.hour < local.hour ||
        (parsed.hour === local.hour && parsed.minute <= local.minute)
      ) {
        dateKey = addCalendarDays(dateKey, 1);
      }
      dateKey = nextBusinessDateKey(dateKey, Boolean(options.weekendCalling));
      const { year, month, day } = splitDateKey(dateKey);
      const iso = zonedWallTimeToUtc(
        timeZone,
        year,
        month,
        day,
        parsed.hour,
        parsed.minute
      ).toISOString();
      return { at: snapIsoToWorkingHours(iso, options) };
    }
  }

  if (dayOffset != null && slotHint) {
    const shifted = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    return resolveScheduleSlot(slotHint, { ...options, now: shifted });
  }
  if (dayOffset != null) {
    const shifted = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    return resolveScheduleSlot("next_morning", { ...options, now: shifted });
  }
  if (slotHint && (/\btomorrow\b/.test(blob) || /\blater\b/.test(blob) || /\bcall back\b/.test(blob))) {
    return resolveScheduleSlot(slotHint, options);
  }

  return null;
}

export function formatWhen(iso: string, timeZone: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}
