import { NextResponse } from "next/server";
import { generateConversationInsights } from "@/lib/ai/insights";
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
    const { summary, sentiment } =
      await generateConversationInsights(conversation);
    const updated = await repo.updateAiInsights(id, {
      aiSummary: summary,
      sentiment,
    }, scope);

    return NextResponse.json({ conversation: updated });
  } catch (error) {
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
