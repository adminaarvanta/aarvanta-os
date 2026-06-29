import { NextResponse } from "next/server";
import { z } from "zod";
import { recordMutationEvent } from "@/lib/api/mutation-events";
import { getCrmRepository } from "@/lib/data/crm-store";
import { validateAgainstRules } from "@/lib/rules/validate-mutation";
import { getSessionContext, getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  stageId: z.string().optional(),
  contactId: z.string().optional(),
  accountId: z.string().optional(),
  value: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  status: z.enum(["open", "won", "lost"]).optional(),
  notes: z.string().optional(),
  ownerId: z.string().optional(),
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
  const deal = await getCrmRepository().getDeal(id, scope);
  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [activities, tasks] = await Promise.all([
    getCrmRepository().listActivities(scope, { dealId: id }),
    getCrmRepository().listTasks(scope, { dealId: id }),
  ]);

  return NextResponse.json({ deal, activities, tasks });
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
  const existing = await getCrmRepository().getDeal(id, ctx.scope);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextStatus = parsed.data.status ?? existing.status;
  const nextValue = parsed.data.value ?? existing.value;
  const ruleCheck = validateAgainstRules({
    deal: { status: nextStatus, value: nextValue },
  });
  if (!ruleCheck.allowed) {
    return NextResponse.json(
      { error: { code: "RULE_VIOLATION", message: ruleCheck.message, ruleId: ruleCheck.ruleId } },
      { status: 422 }
    );
  }

  const deal = await getCrmRepository().updateDeal(id, parsed.data, ctx.scope);
  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const eventType =
    parsed.data.status === "won"
      ? "deal.won"
      : parsed.data.status === "lost"
        ? "deal.lost"
        : "deal.updated";

  await recordMutationEvent({
    ctx,
    type: eventType,
    entityType: "deal",
    entityId: deal.id,
    payload: { changes: parsed.data, status: deal.status, value: deal.value },
  });

  return NextResponse.json({ deal });
}
