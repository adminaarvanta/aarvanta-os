import { NextResponse } from "next/server";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

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
    getCrmRepository().listContacts(scope),
    getCrmRepository().listDeals(scope),
    getCrmRepository().listActivities(scope, { accountId: id }),
  ]);

  return NextResponse.json({
    company,
    contacts: contacts.filter((c) => c.accountId === id),
    deals: deals.filter((d) => d.accountId === id),
    activities,
  });
}
