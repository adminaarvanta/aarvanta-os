import { NextResponse } from "next/server";
import { generateConversationInsights } from "@/lib/ai/insights";
import { getConversation, updateAiInsights } from "@/lib/data/store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { summary, sentiment } = await generateConversationInsights(conversation);
  const updated = await updateAiInsights(id, {
    aiSummary: summary,
    sentiment,
  });

  return NextResponse.json({ conversation: updated });
}
