import { isProductionMode } from "@/lib/config/app-mode";
import { ensureDatastoreReady, isMemoryDatastore } from "@/lib/data/datastore";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { WORKFLOW_TEMPLATES } from "@/lib/data/workflow-demo-seed";
import { ensureSalesPipeline } from "@/lib/demo/crm-bootstrap";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getProductionTenantScope } from "@/lib/tenant/context";
import { ensureTenantRecords } from "@/lib/tenant/ensure-tenant-records";
import type { MemberRole } from "@/types/tenant";
import type { TenantScope } from "@/types/communication";

let bootstrapPromise: Promise<void> | null = null;

function productionBootstrapContext() {
  const scope = getProductionTenantScope();
  const email = process.env.AUTH_EMAIL?.trim();
  if (!email) {
    throw new Error("AUTH_EMAIL is required for production bootstrap.");
  }

  return {
    userId: process.env.AUTH_USER_ID?.trim() || "user_prod",
    email,
    name: process.env.AUTH_NAME?.trim() || "Workspace owner",
    role: "owner" as MemberRole,
    scope,
    member: null,
  };
}

async function ensureWorkflowBootstrap(scope: TenantScope): Promise<void> {
  const repo = getWorkflowRepository();
  const workflows = await repo.listWorkflows(scope);
  if (workflows.length > 0) return;

  for (const template of WORKFLOW_TEMPLATES) {
    await repo.createWorkflow(
      {
        name: template.name,
        description: template.description,
        enabled: template.enabled,
        templateId: template.templateId,
        trigger: template.trigger,
        tags: template.tags,
        steps: template.steps,
      },
      scope
    );
  }
}

/** Idempotent first-run setup for empty production Firestore workspaces. */
export async function ensureProductionBootstrap(): Promise<void> {
  if (!isProductionMode()) return;

  if (!bootstrapPromise) {
    bootstrapPromise = runProductionBootstrap().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}

async function runProductionBootstrap(): Promise<void> {
  await ensureDatastoreReady();
  if (isMemoryDatastore()) return;

  try {
    const ctx = productionBootstrapContext();
    await ensureTenantRecords(ctx);
    await ensureSalesPipeline(ctx.scope);
    await ensureHrPlatformSeed(ctx.scope);
    await ensureWorkflowBootstrap(ctx.scope);
  } catch (error) {
    console.warn(
      "[bootstrap] Production workspace bootstrap skipped:",
      error instanceof Error ? error.message : error
    );
  }
}
