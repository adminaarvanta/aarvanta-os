import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import {
  getAvailabilityDays,
  getDaySlots,
} from "@/lib/calendar/availability";
import { resolveCalendarUserId } from "@/lib/calendar/user-calendar";
import {
  getSessionContext,
  getWebhookTenantScope,
} from "@/lib/tenant/context";

const schema = z.object({
  timezone: z.string().optional(),
  days: z.number().int().min(1).max(7).optional(),
  userId: z.string().optional(),
  campaignId: z.string().optional(),
  sessionId: z.string().optional(),
  leadId: z.string().optional(),
});

/**
 * Tool + admin: next business days with concrete available slots.
 * POST with X-Voice-Relay-Secret is for the EC2 voice relay.
 * GET/POST with a user session is allowed for app use.
 */
export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  const expected = process.env.VOICE_RELAY_CALLBACK_SECRET?.trim();
  const secret = req.headers.get("x-voice-relay-secret")?.trim();
  const isRelayTool = Boolean(expected && secret && secret === expected);

  let timezone = "America/New_York";
  let days = 3;
  let userId: string | undefined;
  let campaignId: string | undefined;
  let sessionId: string | undefined;
  let leadId: string | undefined;

  if (req.method === "POST") {
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = schema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    timezone = parsed.data.timezone ?? timezone;
    days = parsed.data.days ?? days;
    userId = parsed.data.userId;
    campaignId = parsed.data.campaignId;
    sessionId = parsed.data.sessionId;
    leadId = parsed.data.leadId;
  } else {
    const url = new URL(req.url);
    timezone = url.searchParams.get("timezone") ?? timezone;
    days = Number(url.searchParams.get("days") ?? days) || 3;
    userId = url.searchParams.get("userId") ?? undefined;
    campaignId = url.searchParams.get("campaignId") ?? undefined;
    sessionId = url.searchParams.get("sessionId") ?? undefined;
    leadId = url.searchParams.get("leadId") ?? undefined;
  }

  if (!isRelayTool) {
    try {
      const ctx = await getSessionContext();
      userId = userId ?? ctx.userId;
    } catch {
      return unauthorized();
    }
  }

  const scope = isRelayTool
    ? getWebhookTenantScope()
    : (await getSessionContext()).scope;

  const calendarUserId = await resolveCalendarUserId(scope, {
    userId,
    campaignId,
    sessionId,
    leadId,
  });

  const availability = await getAvailabilityDays({
    scope,
    timezone,
    days,
    userId: calendarUserId,
  });

  const withSlots = await Promise.all(
    availability.map(async (day) => {
      const slots = await getDaySlots({
        scope,
        date: day.date,
        timezone,
        userId: calendarUserId,
      });
      return {
        ...day,
        slots: slots
          .filter((s) => s.available)
          .slice(0, 2)
          .map((s) => ({
            start: s.start,
            end: s.end,
            label: s.label,
          })),
      };
    })
  );

  return NextResponse.json({
    timezone,
    availability: withSlots,
  });
}
