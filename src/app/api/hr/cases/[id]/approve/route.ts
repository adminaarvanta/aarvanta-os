import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { approveHrCase } from "@/lib/hr/process-case";
import { getSessionContext } from "@/lib/tenant/context";

const schema = z.object({
  contextFields: z.record(z.string(), z.string()).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid approval payload", 400);
  }

  const { id } = await params;

  try {
    const hrCase = await approveHrCase(id, ctx.scope, {
      contextFields: parsed.data.contextFields,
    });
    return NextResponse.json({ case: hrCase });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval failed";
    return apiError("HR_APPROVAL_ERROR", message, 400);
  }
}
