import { NextResponse } from "next/server";
import { z } from "zod";
import { getMarketplaceStore } from "@/lib/data/platform-store";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";

const installSchema = z.object({
  marketplaceId: z.string().min(1),
});

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const store = getMarketplaceStore();
    const [catalog, installed] = await Promise.all([
      store.listMarketplaceAgents(),
      store.list(ctx.scope),
    ]);
    return NextResponse.json({ catalog, installed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("MARKETPLACE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const store = getMarketplaceStore();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = installSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid marketplace install payload", 400);
    }

    const marketplaceAgent = store.getMarketplaceAgent(parsed.data.marketplaceId);
    if (!marketplaceAgent) {
      return apiError("NOT_FOUND", "Marketplace agent not found", 404);
    }

    const installedAgent = await store.create({
      ...ctx.scope,
      marketplaceId: marketplaceAgent.id,
      name: marketplaceAgent.name,
      enabled: true,
      installedAt: new Date().toISOString(),
    });
    return NextResponse.json({ installedAgent }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Install failed";
    return apiError("MARKETPLACE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
