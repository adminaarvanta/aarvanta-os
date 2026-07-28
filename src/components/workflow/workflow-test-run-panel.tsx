"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import {
  FlowPanel,
  FlowPrimaryButton,
  flowInputClass,
} from "@/components/workflow/workflow-shell";

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

  const inputStyle = {
    borderColor: "var(--flow-line)",
    color: "var(--flow-ink)",
  };

  return (
    <FlowPanel className="space-y-3">
      <div>
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--flow-ink)" }}
        >
          Test run
        </h3>
        <p className="mt-1 text-xs" style={{ color: "var(--flow-muted)" }}>
          Pick sample CRM context, then execute the playbook.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className={flowInputClass}
          style={inputStyle}
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
          className={flowInputClass}
          style={inputStyle}
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
        <FlowPrimaryButton
          type="button"
          disabled={busy}
          onClick={() => void run()}
          className="!px-4 !py-2"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {busy ? "Running…" : "Test run"}
        </FlowPrimaryButton>
        {error && (
          <p className="text-xs" style={{ color: "var(--flow-danger)" }}>
            {error}
          </p>
        )}
      </div>
    </FlowPanel>
  );
}
