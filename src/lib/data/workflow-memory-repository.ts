import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { WorkflowRepository } from "@/lib/data/workflow-repository";
import { buildDemoWorkflowSeed } from "@/lib/data/workflow-demo-seed";
import type { Workflow, WorkflowRun } from "@/types/workflow";

let workflows: Workflow[] = buildDemoWorkflowSeed();
let runs: WorkflowRun[] = [];

export const workflowMemoryRepository: WorkflowRepository = {
  async listWorkflows(scope) {
    return workflows
      .filter((w) => inCrmScope(w, scope))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async getWorkflow(id, scope) {
    const item = workflows.find((w) => w.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async createWorkflow(input, scope) {
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
    workflows.unshift(workflow);
    return workflow;
  },

  async updateWorkflow(id, patch, scope) {
    const idx = workflows.findIndex((w) => w.id === id && inCrmScope(w, scope));
    if (idx === -1) return null;
    workflows[idx] = { ...workflows[idx], ...patch, updatedAt: crmNow() };
    return workflows[idx];
  },

  async deleteWorkflow(id, scope) {
    const idx = workflows.findIndex((w) => w.id === id && inCrmScope(w, scope));
    if (idx === -1) return false;
    workflows.splice(idx, 1);
    runs = runs.filter((r) => !(r.workflowId === id && inCrmScope(r, scope)));
    return true;
  },

  async listRuns(scope, workflowId) {
    return runs
      .filter(
        (r) => inCrmScope(r, scope) && (!workflowId || r.workflowId === workflowId)
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async getRun(id, scope) {
    const item = runs.find((r) => r.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async createRun(input, scope) {
    const run: WorkflowRun = {
      ...scope,
      ...input,
      id: crmNewId("wf_run"),
      createdAt: crmNow(),
    };
    runs.unshift(run);
    return run;
  },

  async updateRun(id, patch, scope) {
    const idx = runs.findIndex((r) => r.id === id && inCrmScope(r, scope));
    if (idx === -1) return null;
    runs[idx] = { ...runs[idx], ...patch };
    return runs[idx];
  },
};

export function resetWorkflowMemory() {
  workflows = buildDemoWorkflowSeed();
  runs = [];
}
