/**
 * Google Calendar secret iCal feed — availability without OAuth verification.
 * Secret addresses are issued in Google Calendar → Settings → Integrate calendar.
 */

const ALLOWED_HOSTS = new Set([
  "calendar.google.com",
  "www.google.com",
  "calendar.googleusercontent.com",
]);

const MAX_ICS_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 4;

const WEEKDAYS: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

export type BusyInterval = { start: string; end: string };

export function normalizeCalendarFeedUrl(raw: string): string {
  return raw.trim().replace(/^webcal:/i, "https:");
}

export function assertGoogleCalendarFeedUrl(raw: string): string {
  const normalized = normalizeCalendarFeedUrl(raw);
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error("Enter a valid Google Calendar iCal link.");
  }
  if (url.username || url.password) {
    throw new Error("Calendar links with credentials are not allowed.");
  }
  if (url.protocol !== "https:") {
    throw new Error("Calendar links must use https.");
  }
  assertAllowedCalendarUrl(url);
  return url.toString();
}

function assertAllowedCalendarUrl(url: URL) {
  const host = url.hostname.toLowerCase();
  if (isBlockedHost(host)) {
    throw new Error("That calendar link is not allowed.");
  }
  if (!ALLOWED_HOSTS.has(host)) {
    throw new Error(
      "Use the Secret address in iCal format from Google Calendar settings."
    );
  }
  const path = url.pathname.toLowerCase();
  const isIcal =
    path.includes("/calendar/ical/") ||
    path.endsWith(".ics") ||
    path.includes("/calendar/export");
  if (host === "www.google.com" && !isIcal) {
    throw new Error(
      "Use the Secret address in iCal format from Google Calendar settings."
    );
  }
  if (!isIcal && host !== "calendar.googleusercontent.com") {
    throw new Error(
      "Use the Secret address in iCal format from Google Calendar settings."
    );
  }
}

function isBlockedHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
  if (hostname.includes(":")) return true;
  if (
    /^(127|10|0)\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  ) {
    return true;
  }
  return false;
}

export function emailFromIcsUrl(url: string): string | undefined {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const match = path.match(/\/ical\/([^/]+)\//i);
    if (!match?.[1]) return undefined;
    const value = match[1];
    if (value.includes("@") && !value.includes("group.calendar.google.com")) {
      return value;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function emailFromIcsText(ics: string): string | undefined {
  const organizer = ics.match(/ORGANIZER[^:]*:mailto:([^\s]+)/i);
  if (organizer?.[1]?.includes("@")) return organizer[1].trim();
  const attendee = ics.match(/ATTENDEE[^:]*:mailto:([^\s]+)/i);
  if (attendee?.[1]?.includes("@")) return attendee[1].trim();
  return undefined;
}

export function maskIcsUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const email = emailFromIcsUrl(url);
    return email ? `${email} (calendar link)` : `${parsed.hostname} (calendar link)`;
  } catch {
    return "Calendar link";
  }
}

export async function fetchCalendarIcs(url: string): Promise<string> {
  let current = assertGoogleCalendarFeedUrl(url);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: { Accept: "text/calendar, text/plain, */*" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) {
        throw new Error("Google Calendar redirected without a destination.");
      }
      const next = new URL(location, current);
      assertAllowedCalendarUrl(next);
      current = next.toString();
      continue;
    }
    if (!res.ok) {
      throw new Error(
        "Google Calendar did not return that feed. Check the secret iCal address and try again."
      );
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_ICS_BYTES) {
      throw new Error("The calendar feed is too large to sync.");
    }
    return buffer.toString("utf8");
  }
  throw new Error("Google Calendar redirected too many times.");
}

export function parseIcsBusyIntervals(
  ics: string,
  windowStart: Date,
  windowEnd: Date
): BusyInterval[] {
  const events = parseVevents(unfoldIcs(ics));
  const busy: BusyInterval[] = [];

  for (const event of events) {
    if (event.transp === "TRANSPARENT") continue;
    const instances = expandEvent(event, windowStart, windowEnd);
    for (const instance of instances) {
      if (instance.end > windowStart && instance.start < windowEnd) {
        busy.push({
          start: instance.start.toISOString(),
          end: instance.end.toISOString(),
        });
      }
    }
  }

  return mergeBusy(busy);
}

function unfoldIcs(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

type VEvent = {
  start?: Date;
  end?: Date;
  allDay?: boolean;
  rrule?: string;
  exdates: Date[];
  recurrenceId?: Date;
  transp?: string;
  uid?: string;
};

function parseVevents(ics: string): VEvent[] {
  const events: VEvent[] = [];
  const blocks = ics.split(/BEGIN:VEVENT/i).slice(1);
  for (const block of blocks) {
    const body = block.split(/END:VEVENT/i)[0] ?? "";
    const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const event: VEvent = { exdates: [] };
    let durationMs: number | undefined;
    for (const line of lines) {
      const [rawName, ...rest] = line.split(":");
      if (!rawName || rest.length === 0) continue;
      const value = rest.join(":");
      const [name, ...params] = rawName.split(";");
      const key = name.toUpperCase();
      const paramMap = Object.fromEntries(
        params.map((part) => {
          const [k, v] = part.split("=");
          return [k.toUpperCase(), v];
        })
      );
      if (key === "DTSTART") {
        event.start = parseIcsDate(value, paramMap.TZID, paramMap.VALUE);
        event.allDay = paramMap.VALUE === "DATE" || /^\d{8}$/.test(value);
      } else if (key === "DTEND") {
        event.end = parseIcsDate(value, paramMap.TZID, paramMap.VALUE);
      } else if (key === "DURATION") {
        durationMs = parseIcsDuration(value);
      } else if (key === "RRULE") {
        event.rrule = value;
      } else if (key === "EXDATE") {
        for (const stamp of value.split(",")) {
          event.exdates.push(parseIcsDate(stamp, paramMap.TZID, paramMap.VALUE));
        }
      } else if (key === "RECURRENCE-ID") {
        event.recurrenceId = parseIcsDate(value, paramMap.TZID, paramMap.VALUE);
      } else if (key === "TRANSP") {
        event.transp = value.toUpperCase();
      } else if (key === "UID") {
        event.uid = value;
      }
    }
    if (event.start && !event.end) {
      event.end = new Date(
        event.start.getTime() + (durationMs ?? (event.allDay ? 86_400_000 : 3_600_000))
      );
    }
    if (event.start && event.end) events.push(event);
  }
  return events;
}

function parseIcsDate(value: string, tzid?: string, valueType?: string): Date {
  const compact = value.trim();
  if (valueType === "DATE" || /^\d{8}$/.test(compact)) {
    const year = Number(compact.slice(0, 4));
    const month = Number(compact.slice(4, 6));
    const day = Number(compact.slice(6, 8));
    return new Date(Date.UTC(year, month - 1, day));
  }
  const match = compact.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/i
  );
  if (!match) return new Date(NaN);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const zulu = Boolean(match[7]);
  if (zulu || !tzid) {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  }
  return zonedDateTimeToUtc(year, month, day, hour, minute, second, tzid);
}

/** Convert a wall clock in `timeZone` to a UTC Date. */
export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(utcGuess)).map((part) => [part.type, part.value])
    );
    const asIf = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    return new Date(utcGuess - (asIf - utcGuess));
  } catch {
    return new Date(utcGuess);
  }
}

function parseIcsDuration(value: string): number {
  const match = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!match) return 3_600_000;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
}

function expandEvent(
  event: VEvent,
  windowStart: Date,
  windowEnd: Date
): { start: Date; end: Date }[] {
  if (!event.start || !event.end) return [];
  const duration = event.end.getTime() - event.start.getTime();
  if (!event.rrule) {
    return [{ start: event.start, end: event.end }];
  }

  const rule = parseRrule(event.rrule);
  const until = rule.until ?? windowEnd;
  const maxCount = rule.count ?? 400;
  const occurrences: { start: Date; end: Date }[] = [];
  const exKeys = new Set(event.exdates.map(dateKey));

  const cursor = new Date(event.start);
  let produced = 0;
  let guard = 0;
  while (produced < maxCount && cursor <= until && guard < 2000) {
    guard += 1;
    const starts = nextOccurrences(cursor, event.start, rule);
    for (const start of starts) {
      if (start < event.start || start > until) continue;
      if (exKeys.has(dateKey(start))) continue;
      produced += 1;
      if (start < windowEnd && start.getTime() + duration > windowStart.getTime()) {
        occurrences.push({ start, end: new Date(start.getTime() + duration) });
      }
      if (produced >= maxCount) break;
    }
    advanceCursor(cursor, rule);
    if (cursor > windowEnd && cursor > until) break;
  }
  return occurrences;
}

type Rrule = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  count?: number;
  until?: Date;
  byday: number[];
};

function parseRrule(value: string): Rrule {
  const parts = Object.fromEntries(
    value.split(";").map((part) => {
      const [k, v] = part.split("=");
      return [k.toUpperCase(), v];
    })
  );
  const freq = (parts.FREQ ?? "WEEKLY").toUpperCase() as Rrule["freq"];
  const byday = (parts.BYDAY ?? "")
    .split(",")
    .map((token) => WEEKDAYS[token.replace(/^-?\d+/, "").toUpperCase()])
    .filter((day): day is number => day !== undefined);
  return {
    freq: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)
      ? freq
      : "WEEKLY",
    interval: Math.max(1, Number(parts.INTERVAL ?? 1) || 1),
    count: parts.COUNT ? Number(parts.COUNT) : undefined,
    until: parts.UNTIL ? parseIcsDate(parts.UNTIL) : undefined,
    byday,
  };
}

function nextOccurrences(cursor: Date, seed: Date, rule: Rrule): Date[] {
  if (rule.freq === "WEEKLY" && rule.byday.length > 0) {
    const weekStart = startOfUtcWeek(cursor);
    const intervalWeeks = Math.floor(
      (weekStart.getTime() - startOfUtcWeek(seed).getTime()) / (7 * 86_400_000)
    );
    if (intervalWeeks % rule.interval !== 0) return [];
    return rule.byday.map((day) => {
      const next = new Date(weekStart);
      next.setUTCDate(weekStart.getUTCDate() + day);
      next.setUTCHours(
        seed.getUTCHours(),
        seed.getUTCMinutes(),
        seed.getUTCSeconds(),
        0
      );
      return next;
    });
  }
  return [new Date(cursor)];
}

function advanceCursor(cursor: Date, rule: Rrule) {
  if (rule.freq === "DAILY") {
    cursor.setUTCDate(cursor.getUTCDate() + rule.interval);
    return;
  }
  if (rule.freq === "WEEKLY") {
    cursor.setUTCDate(cursor.getUTCDate() + 7 * rule.interval);
    return;
  }
  if (rule.freq === "MONTHLY") {
    cursor.setUTCMonth(cursor.getUTCMonth() + rule.interval);
    return;
  }
  cursor.setUTCFullYear(cursor.getUTCFullYear() + rule.interval);
}

function startOfUtcWeek(date: Date): Date {
  const next = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  next.setUTCDate(next.getUTCDate() - next.getUTCDay());
  return next;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 16);
}

function mergeBusy(items: BusyInterval[]): BusyInterval[] {
  const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start));
  const merged: BusyInterval[] = [];
  for (const item of sorted) {
    const last = merged[merged.length - 1];
    if (last && item.start <= last.end) {
      if (item.end > last.end) last.end = item.end;
    } else {
      merged.push({ ...item });
    }
  }
  return merged;
}
