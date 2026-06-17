import { Bell } from "lucide-react";
import { CommunicationsClient } from "@/components/communications/communications-client";
import { getNotificationsRepository } from "@/lib/data/notifications-store";
import { getSessionContext } from "@/lib/tenant/context";

export default async function CommunicationsPage() {
  const ctx = await getSessionContext();
  const repo = getNotificationsRepository();
  const [notifications, digest] = await Promise.all([
    repo.listNotifications(ctx.scope),
    repo.getLatestDigest(ctx.scope),
  ]);

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
          <Bell className="h-5 w-5 text-[#D4AF37]" />
          Communications
        </h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          Notifications, alerts, reminders, and AI digest.
        </p>
      </header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <CommunicationsClient notifications={notifications} digest={digest} />
      </div>
    </>
  );
}

export const metadata = { title: "Communications" };
