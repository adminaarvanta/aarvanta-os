import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { requireSuperAdminSession } from "@/lib/billing/super-admin";
import { getTenantRepository } from "@/lib/data/tenant-store";

const patchSchema = z.object({
  unlimitedVoice: z.boolean(),
  unlimitedEmailOutreach: z.boolean(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireSuperAdminSession();
    const { id } = await params;
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid credit override payload", 400);
    }

    const repo = getTenantRepository();
    const roster = await repo.listMembersByTenant(ctx.scope.tenantId);
    const member = roster.find((m) => m.id === id);
    if (!member) {
      return apiError("NOT_FOUND", "Member not found in this organization", 404);
    }

    const updated = await repo.updateMemberCreditOverrides(
      id,
      parsed.data,
      {
        tenantId: member.tenantId,
        workspaceId: member.workspaceId,
        companyId: member.companyId,
      }
    );
    if (!updated) {
      return apiError("UPDATE_FAILED", "Could not update member credits", 500);
    }

    return NextResponse.json({
      id: updated.id,
      creditOverrides: {
        unlimitedVoice: Boolean(updated.creditOverrides?.unlimitedVoice),
        unlimitedEmailOutreach: Boolean(
          updated.creditOverrides?.unlimitedEmailOutreach
        ),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status =
      message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("CREDIT_ACCESS_ERROR", message, status);
  }
}
