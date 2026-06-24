import { NextResponse } from "next/server";
import { z } from "zod";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext, getTenantScope } from "@/lib/tenant/context";
import { parseJsonBody, unauthorized } from "@/lib/api/request";

const createSchema = z.object({
  type: z.enum(["call", "meeting", "note"]),
  title: z.string().min(1),
  description: z.string().optional(),
  contactId: z.string().optional(),
  accountId: z.string().optional(),
  dealId: z.string().optional(),
  occurredAt: z.string().optional(),
  durationMinutes: z.number().optional(),
  authorName: z.string().optional(),
  authorId: z.string().optional(),
});

export async function GET(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const url = new URL(req.url);
  const filters = {
    contactId: url.searchParams.get("contactId") ?? undefined,
    accountId: url.searchParams.get("accountId") ?? undefined,
    dealId: url.searchParams.get("dealId") ?? undefined,
  };

  const activities = await getCrmRepository().listActivities(scope, filters);
  return NextResponse.json({ activities });
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

  const tenantRepo = getTenantRepository();
  const authorMember = parsed.data.authorId
    ? await tenantRepo.getMemberByUser(parsed.data.authorId, ctx.scope)
    : null;

  const activity = await getCrmRepository().createActivity(
    {
      ...parsed.data,
      authorId: authorMember?.userId ?? ctx.userId,
      authorName: authorMember?.name ?? ctx.name,
    },
    ctx.scope
  );
  return NextResponse.json({ activity }, { status: 201 });
}
