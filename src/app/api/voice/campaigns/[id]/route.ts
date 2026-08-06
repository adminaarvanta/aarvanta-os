import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getSessionContext, getTenantScope } from "@/lib/tenant/context";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  goal: z.string().optional(),
  targetMeetings: z.number().int().positive().optional(),
  filters: z
    .object({
      tags: z.array(z.string()).optional(),
      minLeadScore: z.number().optional(),
      industries: z.array(z.string()).optional(),
      requirePhone: z.boolean().optional(),
      accountIds: z.array(z.string()).optional(),
      contactIds: z.array(z.string()).optional(),
    })
    .optional(),
  voiceAgentId: z.string().optional(),
  workingHours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        start: z.string(),
        end: z.string(),
      })
    )
    .optional(),
  timezone: z.string().optional(),
  dailyCallLimit: z.number().int().positive().optional(),
  weekendCalling: z.boolean().optional(),
  retryPolicy: z
    .object({
      maxRetries: z.number().int().min(0),
      busyMinutes: z.number().int().positive(),
      noAnswerHours: z.number().int().positive(),
      failedMinutes: z.number().int().positive(),
      voicemailHours: z.number().int().positive(),
    })
    .optional(),
  language: z.string().optional(),
  status: z
    .enum(["draft", "scheduled", "running", "paused", "completed", "cancelled"])
    .optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const campaign = await getCallingAgentRepository().getCampaign(id, scope);
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ campaign });
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
  const campaign = await getCallingAgentRepository().updateCampaign(
    id,
    parsed.data as Parameters<
      ReturnType<typeof getCallingAgentRepository>["updateCampaign"]
    >[1],
    ctx.scope
  );
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ campaign });
}
