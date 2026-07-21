"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import { StatusPill } from "@/components/ui/os/status-pill";
import type { Channel } from "@/types/communication";
import type { AiRuntimeStatus } from "@/lib/ai/config";
import type { ChannelStatus } from "@/lib/channels/config";
import type { ProductionReadiness } from "@/lib/config/production-readiness";

const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
  voice: "Voice",
  website_chat: "Website chat",
};

function channelVariant(status: ChannelStatus): "success" | "warning" | "default" {
  if (status === "live") return "success";
  if (status === "simulate") return "warning";
  return "default";
}

function aiLabel(ai: AiRuntimeStatus): string {
  if (ai.status === "live") return `Live · ${ai.model}`;
  if (ai.status === "heuristic") return "Heuristic fallback";
  return "Disabled";
}

type StatusPayload = {
  mode: string;
  datastore: string;
  ai: AiRuntimeStatus;
  channels: Record<Channel, ChannelStatus>;
  emailSync: string;
  readiness: ProductionReadiness;
};

export function SystemStatusPanel() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkStatus() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/system-status");
      if (!res.ok) {
        setError("Could not load system status.");
        return;
      }
      setStatus((await res.json()) as StatusPayload);
    } catch {
      setError("Network error while checking status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="System status"
          description="Runtime mode, datastore, AI, and channel connectivity — check on demand."
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void checkStatus()}
        >
          {busy ? "Checking…" : status ? "Refresh status" : "Check system status"}
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      {!status && !error ? (
        <p className="mt-4 text-sm text-muted">
          Status is hidden by default. Run a check when you need diagnostics.
        </p>
      ) : null}

      {status ? (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border-subtle px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-wide text-muted">
                App mode
              </dt>
              <dd className="mt-1 text-sm capitalize text-foreground">
                {status.mode}
              </dd>
            </div>
            <div className="rounded-lg border border-border-subtle px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-wide text-muted">
                Datastore
              </dt>
              <dd className="mt-1 text-sm capitalize text-foreground">
                {status.datastore}
              </dd>
            </div>
            <div className="rounded-lg border border-border-subtle px-3 py-2.5 sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-wide text-muted">
                AI engine
              </dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-foreground">
                  {aiLabel(status.ai)}
                </span>
                <StatusPill
                  variant={status.ai.status === "live" ? "success" : "warning"}
                >
                  {status.ai.status}
                </StatusPill>
              </dd>
              {status.ai.status !== "live" && "reason" in status.ai && (
                <p className="mt-1 text-xs text-muted">{status.ai.reason}</p>
              )}
            </div>
            <div className="rounded-lg border border-border-subtle px-3 py-2.5 sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-wide text-muted">
                Gmail sync
              </dt>
              <dd className="mt-1 text-sm text-foreground">{status.emailSync}</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-border-subtle pt-4">
            <p className="mb-2 text-xs font-medium text-foreground">Channels</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {(
                Object.entries(status.channels) as [Channel, ChannelStatus][]
              ).map(([channel, channelStatus]) => (
                <li
                  key={channel}
                  className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2"
                >
                  <span className="text-sm text-foreground">
                    {CHANNEL_LABELS[channel]}
                  </span>
                  <StatusPill variant={channelVariant(channelStatus)}>
                    {channelStatus}
                  </StatusPill>
                </li>
              ))}
            </ul>
          </div>
          {status.readiness.items.length > 1 && (
            <div className="mt-4 border-t border-border-subtle pt-4">
              <p className="mb-2 text-xs font-medium text-foreground">
                Production readiness
                {!status.readiness.ready && (
                  <span className="ml-2 text-amber-300">— action required</span>
                )}
              </p>
              {status.readiness.warnings.length > 0 && (
                <ul className="mb-3 space-y-1 text-xs text-amber-200/90">
                  {status.readiness.warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              )}
              <ul className="grid gap-2 sm:grid-cols-2">
                {status.readiness.items
                  .filter((item) => item.id !== "mode")
                  .map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-border-subtle px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-foreground">
                          {item.label}
                        </span>
                        <StatusPill
                          variant={
                            item.status === "ok"
                              ? "success"
                              : item.status === "warning"
                                ? "warning"
                                : "default"
                          }
                        >
                          {item.status}
                        </StatusPill>
                      </div>
                      {item.detail && (
                        <p className="mt-1 text-xs text-muted">{item.detail}</p>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      ) : null}
    </Panel>
  );
}
