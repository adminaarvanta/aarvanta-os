import { NextResponse } from "next/server";
import { z } from "zod";
import { executeBusinessAction } from "@/lib/actions/execute";
import { BUSINESS_INTENTS } from "@/lib/actions/intents";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";

const executeSchema = z.object({
  intent: z.enum([
    "create_contact",
    "create_task",
    "create_invoice",
    "run_ai_buddy",
    "get_business_snapshot",
    "launch_business",
  ]),
  context: z.record(z.string(), z.unknown()).optional(),
  metadata: z
    .object({
      source: z.enum(["ui", "api", "ai", "workflow"]).optional(),
      workflowId: z.string().optional(),
    })
    .optional(),
});

export async function GET() {
  return NextResponse.json({
    version: "v1",
    description: "AGEB Volume 8 — Business Action API",
    intents: BUSINESS_INTENTS,
    endpoint: "POST /api/v1/action/execute",
  });
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = executeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const response = await executeBusinessAction(ctx, parsed.data);
  const status = response.status === "success" ? 200 : 422;
  return NextResponse.json(response, { status });
}
