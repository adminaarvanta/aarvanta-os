import { NextResponse } from "next/server";
import { z } from "zod";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
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
  const company = await getCrmRepository().getCompany(id, scope);
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [contacts, deals, activities] = await Promise.all([
    getCrmRepository().listContacts(scope, { accountId: id }),
    getCrmRepository().listDeals(scope, { accountId: id }),
    getCrmRepository().listActivities(scope, { accountId: id }),
  ]);

  return NextResponse.json({
    company,
    contacts,
    deals,
    activities,
  });
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

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const company = await getCrmRepository().updateCompany(id, parsed.data, scope);
  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ company });
}
