"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardList, StatGrid } from "@/components/platform/module-page-shell";
import type {
  Affiliate,
  AffiliateEarning,
  AffiliatePayoutRequest,
  AffiliateRateCard,
} from "@/types/affiliate";

type AdminAffiliate = Affiliate & { needsPasswordSetup?: boolean };

type AdminPayload = {
  affiliates: AdminAffiliate[];
  rateCards: AffiliateRateCard[];
  earnings: AffiliateEarning[];
  payouts: AffiliatePayoutRequest[];
  leads: { id: string; email: string; status: string; affiliateId: string }[];
};

export function AffiliateAdminClient() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [activationUrl, setActivationUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/affiliate/admin");
    const json = (await res.json()) as AdminPayload & {
      error?: { message?: string };
    };
    if (!res.ok) {
      setError(json.error?.message ?? "Admin access denied.");
      setData(null);
      return;
    }
    setData(json);
    setError(null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    setActivationUrl(null);
    try {
      const res = await fetch("/api/affiliate/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        error?: { message?: string };
        activation?: {
          needed: boolean;
          emailSent: boolean;
          activationUrl?: string;
          reason?: string;
        };
      };
      if (!res.ok) {
        setError(json.error?.message ?? "Action failed.");
        return;
      }
      if (json.activation) {
        const a = json.activation;
        if (!a.needed) {
          setInfo(
            a.emailSent
              ? "Approved — partner already has a password; notice email sent."
              : `Approved — partner already has a password.${a.activationUrl ? ` Dashboard: ${a.activationUrl}` : ""}`
          );
        } else if (a.emailSent) {
          setInfo(
            "Set-password email sent. You can also copy the activation link below."
          );
          setActivationUrl(a.activationUrl ?? null);
        } else {
          setInfo(
            `Set-password email not sent (${a.reason ?? "unknown"}). Copy the activation link below and share it with the partner.`
          );
          setActivationUrl(a.activationUrl ?? null);
        }
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return <p className="text-sm text-red-400">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted">Loading admin…</p>;
  }

  const pending = data.affiliates.filter((a) => a.status === "pending");
  const openPayouts = data.payouts.filter(
    (p) => p.status === "requested" || p.status === "approved"
  );

  return (
    <div className="space-y-8">
      <StatGrid
        items={[
          { label: "Affiliates", value: data.affiliates.length },
          { label: "Pending", value: pending.length },
          { label: "Open payouts", value: openPayouts.length },
          {
            label: "Earnings",
            value: data.earnings.filter((e) => e.status === "pending").length,
            sub: "Pending hold",
          },
        ]}
      />

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-success" role="status">
          {info}
        </p>
      ) : null}
      {activationUrl ? (
        <div className="rounded-xl border border-border bg-surface-muted p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Activation link (set password)
          </p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">
            {activationUrl}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            type="button"
            onClick={() => void navigator.clipboard.writeText(activationUrl)}
          >
            Copy link
          </Button>
        </div>
      ) : null}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Affiliate queue
        </h3>
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface-elevated">
          {data.affiliates.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {a.profile.name} · {a.referralCode}
                </p>
                <p className="text-xs text-muted">
                  {a.profile.email} · {a.source} · {a.profile.regionCode} ·{" "}
                  {a.status}
                  {a.needsPasswordSetup ? " · awaiting password" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {a.status !== "active" ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void patch({
                        action: "set_status",
                        affiliateId: a.id,
                        status: "active",
                      })
                    }
                  >
                    Approve
                  </Button>
                ) : null}
                {a.needsPasswordSetup ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void patch({
                        action: "resend_activation",
                        affiliateId: a.id,
                      })
                    }
                  >
                    Send password link
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void patch({
                      action: "set_status",
                      affiliateId: a.id,
                      status: "suspended",
                    })
                  }
                >
                  Suspend
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Regional rate / cap matrix
        </h3>
        <ul className="space-y-3">
          {data.rateCards
            .filter((c) => !c.affiliateId)
            .map((card) => (
              <RateCardEditor
                key={card.id}
                card={card}
                busy={busy}
                onSave={(next) =>
                  void patch({ action: "upsert_rate_card", rateCard: next })
                }
              />
            ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Payout queue
        </h3>
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface-elevated">
          {data.payouts.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">No payouts yet.</li>
          ) : (
            data.payouts.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {p.amount} {p.currency}
                  </p>
                  <p className="text-xs text-muted">
                    {p.affiliateId} · {p.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {p.status === "requested" ? (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void patch({
                          action: "payout",
                          payoutId: p.id,
                          status: "approved",
                        })
                      }
                    >
                      Approve
                    </Button>
                  ) : null}
                  {p.status === "approved" || p.status === "requested" ? (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void patch({
                          action: "payout",
                          payoutId: p.id,
                          status: "paid",
                        })
                      }
                    >
                      Mark paid
                    </Button>
                  ) : null}
                  {p.status === "requested" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        void patch({
                          action: "payout",
                          payoutId: p.id,
                          status: "rejected",
                        })
                      }
                    >
                      Reject
                    </Button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Earnings
        </h3>
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface-elevated">
          {data.earnings.slice(0, 40).map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {e.type} · {e.amount} {e.currency}
                </p>
                <p className="text-xs text-muted">
                  {e.email ?? e.tenantId} · {e.status}
                </p>
              </div>
              <div className="flex gap-2">
                {e.status === "pending" ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      void patch({
                        action: "approve_earning",
                        earningId: e.id,
                      })
                    }
                  >
                    Approve now
                  </Button>
                ) : null}
                {e.status === "approved" || e.status === "pending" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void patch({
                        action: "clawback_earning",
                        earningId: e.id,
                      })
                    }
                  >
                    Clawback
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Leads</h3>
        <CardList
          items={data.leads.slice(0, 40).map((l) => ({
            id: l.id,
            title: l.email,
            body: l.affiliateId,
            badge: l.status,
          }))}
        />
      </section>
    </div>
  );
}

function RateCardEditor({
  card,
  busy,
  onSave,
}: {
  card: AffiliateRateCard;
  busy: boolean;
  onSave: (card: AffiliateRateCard) => void;
}) {
  const [draft, setDraft] = useState(card);

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <p className="text-sm font-medium text-foreground">
        Region: {card.regionCode}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {(
          [
            ["defaultDiscountPercent", "Default discount %"],
            ["maxDiscountPercent", "Max discount %"],
            ["defaultCpaAmount", "Default CPA"],
            ["maxCpaAmount", "Max CPA"],
            ["defaultCommissionPercent", "Default commission %"],
            ["maxCommissionPercent", "Max commission %"],
            ["payoutMinimum", "Payout minimum"],
            ["attributionWindowDays", "Attribution days"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-xs text-muted">
            {label}
            <input
              type="number"
              className="mt-1 w-full rounded border border-border bg-surface-muted px-2 py-1.5 text-sm text-foreground"
              value={draft[key]}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  [key]: Number(e.target.value),
                }))
              }
            />
          </label>
        ))}
      </div>
      <Button
        className="mt-3"
        size="sm"
        disabled={busy}
        onClick={() => onSave(draft)}
      >
        Save caps
      </Button>
    </div>
  );
}
