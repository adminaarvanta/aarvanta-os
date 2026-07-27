"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

  async function resolve(
    resolution: "approved" | "rejected" | "modified"
  ) {
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
      <p className="text-sm text-muted">
        Resolved: {approval.resolution}
        {approval.modifiedOffer ? ` · ${approval.modifiedOffer}` : ""}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3 text-sm">
        {approval.currentOffer && (
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <p className="text-xs text-muted">Current offer</p>
            <p className="font-medium text-foreground">{approval.currentOffer}</p>
          </div>
        )}
        {approval.requestedOffer && (
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <p className="text-xs text-muted">Requested</p>
            <p className="font-medium text-foreground">{approval.requestedOffer}</p>
          </div>
        )}
        {typeof approval.dealValue === "number" && (
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <p className="text-xs text-muted">Deal value</p>
            <p className="font-medium text-foreground">
              ₹{approval.dealValue.toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </div>
      {approval.marginImpact && (
        <p className="text-xs text-muted">{approval.marginImpact}</p>
      )}

      {modifyMode && (
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
          value={modifiedOffer}
          onChange={(e) => setModifiedOffer(e.target.value)}
          placeholder="Enter modified offer"
        />
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy}
          onClick={() => resolve("approved")}
        >
          {approval.proposedAction}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => resolve("rejected")}
        >
          Reject & continue
        </Button>
        {!modifyMode ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => setModifyMode(true)}
          >
            Edit offer
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !modifiedOffer.trim()}
            onClick={() => resolve("modified")}
          >
            Save modified offer
          </Button>
        )}
      </div>
    </div>
  );
}
