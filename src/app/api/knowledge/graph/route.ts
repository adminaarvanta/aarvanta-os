import { NextResponse } from "next/server";
import { getKnowledgeGraphStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const store = getKnowledgeGraphStore();
    const [nodes, edges] = await Promise.all([
      store.listNodes(scope),
      store.listEdges(scope),
    ]);
    return NextResponse.json({ nodes, edges });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("KNOWLEDGE_GRAPH_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
