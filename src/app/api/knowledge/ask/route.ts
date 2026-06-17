import { NextResponse } from "next/server";
import { z } from "zod";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { askKnowledgeBase } from "@/lib/knowledge/rag";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const schema = z.object({
  question: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const repo = getKnowledgeRepository();
  const [documents, chunks] = await Promise.all([
    repo.listDocuments(scope),
    repo.listChunks(scope),
  ]);

  const result = await askKnowledgeBase({
    question: parsed.data.question,
    documents,
    chunks,
  });

  return NextResponse.json({ result });
}
