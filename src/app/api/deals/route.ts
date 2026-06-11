import { NextResponse } from "next/server";
import { z } from "zod";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const createSchema = z.object({
  title: z.string().min(1),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1),
  contactId: z.string().optional(),
  accountId: z.string().optional(),
  value: z.number().min(0),
  currency: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  status: z.enum(["open", "won", "lost"]).optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const pipelineId = new URL(req.url).searchParams.get("pipelineId") ?? undefined;
  const deals = await getCrmRepository().listDeals(scope, pipelineId ?? undefined);
  return NextResponse.json({ deals });
}

export async function POST(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const deal = await getCrmRepository().createDeal(parsed.data, scope);
  return NextResponse.json({ deal }, { status: 201 });
}
