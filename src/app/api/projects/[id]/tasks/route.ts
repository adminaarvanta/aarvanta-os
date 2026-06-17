import { NextResponse } from "next/server";
import { z } from "zod";
import { getProjectRepository } from "@/lib/data/project-store";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional(),
  assignee: z.string().optional(),
});

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional(),
  assignee: z.string().optional(),
  order: z.number().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id: projectId } = await params;
  const tasks = await getProjectRepository().listTasks(scope, projectId);
  return NextResponse.json({ tasks });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id: projectId } = await params;
  const repo = getProjectRepository();
  const project = await repo.getProject(projectId, scope);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const task = await repo.createTask(
    { projectId, ...parsed.data },
    scope
  );
  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const taskId = new URL(req.url).searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id: projectId } = await params;
  const repo = getProjectRepository();
  const task = await repo.getTask(taskId, scope);
  if (!task || task.projectId !== projectId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await repo.updateTask(taskId, parsed.data, scope);
  return NextResponse.json({ task: updated });
}
