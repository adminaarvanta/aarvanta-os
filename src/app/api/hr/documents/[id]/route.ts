import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { crmNow } from "@/lib/data/crm-helpers";
import { getHrStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(["draft", "finalized"]).optional(),
  content: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getTenantScope();
    const { id } = await params;
    const document = await getHrStore().getDocument(id, scope);
    if (!document) {
      return apiError("NOT_FOUND", "Document not found", 404);
    }
    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("HR_DOCUMENT_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getTenantScope();
    const { id } = await params;
    const existing = await getHrStore().getDocument(id, scope);
    if (!existing) {
      return apiError("NOT_FOUND", "Document not found", 404);
    }

    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update payload", 400);
    }

    const document = await getHrStore().setDocument({
      ...existing,
      ...parsed.data,
      updatedAt: crmNow(),
    });

    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return apiError("HR_DOCUMENT_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getTenantScope();
    const { id } = await params;
    const removed = await getHrStore().removeDocument(id, scope);
    if (!removed) {
      return apiError("NOT_FOUND", "Document not found", 404);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return apiError("HR_DOCUMENT_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
