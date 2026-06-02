import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import type { ConversationTag } from "@/types/communication";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const patchSchema = z.object({
  tags: z.array(
    z.enum(["hot_lead", "vip", "follow_up", "support", "lost"])
  ),
});

async function resolveScope() {
  try {
    return await getTenantScope();
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await resolveScope();
  if (!scope) return unauthorized();

  const { id } = await params;
  const conversation = await getRepository().getConversation(id, scope);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const scope = await resolveScope();
  if (!scope) return unauthorized();

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const conversation = await getRepository().setTags(
    id,
    parsed.data.tags as ConversationTag[],
    scope
  );
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}
