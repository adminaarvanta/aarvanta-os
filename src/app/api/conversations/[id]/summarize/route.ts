import { NextResponse } from "next/server";
import { refreshConversationAiInsights } from "@/lib/ai/refresh-conversation-insights";
import { AiNotConfiguredError, AiRequestError } from "@/lib/ai/provider";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export async function POST(
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
  const repo = getRepository();
  const conversation = await repo.getConversation(id, scope);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await refreshConversationAiInsights(id, scope);
    const updated = await repo.getConversation(id, scope);

    return NextResponse.json({
      conversation: updated,
      intent: updated?.aiIntent,
      qualificationScore: updated?.aiQualificationScore,
    });
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { error: { code: "AI_NOT_CONFIGURED", message: error.message } },
        { status: 503 }
      );
    }
    if (error instanceof AiRequestError) {
      return NextResponse.json(
        { error: { code: "AI_FAILED", message: error.message } },
        { status: 502 }
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "AI_FAILED",
          message:
            error instanceof Error ? error.message : "Failed to generate insights",
        },
      },
      { status: 502 }
    );
  }
}
