"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { EmailCampaignStatus } from "@/types/email-outreach";

export function EmailCampaignActions({
  campaignId,
  status,
}: {
  campaignId: string;
  status: EmailCampaignStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "start" | "pause" | "resume" | "stop") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/outreach/campaigns/${campaignId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string | { message?: string } }
          | null;
        const message =
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message ?? "Action failed";
        setError(message);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        {(status === "draft" || status === "scheduled" || status === "paused") && (
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => void run(status === "paused" ? "resume" : "start")}
          >
            {status === "paused" ? "Resume" : "Start"}
          </Button>
        )}
        {status === "running" && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => void run("pause")}
          >
            Pause
          </Button>
        )}
        {status !== "cancelled" && status !== "completed" && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void run("stop")}
          >
            Stop
          </Button>
        )}
      </div>
      {error ? <p className="text-xs text-[var(--chart-lost)]">{error}</p> : null}
    </div>
  );
}
