import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import { getNotificationsRepository } from "@/lib/data/notifications-store";
import { getSessionContext } from "@/lib/tenant/context";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getSessionContext();
    const { id } = await params;
    const repo = getNotificationsRepository();
    const updated = await repo.markRead(id, ctx.scope);
    if (!updated) return apiError("NOT_FOUND", "Notification not found", 404);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return apiError("NOTIFICATIONS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
