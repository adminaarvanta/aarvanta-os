import { NextResponse } from "next/server";
import { z } from "zod";
import { getProjectRepository } from "@/lib/data/project-store";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "on_hold"]).optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const projects = await getProjectRepository().listProjects(scope);
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
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

  const project = await getProjectRepository().createProject(parsed.data, scope);
  return NextResponse.json({ project }, { status: 201 });
}
