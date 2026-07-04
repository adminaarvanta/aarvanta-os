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
      <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-4">
        <p className="text-sm font-medium text-[#F5E6C8]">
          Step 1 — Express your business intent
        </p>
        <p className="mt-1 text-xs text-[#A89878]">
          Launch OS converts your idea into a fully configured operating system — no manual setup.
        </p>
        <form onSubmit={onInterpret} className="mt-4 space-y-3">
          <label className="block space-y-1 text-xs text-[#A89878]">
            Business idea
            <textarea
              value={businessIdea}
              onChange={(e) => setBusinessIdea(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
              placeholder="Sell handmade candles online..."
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-xs text-[#A89878]">
              Country base
              <input
                value={countryBase}
                onChange={(e) => setCountryBase(e.target.value)}
                className="w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A89878]">
              Scale
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value as (typeof SCALES)[number])}
                className="w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8]"
              >
                {SCALES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-1 text-xs text-[#A89878]">
              Channels
              <div className="flex flex-wrap gap-2 pt-1">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${
                      channels.includes(ch)
                        ? "border-[#D4AF37] text-[#F9E076]"
                        : "border-[#3d3528] text-[#A89878]"
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
        <section className="space-y-4 rounded-xl border border-[#D4AF37]/30 bg-[#101010] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[#F5E6C8]">
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
              <span className="text-[10px] text-[#A89878]">AI-enhanced</span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#3d3528] p-3">
              <p className="text-xs font-medium text-[#D4AF37]">Brand</p>
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
                  <p className="text-sm text-[#F5E6C8]">{session.brandName}</p>
                  <p className="text-[10px] text-[#A89878]">
                    {session.commercial?.branding.tagline}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[#3d3528] p-3">
              <p className="text-xs font-medium text-[#D4AF37]">Industry</p>
              <p className="mt-1 text-sm text-[#F5E6C8]">
                {session.industry?.primaryIndustry} — {session.industry?.hybridModel}
              </p>
              <p className="text-[10px] text-[#A89878]">
                Confidence {Math.round((session.industry?.confidence ?? 0) * 100)}%
              </p>
            </div>
          </div>

          {session.commercial?.domainSuggestions?.length ? (
            <div className="rounded-lg border border-[#3d3528] p-3">
              <p className="text-xs font-medium text-[#D4AF37]">Domain suggestions</p>
              <ul className="mt-2 space-y-1">
                {session.commercial.domainSuggestions.map((d) => (
                  <li key={d.domain} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-[#F5E6C8]">{d.domain}</span>
                    <StatusPill variant={d.available ? "success" : "default"}>
                      {d.available ? "recommended" : "alt"}
                    </StatusPill>
                    <span className="text-[#A89878]">{d.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {session.commercial?.legalDocs?.length ? (
            <div className="rounded-lg border border-[#3d3528] p-3">
              <p className="text-xs font-medium text-[#D4AF37]">Legal documents (draft)</p>
              <ul className="mt-2 space-y-1 text-xs text-[#A89878]">
                {session.commercial.legalDocs.map((doc) => (
                  <li key={doc.type}>· {doc.title}</li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-[#6B5D48]">
                Uploaded to Knowledge Hub on deploy — review with legal counsel.
              </p>
            </div>
          ) : null}

          {session.commercial?.storeSlug ? (
            <div className="rounded-lg border border-[#3d3528] p-3">
              <p className="text-xs font-medium text-[#D4AF37]">Store preview</p>
              <p className="mt-1 text-xs text-[#A89878]">
                Public URL after deploy:{" "}
                <span className="font-mono text-[#F5E6C8]">
                  /store/{session.commercial.storeSlug}
                </span>
              </p>
            </div>
          ) : null}

          {session.businessModel && (
            <div className="rounded-lg border border-[#3d3528] p-3">
              <p className="text-xs font-medium text-[#D4AF37]">AI business designer</p>
              <p className="mt-1 text-sm text-[#F5E6C8]">
                {session.businessModel.aiInsight}
              </p>
              <p className="mt-2 text-xs text-[#A89878]">
                Revenue: {session.businessModel.revenueStreams.join(" · ")}
              </p>
              <p className="text-xs text-[#A89878]">
                Pricing: {session.businessModel.pricingModel}
              </p>
            </div>
          )}

          {session.buddies && session.buddies.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-[#D4AF37]">AI Buddies assigned</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {session.buddies.map((b) => (
                  <li
                    key={b.buddyId}
                    className="rounded-lg border border-[#3d3528] px-3 py-2 text-xs text-[#A89878]"
                  >
                    <span className="font-medium text-[#F5E6C8]">{b.name}</span>
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
              <div className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/5 p-4">
                <p className="text-sm font-semibold text-[#F9E076]">Your business is live</p>
                <p className="mt-1 text-xs text-[#A89878]">
                  CRM, finance, workflows, legal docs, store, and AI buddies are active.
                </p>
                {session.commercial?.storeSlug ? (
                  <Link
                    href={`/store/${session.commercial.storeSlug}`}
                    target="_blank"
                    className="mt-3 inline-block text-sm font-medium text-[#D4AF37] hover:underline"
                  >
                    Open live store →
                  </Link>
                ) : null}
              </div>
              <p className="text-xs font-medium text-[#D4AF37]">Deployed artifacts</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {session.artifacts?.map((a) => (
                  <li key={`${a.kind}-${a.id}`}>
                    {a.href ? (
                      <Link
                        href={a.href}
                        className="block rounded-lg border border-[#3d3528] px-3 py-2 text-xs text-[#F5E6C8] hover:border-[#D4AF37]/40"
                      >
                        {a.label}
                      </Link>
                    ) : (
                      <span className="block rounded-lg border border-[#3d3528] px-3 py-2 text-xs text-[#A89878]">
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
