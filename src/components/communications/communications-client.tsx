"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/utils";
import type { AiDigest, AppNotification } from "@/types/notifications";

const priorityClass = {
  high: "bg-[#2A1218] text-[#F0A0A8] ring-[#8B3A45]/45",
  medium: "bg-[#2A2210] text-[#C9AA72] ring-[#B8965D]/35",
  low: "bg-[#121E32] text-[#9AABC4] ring-[#243656]",
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
        <section className="rounded-xl border border-[#B8965D]/30 bg-[#B8965D]/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[#B8965D]">
            AI Digest · {digest.period}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#FFFFFF]">
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
                <dt className="text-[10px] text-[#9AABC4]">New leads</dt>
                <dd className="text-lg font-semibold text-[#C9AA72]">
                  {digest.stats.newLeads}
                </dd>
              </div>
            )}
            {digest.stats.dealsNeedAttention != null && (
              <div>
                <dt className="text-[10px] text-[#9AABC4]">Deals need attention</dt>
                <dd className="text-lg font-semibold text-[#C9AA72]">
                  {digest.stats.dealsNeedAttention}
                </dd>
              </div>
            )}
            {digest.stats.revenueChangePct != null && (
              <div>
                <dt className="text-[10px] text-[#9AABC4]">Revenue change</dt>
                <dd className="text-lg font-semibold text-[#4DA6FF]">
                  +{digest.stats.revenueChangePct}%
                </dd>
              </div>
            )}
            {digest.stats.unreadMessages != null && (
              <div>
                <dt className="text-[10px] text-[#9AABC4]">Unread messages</dt>
                <dd className="text-lg font-semibold text-[#C9AA72]">
                  {digest.stats.unreadMessages}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Notifications & alerts</h3>
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
                  ? "border-[#243656] bg-[#0D1524] opacity-70"
                  : "border-[#B8965D]/20 bg-[#0D1524]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={priorityClass[n.priority]}>
                      {kindLabel[n.kind]}
                    </Badge>
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#B8965D]" />
                    )}
                  </div>
                  <p className="mt-2 font-medium text-[#FFFFFF]">{n.title}</p>
                  <p className="mt-1 text-sm text-[#9AABC4]">{n.body}</p>
                  <p className="mt-2 text-[10px] text-[#9AABC4]/70">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="text-xs text-[#B8965D] hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                  {n.actionUrl && (
                    <Link
                      href={n.actionUrl}
                      className="text-xs text-[#C9AA72] hover:underline"
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
