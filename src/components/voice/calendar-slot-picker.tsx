"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Day = { date: string; label: string; slotCount: number };
type Slot = { start: string; end: string; label: string; available: boolean };

export function CalendarSlotPicker({
  leadId,
  onBooked,
}: {
  leadId?: string;
  onBooked?: (meetingId: string) => void;
}) {
  const [days, setDays] = useState<Day[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/calendar/availability?days=3");
      if (!res.ok) return;
      const data = (await res.json()) as { availability: Day[] };
      setDays(data.availability);
      if (data.availability[0]) setSelectedDay(data.availability[0].date);
    })();
  }, []);

  useEffect(() => {
    if (!selectedDay) return;
    void (async () => {
      const res = await fetch(
        `/api/calendar/day-slots?date=${encodeURIComponent(selectedDay)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as { slots: Slot[] };
      setSlots(data.slots);
      setSelectedSlot(null);
    })();
  }, [selectedDay]);

  async function book() {
    if (!selectedSlot || !leadId) {
      setMessage("Select a slot and provide a lead to book.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          meetingStart: selectedSlot.start,
          meetingEnd: selectedSlot.end,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Booking failed");
      }
      const data = (await res.json()) as { meeting: { id: string } };
      setMessage("Meeting booked");
      onBooked?.(data.meeting.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => setSelectedDay(day.date)}
            className={`rounded-xl border px-4 py-3 text-left text-sm ${
              selectedDay === day.date
                ? "border-gold bg-gold/10 text-foreground"
                : "border-border bg-surface text-muted"
            }`}
          >
            <p className="font-medium text-foreground">{day.label}</p>
            <p className="text-xs">{day.slotCount} slots</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {slots.map((slot) => (
          <button
            key={slot.start}
            type="button"
            disabled={!slot.available}
            onClick={() => setSelectedSlot(slot)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              !slot.available
                ? "cursor-not-allowed border-border bg-surface text-muted opacity-50"
                : selectedSlot?.start === slot.start
                  ? "border-gold bg-gold text-background"
                  : "border-border bg-surface-elevated text-foreground hover:border-gold/50"
            }`}
          >
            {slot.label}
          </button>
        ))}
      </div>

      {leadId ? (
        <Button
          type="button"
          disabled={!selectedSlot || busy}
          onClick={() => void book()}
        >
          {busy ? "Booking…" : "Book selected slot"}
        </Button>
      ) : (
        <p className="text-xs text-muted">
          Preview mode — open a meeting or pass a lead to book.
        </p>
      )}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
