import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getSessionContext, getTenantScope } from "@/lib/tenant/context";

const filtersSchema = z.object({
  tags: z
    .array(
      z.enum([
        "hot_lead",
        "vip",
        "customer",
        "prospect",
        "partner",
        "follow_up",
      ])
    )
    .optional(),
  minLeadScore: z.number().min(0).max(100).optional(),
  industries: z.array(z.string()).optional(),
  requirePhone: z.boolean().optional(),
  accountIds: z.array(z.string()).optional(),
  contactIds: z.array(z.string()).optional(),
});

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  goal: z.string().optional(),
  targetMeetings: z.number().int().positive().optional(),
  filters: filtersSchema.optional(),
  voiceAgentId: z.string().min(1),
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

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const campaigns = await getCallingAgentRepository().listCampaigns(scope);
  return NextResponse.json({ campaigns });
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

  const campaign = await getCallingAgentRepository().createCampaign(
    {
      ...parsed.data,
      createdBy: ctx.userId,
    },
    ctx.scope
  );

  return NextResponse.json({ campaign }, { status: 201 });
}
