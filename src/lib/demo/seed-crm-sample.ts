import { buildCrmSampleForScope } from "@/lib/data/crm-demo-seed";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isMemoryDatastore } from "@/lib/data/datastore";
import type { TenantScope } from "@/types/communication";

export type SeedCrmSampleResult = {
  seeded: boolean;
  reason?: string;
  counts: {
    pipelines: number;
    companies: number;
    contacts: number;
    deals: number;
    tasks: number;
    activities: number;
  };
};

/**
 * Seed sample CRM data (companies, leads, pipeline deals, agent-assigned tasks)
 * for the active tenant so AI workforce can be exercised end-to-end.
 *
 * Idempotent by default: skips when contacts already exist unless `force` is set.
 */
export async function seedCrmSampleData(
  scope: TenantScope,
  options?: { force?: boolean }
): Promise<SeedCrmSampleResult> {
  const crm = getCrmRepository();
  const existingContacts = await crm.listContacts(scope);
  const existingTasks = await crm.listTasks(scope);
  const agentTasks = existingTasks.filter((t) => Boolean(t.assignedAgentType));

  if (!options?.force && existingContacts.length > 0 && agentTasks.length > 0) {
    return {
      seeded: false,
      reason: "CRM already has contacts and agent tasks. Pass force=true to reseed.",
      counts: {
        pipelines: (await crm.listPipelines(scope)).length,
        companies: (await crm.listCompanies(scope)).length,
        contacts: existingContacts.length,
        deals: (await crm.listDeals(scope)).length,
        tasks: existingTasks.length,
        activities: (await crm.listActivities(scope)).length,
      },
    };
  }

  const sample = buildCrmSampleForScope(scope);

  // Prefer direct Firestore writes with stable IDs so agent task links stay consistent.
  if (!isMemoryDatastore()) {
    const db = getAdminFirestore();
    if (!db) {
      throw new Error("Firestore is not configured.");
    }

    const batchWrites: Array<{ collection: string; id: string; data: object }> = [
      ...sample.pipelines.map((item) => ({
        collection: "crm_pipelines",
        id: item.id,
        data: item,
      })),
      ...sample.companies.map((item) => ({
        collection: "crm_companies",
        id: item.id,
        data: item,
      })),
      ...sample.contacts.map((item) => ({
        collection: "crm_contacts",
        id: item.id,
        data: item,
      })),
      ...sample.deals.map((item) => ({
        collection: "crm_deals",
        id: item.id,
        data: item,
      })),
      ...sample.tasks.map((item) => ({
        collection: "crm_tasks",
        id: item.id,
        data: item,
      })),
      ...sample.activities.map((item) => ({
        collection: "crm_activities",
        id: item.id,
        data: item,
      })),
    ];

    // Firestore batches max 500 ops.
    const chunkSize = 400;
    for (let i = 0; i < batchWrites.length; i += chunkSize) {
      const chunk = batchWrites.slice(i, i + chunkSize);
      const batch = db.batch();
      for (const row of chunk) {
        batch.set(db.collection(row.collection).doc(row.id), row.data, {
          merge: true,
        });
      }
      await batch.commit();
    }
  } else {
    // Memory datastore: create via repository when missing, otherwise overwrite via create+delete isn't available for fixed IDs.
    // Reset in-memory demo arrays by writing through create* when ids don't already exist.
    const { resetCrmMemoryWithSample } = await import(
      "@/lib/data/crm-memory-repository"
    );
    resetCrmMemoryWithSample(sample);
  }

  return {
    seeded: true,
    counts: {
      pipelines: sample.pipelines.length,
      companies: sample.companies.length,
      contacts: sample.contacts.length,
      deals: sample.deals.length,
      tasks: sample.tasks.length,
      activities: sample.activities.length,
    },
  };
}

/** Seed only when CRM has no contacts (production first-run). */
export async function ensureCrmSampleSeed(scope: TenantScope): Promise<void> {
  const contacts = await getCrmRepository().listContacts(scope);
  if (contacts.length > 0) return;
  await seedCrmSampleData(scope, { force: true });
}
