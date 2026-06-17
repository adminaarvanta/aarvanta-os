import { NextResponse } from "next/server";
import { getProjectRepository } from "@/lib/data/project-store";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const repo = getProjectRepository();
  const project = await repo.getProject(id, scope);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tasks = await repo.listTasks(scope, id);
  return NextResponse.json({ project, tasks });
}
