import { NextResponse } from "next/server";
import { getEventRepository } from "@/lib/data/event-store";
import { requirePermission } from "@/lib/tenant/context";
import type { DomainEventType } from "@/types/events";
import type { EntityType } from "@/types/entity";

export async function GET(req: Request) {
  let ctx;
  try {
    ctx = await requirePermission("platform:audit");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: { message } }, { status });
  }

  const url = new URL(req.url);
  const filters = {
    type: (url.searchParams.get("type") as DomainEventType | null) ?? undefined,
    entityType:
      (url.searchParams.get("entityType") as EntityType | null) ?? undefined,
    entityId: url.searchParams.get("entityId") ?? undefined,
    limit: url.searchParams.get("limit")
      ? Number(url.searchParams.get("limit"))
      : 50,
  };

  const events = await getEventRepository().list(ctx.scope, filters);
  return NextResponse.json({ events });
}
