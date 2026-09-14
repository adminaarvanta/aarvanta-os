"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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
  connectMode?: "oauth" | "ics" | "invite" | "local";
  isCurrentUser: boolean;
};

type CalendarStatus = {
  oauthConfigured: boolean;
  oauthPublic?: boolean;
  demoMode: boolean;
  liveSync: boolean;
  currentUser: CalendarRow;
  team: CalendarRow[];
};

type CalendarContextValue = {
  data: CalendarStatus | null;
  loading: boolean;
  busy: string | null;
  message: string | null;
  highlightIcs: boolean;
  connect: () => Promise<void>;
  connectOAuth: () => Promise<void>;
  connectIcs: (icsUrl: string) => Promise<void>;
  syncNow: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

function useCalendarContext() {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("Calendar panel must be wrapped in UserCalendarProvider");
  }
  return ctx;
}

export function UserCalendarProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [highlightIcs, setHighlightIcs] = useState(false);

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

  useEffect(() => {
    const gcal = new URLSearchParams(window.location.search).get("gcal");
    if (gcal === "denied") {
      setHighlightIcs(true);
      setMessage(
        "Google blocked sign-in because Aarvanta has not finished Google’s verification. Click Connect calendar — bookings go to your Google account as invites."
      );
    } else if (gcal === "error") {
      setHighlightIcs(true);
      setMessage(
        "Google Calendar sign-in failed. Click Connect calendar instead."
      );
    } else if (gcal === "connected") {
      setMessage("Your Google Calendar is connected.");
    }
  }, []);

  async function connect() {
    if (!data) return;
    setBusy("connect");
    setMessage(null);
    try {
      const res = await fetch("/api/voice/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "invite" }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Connect failed");
      }
      await load();
      setMessage(
        "Connected. Bookings will be emailed to your Google Calendar as invites."
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Connect failed");
    } finally {
      setBusy(null);
    }
  }

  async function connectOAuth() {
    setBusy("oauth");
    setMessage(null);
    try {
      const res = await fetch("/api/voice/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "oauth" }),
      });
      const body = (await res.json()) as {
        redirect?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(body.error?.message ?? "Google sign-in is not available");
      }
      if (body.redirect) {
        window.location.href = body.redirect;
        return;
      }
      throw new Error("Google sign-in is not available");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(null);
    }
  }

  async function connectIcs(icsUrl: string) {
    setBusy("ics");
    setMessage(null);
    try {
      const res = await fetch("/api/voice/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icsUrl }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Could not connect that calendar link");
      }
      await load();
      setHighlightIcs(false);
      setMessage("Calendar link connected. Availability will sync from that feed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not connect that calendar link");
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
      setMessage("Synced.");
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
      setMessage("Disconnected.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <CalendarContext.Provider
      value={{
        data,
        loading,
        busy,
        message,
        highlightIcs,
        connect,
        connectOAuth,
        connectIcs,
        syncNow,
        disconnect,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function UserCalendarStatus() {
  const {
    data,
    loading,
    busy,
    message,
    highlightIcs,
    connect,
    connectOAuth,
    connectIcs,
    syncNow,
    disconnect,
  } = useCalendarContext();
  const [icsUrl, setIcsUrl] = useState("");

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2 shadow-sm">
        <p className="text-xs text-muted">Loading calendar…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2 shadow-sm">
        <p className="text-xs text-[var(--chart-lost)]">
          {message ?? "Calendar status unavailable."}
        </p>
      </div>
    );
  }

  const mine = data.currentUser;
  const account = mine.connected
    ? mine.accountLabel || mine.email
    : "Not linked";
  const syncLabel = mine.lastSyncAt ? formatRelative(mine.lastSyncAt) : "Never";
  const mode =
    mine.connectMode === "ics"
      ? "Calendar link"
      : mine.connectMode === "invite"
        ? "Invites"
        : data.liveSync
          ? "Live"
          : data.demoMode
            ? "Demo"
            : "Local";

  return (
    <div
      className={`rounded-xl border bg-surface-elevated px-3 py-2 shadow-sm ${
        highlightIcs && !mine.connected
          ? "border-[rgba(220,38,38,0.35)]"
          : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--chart-revenue)]" />
          <p className="text-xs font-semibold text-foreground">Your calendar</p>
          <Badge
            className={
              mine.connected
                ? "bg-[var(--chart-ai-soft)] px-1.5 py-0 text-[10px] text-[var(--chart-ai)] ring-[rgba(18,163,106,0.3)]"
                : "bg-surface-muted px-1.5 py-0 text-[10px] text-muted ring-border"
            }
          >
            {mine.connected ? "Connected" : "Not connected"}
          </Badge>
        </div>
        <p className="min-w-0 truncate text-[11px] text-muted">
          {account} · {syncLabel} · {mode}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {!mine.connected ? (
            <>
              <Button
                size="sm"
                className="h-7 px-2 text-[11px]"
                disabled={busy !== null}
                onClick={() => void connect()}
              >
                {busy === "connect" ? "Connecting…" : "Connect calendar"}
              </Button>
              {data.oauthPublic ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-[11px]"
                  disabled={busy !== null}
                  onClick={() => void connectOAuth()}
                >
                  {busy === "oauth" ? "Redirecting…" : "Continue with Google"}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-[11px]"
                disabled={busy !== null}
                onClick={() => void syncNow()}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                {busy === "sync" ? "Syncing…" : "Sync"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                disabled={busy !== null}
                onClick={() => void disconnect()}
              >
                <Unplug className="mr-1 h-3 w-3" />
                {busy === "disconnect" ? "…" : "Disconnect"}
              </Button>
            </>
          )}
        </div>
      </div>
      {!mine.connected ? (
        <form
          className="mt-2 space-y-1.5 border-t border-border pt-2"
          onSubmit={(event) => {
            event.preventDefault();
            void connectIcs(icsUrl);
          }}
        >
          <p className="text-[11px] font-medium text-foreground">
            Connect without Google sign-in
          </p>
          <p className="text-[11px] leading-relaxed text-muted">
            {data.oauthPublic ? (
              <>
                <span className="text-foreground">Connect calendar</span> sends
                bookings to{" "}
                <span className="text-foreground">{mine.email}</span> as
                calendar invites. Continue with Google syncs live busy times.
              </>
            ) : (
              <>
                Google currently blocks Aarvanta’s sign-in until verification
                finishes.{" "}
                <span className="text-foreground">Connect calendar</span> sends
                bookings to{" "}
                <span className="text-foreground">{mine.email}</span> as
                calendar invites — Google Calendar adds those automatically.
              </>
            )}
          </p>
          <p className="text-[11px] text-muted">
            Optional live busy times: Google Calendar → Settings → Integrate
            calendar → copy{" "}
            <span className="text-foreground">Secret address in iCal format</span>.
          </p>
          <div className="flex flex-col gap-1.5 sm:flex-row">
            <input
              type="url"
              value={icsUrl}
              onChange={(event) => setIcsUrl(event.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs text-foreground"
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="h-8 px-3 text-[11px]"
              disabled={busy !== null || !icsUrl.trim()}
            >
              {busy === "ics" ? "Connecting…" : "Connect link"}
            </Button>
          </div>
        </form>
      ) : null}
      {mine.lastSyncError ? (
        <p className="mt-1.5 text-[11px] text-[var(--chart-lost)]">
          {mine.lastSyncError}
        </p>
      ) : null}
      {message ? <p className="mt-1.5 text-[11px] text-muted">{message}</p> : null}
    </div>
  );
}

export function TeamCalendars() {
  const { data, loading } = useCalendarContext();

  if (loading || !data) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2.5 shadow-sm">
      <p className="text-xs font-semibold text-foreground">Team calendars</p>
      <p className="mt-0.5 text-[11px] text-muted">
        Active members only — each person connects their own calendar.
      </p>
      <ul className="mt-2 divide-y divide-border">
        {data.team.map((row) => (
          <li
            key={row.userId}
            className="flex items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0"
          >
            <p className="min-w-0 truncate text-xs text-foreground">
              {row.name}
              {row.isCurrentUser ? (
                <span className="ml-1 text-[11px] text-muted">(you)</span>
              ) : null}
              <span className="ml-1.5 text-[11px] text-muted">
                {ROLE_LABELS[row.role]}
              </span>
            </p>
            <Badge
              className={
                row.connected
                  ? "bg-[var(--chart-ai-soft)] px-1.5 py-0 text-[10px] text-[var(--chart-ai)] ring-[rgba(18,163,106,0.3)]"
                  : "bg-surface-muted px-1.5 py-0 text-[10px] text-muted ring-border"
              }
            >
              {row.connected
                ? row.connectMode === "ics"
                  ? "Link"
                  : row.connectMode === "invite"
                    ? "Invites"
                    : "Synced"
                : "Not connected"}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Compact status + team list stacked (settings fallback). */
export function UserCalendarPanel() {
  return (
    <UserCalendarProvider>
      <div className="space-y-4">
        <UserCalendarStatus />
        <TeamCalendars />
      </div>
    </UserCalendarProvider>
  );
}
