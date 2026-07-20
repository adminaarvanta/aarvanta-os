"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { formatRelative, cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notifications";

export function NotificationsMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as {
        notifications: AppNotification[];
        unread: number;
      };
      setNotifications(data.notifications.slice(0, 8));
      setUnread(data.unread);
    } catch {
      setNotifications([]);
      setUnread(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST" });
    await load();
  }

  async function openItem(n: AppNotification) {
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
    }
    setOpen(false);
    if (n.actionUrl) {
      router.push(n.actionUrl);
    } else {
      await load();
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-black">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 flex w-[min(calc(100vw-1.5rem),22rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl">
            <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                <p className="text-[11px] text-muted">
                  {unread > 0 ? `${unread} unread` : "You're all caught up"}
                </p>
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted hover:bg-surface-hover hover:text-foreground"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted">
                  No notifications yet
                </p>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li key={n.id} className="border-b border-border-subtle last:border-0">
                      <button
                        type="button"
                        onClick={() => void openItem(n)}
                        className={cn(
                          "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover",
                          !n.read && "bg-gold/5"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && (
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                          )}
                          <div className={cn("min-w-0 flex-1", n.read && "pl-3.5")}>
                            <p className="truncate text-sm font-medium text-foreground">
                              {n.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                              {n.body}
                            </p>
                            <p className="mt-1 text-[10px] text-dim">
                              {formatRelative(n.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-border-subtle p-2">
              <Link
                href="/communications"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-center text-xs font-medium text-gold hover:bg-surface-hover"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
