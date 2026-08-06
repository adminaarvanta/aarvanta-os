import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { previewAudienceCount, resolveAudience } from "@/lib/calling/audience";
import { getSessionContext } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

const schema = z.object({
  filters: z.object({
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
  }),
  includeSample: z.boolean().optional(),
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await previewAudienceCount(parsed.data.filters, ctx.scope);
  if (!parsed.data.includeSample) {
    return NextResponse.json({ count });
  }

  const audience = await resolveAudience(parsed.data.filters, ctx.scope);
  return NextResponse.json({
    count,
    sample: audience.slice(0, 10).map((c) => ({
      id: c.id,
      name: contactDisplayName(c),
      companyName: c.companyName,
      leadScore: c.leadScore,
      phone: c.phone,
    })),
  });
}
