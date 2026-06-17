import type { TenantScope } from "@/types/communication";
import type { Workflow, WorkflowRun, WorkflowRunContext } from "@/types/workflow";

export type CreateWorkflowInput = {
  name: string;
  description?: string;
  enabled?: boolean;
  templateId?: string;
  trigger: Workflow["trigger"];
  steps: Workflow["steps"];
  tags?: string[];
};

export interface WorkflowRepository {
  listWorkflows(scope: TenantScope): Promise<Workflow[]>;
  getWorkflow(id: string, scope: TenantScope): Promise<Workflow | null>;
  createWorkflow(input: CreateWorkflowInput, scope: TenantScope): Promise<Workflow>;
  updateWorkflow(
    id: string,
    patch: Partial<
      Pick<
        Workflow,
        "name" | "description" | "enabled" | "trigger" | "steps" | "tags"
      >
    >,
    scope: TenantScope
  ): Promise<Workflow | null>;
  deleteWorkflow(id: string, scope: TenantScope): Promise<boolean>;

  listRuns(scope: TenantScope, workflowId?: string): Promise<WorkflowRun[]>;
  getRun(id: string, scope: TenantScope): Promise<WorkflowRun | null>;
  createRun(
    input: Omit<WorkflowRun, keyof TenantScope | "id" | "createdAt">,
    scope: TenantScope
  ): Promise<WorkflowRun>;
  updateRun(
    id: string,
    patch: Partial<
      Pick<
        WorkflowRun,
        | "status"
        | "stepLogs"
        | "pendingApproval"
        | "error"
        | "completedAt"
        | "context"
      >
    >,
    scope: TenantScope
  ): Promise<WorkflowRun | null>;
}

export type RunWorkflowInput = {
  workflowId: string;
  context?: WorkflowRunContext;
};
