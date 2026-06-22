import { DEMO_CRM_PIPELINES } from "@/lib/data/crm-demo-seed";
import { crmNewId } from "@/lib/data/crm-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isProductionMode } from "@/lib/config/app-mode";
import type { TenantScope } from "@/types/communication";
import type { CrmPipeline } from "@/types/crm";

/** Ensure a sales pipeline exists (production Firestore may start empty). */
export async function ensureSalesPipeline(
  scope: TenantScope
): Promise<CrmPipeline> {
  const crm = getCrmRepository();
  const pipelines = await crm.listPipelines(scope);
  if (pipelines.length > 0) return pipelines[0]!;

  const template = DEMO_CRM_PIPELINES[0]!;
  const pipeline: CrmPipeline = {
    ...template,
    ...scope,
    id: crmNewId("pipe"),
  };

  if (isProductionMode()) {
    const db = getAdminFirestore();
    if (!db) throw new Error("Firestore is not configured.");
    await db.collection("crm_pipelines").doc(pipeline.id).set(pipeline);
  }

  return pipeline;
}
