import { NextResponse } from "next/server";
import { z } from "zod";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getSessionContext, getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const stageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  order: z.number().int().min(0),
  probability: z.number().min(0).max(100),
});

const createSchema = z.object({
  name: z.string().min(1),
  stages: z.array(stageSchema).optional(),
});

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const pipelines = await getCrmRepository().listPipelines(scope);
  return NextResponse.json({ pipelines });
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pipeline = await getCrmRepository().createPipeline(parsed.data, ctx.scope);
  return NextResponse.json({ pipeline }, { status: 201 });
}
