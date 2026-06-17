import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext, requirePermission } from "@/lib/tenant/context";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "member", "guest"]),
});

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const repo = getTenantRepository();
    const invitations = await repo.listInvitations(ctx.scope);
    return NextResponse.json(invitations);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("TENANT_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePermission("members:invite");
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid invitation payload", 400);
    }

    const repo = getTenantRepository();
    const invitation = await repo.createInvitation(
      {
        email: parsed.data.email,
        role: parsed.data.role,
        workspaceId: ctx.scope.workspaceId,
        invitedBy: ctx.userId,
        invitedByName: ctx.name,
      },
      ctx.scope
    );
    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invite failed";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}
