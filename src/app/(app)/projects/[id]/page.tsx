import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectKanbanBoard } from "@/components/projects/project-kanban-board";
import { getProjectRepository } from "@/lib/data/project-store";
import { getTenantScope } from "@/lib/tenant/context";
import { Badge } from "@/components/ui/badge";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const repo = getProjectRepository();

  const project = await repo.getProject(id, scope);
  if (!project) notFound();

  const tasks = await repo.listTasks(scope, id);

  return (
    <>
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/projects" className="text-xs text-[#B8965D] hover:underline">
          ← Projects
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-[#FFFFFF] sm:text-xl">
            {project.name}
          </h2>
          <Badge className="bg-[#121E32] text-[#9AABC4] ring-[#243656]">
            {project.status.replace("_", " ")}
          </Badge>
        </div>
        {project.description && (
          <p className="mt-1 text-xs text-[#9AABC4] sm:text-sm">{project.description}</p>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <ProjectKanbanBoard projectId={project.id} tasks={tasks} />
      </div>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const project = await getProjectRepository().getProject(id, scope);
  return { title: project?.name ?? "Project" };
}
