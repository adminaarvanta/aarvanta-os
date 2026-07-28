import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getHrStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

const patchSchema = z.object({
  status: z.enum(["draft", "open", "closed"]).optional(),
  title: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  requirements: z.string().min(1).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }
  const { id } = await ctx.params;
  const scope = await getTenantScope();
  const store = getHrStore();
  const existing = await store.getJob(id, scope);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const job = await store.setJob({
    ...existing,
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ job });
}
