import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import { getNotificationsRepository } from "@/lib/data/notifications-store";
import { getSessionContext } from "@/lib/tenant/context";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const repo = getNotificationsRepository();
    const [notifications, digest] = await Promise.all([
      repo.listNotifications(ctx.scope),
      repo.getLatestDigest(ctx.scope),
    ]);
    const unread = notifications.filter((n) => !n.read).length;
    return NextResponse.json({ notifications, digest, unread });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("NOTIFICATIONS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST() {
  try {
    const ctx = await getSessionContext();
    const repo = getNotificationsRepository();
    const count = await repo.markAllRead(ctx.scope);
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return apiError("NOTIFICATIONS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
