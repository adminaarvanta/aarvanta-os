"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";
import type { AiDigest, AppNotification } from "@/types/notifications";

const priorityClass = {
  high: "bg-red-950/60 text-red-300 ring-red-700/50",
  medium: "bg-amber-950/60 text-amber-300 ring-amber-700/50",
  low: "bg-[#141414] text-[#A89878] ring-[#3d3528]",
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
        <section className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[#D4AF37]">
            AI Digest · {digest.period}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#F5E6C8]">
            {digest.headline}
          </h3>
          <ul className="mt-3 space-y-1">
            {digest.highlights.map((h) => (
              <li key={h} className="text-sm text-[#C4B896]">
                · {h}
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {digest.stats.newLeads != null && (
              <div>
                <dt className="text-[10px] text-[#A89878]">New leads</dt>
                <dd className="text-lg font-semibold text-[#F9E076]">
                  {digest.stats.newLeads}
                </dd>
              </div>
            )}
            {digest.stats.dealsNeedAttention != null && (
              <div>
                <dt className="text-[10px] text-[#A89878]">Deals need attention</dt>
                <dd className="text-lg font-semibold text-[#F9E076]">
                  {digest.stats.dealsNeedAttention}
                </dd>
              </div>
            )}
            {digest.stats.revenueChangePct != null && (
              <div>
                <dt className="text-[10px] text-[#A89878]">Revenue change</dt>
                <dd className="text-lg font-semibold text-emerald-400">
                  +{digest.stats.revenueChangePct}%
                </dd>
              </div>
            )}
            {digest.stats.unreadMessages != null && (
              <div>
                <dt className="text-[10px] text-[#A89878]">Unread messages</dt>
                <dd className="text-lg font-semibold text-[#F9E076]">
                  {digest.stats.unreadMessages}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#F5E6C8]">Notifications & alerts</h3>
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
                  ? "border-[#3d3528] bg-[#101010] opacity-70"
                  : "border-[#D4AF37]/20 bg-[#101010]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={priorityClass[n.priority]}>
                      {kindLabel[n.kind]}
                    </Badge>
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                    )}
                  </div>
                  <p className="mt-2 font-medium text-[#F5E6C8]">{n.title}</p>
                  <p className="mt-1 text-sm text-[#A89878]">{n.body}</p>
                  <p className="mt-2 text-[10px] text-[#A89878]/70">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="text-xs text-[#D4AF37] hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                  {n.actionUrl && (
                    <Link
                      href={n.actionUrl}
                      className="text-xs text-[#F9E076] hover:underline"
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
