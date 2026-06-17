import { NextResponse } from "next/server";
import { z } from "zod";
import { getAgentMemoryRepository } from "@/lib/data/agent-memory-store";
import { isAgentType } from "@/lib/workforce/agents";
import { getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const postSchema = z.object({
  content: z.string().min(1).max(2000),
  category: z.enum(["insight", "decision", "preference", "fact"]).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { agentType } = await params;
  if (!isAgentType(agentType)) {
    return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
  }

  const memory = await getAgentMemoryRepository().listMemory(scope, agentType);
  return NextResponse.json({ memory });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { agentType } = await params;
  if (!isAgentType(agentType)) {
    return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await getAgentMemoryRepository().addMemory(
    {
      agentType,
      content: parsed.data.content,
      category: parsed.data.category ?? "fact",
      source: "manual",
    },
    scope
  );

  return NextResponse.json({ entry }, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ agentType: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { agentType } = await params;
  if (!isAgentType(agentType)) {
    return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const deleted = await getAgentMemoryRepository().deleteMemory(id, scope);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
