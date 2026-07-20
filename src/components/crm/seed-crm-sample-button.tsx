"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SeedCrmSampleButton({
  label = "Load sample CRM data",
  forceLabel = "Reload sample data",
}: {
  label?: string;
  forceLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function seed(force: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/crm/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = (await res.json()) as {
        seeded?: boolean;
        reason?: string;
        counts?: Record<string, number>;
        error?: { message?: string };
      };
      if (!res.ok) {
        setMessage(
          typeof data.error?.message === "string"
            ? data.error.message
            : "Could not seed CRM sample data"
        );
        return;
      }
      if (!data.seeded) {
        setMessage(data.reason ?? "Sample data already present.");
        return;
      }
      const c = data.counts;
      setMessage(
        c
          ? `Loaded ${c.contacts} contacts, ${c.deals} deals, ${c.tasks} agent tasks.`
          : "Sample CRM data loaded."
      );
      router.refresh();
    } catch {
      setMessage("Network error while seeding");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => void seed(false)}
      >
        <Database className="mr-1.5 h-3.5 w-3.5" />
        {busy ? "Loading…" : label}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() => void seed(true)}
      >
        {forceLabel}
      </Button>
      {message && <p className="w-full text-xs text-muted sm:w-auto">{message}</p>}
    </div>
  );
}
