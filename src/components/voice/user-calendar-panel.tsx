"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, RefreshCw, Unplug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";
import { ROLE_LABELS, type MemberRole } from "@/types/tenant";

type CalendarRow = {
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  connected: boolean;
  accountLabel?: string;
  lastSyncAt?: string;
  lastSyncError?: string;
  isCurrentUser: boolean;
};

type CalendarStatus = {
  oauthConfigured: boolean;
  demoMode: boolean;
  liveSync: boolean;
  currentUser: CalendarRow;
  team: CalendarRow[];
};

export function UserCalendarPanel() {
  const [data, setData] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/voice/calendar");
    if (!res.ok) throw new Error("Could not load calendar status");
    const next = (await res.json()) as CalendarStatus;
    setData(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setMessage(err instanceof Error ? err.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function connect() {
    if (!data) return;
    setBusy("connect");
    setMessage(null);
    try {
      if (data.oauthConfigured) {
        window.location.href = "/api/integrations/google-calendar/oauth/start";
        return;
      }
      const res = await fetch("/api/voice/calendar", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Connect failed");
      }
      await load();
      setMessage(
        data.demoMode
          ? "Your calendar is connected. Demo mode syncs locally until Google OAuth is configured."
          : "Your calendar is connected."
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setBusy(null);
    }
  }

  async function syncNow() {
    setBusy("sync");
    setMessage(null);
    try {
      const res = await fetch("/api/voice/calendar/sync", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Sync failed");
      }
      await load();
      setMessage("Calendar synced with Voice OS.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy("disconnect");
    setMessage(null);
    try {
      const res = await fetch("/api/voice/calendar", { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Disconnect failed");
      }
      await load();
      setMessage("Calendar disconnected.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
        <p className="text-sm text-muted">Loading calendar connection…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
        <p className="text-sm text-[var(--chart-lost)]">
          {message ?? "Calendar status unavailable."}
        </p>
      </div>
    );
  }

  const mine = data.currentUser;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-[var(--chart-revenue-soft)] p-2 text-[var(--chart-revenue)]">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Your calendar
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Active users each connect their own Google Calendar. Voice OS
                uses it for availability and booked meetings.
              </p>
            </div>
          </div>
          <Badge
            className={
              mine.connected
                ? "bg-[var(--chart-ai-soft)] text-[var(--chart-ai)] ring-[rgba(18,163,106,0.3)]"
                : "bg-surface-muted text-muted ring-border"
            }
          >
            {mine.connected ? "Connected" : "Not connected"}
          </Badge>
        </div>

        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Workspace user</dt>
            <dd className="font-medium text-foreground">
              {mine.name} · {ROLE_LABELS[mine.role]}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Calendar account</dt>
            <dd className="font-medium text-foreground">
              {mine.connected
                ? mine.accountLabel || mine.email
                : "Not linked yet"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Last sync</dt>
            <dd className="font-medium text-foreground">
              {mine.lastSyncAt ? formatRelative(mine.lastSyncAt) : "Never"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Sync mode</dt>
            <dd className="font-medium text-foreground">
              {data.liveSync
                ? "Google Calendar (live)"
                : data.demoMode
                  ? "Demo / local"
                  : "Local until OAuth is configured"}
            </dd>
          </div>
        </dl>

        {mine.lastSyncError ? (
          <p className="mt-3 rounded-xl border border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.08)] px-3 py-2 text-xs text-[var(--chart-lost)]">
            {mine.lastSyncError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {!mine.connected ? (
            <Button
              size="sm"
              disabled={busy !== null}
              onClick={() => void connect()}
            >
              {busy === "connect" ? "Connecting…" : "Connect my calendar"}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy !== null}
                onClick={() => void syncNow()}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {busy === "sync" ? "Syncing…" : "Sync now"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy !== null}
                onClick={() => void disconnect()}
              >
                <Unplug className="mr-1.5 h-3.5 w-3.5" />
                {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
              </Button>
            </>
          )}
        </div>
        {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
      </div>

      <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold text-foreground">
          Team calendars
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Every active member can connect their own calendar. Suspended users
          are hidden.
        </p>
        <ul className="mt-3 divide-y divide-border">
          {data.team.map((row) => (
            <li
              key={row.userId}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {row.name}
                  {row.isCurrentUser ? (
                    <span className="ml-1.5 text-xs font-normal text-muted">
                      (you)
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted">
                  {ROLE_LABELS[row.role]}
                  {row.connected && row.accountLabel
                    ? ` · ${row.accountLabel}`
                    : ""}
                </p>
              </div>
              <Badge
                className={
                  row.connected
                    ? "bg-[var(--chart-ai-soft)] text-[var(--chart-ai)] ring-[rgba(18,163,106,0.3)]"
                    : "bg-surface-muted text-muted ring-border"
                }
              >
                {row.connected ? "Synced" : "Not connected"}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
