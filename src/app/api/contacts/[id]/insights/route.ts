import { NextResponse } from "next/server";
import { generateContactInsights } from "@/lib/ai/crm-insights";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function POST(
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
  const repo = getCrmRepository();
  const contact = await repo.getContact(id, scope);
  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [deals, activities] = await Promise.all([
    repo.listDeals(scope),
    repo.listActivities(scope, { contactId: id }),
  ]);

  const insights = await generateContactInsights({
    contact,
    deals: deals.filter((d) => d.contactId === id),
    activities,
  });

  return NextResponse.json({ insights });
}
