"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CampaignStatus } from "@/types/calling-agent";

export function CampaignActions({
  campaignId,
  status,
}: {
  campaignId: string;
  status: CampaignStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(action: "start" | "pause" | "resume" | "stop") {
    setBusy(true);
    try {
      await fetch(`/api/voice/campaigns/${campaignId}/${action}`, {
        method: "POST",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
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
  );
}
