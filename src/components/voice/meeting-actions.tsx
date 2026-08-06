"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MeetingActions({
  meetingId,
  calendarEventId,
}: {
  meetingId: string;
  calendarEventId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cancel() {
    setBusy(true);
    try {
      const id = calendarEventId ?? meetingId;
      await fetch(`/api/calendar/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => router.push(`/voice/calendar?leadId=`)}
      >
        Reschedule
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() => void cancel()}
      >
        Cancel meeting
      </Button>
    </div>
  );
}
