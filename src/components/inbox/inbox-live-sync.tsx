"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

export function InboxLiveSync({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const sync = useCallback(
    async (quiet = false) => {
      if (!enabled || inFlight.current) return;
      inFlight.current = true;
      if (!quiet) setSyncing(true);
      try {
        const res = await fetch("/api/email/sync", { method: "POST" });
        if (res.ok) {
          const data = (await res.json()) as { processed?: number };
          setLastSync(new Date());
          if ((data.processed ?? 0) > 0) {
            router.refresh();
          }
        }
      } catch {
        /* ignore transient network errors */
      } finally {
        inFlight.current = false;
        if (!quiet) setSyncing(false);
      }
    },
    [enabled, router]
  );

  useEffect(() => {
    if (!enabled) return;
    void sync(true);
    const id = window.setInterval(() => void sync(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, sync]);

  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={() => void sync(false)}
      disabled={syncing}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground",
        syncing && "opacity-70"
      )}
      title={lastSync ? `Last synced ${lastSync.toLocaleTimeString()}` : "Sync email now"}
    >
      {syncing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      Sync email
    </button>
  );
}
