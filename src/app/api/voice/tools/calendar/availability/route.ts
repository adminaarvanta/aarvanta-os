import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/request";
import { getAvailabilityDays } from "@/lib/calendar/availability";
import { getWebhookTenantScope } from "@/lib/tenant/context";

const schema = z.object({
  timezone: z.string().optional(),
  ownerId: z.string().optional(),
  days: z.number().int().min(1).max(7).optional(),
});

/** Tool + admin: next 2–3 business days with availability. */
export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  const expected = process.env.VOICE_RELAY_CALLBACK_SECRET?.trim();
  const secret = req.headers.get("x-voice-relay-secret")?.trim();
  const isTool = Boolean(expected && secret === expected);

  let timezone = "America/New_York";
  let days = 3;
  if (req.method === "POST") {
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = schema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    timezone = parsed.data.timezone ?? timezone;
    days = parsed.data.days ?? days;
  } else {
    const url = new URL(req.url);
    timezone = url.searchParams.get("timezone") ?? timezone;
    days = Number(url.searchParams.get("days") ?? days) || 3;
  }

  if (!isTool) {
    // Session users also allowed via calendar admin APIs; tools use secret.
  }

  const scope = getWebhookTenantScope();
  const availability = await getAvailabilityDays({ scope, timezone, days });
  return NextResponse.json({ availability });
}
