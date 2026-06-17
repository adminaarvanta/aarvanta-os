"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";
import type { IntegrationConnection, IntegrationProvider } from "@/types/integration";

type ProviderRow = {
  provider: IntegrationProvider;
  name: string;
  description: string;
  category: string;
  connection: IntegrationConnection | null;
};

const statusClass: Record<string, string> = {
  connected: "bg-emerald-950/60 text-emerald-300 ring-emerald-700/50",
  disconnected: "bg-[#141414] text-[#A89878] ring-[#3d3528]",
  syncing: "bg-blue-950/60 text-blue-300 ring-blue-700/50",
  error: "bg-red-950/60 text-red-300 ring-red-700/50",
};

export function IntegrationsClient({ providers }: { providers: ProviderRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function connect(provider: IntegrationProvider) {
    setBusy(provider);
    try {
      await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, accountLabel: "demo@account.com" }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(provider: IntegrationProvider) {
    setBusy(provider);
    try {
      await fetch("/api/integrations/connect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function sync(provider: IntegrationProvider) {
    setBusy(provider);
    try {
      await fetch("/api/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {providers.map((p) => {
        const status = p.connection?.status ?? "disconnected";
        const connected = status === "connected" || status === "syncing";
        return (
          <li
            key={p.provider}
            className="rounded-xl border border-[#3d3528] bg-[#101010] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#F5E6C8]">{p.name}</h3>
                <p className="mt-1 text-xs text-[#A89878]">{p.description}</p>
                <Badge className="mt-2 bg-[#141414] text-[#A89878] ring-[#3d3528]">
                  {p.category}
                </Badge>
              </div>
              <Badge className={statusClass[status] ?? statusClass.disconnected}>
                {status}
              </Badge>
            </div>
            {p.connection?.accountLabel && (
              <p className="mt-3 text-xs text-[#A89878]">
                Account: {p.connection.accountLabel}
              </p>
            )}
            {p.connection?.lastSyncAt && (
              <p className="mt-1 text-[10px] text-[#A89878]/70">
                Last sync {formatRelative(p.connection.lastSyncAt)}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {!connected ? (
                <Button
                  size="sm"
                  onClick={() => connect(p.provider)}
                  disabled={busy === p.provider}
                >
                  Connect
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => sync(p.provider)}
                    disabled={busy === p.provider}
                  >
                    Sync now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => disconnect(p.provider)}
                    disabled={busy === p.provider}
                  >
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
