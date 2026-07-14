import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/project";
import { formatRelative } from "@/lib/utils";

const statusColors: Record<Project["status"], string> = {
  active: "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30",
  completed: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  on_hold: "bg-gold/10 text-gold-bright ring-gold/35",
};

export function ProjectList({ projects }: { projects: Project[] }) {
  if (!projects.length) {
    return (
      <p className="text-sm text-muted">
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
            className="block rounded-xl border border-border bg-surface-elevated p-5 hover:border-gold/40 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-1 h-3 w-3 shrink-0 rounded-full ring-2 ring-border"
                style={{ backgroundColor: project.color ?? "#B8965D" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{project.name}</p>
                  <Badge className={statusColors[project.status]}>
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
                {project.description && (
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    {project.description}
                  </p>
                )}
                <p className="mt-2 text-[10px] text-muted">
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
