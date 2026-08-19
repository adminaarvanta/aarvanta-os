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

  try {
    const { consumeCredits } = await import("@/lib/billing/consume");
    await consumeCredits(scope, "lead_score");
  } catch (error) {
    const { handlePlanError } = await import("@/lib/billing/api-guard");
    const planRes = handlePlanError(error);
    if (planRes) return planRes;
    throw error;
  }

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

  const { publishDomainEvent } = await import("@/lib/events/publish");
  const { aiAgentActor } = await import("@/lib/identity/from-session");
  await publishDomainEvent({
    scope,
    type: "contact.updated",
    actor: aiAgentActor("sales_manager", "AI Sales Manager"),
    entityType: "contact",
    entityId: id,
    source: "ai",
    payload: { leadScore: score, reason },
  });

  return NextResponse.json({ contact: updated, score, reason });
}
