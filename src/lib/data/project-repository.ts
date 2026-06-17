import type { TenantScope } from "@/types/communication";
import type {
  Project,
  ProjectStatus,
  ProjectTask,
  ProjectTaskStatus,
} from "@/types/project";

export type CreateProjectInput = {
  name: string;
  description?: string;
  status?: ProjectStatus;
  color?: string;
  startDate?: string;
  dueDate?: string;
  contactId?: string;
  dealId?: string;
  tags?: string[];
};

export type CreateProjectTaskInput = {
  projectId: string;
  title: string;
  description?: string;
  status?: ProjectTaskStatus;
  priority?: ProjectTask["priority"];
  dueDate?: string;
  assignee?: string;
  order?: number;
};

export interface ProjectRepository {
  listProjects(scope: TenantScope): Promise<Project[]>;
  getProject(id: string, scope: TenantScope): Promise<Project | null>;
  createProject(input: CreateProjectInput, scope: TenantScope): Promise<Project>;
  updateProject(
    id: string,
    patch: Partial<
      Pick<
        Project,
        | "name"
        | "description"
        | "status"
        | "color"
        | "startDate"
        | "dueDate"
        | "contactId"
        | "dealId"
        | "tags"
      >
    >,
    scope: TenantScope
  ): Promise<Project | null>;

  listTasks(scope: TenantScope, projectId?: string): Promise<ProjectTask[]>;
  getTask(id: string, scope: TenantScope): Promise<ProjectTask | null>;
  createTask(input: CreateProjectTaskInput, scope: TenantScope): Promise<ProjectTask>;
  updateTask(
    id: string,
    patch: Partial<
      Pick<
        ProjectTask,
        | "title"
        | "description"
        | "status"
        | "priority"
        | "dueDate"
        | "assignee"
        | "order"
      >
    >,
    scope: TenantScope
  ): Promise<ProjectTask | null>;
}
