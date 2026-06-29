import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import { getHrStore } from "@/lib/data/platform-store";
import { sendHrDocument } from "@/lib/hr/send-document";
import { getSessionContext } from "@/lib/tenant/context";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await params;
  const hrStore = getHrStore();
  const document = await hrStore.getDocument(id, ctx.scope);
  if (!document) {
    return apiError("NOT_FOUND", "Document not found", 404);
  }

  const cases = await hrStore.listCases(ctx.scope);
  const hrCase = cases.find((item) => item.documentId === id) ?? null;

  if (!hrCase?.conversationId) {
    return apiError(
      "VALIDATION_ERROR",
      "Document must be linked to an inbox conversation to send",
      400
    );
  }

  try {
    const result = await sendHrDocument({
      scope: ctx.scope,
      document,
      hrCase,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    return apiError("HR_SEND_ERROR", message, 400);
  }
}
