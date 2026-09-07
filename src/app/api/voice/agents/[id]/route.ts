import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { canMutateVoiceAgent, canViewVoiceAgent } from "@/lib/calling/voice-agent-access";
import { getSessionContext } from "@/lib/tenant/context";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  language: z.string().optional(),
  ttsProvider: z.string().optional(),
  ttsVoice: z.string().optional(),
  greetingName: z.string().optional(),
  flowConfig: z
    .object({
      entryStage: z.string(),
      stages: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          objective: z.string(),
          samplePrompt: z.string().optional(),
          transitions: z.array(
            z.object({
              when: z.string(),
              to: z.string(),
            })
          ),
        })
      ),
    })
    .optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const agent = await getCallingAgentRepository().getAgent(id, ctx.scope);
  if (!agent || !canViewVoiceAgent(agent, ctx.userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ agent });
}

export async function PUT(req: Request, { params }: Params) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const existing = await getCallingAgentRepository().getAgent(id, ctx.scope);
  if (!existing || !canMutateVoiceAgent(existing, ctx.userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const agent = await getCallingAgentRepository().updateAgent(
    id,
    parsed.data as Parameters<
      ReturnType<typeof getCallingAgentRepository>["updateAgent"]
    >[1],
    ctx.scope
  );
  if (!agent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ agent });
}
