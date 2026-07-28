import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getHrStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }
  const scope = await getTenantScope();
  const jobs = await getHrStore().listJobs(scope);
  return NextResponse.json({ jobs });
}

const createSchema = z.object({
  title: z.string().min(1),
  department: z.string().min(1),
  requirements: z.string().min(1),
  status: z.enum(["draft", "open", "closed"]).optional(),
});

export async function POST(req: Request) {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }
  const scope = await getTenantScope();
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const now = new Date().toISOString();
  const job = await getHrStore().createJob({
    ...scope,
    title: parsed.data.title.trim(),
    department: parsed.data.department.trim(),
    requirements: parsed.data.requirements.trim(),
    status: parsed.data.status ?? "open",
    postedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ job }, { status: 201 });
}
