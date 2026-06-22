import { NextResponse } from "next/server";
import { z } from "zod";
import { getMemoryLayersStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

const layerSchema = z.enum(["user", "team", "company", "customer"]);

export async function GET(req: Request) {
  try {
    const scope = await getTenantScope();
    const store = getMemoryLayersStore();
    const allEntries = await store.list(scope);
    const layerQuery = new URL(req.url).searchParams.get("layer");
    if (layerQuery) {
      const parsedLayer = layerSchema.safeParse(layerQuery);
      if (!parsedLayer.success) {
        return apiError("VALIDATION_ERROR", "Invalid layer query parameter", 400);
      }
      const entries = allEntries.filter((entry) => entry.layer === parsedLayer.data);
      return NextResponse.json({ entries });
    }

    return NextResponse.json({ entries: allEntries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("MEMORY_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
