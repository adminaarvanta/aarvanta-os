import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { crmNow } from "@/lib/data/crm-helpers";
import { getHrStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }
  const scope = await getTenantScope();
  const leaveRequests = await getHrStore().listLeaveRequests(scope);
  return NextResponse.json({ leaveRequests });
}

const createSchema = z.object({
  employeeId: z.string().min(1),
  leaveType: z.enum(["annual", "sick", "unpaid", "other"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.number().min(1),
  reason: z.string().min(1),
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
  const store = getHrStore();
  const employee = await store.getEmployee(parsed.data.employeeId, scope);
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }
  const now = crmNow();
  const leaveRequest = await store.createLeaveRequest({
    ...scope,
    employeeId: employee.id,
    employeeName: employee.name,
    leaveType: parsed.data.leaveType,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    days: parsed.data.days,
    reason: parsed.data.reason.trim(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ leaveRequest }, { status: 201 });
}

const actionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

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
  const existing = (await store.listLeaveRequests(scope)).find((l) => l.id === parsed.data.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const now = crmNow();
  const status = parsed.data.action === "approve" ? "approved" : "rejected";
  const leaveRequest = await store.setLeaveRequest({
    ...existing,
    status,
    updatedAt: now,
  });
  if (status === "approved" && leaveRequest.leaveType === "annual") {
    const employee = await store.getEmployee(leaveRequest.employeeId, scope);
    if (employee) {
      await store.setEmployee({
        ...employee,
        leaveBalance: Math.max(0, employee.leaveBalance - leaveRequest.days),
        status: employee.status ?? "active",
      });
    }
  }
  return NextResponse.json({ leaveRequest });
}
