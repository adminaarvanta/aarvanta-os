import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import {
  isTelemetryEventName,
  recordTelemetry,
} from "@/lib/analytics/telemetry";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(60),
  path: z.string().max(80).optional(),
  step: z.string().max(40).optional(),
  cta: z.string().max(40).optional(),
  module: z.string().max(40).optional(),
  outcome: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isTelemetryEventName(parsed.data.name)) {
    return apiError("VALIDATION_ERROR", "Invalid telemetry payload", 400);
  }
  const event = recordTelemetry(parsed.data.name, parsed.data);
  return NextResponse.json({ ok: true, at: event.at });
}
