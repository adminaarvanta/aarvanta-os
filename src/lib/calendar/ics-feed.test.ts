import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertGoogleCalendarFeedUrl,
  emailFromIcsText,
  emailFromIcsUrl,
  maskIcsUrl,
  parseIcsBusyIntervals,
  zonedDateTimeToUtc,
} from "@/lib/calendar/ics-feed";

describe("assertGoogleCalendarFeedUrl", () => {
  it("accepts a Google secret iCal address and webcal URLs", () => {
    const https = assertGoogleCalendarFeedUrl(
      "https://calendar.google.com/calendar/ical/ali.aarvanta%40gmail.com/private-abc123/basic.ics"
    );
    assert.equal(
      https,
      "https://calendar.google.com/calendar/ical/ali.aarvanta%40gmail.com/private-abc123/basic.ics"
    );
    const webcal = assertGoogleCalendarFeedUrl(
      "webcal://calendar.google.com/calendar/ical/user@gmail.com/private-token/basic.ics"
    );
    assert.match(webcal, /^https:\/\/calendar\.google\.com\//);
  });

  it("rejects private hosts and non-Google calendars", () => {
    assert.throws(
      () => assertGoogleCalendarFeedUrl("https://127.0.0.1/calendar/ical/x/basic.ics"),
      /not allowed/
    );
    assert.throws(
      () => assertGoogleCalendarFeedUrl("https://evil.example/calendar/ical/x/basic.ics"),
      /Secret address/
    );
    assert.throws(
      () => assertGoogleCalendarFeedUrl("https://www.google.com/search?q=calendar"),
      /Secret address/
    );
  });
});

describe("email helpers", () => {
  it("reads the mailbox from a standard Google iCal path", () => {
    assert.equal(
      emailFromIcsUrl(
        "https://calendar.google.com/calendar/ical/ali.aarvanta%40gmail.com/private-abc/basic.ics"
      ),
      "ali.aarvanta@gmail.com"
    );
    assert.equal(
      maskIcsUrl(
        "https://calendar.google.com/calendar/ical/ali.aarvanta%40gmail.com/private-abc/basic.ics"
      ),
      "ali.aarvanta@gmail.com (calendar link)"
    );
    assert.equal(
      emailFromIcsUrl(
        "https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics"
      ),
      undefined
    );
  });

  it("reads an organizer mailbox from ICS text", () => {
    assert.equal(
      emailFromIcsText("ORGANIZER;CN=Ali:mailto:ali.aarvanta@gmail.com\n"),
      "ali.aarvanta@gmail.com"
    );
  });
});

describe("parseIcsBusyIntervals", () => {
  const windowStart = new Date("2026-09-14T00:00:00.000Z");
  const windowEnd = new Date("2026-09-18T00:00:00.000Z");

  it("reads a timed event and skips transparent ones", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260915T140000Z",
      "DTEND:20260915T150000Z",
      "SUMMARY:Busy",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "DTSTART:20260915T160000Z",
      "DTEND:20260915T170000Z",
      "TRANSP:TRANSPARENT",
      "SUMMARY:Free",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    assert.deepEqual(parseIcsBusyIntervals(ics, windowStart, windowEnd), [
      { start: "2026-09-15T14:00:00.000Z", end: "2026-09-15T15:00:00.000Z" },
    ]);
  });

  it("unfolds folded ICS lines", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260915T140000Z",
      "DTEND:20260915T150000Z",
      "SUM",
      " MARY:Folded",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    assert.equal(parseIcsBusyIntervals(ics, windowStart, windowEnd).length, 1);
  });

  it("expands a weekly RRULE and honors EXDATE", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260914T150000Z",
      "DTEND:20260914T153000Z",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE",
      "EXDATE:20260916T150000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const busy = parseIcsBusyIntervals(ics, windowStart, windowEnd);
    assert.deepEqual(
      busy.map((b) => b.start),
      ["2026-09-14T15:00:00.000Z"]
    );
  });

  it("treats all-day events as busy for that date", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART;VALUE=DATE:20260915",
      "DTEND;VALUE=DATE:20260916",
      "SUMMARY:Out",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const busy = parseIcsBusyIntervals(ics, windowStart, windowEnd);
    assert.equal(busy[0]?.start, "2026-09-15T00:00:00.000Z");
    assert.equal(busy[0]?.end, "2026-09-16T00:00:00.000Z");
  });

  it("merges overlapping busy blocks", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260915T140000Z",
      "DTEND:20260915T150000Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "DTSTART:20260915T143000Z",
      "DTEND:20260915T160000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    assert.deepEqual(parseIcsBusyIntervals(ics, windowStart, windowEnd), [
      { start: "2026-09-15T14:00:00.000Z", end: "2026-09-15T16:00:00.000Z" },
    ]);
  });
});

describe("zonedDateTimeToUtc", () => {
  it("converts Eastern Daylight Time to UTC", () => {
    const utc = zonedDateTimeToUtc(2026, 9, 15, 10, 0, 0, "America/New_York");
    assert.equal(utc.toISOString(), "2026-09-15T14:00:00.000Z");
  });
});
