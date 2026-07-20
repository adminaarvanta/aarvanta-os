import { NextResponse } from "next/server";
import { z } from "zod";
import { recordMutationEvent } from "@/lib/api/mutation-events";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getSessionContext, getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  accountId: z.string().optional(),
  tags: z
    .array(
      z.enum([
        "hot_lead",
        "vip",
        "customer",
        "prospect",
        "partner",
        "follow_up",
      ])
    )
    .optional(),
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
  const contact = await getCrmRepository().getContact(id, scope);
  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [activities, deals, tasks] = await Promise.all([
    getCrmRepository().listActivities(scope, { contactId: id }),
    getCrmRepository().listDeals(scope),
    getCrmRepository().listTasks(scope),
  ]);

  return NextResponse.json({
    contact,
    activities,
    deals: deals.filter((d) => d.contactId === id),
    tasks: tasks.filter((t) => t.contactId === id),
  });
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
  const contact = await getCrmRepository().updateContact(id, parsed.data, ctx.scope);
  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await recordMutationEvent({
    ctx,
    type: "contact.updated",
    entityType: "contact",
    entityId: contact.id,
    payload: { changes: parsed.data },
  });

  return NextResponse.json({ contact });
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
  const ok = await getCrmRepository().deleteContact(id, scope);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
