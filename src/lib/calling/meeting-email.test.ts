import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMeetingInviteIcs } from "@/lib/calling/meeting-email";
import type { MeetingBooking } from "@/types/calling-agent";
import type { CrmContact } from "@/types/crm";

describe("buildMeetingInviteIcs", () => {
  it("emits a METHOD:REQUEST with organizer and attendees", () => {
    const meeting = {
      id: "mtg_1",
      title: "Discovery Call — Acme",
      meetingStart: "2026-09-14T16:00:00.000Z",
      meetingEnd: "2026-09-14T16:30:00.000Z",
      timezone: "UTC",
      meetLink: "https://meet.jit.si/aarvanta-demo",
    } as MeetingBooking;
    const contact = {
      firstName: "Ali",
      lastName: "Aarvanta",
    } as CrmContact;

    const ics = buildMeetingInviteIcs(meeting, contact, [
      "ali.aarvanta@gmail.com",
      "pavan@aarvanta.com",
    ]);

    assert.match(ics, /METHOD:REQUEST/);
    assert.match(ics, /DTSTART:20260914T160000Z/);
    assert.match(ics, /DTEND:20260914T163000Z/);
    assert.match(ics, /ORGANIZER;CN=Aarvanta:mailto:admin@aarvanta.co/);
    assert.match(ics, /ATTENDEE;.*mailto:ali\.aarvanta@gmail\.com/);
    assert.match(ics, /ATTENDEE;.*mailto:pavan@aarvanta\.com/);
    assert.match(ics, /STATUS:CONFIRMED/);
  });
});
