"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2, ShieldAlert, X } from "lucide-react";
import { labelForHrDocumentType } from "@/lib/hr/document-types";
import { StatusPill } from "@/components/ui/os/status-pill";
import type { HrCase } from "@/types/hr-case";

export function HrCasePanel({
  conversationId,
  initialCases,
}: {
  conversationId: string;
  initialCases: HrCase[];
}) {
  const [cases, setCases] = useState(initialCases);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeCase =
    cases.find((item) => !["sent", "dismissed", "failed"].includes(item.status)) ??
    cases[0];

  async function refresh() {
    const res = await fetch(`/api/hr/cases?conversationId=${conversationId}`);
    if (!res.ok) return;
    const data = (await res.json()) as { cases: HrCase[] };
    setCases(data.cases);
  }

  async function approve(caseId: string) {
    setBusyId(caseId);
    setError(null);
    try {
      const res = await fetch(`/api/hr/cases/${caseId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Approval failed");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setBusyId(null);
    }
  }

  async function dismiss(caseId: string) {
    setBusyId(caseId);
    setError(null);
    try {
      const res = await fetch(`/api/hr/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      if (!res.ok) throw new Error("Dismiss failed");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dismiss failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!activeCase) return null;

  const docLabel = activeCase.proposedDocumentType
    ? labelForHrDocumentType(activeCase.proposedDocumentType)
    : null;

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            HR automation
          </p>
          <p className="mt-1 text-sm text-foreground">{activeCase.aiSummary}</p>
        </div>
        <StatusPill variant={activeCase.riskTier === "high" ? "warning" : "gold"}>
          {activeCase.riskTier} risk
        </StatusPill>
      </div>

      <dl className="space-y-1.5 text-xs text-muted">
        <div className="flex justify-between gap-2">
          <dt>Action</dt>
          <dd className="text-foreground">{activeCase.proposedAction.replace(/_/g, " ")}</dd>
        </div>
        {docLabel && (
          <div className="flex justify-between gap-2">
            <dt>Document</dt>
            <dd className="text-foreground">{docLabel}</dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt>Status</dt>
          <dd className="text-foreground">{activeCase.status.replace(/_/g, " ")}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Confidence</dt>
          <dd className="tabular-nums text-foreground">
            {Math.round(activeCase.confidence * 100)}%
          </dd>
        </div>
      </dl>

      {activeCase.riskReasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-[11px] text-muted">
          {activeCase.riskReasons.map((reason) => (
            <li key={reason} className="flex gap-1.5">
              <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
              {reason}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      {activeCase.status === "pending_approval" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busyId === activeCase.id}
            onClick={() => approve(activeCase.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold/15 px-3 py-1.5 text-xs font-medium text-gold-bright ring-1 ring-gold/30 hover:bg-gold/25 disabled:opacity-50"
          >
            {busyId === activeCase.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Approve & send
          </button>
          <button
            type="button"
            disabled={busyId === activeCase.id}
            onClick={() => dismiss(activeCase.id)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-border hover:bg-surface-hover disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Dismiss
          </button>
        </div>
      )}

      {activeCase.status === "sent" && activeCase.documentId && (
        <Link
          href="/hr"
          className="mt-3 inline-block text-xs font-medium text-gold hover:text-gold-bright"
        >
          View in HR OS →
        </Link>
      )}
    </div>
  );
}
