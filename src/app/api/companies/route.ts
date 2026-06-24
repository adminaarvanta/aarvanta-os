import { NextResponse } from "next/server";
import { z } from "zod";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const createSchema = z.object({
  name: z.string().min(1),
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

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const companies = await getCrmRepository().listCompanies(scope);
  return NextResponse.json({ companies });
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

  const company = await getCrmRepository().createCompany(parsed.data, scope);
  return NextResponse.json({ company }, { status: 201 });
}
