import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getLaunchRepository } from "@/lib/data/launch-store";
import { createAndInterpretLaunch } from "@/lib/launch/orchestrate";
import { getTenantScope } from "@/lib/tenant/context";

const createSchema = z.object({
  businessIdea: z.string().min(3).max(500),
  targetMarket: z.string().optional(),
  countryBase: z.string().min(2).max(8).default("UK"),
  scale: z.enum(["solo", "startup", "smb", "enterprise"]).default("startup"),
  channels: z
    .array(z.enum(["online", "retail", "wholesale", "marketplace", "subscription"]))
    .min(1)
    .default(["online"]),
});

export async function GET() {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const sessions = await getLaunchRepository().list(scope);
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { session, usedAi } = await createAndInterpretLaunch(parsed.data, scope);
  await getLaunchRepository().save(session);

  return NextResponse.json({ session, usedAi }, { status: 201 });
}
