"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Globe, Link2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/os/status-pill";
import { formatDomainPrice } from "@/lib/site-builder/domain-catalog";
import {
  buildDnsInstructions,
  DNS_PROVIDER_GUIDE,
} from "@/lib/site-builder/dns-instructions";
import {
  toExternalDomainPreference,
  toSelectedDomainPreference,
} from "@/lib/site-builder/domain-purchase-client";
import type { SiteDomainListing, SiteDomainPurchase } from "@/types/site-builder";

type DomainTab = "buy" | "existing";

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
  const [tab, setTab] = useState<DomainTab>(
    domain.status === "external" ? "existing" : "buy"
  );
  const [listings, setListings] = useState<SiteDomainListing[]>([]);
  const [query, setQuery] = useState("");
  const [existingInput, setExistingInput] = useState(domain.selectedDomain ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const dnsRecords = useMemo(
    () =>
      domain.status === "external" && domain.selectedDomain
        ? buildDnsInstructions(domain.selectedDomain)
        : [],
    [domain.status, domain.selectedDomain]
  );

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
    if (tab === "buy") void searchDomains();
  }, [tab, searchDomains]);

  async function purchaseDomain(listing: SiteDomainListing) {
    if (!listing.available) return;
    setBusy(true);
    setError(null);
    try {
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

  function connectExistingDomain() {
    setError(null);
    const next = toExternalDomainPreference(existingInput, domain.currency);
    if (!next) {
      setError("Enter a valid domain, e.g. mybrand.com or www.mybrand.co.uk");
      return;
    }
    onDomainChange(next);
    setExistingInput(next.selectedDomain ?? existingInput);
  }

  function clearDomain() {
    onDomainChange({
      status: "none",
      currency: domain.currency,
      autoRenew: domain.autoRenew,
    });
    setExistingInput("");
  }

  async function copyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setError("Could not copy — select the value manually.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-border bg-surface-muted p-0.5">
        <button
          type="button"
          onClick={() => setTab("buy")}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition ${
            tab === "buy"
              ? "bg-surface-elevated text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Buy with Aarvanta
        </button>
        <button
          type="button"
          onClick={() => setTab("existing")}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition ${
            tab === "existing"
              ? "bg-surface-elevated text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          I already have a domain
        </button>
      </div>

      {tab === "buy" && (
        <div className="flex items-start gap-2 rounded-lg border border-gold/30 bg-primary-soft p-3">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p className="text-xs text-muted">
            Buy through Aarvanta and DNS is configured automatically when you publish — no
            registrar dashboard work.
          </p>
        </div>
      )}

      {tab === "existing" && (
        <div className="flex items-start gap-2 rounded-lg border border-gold/30 bg-primary-soft p-3">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p className="text-xs text-muted">
            Enter the domain you already own. We&apos;ll show the exact DNS records to add in
            your provider&apos;s dashboard (same idea as Vercel custom domains).
          </p>
        </div>
      )}

      {domain.status === "purchased" && domain.selectedDomain && tab === "buy" && (
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

      {tab === "existing" && (
        <>
          {domain.status === "external" && domain.selectedDomain ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-gold/40 bg-primary-soft p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill variant="warning">
                      {domain.dnsStatus === "verified" ? "DNS verified" : "Add DNS records"}
                    </StatusPill>
                    <span className="font-mono text-sm text-foreground">
                      {domain.selectedDomain}
                    </span>
                  </div>
                  <Button type="button" variant="secondary" onClick={clearDomain}>
                    Change
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Keep the domain at your current provider. Only DNS needs updating so traffic
                  reaches Aarvanta Hosting.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <p className="text-xs font-medium text-foreground">
                  What to change in your domain provider
                </p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] text-muted">
                  {DNS_PROVIDER_GUIDE.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-[56px_64px_1fr_40px] gap-2 border-b border-border bg-surface-elevated px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-dim">
                  <span>Type</span>
                  <span>Host</span>
                  <span>Value</span>
                  <span />
                </div>
                <ul>
                  {dnsRecords.map((record) => {
                    const key = `${record.type}-${record.host}-${record.value}`;
                    return (
                      <li
                        key={key}
                        className="grid grid-cols-[56px_64px_1fr_40px] items-center gap-2 border-b border-border px-3 py-2.5 last:border-b-0"
                      >
                        <span className="font-mono text-xs font-medium text-gold">
                          {record.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copyValue(`${key}-host`, record.host)}
                          className="truncate text-left font-mono text-xs text-foreground hover:text-gold"
                          title="Copy host"
                        >
                          {record.host}
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => void copyValue(key, record.value)}
                            className="block w-full truncate text-left font-mono text-xs text-foreground hover:text-gold"
                            title="Copy value"
                          >
                            {record.value}
                          </button>
                          <p className="truncate text-[10px] text-dim">{record.purpose}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void copyValue(key, record.value)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-elevated hover:text-foreground"
                          aria-label={`Copy ${record.type} value`}
                        >
                          {copiedKey === key ? (
                            <Check className="h-3.5 w-3.5 text-gold" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="flex items-start gap-1.5 text-[11px] text-dim">
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
                Host names: use <span className="mx-1 font-mono text-muted">@</span> or leave blank
                for the root domain, depending on your provider. TTL can stay at the default if
                3600 is not offered.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={existingInput}
                  onChange={(e) => setExistingInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      connectExistingDomain();
                    }
                  }}
                  placeholder="yourdomain.com"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 font-mono text-sm text-foreground"
                />
                <Button type="button" onClick={connectExistingDomain} disabled={busy}>
                  Connect
                </Button>
              </div>
              <p className="text-[11px] text-dim">
                No transfer needed — you keep billing with your current registrar.
              </p>
            </div>
          )}
        </>
      )}

      {tab === "buy" && domain.status !== "purchased" && (
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
              const selected = domain.selectedDomain === listing.domain && domain.status !== "external";
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
                          Buy now
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
        </>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
