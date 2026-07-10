import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/project";
import { formatRelative } from "@/lib/utils";

const statusColors: Record<Project["status"], string> = {
  active: "bg-[#0A2A33] text-[#4DA6FF] ring-[#4DA6FF]/30",
  completed: "bg-[#0D1A2E] text-[#4DA6FF] ring-[#4DA6FF]/30",
  on_hold: "bg-[#2A2210] text-[#C9AA72] ring-[#B8965D]/35",
};

export function ProjectList({ projects }: { projects: Project[] }) {
  if (!projects.length) {
    return (
      <p className="text-sm text-[#9AABC4]">
        No projects yet. Create one to start tracking work on a Kanban board.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="block rounded-xl border border-[#243656] bg-[#0D1524] p-5 hover:border-[#B8965D]/40 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-1 h-3 w-3 shrink-0 rounded-full ring-2 ring-[#243656]"
                style={{ backgroundColor: project.color ?? "#B8965D" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#FFFFFF]">{project.name}</p>
                  <Badge className={statusColors[project.status]}>
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
                {project.description && (
                  <p className="mt-1 text-xs text-[#9AABC4] line-clamp-2">
                    {project.description}
                  </p>
                )}
                <p className="mt-2 text-[10px] text-[#9AABC4]">
                  Updated {formatRelative(project.updatedAt)}
                  {project.dueDate ? ` · Due ${project.dueDate}` : ""}
                </p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
