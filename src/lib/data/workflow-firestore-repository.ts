import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { CreateWorkflowInput, WorkflowRepository } from "@/lib/data/workflow-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { Workflow, WorkflowRun } from "@/types/workflow";

const WORKFLOWS = "workflows";
const RUNS = "workflow_runs";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

async function listScoped<T extends TenantScope>(collection: string, scope: TenantScope) {
  const snap = await getDb()
    .collection(collection)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as T);
}

export const workflowFirestoreRepository: WorkflowRepository = {
  async listWorkflows(scope) {
    const items = await listScoped<Workflow>(WORKFLOWS, scope);
    return items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getWorkflow(id, scope) {
    const snap = await getDb().collection(WORKFLOWS).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as Workflow;
    return inCrmScope(data, scope) ? data : null;
  },

  async createWorkflow(input: CreateWorkflowInput, scope) {
    const now = crmNow();
    const workflow: Workflow = {
      ...scope,
      id: crmNewId("wf"),
      ...input,
      enabled: input.enabled ?? true,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await getDb().collection(WORKFLOWS).doc(workflow.id).set(workflow);
    return workflow;
  },

  async updateWorkflow(id, patch, scope) {
    const existing = await this.getWorkflow(id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    await getDb().collection(WORKFLOWS).doc(id).set(updated);
    return updated;
  },

  async deleteWorkflow(id, scope) {
    const existing = await this.getWorkflow(id, scope);
    if (!existing) return false;
    await getDb().collection(WORKFLOWS).doc(id).delete();
    const runSnap = await getDb()
      .collection(RUNS)
      .where("workflowId", "==", id)
      .get();
    const batch = getDb().batch();
    for (const doc of runSnap.docs) batch.delete(doc.ref);
    await batch.commit();
    return true;
  },

  async listRuns(scope, workflowId) {
    const items = await listScoped<WorkflowRun>(RUNS, scope);
    return items
      .filter((r) => !workflowId || r.workflowId === workflowId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async getRun(id, scope) {
    const snap = await getDb().collection(RUNS).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as WorkflowRun;
    return inCrmScope(data, scope) ? data : null;
  },

  async createRun(input, scope) {
    const run: WorkflowRun = {
      ...scope,
      ...input,
      id: crmNewId("wf_run"),
      createdAt: crmNow(),
    };
    await getDb().collection(RUNS).doc(run.id).set(run);
    return run;
  },

  async updateRun(id, patch, scope) {
    const existing = await this.getRun(id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    await getDb().collection(RUNS).doc(id).set(updated);
    return updated;
  },
};
