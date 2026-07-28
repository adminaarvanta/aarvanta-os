import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { getHrStore } from "@/lib/data/platform-store";
import { createOnboardingCandidate } from "@/lib/hr/onboarding-service";
import { getTenantScope } from "@/lib/tenant/context";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  role: z.string().min(1),
  score: z.number().min(0).max(100).optional(),
  status: z
    .enum(["applied", "screening", "interview", "offer", "hired", "rejected"])
    .optional(),
  jobId: z.string().optional(),
  resumeSummary: z.string().optional(),
  source: z.enum(["manual", "excel", "sheets"]).optional(),
});

export async function GET() {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }
  const scope = await getTenantScope();
  const candidates = await getHrStore().list(scope);
  return NextResponse.json({ candidates });
}

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
  const candidate = await getHrStore().create({
    ...scope,
    name: parsed.data.name.trim(),
    email: parsed.data.email?.trim().toLowerCase(),
    role: parsed.data.role.trim(),
    score: parsed.data.score ?? 70,
    status: parsed.data.status ?? "applied",
    jobId: parsed.data.jobId,
    source: parsed.data.source ?? "manual",
    resumeSummary: parsed.data.resumeSummary?.trim() || "Added manually in HR OS.",
  });
  return NextResponse.json({ candidate }, { status: 201 });
}

const actionSchema = z.object({
  action: z.enum(["advance", "reject", "hire"]),
  id: z.string().min(1),
  department: z.string().optional(),
  startDate: z.string().optional(),
});

const PIPELINE = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
] as const;

export async function PUT(req: Request) {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }
  const scope = await getTenantScope();
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const store = getHrStore();
  const existing = await store.get(parsed.data.id, scope);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.action === "reject") {
    const candidate = await store.set({ ...existing, status: "rejected" });
    return NextResponse.json({ candidate });
  }

  if (parsed.data.action === "advance") {
    const idx = PIPELINE.indexOf(
      existing.status === "rejected" ? "applied" : (existing.status as (typeof PIPELINE)[number])
    );
    const next = PIPELINE[Math.min(idx + 1, PIPELINE.length - 1)] ?? "hired";
    if (next === "hired") {
      // fall through to hire
    } else {
      const candidate = await store.set({ ...existing, status: next });
      return NextResponse.json({ candidate });
    }
  }

  // hire
  const startDate = parsed.data.startDate ?? new Date().toISOString().slice(0, 10);
  const employee = await store.createEmployee({
    ...scope,
    name: existing.name,
    department: parsed.data.department?.trim() || "General",
    role: existing.role,
    startDate,
    leaveBalance: 20,
    email: existing.email,
    status: "active",
    candidateId: existing.id,
  });
  const candidate = await store.set({ ...existing, status: "hired" });
  if (existing.email) {
    await createOnboardingCandidate({
      name: existing.name,
      email: existing.email,
      role: existing.role,
      startDate,
      employeeId: employee.id,
      atsCandidateId: existing.id,
    });
  }
  return NextResponse.json({ candidate, employee });
}
