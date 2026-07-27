import { withFirestoreFallback, isMemoryDatastore } from "@/lib/data/datastore";
import { createScopedRepository } from "@/lib/data/scoped-store";
import type { TenantScope } from "@/types/communication";
import type {
  ContextPackage,
  WorkforceApproval,
  WorkforceExecution,
  WorkforceGoal,
  WorkforceReport,
} from "@/types/workforce";

type ScopedEntity = TenantScope & { id: string };
type CreateInput<T extends ScopedEntity> = Omit<T, "id"> &
  Partial<Pick<T, "id">>;

type ScopedCrudStore<T extends ScopedEntity> = {
  list(scope: TenantScope): Promise<T[]>;
  get(id: string, scope: TenantScope): Promise<T | null>;
  create(item: CreateInput<T>): Promise<T>;
  set(item: T): Promise<T>;
  remove(id: string, scope: TenantScope): Promise<boolean>;
};

function createCrudStore<T extends ScopedEntity>(
  repository: ReturnType<typeof createScopedRepository<T>>,
  idPrefix: string
): ScopedCrudStore<T> {
  return {
    async list(scope) {
      if (isMemoryDatastore()) return repository.memory.list(scope);
      return withFirestoreFallback(
        () => repository.firestore.list(scope),
        () => repository.memory.list(scope)
      );
    },
    async get(id, scope) {
      if (isMemoryDatastore()) return repository.memory.get(id, scope);
      return withFirestoreFallback(
        () => repository.firestore.get(id, scope),
        () => repository.memory.get(id, scope)
      );
    },
    async create(item) {
      if (isMemoryDatastore()) return repository.memory.create(item, idPrefix);
      return withFirestoreFallback(
        () => repository.firestore.create(item, idPrefix),
        () => repository.memory.create(item, idPrefix)
      );
    },
    async set(item) {
      if (isMemoryDatastore()) return repository.memory.set(item);
      return withFirestoreFallback(
        () => repository.firestore.set(item),
        () => repository.memory.set(item)
      );
    },
    async remove(id, scope) {
      if (isMemoryDatastore()) return repository.memory.remove(id, scope);
      return withFirestoreFallback(
        () => repository.firestore.remove(id, scope),
        () => repository.memory.remove(id, scope)
      );
    },
  };
}

const goalsRepo = createScopedRepository<WorkforceGoal>(
  "workforce_goals",
  () => []
);
const executionsRepo = createScopedRepository<WorkforceExecution>(
  "workforce_executions",
  () => []
);
const contextsRepo = createScopedRepository<ContextPackage>(
  "workforce_contexts",
  () => []
);
const approvalsRepo = createScopedRepository<WorkforceApproval>(
  "workforce_approvals",
  () => []
);
const reportsRepo = createScopedRepository<WorkforceReport>(
  "workforce_reports",
  () => []
);

const goalsStore = createCrudStore(goalsRepo, "wf_goal");
const executionsStore = createCrudStore(executionsRepo, "wf_exec");
const contextsStore = createCrudStore(contextsRepo, "wf_ctx");
const approvalsStore = createCrudStore(approvalsRepo, "wf_appr");
const reportsStore = createCrudStore(reportsRepo, "wf_rpt");

export function getWorkforceGoalsStore() {
  return goalsStore;
}

export function getWorkforceExecutionsStore() {
  return executionsStore;
}

export function getWorkforceContextsStore() {
  return contextsStore;
}

export function getWorkforceApprovalsStore() {
  return approvalsStore;
}

export function getWorkforceReportsStore() {
  return reportsStore;
}
