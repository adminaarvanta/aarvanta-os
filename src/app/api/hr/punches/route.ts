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
  const punches = await getHrStore().listPunches(scope);
  return NextResponse.json({ punches });
}

const punchSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(["in", "out"]),
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
  const parsed = punchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const store = getHrStore();
  const employee = await store.getEmployee(parsed.data.employeeId, scope);
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
  const now = new Date().toISOString();
  const punch = await store.createPunch({
    ...scope,
    employeeId: employee.id,
    employeeName: employee.name,
    type: parsed.data.type,
    at: now,
    source: "admin",
    createdAt: now,
  });
  return NextResponse.json({ punch }, { status: 201 });
}
