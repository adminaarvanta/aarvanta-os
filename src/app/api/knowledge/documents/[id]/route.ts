import { NextResponse } from "next/server";
import { z } from "zod";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
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
  return NextResponse.json({ document, chunks });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const updated = await getKnowledgeRepository().updateDocument(
    id,
    parsed.data,
    scope
  );
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ document: updated });
}

export async function DELETE(
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
  const deleted = await getKnowledgeRepository().deleteDocument(id, scope);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
