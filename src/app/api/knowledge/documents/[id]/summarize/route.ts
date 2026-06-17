import { NextResponse } from "next/server";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { summarizeDocument } from "@/lib/knowledge/rag";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const repo = getKnowledgeRepository();
  const document = await repo.getDocument(id, scope);
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chunks = await repo.listChunks(scope, id);
  const text = chunks.map((c) => c.content).join("\n\n");
  if (!text) {
    return NextResponse.json({ error: "Document has no content" }, { status: 400 });
  }

  const { summary, tags } = await summarizeDocument({
    title: document.title,
    text,
  });

  const updated = await repo.updateDocument(id, { summary, tags }, scope);
  return NextResponse.json({ document: updated });
}
