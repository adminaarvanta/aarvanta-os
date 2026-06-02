import { NextResponse } from "next/server";
import { z } from "zod";
import { getConversation, setTags } from "@/lib/data/store";
import type { ConversationTag } from "@/types/communication";

const patchSchema = z.object({
  tags: z.array(
    z.enum(["hot_lead", "vip", "follow_up", "support", "lost"])
  ),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const conversation = await setTags(id, parsed.data.tags as ConversationTag[]);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}
