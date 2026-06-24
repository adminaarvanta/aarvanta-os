import { NextResponse } from "next/server";
import { z } from "zod";
import { crmNewId } from "@/lib/data/crm-helpers";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { apiError, parseJsonBody, unauthorized } from "@/lib/api/request";
import { requirePermission } from "@/lib/tenant/context";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "manager", "member", "guest"]),
  userId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("members:manage");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid member payload", 400);
    }

    const repo = getTenantRepository();
    const member = await repo.createMember(
      {
        userId: parsed.data.userId ?? crmNewId("user"),
        email: parsed.data.email.trim().toLowerCase(),
        name: parsed.data.name.trim(),
        role: parsed.data.role,
      },
      ctx.scope
    );

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create member failed";
    if (message === "Unauthorized") return unauthorized();
    if (message === "Forbidden") {
      return apiError("FORBIDDEN", "Insufficient permissions", 403);
    }
    return apiError("MEMBER_ERROR", message, 500);
  }
}
