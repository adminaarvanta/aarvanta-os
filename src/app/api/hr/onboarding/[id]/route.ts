import { NextResponse } from "next/server";
import { z } from "zod";
import { unauthorized, parseJsonBody } from "@/lib/api/request";
import {
  markCeoComplete,
  sendOnboardingPack,
} from "@/lib/hr/onboarding-service";
import { getTenantScope } from "@/lib/tenant/context";

const actionSchema = z.object({
  action: z.enum(["send", "ceo_complete"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const candidate =
    parsed.data.action === "send"
      ? await sendOnboardingPack(id)
      : await markCeoComplete(id);

  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ candidate });
}
