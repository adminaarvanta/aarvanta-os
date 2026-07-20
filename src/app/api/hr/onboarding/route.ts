import { NextResponse } from "next/server";
import { z } from "zod";
import { unauthorized } from "@/lib/api/request";
import { parseJsonBody } from "@/lib/api/request";
import {
  createOnboardingCandidate,
  getOnboardingDashboard,
  markCeoComplete,
  sendOnboardingPack,
} from "@/lib/hr/onboarding-service";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }
  const dashboard = await getOnboardingDashboard();
  return NextResponse.json(dashboard);
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  startDate: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const candidate = await createOnboardingCandidate(parsed.data);
  return NextResponse.json({ candidate }, { status: 201 });
}
