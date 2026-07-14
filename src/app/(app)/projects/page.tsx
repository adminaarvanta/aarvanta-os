import { Kanban } from "lucide-react";
import { ProjectList } from "@/components/projects/project-list";
import { getProjectRepository } from "@/lib/data/project-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function ProjectsPage() {
  const scope = await getTenantScope();
  const projects = await getProjectRepository().listProjects(scope);

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl">
          <Kanban className="h-5 w-5 text-gold" />
          Projects
        </h2>
        <p className="text-xs text-muted sm:text-sm">
          Project OS — Kanban boards, tasks, and delivery tracking.
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <ProjectList projects={projects} />
      </div>
    </>
  );
}

export const metadata = { title: "Projects" };
