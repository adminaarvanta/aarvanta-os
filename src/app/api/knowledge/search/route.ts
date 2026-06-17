import { NextResponse } from "next/server";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { searchKnowledgeChunks } from "@/lib/knowledge/search";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function GET(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const query = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ hits: [] });
  }

  const repo = getKnowledgeRepository();
  const chunks = await repo.listChunks(scope);
  const hits = await searchKnowledgeChunks(chunks, query, 10);

  return NextResponse.json({ hits, query });
}
