import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { applyCreditOverridesForEmail } from "@/lib/billing/credit-access-roster";
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

    const updated = await applyCreditOverridesForEmail(
      getTenantRepository(),
      id,
      parsed.data,
      ctx.email
    );
    if (!updated) {
      return apiError("NOT_FOUND", "Member not found", 404);
    }

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
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
