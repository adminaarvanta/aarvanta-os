"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Globe, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/os/status-pill";
import { formatDomainPrice } from "@/lib/site-builder/domain-catalog";
import { toSelectedDomainPreference } from "@/lib/site-builder/domain-purchase-client";
import type { SiteDomainListing, SiteDomainPurchase } from "@/types/site-builder";

export function DomainPurchasePanel({
  businessName,
  countryBase,
  domain,
  buildJobId,
  onDomainChange,
}: {
  businessName: string;
  countryBase: string;
  domain: SiteDomainPurchase;
  buildJobId?: string;
  onDomainChange: (domain: SiteDomainPurchase) => void;
}) {
  const [listings, setListings] = useState<SiteDomainListing[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDomains = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/build/domains/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          countryBase,
          query: query.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setError("Could not search domains.");
        return;
      }
      const data = (await res.json()) as { listings: SiteDomainListing[] };
      setListings(data.listings);
    } finally {
      setBusy(false);
    }
  }, [businessName, countryBase, query]);

  useEffect(() => {
    void searchDomains();
  }, [searchDomains]);

  async function purchaseDomain(listing: SiteDomainListing) {
    if (!listing.available) return;
    setBusy(true);
    setError(null);
    try {
      // Prefer Stripe Checkout when configured.
      const stripeRes = await fetch("/api/build/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "domain",
          domain: listing.domain,
          tld: listing.tld,
          priceAnnual: listing.priceAnnual,
          currency: listing.currency,
          autoRenew: domain.autoRenew,
          buildJobId,
        }),
      });
      const stripeBody = (await stripeRes.json()) as {
        url?: string;
        demo?: boolean;
        error?: { message?: string; code?: string };
      };

      if (stripeRes.ok && stripeBody.url) {
        window.location.href = stripeBody.url;
        return;
      }

      // Demo / unconfigured Stripe — fall back to instant demo purchase.
      if ((stripeRes.ok && stripeBody.demo) || stripeRes.status === 503) {
        const res = await fetch("/api/build/domains/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: listing.domain,
            tld: listing.tld,
            priceAnnual: listing.priceAnnual,
            currency: listing.currency,
            autoRenew: domain.autoRenew,
            buildJobId,
          }),
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: { message?: string } };
          setError(body.error?.message ?? "Domain purchase failed.");
          return;
        }
        const data = (await res.json()) as { domain: SiteDomainPurchase };
        onDomainChange(data.domain);
        return;
      }

      setError(stripeBody.error?.message ?? "Domain checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  function selectDomain(listing: SiteDomainListing) {
    if (!listing.available) return;
    onDomainChange(
      toSelectedDomainPreference({
        domain: listing.domain,
        tld: listing.tld,
        priceAnnual: listing.priceAnnual,
        currency: listing.currency,
        autoRenew: domain.autoRenew,
      })
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-gold/30 bg-primary-soft p-3">
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="text-xs text-muted">
          Domains are purchased <strong className="text-foreground">through Aarvanta</strong>.
          DNS is configured automatically when you publish — no external registrar or tech setup needed.
        </p>
      </div>

      {domain.status === "purchased" && domain.selectedDomain && (
        <div className="rounded-lg border border-gold/40 bg-primary-soft p-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill variant="success">Purchased</StatusPill>
            <span className="font-mono text-sm text-foreground">{domain.selectedDomain}</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Order {domain.registrarOrderId} · Renews{" "}
            {domain.expiresAt ? new Date(domain.expiresAt).toLocaleDateString() : "in 1 year"}
            {domain.priceAnnual
              ? ` · ${formatDomainPrice(domain.priceAnnual, domain.currency)}/yr`
              : null}
          </p>
        </div>
      )}

      {domain.status !== "purchased" && (
        <>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search e.g. mybrand.co.uk"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
            />
            <Button type="button" variant="secondary" onClick={() => void searchDomains()} disabled={busy}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <ul className="space-y-2">
            {listings.map((listing) => {
              const selected = domain.selectedDomain === listing.domain;
              return (
                <li
                  key={listing.domain}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${
                    selected ? "border-gold bg-primary-soft" : "border-border bg-surface-muted"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-foreground">{listing.domain}</p>
                    <p className="text-[10px] text-dim">{listing.note}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gold">
                      {formatDomainPrice(listing.priceAnnual, listing.currency)}/yr
                    </span>
                    {listing.available ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => selectDomain(listing)}
                          disabled={busy}
                        >
                          {selected ? <Check className="h-3.5 w-3.5" /> : "Select"}
                        </Button>
                        <Button type="button" onClick={() => void purchaseDomain(listing)} disabled={busy}>
                          Buy with Stripe
                        </Button>
                      </>
                    ) : (
                      <StatusPill variant="default">Unavailable</StatusPill>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={domain.autoRenew}
          onChange={(e) =>
            onDomainChange({ ...domain, autoRenew: e.target.checked })
          }
          className="rounded border-border"
        />
        Auto-renew domain annually
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
