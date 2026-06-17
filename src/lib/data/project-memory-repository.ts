import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type {
  CreateProjectInput,
  CreateProjectTaskInput,
  ProjectRepository,
} from "@/lib/data/project-repository";
import { buildDemoProjectSeed } from "@/lib/data/project-demo-seed";
import type { TenantScope } from "@/types/communication";
import type { Project, ProjectTask } from "@/types/project";

const seed = buildDemoProjectSeed();
let projects: Project[] = seed.projects;
let tasks: ProjectTask[] = seed.tasks;

export const projectMemoryRepository: ProjectRepository = {
  async listProjects(scope) {
    return projects
      .filter((p) => inCrmScope(p, scope))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async getProject(id, scope) {
    const item = projects.find((p) => p.id === id);
    return item && inCrmScope(item, scope) ? item : null;
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
    projects.unshift(project);
    return project;
  },

  async updateProject(id, patch, scope) {
    const idx = projects.findIndex((p) => p.id === id && inCrmScope(p, scope));
    if (idx === -1) return null;
    projects[idx] = { ...projects[idx], ...patch, updatedAt: crmNow() };
    return projects[idx];
  },

  async listTasks(scope, projectId) {
    return tasks
      .filter(
        (t) => inCrmScope(t, scope) && (!projectId || t.projectId === projectId)
      )
      .sort((a, b) => a.order - b.order);
  },

  async getTask(id, scope) {
    const item = tasks.find((t) => t.id === id);
    return item && inCrmScope(item, scope) ? item : null;
  },

  async createTask(input, scope) {
    const now = crmNow();
    const task: ProjectTask = {
      ...scope,
      id: crmNewId("ptask"),
      ...input,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      order: input.order ?? tasks.filter((t) => t.projectId === input.projectId).length,
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(task);
    return task;
  },

  async updateTask(id, patch, scope) {
    const idx = tasks.findIndex((t) => t.id === id && inCrmScope(t, scope));
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...patch, updatedAt: crmNow() };
    return tasks[idx];
  },
};

export function resetProjectMemory() {
  const fresh = buildDemoProjectSeed();
  projects = fresh.projects;
  tasks = fresh.tasks;
}
