import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody, unauthorized } from "@/lib/api/request";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { generateWorkflowFromIntent } from "@/lib/workflow/generate-from-intent";
import { requirePermission } from "@/lib/tenant/context";

const generateSchema = z.object({
  intent: z.string().min(3),
});

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("workflows:manage");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const draft = generateWorkflowFromIntent(parsed.data.intent);
    const workflow = await getWorkflowRepository().createWorkflow(draft, ctx.scope);

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generate failed";
    if (message === "Unauthorized") return unauthorized();
    const status = message === "Forbidden" ? 403 : 500;
    return apiError("WORKFLOW_ERROR", message, status);
  }
}
