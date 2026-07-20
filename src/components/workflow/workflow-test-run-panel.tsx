"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold";

export function WorkflowTestRunPanel({
  workflowId,
  contacts,
  deals,
}: {
  workflowId: string;
  contacts: Array<{ id: string; name: string; leadScore?: number }>;
  deals: Array<{ id: string; title: string; value: number; contactId?: string }>;
}) {
  const router = useRouter();
  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [dealId, setDealId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const contact = contacts.find((c) => c.id === contactId);
      const deal = deals.find((d) => d.id === dealId);
      const res = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contactId || undefined,
          dealId: dealId || undefined,
          contactName: contact?.name,
          leadScore: contact?.leadScore,
          dealValue: deal?.value,
        }),
      });
      const data = (await res.json()) as {
        run?: { id: string };
        error?: string | { message?: string };
      };
      if (!res.ok || !data.run) {
        setError(
          typeof data.error === "string"
            ? data.error
            : typeof data.error === "object" && data.error?.message
              ? data.error.message
              : "Run failed — is the workflow enabled?"
        );
        return;
      }
      router.push(`/workflows/runs/${data.run.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Test run</h3>
        <p className="mt-1 text-xs text-muted">
          Pick sample CRM context (like Zapier’s test), then execute the automation.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className={inputClass}
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
        >
          <option value="">No contact</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {typeof c.leadScore === "number" ? ` · score ${c.leadScore}` : ""}
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={dealId}
          onChange={(e) => setDealId(e.target.value)}
        >
          <option value="">No deal</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} · £{d.value.toLocaleString()}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={busy} onClick={() => void run()}>
          {busy ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="mr-1.5 h-3.5 w-3.5" />
          )}
          {busy ? "Running…" : "Test run"}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
