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
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/projects" className="text-xs text-[#D4AF37] hover:underline">
          ← Projects
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">
            {project.name}
          </h2>
          <Badge className="bg-[#141414] text-[#A89878] ring-[#3d3528]">
            {project.status.replace("_", " ")}
          </Badge>
        </div>
        {project.description && (
          <p className="mt-1 text-xs text-[#A89878] sm:text-sm">{project.description}</p>
        )}
      </header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
