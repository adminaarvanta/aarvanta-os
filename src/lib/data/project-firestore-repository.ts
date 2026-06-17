import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { ProjectRepository } from "@/lib/data/project-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { Project, ProjectTask } from "@/types/project";

const PROJECTS = "projects";
const TASKS = "project_tasks";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

async function listScoped<T extends { tenantId: string }>(
  collection: string,
  scope: TenantScope
): Promise<T[]> {
  const snap = await getDb()
    .collection(collection)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as T);
}

export const projectFirestoreRepository: ProjectRepository = {
  async listProjects(scope) {
    const items = await listScoped<Project>(PROJECTS, scope);
    return items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getProject(id, scope) {
    const snap = await getDb().collection(PROJECTS).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as Project;
    return inCrmScope(data, scope) ? data : null;
  },

  async createProject(input, scope) {
    const now = crmNow();
    const project: Project = {
      ...scope,
      id: crmNewId("proj"),
      ...input,
      status: input.status ?? "active",
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await getDb().collection(PROJECTS).doc(project.id).set(project);
    return project;
  },

  async updateProject(id, patch, scope) {
    const existing = await this.getProject(id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    await getDb().collection(PROJECTS).doc(id).set(updated);
    return updated;
  },

  async listTasks(scope, projectId) {
    const items = await listScoped<ProjectTask>(TASKS, scope);
    return items
      .filter((t) => !projectId || t.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  },

  async getTask(id, scope) {
    const snap = await getDb().collection(TASKS).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as ProjectTask;
    return inCrmScope(data, scope) ? data : null;
  },

  async createTask(input, scope) {
    const existing = await this.listTasks(scope, input.projectId);
    const now = crmNow();
    const task: ProjectTask = {
      ...scope,
      id: crmNewId("ptask"),
      ...input,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      order: input.order ?? existing.length,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().collection(TASKS).doc(task.id).set(task);
    return task;
  },

  async updateTask(id, patch, scope) {
    const existing = await this.getTask(id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    await getDb().collection(TASKS).doc(id).set(updated);
    return updated;
  },
};
