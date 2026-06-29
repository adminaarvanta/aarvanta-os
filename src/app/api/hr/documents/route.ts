import { NextResponse } from "next/server";
import { z } from "zod";
import { recordMutationEvent } from "@/lib/api/mutation-events";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { crmNow } from "@/lib/data/crm-helpers";
import { getHrStore } from "@/lib/data/platform-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { generateHrDocument } from "@/lib/hr/generate-document";
import { getSessionContext } from "@/lib/tenant/context";

const HR_DOCUMENT_TYPES = [
  "offer_letter",
  "experience_letter",
  "appointment_letter",
  "relieving_letter",
  "salary_certificate",
  "employment_verification",
  "corporate_invoice",
  "nda",
  "policy_memo",
  "warning_letter",
  "custom_corporate",
] as const;

const createSchema = z.object({
  type: z.enum(HR_DOCUMENT_TYPES),
  title: z.string().min(1),
  subjectName: z.string().min(1),
  subjectId: z.string().optional(),
  subjectKind: z.enum(["employee", "candidate", "vendor", "other"]).optional(),
  instructions: z.string().min(1),
  contextFields: z.record(z.string(), z.string()).default({}),
  status: z.enum(["draft", "finalized"]).optional(),
});

export async function GET() {
  try {
    const scope = await getSessionContext();
    const documents = await getHrStore().listDocuments(scope.scope);
    return NextResponse.json({ documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("HR_DOCUMENT_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid HR document payload", 400);
  }

  const org = await getTenantRepository().getOrganization(ctx.scope.tenantId);
  const companyName = org?.name ?? "Your Company";

  const content = await generateHrDocument({
    type: parsed.data.type,
    title: parsed.data.title,
    subjectName: parsed.data.subjectName,
    instructions: parsed.data.instructions,
    contextFields: parsed.data.contextFields,
    companyName,
    authorName: ctx.name,
  });

  const now = crmNow();
  const document = await getHrStore().createDocument({
    ...ctx.scope,
    ...parsed.data,
    content,
    status: parsed.data.status ?? "draft",
    createdByName: ctx.name,
    createdAt: now,
    updatedAt: now,
  });

  await recordMutationEvent({
    ctx,
    type: "hr.document.generated",
    entityType: "document",
    entityId: document.id,
    payload: {
      hrDocumentType: document.type,
      title: document.title,
      subjectName: document.subjectName,
    },
  });

  return NextResponse.json({ document }, { status: 201 });
}
