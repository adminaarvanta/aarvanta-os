import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import {
  getUserPrimaryAgentId,
  listVoiceAgentsForUser,
} from "@/lib/calling/resolve-voice-agent";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getSessionContext } from "@/lib/tenant/context";

const createSchema = z.object({
  name: z.string().min(1),
  language: z.string().optional(),
  ttsProvider: z.string().optional(),
  ttsVoice: z.string().optional(),
  greetingName: z.string().optional(),
});

export async function GET() {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const [agents, primaryAgentId] = await Promise.all([
    listVoiceAgentsForUser(ctx.scope, ctx.userId),
    getUserPrimaryAgentId(ctx.scope, ctx.userId),
  ]);
  return NextResponse.json({
    agents,
    primaryAgentId: primaryAgentId ?? null,
  });
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const agent = await getCallingAgentRepository().createAgent(
    {
      ...parsed.data,
      ownerUserId: ctx.userId,
      createdBy: ctx.userId,
    },
    ctx.scope
  );
  return NextResponse.json({ agent }, { status: 201 });
}
