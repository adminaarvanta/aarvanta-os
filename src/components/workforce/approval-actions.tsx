"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  WfPrimaryButton,
  WfSecondaryButton,
} from "@/components/workforce/workforce-shell";
import type { WorkforceApproval } from "@/types/workforce";

export function ApprovalActions({
  executionId,
  approval,
}: {
  executionId: string;
  approval: WorkforceApproval;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [modifyMode, setModifyMode] = useState(false);
  const [modifiedOffer, setModifiedOffer] = useState(
    approval.requestedOffer ?? ""
  );
  const [error, setError] = useState<string | null>(null);

  async function resolve(resolution: "approved" | "rejected" | "modified") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workforce/executions/${executionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId: approval.id,
          resolution,
          modifiedOffer:
            resolution === "modified" ? modifiedOffer.trim() : undefined,
        }),
      });
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to resolve approval");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (approval.status !== "pending") {
    return (
      <p className="text-sm" style={{ color: "var(--wf-muted)" }}>
        Resolved: {approval.resolution}
        {approval.modifiedOffer ? ` · ${approval.modifiedOffer}` : ""}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--wf-wait-soft)" }}
        >
          <AlertTriangle className="h-5 w-5" style={{ color: "#B45309" }} />
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: "var(--wf-ink)" }}>
            Decision Required
          </h3>
          <p className="text-sm" style={{ color: "var(--wf-muted)" }}>
            {approval.reason}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {approval.currentOffer && (
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--wf-line)", background: "var(--wf-bg)" }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--wf-muted)" }}
            >
              Current Offer
            </p>
            <p className="mt-1 text-lg font-bold" style={{ color: "var(--wf-ink)" }}>
              {approval.currentOffer}
            </p>
          </div>
        )}
        {approval.requestedOffer && (
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: "var(--wf-accent)",
              background: "var(--wf-accent-soft)",
            }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--wf-accent-deep)" }}
            >
              Requested Offer
            </p>
            <p
              className="mt-1 text-lg font-bold"
              style={{ color: "var(--wf-accent-deep)" }}
            >
              {approval.requestedOffer}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        {typeof approval.dealValue === "number" && (
          <div>
            <p style={{ color: "var(--wf-muted)" }}>Deal value</p>
            <p className="font-bold" style={{ color: "var(--wf-ink)" }}>
              ₹{approval.dealValue.toLocaleString("en-IN")}
            </p>
          </div>
        )}
        {approval.marginImpact && (
          <div>
            <p style={{ color: "var(--wf-muted)" }}>Impact</p>
            <p className="font-bold" style={{ color: "var(--wf-danger)" }}>
              {approval.marginImpact}
            </p>
          </div>
        )}
      </div>

      {modifyMode && (
        <input
          className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ borderColor: "var(--wf-line)", color: "var(--wf-ink)" }}
          value={modifiedOffer}
          onChange={(e) => setModifiedOffer(e.target.value)}
          placeholder="Enter modified offer"
        />
      )}

      {error && (
        <p className="text-sm font-medium" style={{ color: "var(--wf-danger)" }}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => resolve("approved")}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--wf-ok)" }}
        >
          {approval.proposedAction}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => resolve("rejected")}
          className="rounded-xl border px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ borderColor: "var(--wf-danger)", color: "var(--wf-danger)" }}
        >
          Reject & Continue
        </button>
        {!modifyMode ? (
          <WfSecondaryButton
            type="button"
            disabled={busy}
            onClick={() => setModifyMode(true)}
          >
            Edit Offer
          </WfSecondaryButton>
        ) : (
          <WfPrimaryButton
            type="button"
            disabled={busy || !modifiedOffer.trim()}
            onClick={() => resolve("modified")}
          >
            Save modified offer
          </WfPrimaryButton>
        )}
      </div>
    </div>
  );
}
