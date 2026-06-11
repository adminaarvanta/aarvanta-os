import { NextResponse } from "next/server";
import { z } from "zod";
import { applyAgentAction } from "@/lib/workforce/apply-action";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { crmNow } from "@/lib/data/crm-helpers";

const schema = z.object({
  actionId: z.string().min(1),
});

export async function POST(
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const repo = getWorkforceRepository();
  const run = await repo.getRun(id, scope);
  if (!run) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const action = run.actions.find((a) => a.id === parsed.data.actionId);
  if (!action) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }

  if (action.applied) {
    return NextResponse.json({ error: "Action already applied" }, { status: 409 });
  }

  if (action.type === "suggest_reply" || action.type === "alert") {
    const updatedActions = run.actions.map((a) =>
      a.id === action.id
        ? { ...a, applied: true, appliedAt: crmNow() }
        : a
    );
    const updated = await repo.updateRun(id, { actions: updatedActions }, scope);
    return NextResponse.json({
      result: await applyAgentAction(action, scope),
      run: updated,
    });
  }

  try {
    const result = await applyAgentAction(action, scope);
    const updatedActions = run.actions.map((a) =>
      a.id === action.id
        ? { ...a, applied: true, appliedAt: crmNow() }
        : a
    );
    const updated = await repo.updateRun(id, { actions: updatedActions }, scope);
    return NextResponse.json({ result, run: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "APPLY_FAILED",
          message: error instanceof Error ? error.message : "Failed to apply action",
        },
      },
      { status: 400 }
    );
  }
}
