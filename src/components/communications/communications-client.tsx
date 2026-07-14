"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";
import type { AiDigest, AppNotification } from "@/types/notifications";

const priorityClass = {
  high: "bg-danger/15 text-danger ring-danger/45",
  medium: "bg-gold/10 text-gold-bright ring-gold/35",
  low: "bg-surface-muted text-muted ring-border",
};

const kindLabel = {
  alert: "Alert",
  notification: "Notification",
  reminder: "Reminder",
};

export function CommunicationsClient({
  notifications,
  digest,
}: {
  notifications: AppNotification[];
  digest: AiDigest | null;
}) {
  const router = useRouter();

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST" });
    router.refresh();
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {digest && (
        <section className="rounded-xl border border-gold/30 bg-gold/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gold">
            AI Digest · {digest.period}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">
            {digest.headline}
          </h3>
          <ul className="mt-3 space-y-1">
            {digest.highlights.map((h) => (
              <li key={h} className="text-sm text-gold-bright">
                · {h}
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {digest.stats.newLeads != null && (
              <div>
                <dt className="text-[10px] text-muted">New leads</dt>
                <dd className="text-lg font-semibold text-gold-bright">
                  {digest.stats.newLeads}
                </dd>
              </div>
            )}
            {digest.stats.dealsNeedAttention != null && (
              <div>
                <dt className="text-[10px] text-muted">Deals need attention</dt>
                <dd className="text-lg font-semibold text-gold-bright">
                  {digest.stats.dealsNeedAttention}
                </dd>
              </div>
            )}
            {digest.stats.revenueChangePct != null && (
              <div>
                <dt className="text-[10px] text-muted">Revenue change</dt>
                <dd className="text-lg font-semibold text-accent-cyan">
                  +{digest.stats.revenueChangePct}%
                </dd>
              </div>
            )}
            {digest.stats.unreadMessages != null && (
              <div>
                <dt className="text-[10px] text-muted">Unread messages</dt>
                <dd className="text-lg font-semibold text-gold-bright">
                  {digest.stats.unreadMessages}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Notifications & alerts</h3>
          <Button size="sm" variant="secondary" onClick={markAllRead}>
            Mark all read
          </Button>
        </div>
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 ${
                n.read
                  ? "border-border bg-surface-elevated opacity-70"
                  : "border-gold/20 bg-surface-elevated"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={priorityClass[n.priority]}>
                      {kindLabel[n.kind]}
                    </Badge>
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    )}
                  </div>
                  <p className="mt-2 font-medium text-foreground">{n.title}</p>
                  <p className="mt-1 text-sm text-muted">{n.body}</p>
                  <p className="mt-2 text-[10px] text-muted/70">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="text-xs text-gold hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                  {n.actionUrl && (
                    <Link
                      href={n.actionUrl}
                      className="text-xs text-gold-bright hover:underline"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
