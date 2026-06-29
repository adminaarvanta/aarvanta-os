import { NextResponse } from "next/server";
import { z } from "zod";
import { recordMutationEvent } from "@/lib/api/mutation-events";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getSessionContext } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  contactId: z.string().optional(),
  accountId: z.string().optional(),
  dealId: z.string().optional(),
});

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
  const task = await getCrmRepository().updateTask(id, parsed.data, ctx.scope);
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const eventType =
    parsed.data.status === "done" || task.status === "done"
      ? "task.completed"
      : "task.updated";

  await recordMutationEvent({
    ctx,
    type: eventType,
    entityType: "task",
    entityId: task.id,
    payload: { changes: parsed.data, status: task.status },
  });

  return NextResponse.json({ task });
}
