import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import { crmNow } from "@/lib/data/crm-helpers";
import { getHrStore } from "@/lib/data/platform-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { generateHrDocument } from "@/lib/hr/generate-document";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }
  const scope = await getTenantScope();
  const exitCases = await getHrStore().listExitCases(scope);
  return NextResponse.json({ exitCases });
}

const createSchema = z.object({
  employeeId: z.string().min(1),
  lastDay: z.string().min(1),
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
  const org = await getTenantRepository().getOrganization(scope.tenantId);
  const companyName = org?.name ?? "Your Company";
  const now = crmNow();

  const relievingContent = await generateHrDocument({
    type: "relieving_letter",
    title: `Relieving letter — ${employee.name}`,
    subjectName: employee.name,
    instructions: `Relieving letter for ${employee.name}, last working day ${parsed.data.lastDay}. Reason: ${parsed.data.reason}.`,
    contextFields: {
      lastDay: parsed.data.lastDay,
      reason: parsed.data.reason,
      role: employee.role,
      department: employee.department,
    },
    companyName,
    authorName: "HR OS",
  });

  const experienceContent = await generateHrDocument({
    type: "experience_letter",
    title: `Experience letter — ${employee.name}`,
    subjectName: employee.name,
    instructions: `Experience letter for ${employee.name} covering employment through ${parsed.data.lastDay}.`,
    contextFields: {
      lastDay: parsed.data.lastDay,
      role: employee.role,
      department: employee.department,
      startDate: employee.startDate,
    },
    companyName,
    authorName: "HR OS",
  });

  const relievingDoc = await store.createDocument({
    ...scope,
    type: "relieving_letter",
    title: `Relieving letter — ${employee.name}`,
    subjectName: employee.name,
    subjectId: employee.id,
    subjectKind: "employee",
    status: "finalized",
    instructions: parsed.data.reason,
    contextFields: { lastDay: parsed.data.lastDay },
    content: relievingContent,
    createdByName: "HR OS",
    createdAt: now,
    updatedAt: now,
  });

  const experienceDoc = await store.createDocument({
    ...scope,
    type: "experience_letter",
    title: `Experience letter — ${employee.name}`,
    subjectName: employee.name,
    subjectId: employee.id,
    subjectKind: "employee",
    status: "finalized",
    instructions: parsed.data.reason,
    contextFields: { lastDay: parsed.data.lastDay },
    content: experienceContent,
    createdByName: "HR OS",
    createdAt: now,
    updatedAt: now,
  });

  await store.setEmployee({
    ...employee,
    status: "exited",
    endDate: parsed.data.lastDay,
  });

  const exitCase = await store.createExitCase({
    ...scope,
    employeeId: employee.id,
    employeeName: employee.name,
    lastDay: parsed.data.lastDay,
    reason: parsed.data.reason.trim(),
    status: "completed",
    relievingDocId: relievingDoc.id,
    experienceDocId: experienceDoc.id,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ exitCase }, { status: 201 });
}
