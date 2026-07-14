"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/os/status-pill";
import type { LaunchSession } from "@/types/launch";

const SCALES = ["solo", "startup", "smb", "enterprise"] as const;
const CHANNELS = [
  "online",
  "retail",
  "wholesale",
  "marketplace",
  "subscription",
] as const;

export function LaunchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");

  const [businessIdea, setBusinessIdea] = useState(
    "Sell handmade candles online to UK and EU customers"
  );
  const [countryBase, setCountryBase] = useState("UK");
  const [scale, setScale] = useState<(typeof SCALES)[number]>("startup");
  const [channels, setChannels] = useState<string[]>(["online"]);
  const [session, setSession] = useState<LaunchSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);

  const loadSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/launch/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { session: LaunchSession };
    setSession(data.session);
  }, []);

  useEffect(() => {
    if (sessionParam) void loadSession(sessionParam);
  }, [sessionParam, loadSession]);

  function toggleChannel(channel: string) {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  }

  async function onInterpret(event: React.FormEvent) {
    event.preventDefault();
    if (!businessIdea.trim() || channels.length === 0) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessIdea: businessIdea.trim(),
          countryBase,
          scale,
          channels,
          targetMarket: "global",
        }),
      });

      if (!res.ok) {
        setError("Could not interpret your business idea. Try again.");
        return;
      }

      const data = (await res.json()) as {
        session: LaunchSession;
        usedAi: boolean;
      };
      setSession(data.session);
      setUsedAi(data.usedAi);
      router.replace(`/launch?session=${data.session.id}`);
    } finally {
      setBusy(false);
    }
  }

  async function onDeploy() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/launch/${session.id}/deploy`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        setError(body.error?.message ?? "Deployment failed.");
        return;
      }
      const data = (await res.json()) as { session: LaunchSession };
      setSession(data.session);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface-elevated p-4">
        <p className="text-sm font-medium text-foreground">
          Step 1 — Express your business intent
        </p>
        <p className="mt-1 text-xs text-muted">
          Launch OS converts your idea into a fully configured operating system — no manual setup.
        </p>
        <form onSubmit={onInterpret} className="mt-4 space-y-3">
          <label className="block space-y-1 text-xs text-muted">
            Business idea
            <textarea
              value={businessIdea}
              onChange={(e) => setBusinessIdea(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Sell handmade candles online..."
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-xs text-muted">
              Country base
              <input
                value={countryBase}
                onChange={(e) => setCountryBase(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Scale
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value as (typeof SCALES)[number])}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {SCALES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-1 text-xs text-muted">
              Channels
              <div className="flex flex-wrap gap-2 pt-1">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${
                      channels.includes(ch)
                        ? "border-gold text-gold-bright"
                        : "border-border text-muted"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "Building system…" : "Generate business OS"}
          </Button>
        </form>
      </section>

      {session && (
        <section className="space-y-4 rounded-xl border border-gold/30 bg-surface-elevated p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              Step 2 — Review generated system
            </p>
            <StatusPill
              variant={
                session.status === "deployed"
                  ? "success"
                  : session.status === "interpreted"
                    ? "warning"
                    : "default"
              }
            >
              {session.status}
            </StatusPill>
            {usedAi && (
              <span className="text-[10px] text-muted">AI-enhanced</span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-gold">Brand</p>
              <div className="mt-2 flex items-center gap-3">
                {session.commercial?.branding.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.commercial.branding.logoDataUrl}
                    alt=""
                    className="h-12 w-12 rounded-lg"
                  />
                ) : null}
                <div>
                  <p className="text-sm text-foreground">{session.brandName}</p>
                  <p className="text-[10px] text-muted">
                    {session.commercial?.branding.tagline}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-gold">Industry</p>
              <p className="mt-1 text-sm text-foreground">
                {session.industry?.primaryIndustry} — {session.industry?.hybridModel}
              </p>
              <p className="text-[10px] text-muted">
                Confidence {Math.round((session.industry?.confidence ?? 0) * 100)}%
              </p>
            </div>
          </div>

          {session.commercial?.domainSuggestions?.length ? (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-gold">Domain suggestions</p>
              <ul className="mt-2 space-y-1">
                {session.commercial.domainSuggestions.map((d) => (
                  <li key={d.domain} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-foreground">{d.domain}</span>
                    <StatusPill variant={d.available ? "success" : "default"}>
                      {d.available ? "recommended" : "alt"}
                    </StatusPill>
                    <span className="text-muted">{d.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {session.commercial?.legalDocs?.length ? (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-gold">Legal documents (draft)</p>
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {session.commercial.legalDocs.map((doc) => (
                  <li key={doc.type}>· {doc.title}</li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-dim">
                Uploaded to Knowledge Hub on deploy — review with legal counsel.
              </p>
            </div>
          ) : null}

          {session.commercial?.storeSlug ? (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-gold">Store preview</p>
              <p className="mt-1 text-xs text-muted">
                Public URL after deploy:{" "}
                <span className="font-mono text-foreground">
                  /store/{session.commercial.storeSlug}
                </span>
              </p>
            </div>
          ) : null}

          {session.businessModel && (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-gold">AI business designer</p>
              <p className="mt-1 text-sm text-foreground">
                {session.businessModel.aiInsight}
              </p>
              <p className="mt-2 text-xs text-muted">
                Revenue: {session.businessModel.revenueStreams.join(" · ")}
              </p>
              <p className="text-xs text-muted">
                Pricing: {session.businessModel.pricingModel}
              </p>
            </div>
          )}

          {session.buddies && session.buddies.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-gold">AI Buddies assigned</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {session.buddies.map((b) => (
                  <li
                    key={b.buddyId}
                    className="rounded-lg border border-border px-3 py-2 text-xs text-muted"
                  >
                    <span className="font-medium text-foreground">{b.name}</span>
                    <p className="mt-0.5">{b.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {session.status !== "deployed" ? (
            <Button onClick={onDeploy} disabled={busy}>
              {busy ? "Deploying…" : "Deploy live business system"}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-gold/40 bg-gold/5 p-4">
                <p className="text-sm font-semibold text-gold-bright">Your business is live</p>
                <p className="mt-1 text-xs text-muted">
                  CRM, finance, workflows, legal docs, store, and AI buddies are active.
                </p>
                {session.commercial?.storeSlug ? (
                  <Link
                    href={`/store/${session.commercial.storeSlug}`}
                    target="_blank"
                    className="mt-3 inline-block text-sm font-medium text-gold hover:underline"
                  >
                    Open live store →
                  </Link>
                ) : null}
              </div>
              <p className="text-xs font-medium text-gold">Deployed artifacts</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {session.artifacts?.map((a) => (
                  <li key={`${a.kind}-${a.id}`}>
                    {a.href ? (
                      <Link
                        href={a.href}
                        className="block rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:border-gold/40"
                      >
                        {a.label}
                      </Link>
                    ) : (
                      <span className="block rounded-lg border border-border px-3 py-2 text-xs text-muted">
                        {a.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
