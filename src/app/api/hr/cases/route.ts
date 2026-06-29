import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getHrStore } from "@/lib/data/platform-store";
import { getHrWorkspaceSettings } from "@/lib/hr/settings";
import { getSessionContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  try {
    const ctx = await getSessionContext();
    const hrStore = getHrStore();
    const conversationId = new URL(req.url).searchParams.get("conversationId");

    if (conversationId) {
      const cases = await hrStore.listCasesByConversation(conversationId, ctx.scope);
      return NextResponse.json({ cases });
    }

    const [cases, pendingApprovals, settings] = await Promise.all([
      hrStore.listCases(ctx.scope),
      hrStore.listPendingApprovals(ctx.scope),
      Promise.resolve(getHrWorkspaceSettings(ctx.scope.workspaceId)),
    ]);
    return NextResponse.json({ cases, pendingApprovals, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("HR_CASE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

const createSchema = z.object({
  conversationId: z.string().min(1),
});

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid HR case payload", 400);
  }

  const { runHrCaseEvaluation } = await import("@/lib/hr/evaluate-conversation-case");
  await runHrCaseEvaluation(parsed.data.conversationId, ctx.scope);

  const hrCase = await getHrStore().findOpenCaseByConversation(
    parsed.data.conversationId,
    ctx.scope
  );

  return NextResponse.json({ case: hrCase }, { status: hrCase ? 201 : 200 });
}
