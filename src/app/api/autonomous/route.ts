import { NextResponse } from "next/server";
import { z } from "zod";
import { getAutonomousStore } from "@/lib/data/platform-store";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";

const createTaskSchema = z.object({
  agentType: z.string().min(1),
  goal: z.string().min(1),
  steps: z.array(z.string().min(1)).optional(),
  requiresApproval: z.boolean().optional(),
});

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const tasks = await getAutonomousStore().list(ctx.scope);
    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("AUTONOMOUS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const store = getAutonomousStore();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid autonomous task payload", 400);
    }

    const task = await store.create({
      ...ctx.scope,
      ...parsed.data,
      steps: parsed.data.steps ?? [],
      requiresApproval: parsed.data.requiresApproval ?? false,
      status: "queued",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return apiError("AUTONOMOUS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
