"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AffiliateDashboardClient } from "@/components/affiliate/affiliate-dashboard-client";

export function ReferralsOptInClient({
  hasAffiliate,
}: {
  hasAffiliate: boolean;
}) {
  const [joined, setJoined] = useState(hasAffiliate);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function optIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliate/apply", { method: "PUT" });
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setError(data.error?.message ?? "Could not enable referrals.");
        return;
      }
      setJoined(true);
    } finally {
      setBusy(false);
    }
  }

  if (!joined) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-surface-elevated p-6">
        <p className="text-sm text-muted">
          Share Aarvanta with your network. You earn CPA on qualified free
          signups and commission on paid conversions. Buyers get a capped
          regional discount.
        </p>
        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="button" disabled={busy} onClick={() => void optIn()}>
          {busy ? "Enabling…" : "Enable referral program"}
        </Button>
        <p className="text-xs text-dim">
          External partners can also{" "}
          <Link href="/affiliate" className="text-gold hover:underline">
            apply here
          </Link>
          .
        </p>
      </div>
    );
  }

  return <AffiliateDashboardClient />;
}
