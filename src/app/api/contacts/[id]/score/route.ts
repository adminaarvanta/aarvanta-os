import { NextResponse } from "next/server";
import { generateLeadScore } from "@/lib/ai/lead-score";
import { crmNow } from "@/lib/data/crm-helpers";
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

  const { score, reason } = await generateLeadScore({
    contact,
    deals: deals.filter((d) => d.contactId === id),
    activities,
  });

  const updated = await repo.updateContact(
    id,
    {
      leadScore: score,
      leadScoreReason: reason,
      leadScoreUpdatedAt: crmNow(),
    },
    scope
  );

  return NextResponse.json({ contact: updated, score, reason });
}
