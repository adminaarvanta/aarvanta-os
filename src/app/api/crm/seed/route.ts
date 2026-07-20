import { NextResponse } from "next/server";
import { z } from "zod";
import { seedCrmSampleData } from "@/lib/demo/seed-crm-sample";
import { getSessionContext } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

export const runtime = "nodejs";

const bodySchema = z.object({
  force: z.boolean().optional(),
});

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await seedCrmSampleData(ctx.scope, {
      force: parsed.data.force ?? false,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "CRM_SEED_FAILED",
          message: error instanceof Error ? error.message : "Seed failed",
        },
      },
      { status: 500 }
    );
  }
}
