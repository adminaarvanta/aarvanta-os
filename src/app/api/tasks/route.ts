import { NextResponse } from "next/server";
import { z } from "zod";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional(),
  contactId: z.string().optional(),
  accountId: z.string().optional(),
  dealId: z.string().optional(),
  assignedTo: z.string().optional(),
  source: z.enum(["manual", "ai"]).optional(),
});

export async function GET(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const status = new URL(req.url).searchParams.get("status") as
    | "todo"
    | "in_progress"
    | "done"
    | null;
  const assignedTo = new URL(req.url).searchParams.get("assignedTo") ?? undefined;

  const tasks = await getCrmRepository().listTasks(
    scope,
    {
      ...(status ? { status } : {}),
      ...(assignedTo ? { assignedTo } : {}),
    }
  );
  return NextResponse.json({ tasks });
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

  const task = await getCrmRepository().createTask(parsed.data, scope);
  return NextResponse.json({ task }, { status: 201 });
}
