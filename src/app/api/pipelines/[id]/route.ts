import { NextResponse } from "next/server";
import { z } from "zod";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getSessionContext, getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const stageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().min(0),
  probability: z.number().min(0).max(100),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  stages: z.array(stageSchema).optional(),
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
  const pipeline = await getCrmRepository().getPipeline(id, scope);
  if (!pipeline) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deals = await getCrmRepository().listDeals(scope, { pipelineId: id });
  return NextResponse.json({ pipeline, deals });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const pipeline = await getCrmRepository().updatePipeline(id, parsed.data, ctx.scope);
  if (!pipeline) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ pipeline });
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
  const ok = await getCrmRepository().deletePipeline(id, scope);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
