import type { TenantScope } from "@/types/communication";

export type ProjectStatus = "active" | "completed" | "on_hold";
export type ProjectTaskStatus = "todo" | "in_progress" | "done";
export type ProjectTaskPriority = "low" | "medium" | "high";

export interface Project extends TenantScope {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  color?: string;
  startDate?: string;
  dueDate?: string;
  contactId?: string;
  dealId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask extends TenantScope {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  dueDate?: string;
  assignee?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
