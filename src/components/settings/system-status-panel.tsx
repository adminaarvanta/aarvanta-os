"use client";

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

export function SystemStatusPanel({
  mode,
  datastore,
  ai,
  channels,
  emailSync,
  readiness,
}: {
  mode: string;
  datastore: string;
  ai: AiRuntimeStatus;
  channels: Record<Channel, ChannelStatus>;
  emailSync: string;
  readiness?: ProductionReadiness;
}) {
  return (
    <Panel>
      <SectionHeader
        title="System status"
        description="Runtime mode, datastore, AI provider, and channel connectivity."
      />
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border-subtle px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-wide text-muted">App mode</dt>
          <dd className="mt-1 text-sm capitalize text-foreground">{mode}</dd>
        </div>
        <div className="rounded-lg border border-border-subtle px-3 py-2.5">
          <dt className="text-[10px] uppercase tracking-wide text-muted">Datastore</dt>
          <dd className="mt-1 text-sm capitalize text-foreground">{datastore}</dd>
        </div>
        <div className="rounded-lg border border-border-subtle px-3 py-2.5 sm:col-span-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted">AI engine</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground">{aiLabel(ai)}</span>
            <StatusPill variant={ai.status === "live" ? "success" : "warning"}>
              {ai.status}
            </StatusPill>
          </dd>
          {ai.status !== "live" && "reason" in ai && (
            <p className="mt-1 text-xs text-muted">{ai.reason}</p>
          )}
        </div>
        <div className="rounded-lg border border-border-subtle px-3 py-2.5 sm:col-span-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted">Gmail sync</dt>
          <dd className="mt-1 text-sm text-foreground">{emailSync}</dd>
        </div>
      </dl>
      <div className="mt-4 border-t border-border-subtle pt-4">
        <p className="mb-2 text-xs font-medium text-foreground">Channels</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(Object.entries(channels) as [Channel, ChannelStatus][]).map(([channel, status]) => (
            <li
              key={channel}
              className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2"
            >
              <span className="text-sm text-foreground">{CHANNEL_LABELS[channel]}</span>
              <StatusPill variant={channelVariant(status)}>{status}</StatusPill>
            </li>
          ))}
        </ul>
      </div>
      {readiness && readiness.items.length > 1 && (
        <div className="mt-4 border-t border-border-subtle pt-4">
          <p className="mb-2 text-xs font-medium text-foreground">
            Production readiness
            {!readiness.ready && (
              <span className="ml-2 text-amber-300">— action required</span>
            )}
          </p>
          {readiness.warnings.length > 0 && (
            <ul className="mb-3 space-y-1 text-xs text-amber-200/90">
              {readiness.warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          )}
          <ul className="grid gap-2 sm:grid-cols-2">
            {readiness.items
              .filter((item) => item.id !== "mode")
              .map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-border-subtle px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-foreground">{item.label}</span>
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
    </Panel>
  );
}
