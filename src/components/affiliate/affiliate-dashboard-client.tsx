"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardList, StatGrid } from "@/components/platform/module-page-shell";
import type { Affiliate, AffiliateEarning, AffiliatePayoutRequest } from "@/types/affiliate";

type DashboardPayload = {
  affiliate: Affiliate;
  rates: {
    discountPercent: number;
    cpaAmount: number;
    commissionPercent: number;
    payoutMinimum: number;
    currency: string;
    regionCode: string;
  };
  balance: {
    pending: number;
    approved: number;
    paid: number;
    available: number;
    currency: string;
  };
  stats: { clicks: number; leads: number; conversions: number };
  leads: { id: string; email: string; status: string; createdAt: string }[];
  earnings: AffiliateEarning[];
  payouts: AffiliatePayoutRequest[];
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "GBP",
  }).format(amount);
}

export function AffiliateDashboardClient({
  initial,
}: {
  initial?: DashboardPayload | null;
}) {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(
    initial ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    company: "",
    website: "",
    country: "",
    payoutMethod: "",
    payoutDetails: "",
    marketingChannels: "",
  });

  useEffect(() => {
    if (initial) {
      const p = initial.affiliate.profile;
      setProfile({
        name: p.name,
        company: p.company ?? "",
        website: p.website ?? "",
        country: p.country,
        payoutMethod: p.payoutMethod ?? "",
        payoutDetails: p.payoutDetails ?? "",
        marketingChannels: p.marketingChannels ?? "",
      });
      return;
    }
    void (async () => {
      const res = await fetch("/api/affiliate/me");
      const data = (await res.json()) as {
        dashboard?: DashboardPayload | null;
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? "Could not load dashboard.");
        return;
      }
      if (data.dashboard) {
        setDashboard(data.dashboard);
        const p = data.dashboard.affiliate.profile;
        setProfile({
          name: p.name,
          company: p.company ?? "",
          website: p.website ?? "",
          country: p.country,
          payoutMethod: p.payoutMethod ?? "",
          payoutDetails: p.payoutDetails ?? "",
          marketingChannels: p.marketingChannels ?? "",
        });
      }
    })();
  }, [initial]);

  if (!dashboard) {
    return (
      <p className="text-sm text-muted">
        {error ?? "No affiliate profile yet. Apply at /affiliate or opt in from Referrals."}
      </p>
    );
  }

  const { affiliate, rates, balance, stats } = dashboard;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/r/${affiliate.referralCode}`;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/affiliate/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = (await res.json()) as {
        affiliate?: Affiliate;
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? "Could not update profile.");
        return;
      }
      setInfo("Profile updated.");
      if (data.affiliate && dashboard) {
        setDashboard({ ...dashboard, affiliate: data.affiliate });
      }
    } finally {
      setBusy(false);
    }
  }

  async function requestPayout() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/affiliate/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: balance.available }),
      });
      const data = (await res.json()) as {
        payout?: AffiliatePayoutRequest;
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? "Payout request failed.");
        return;
      }
      setInfo("Payout requested. Admin will review.");
      const refresh = await fetch("/api/affiliate/me");
      const refreshed = (await refresh.json()) as {
        dashboard?: DashboardPayload | null;
      };
      if (refreshed.dashboard) setDashboard(refreshed.dashboard);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <StatGrid
        items={[
          { label: "Clicks", value: stats.clicks, sub: "Referral link hits" },
          { label: "Leads", value: stats.leads, sub: "Qualified CPA" },
          {
            label: "Conversions",
            value: stats.conversions,
            sub: "Paid commissions",
          },
          {
            label: "Available",
            value: money(balance.available, balance.currency),
            sub: `${money(balance.pending, balance.currency)} pending`,
          },
        ]}
      />

      <section className="rounded-xl border border-border bg-surface-elevated p-4">
        <h3 className="text-sm font-semibold text-foreground">Your link</h3>
        <p className="mt-1 text-xs text-muted">
          Status: {affiliate.status} · Region: {rates.regionCode} · Buyer
          discount {rates.discountPercent}% · CPA{" "}
          {money(rates.cpaAmount, rates.currency)} · Commission{" "}
          {rates.commissionPercent}%
        </p>
        <code className="mt-3 block break-all rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground">
          {link || `/r/${affiliate.referralCode}`}
        </code>
        <p className="mt-2 text-xs text-dim">
          Code: <strong>{affiliate.referralCode}</strong>
        </p>
      </section>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {info ? <p className="text-sm text-gold">{info}</p> : null}

      <section className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={busy || balance.available < rates.payoutMinimum}
          onClick={() => void requestPayout()}
        >
          Request payout ({money(balance.available, balance.currency)})
        </Button>
        <span className="text-xs text-muted">
          Minimum {money(rates.payoutMinimum, rates.currency)}
        </span>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Income ledger
        </h3>
        <CardList
          items={dashboard.earnings.map((e) => ({
            id: e.id,
            title: `${e.type.toUpperCase()} · ${money(e.amount, e.currency)}`,
            body: e.note ?? e.email ?? e.tenantId,
            badge: e.status,
            meta: e.createdAt.slice(0, 10),
          }))}
        />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Leads</h3>
        <CardList
          items={dashboard.leads.map((l) => ({
            id: l.id,
            title: maskEmail(l.email),
            body: l.status,
            meta: l.createdAt.slice(0, 10),
            badge: l.status,
          }))}
        />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Payout requests
        </h3>
        <CardList
          items={dashboard.payouts.map((p) => ({
            id: p.id,
            title: money(p.amount, p.currency),
            body: p.method ?? "manual",
            badge: p.status,
            meta: p.createdAt.slice(0, 10),
          }))}
        />
      </section>

      <section className="rounded-xl border border-border bg-surface-elevated p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Profile update
        </h3>
        <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["name", "Name"],
              ["company", "Company"],
              ["website", "Website"],
              ["country", "Country"],
              ["payoutMethod", "Payout method"],
              ["payoutDetails", "Payout details"],
              ["marketingChannels", "Marketing channels"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs text-muted">
              {label}
              <input
                className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
                value={profile[key]}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </label>
          ))}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              Save profile
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  const u = user.slice(0, 2) + "***";
  return `${u}@${domain}`;
}
