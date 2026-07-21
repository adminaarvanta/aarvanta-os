import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/request";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { sendInvitationEmail } from "@/lib/tenant/send-invitation-email";
import { requirePermission } from "@/lib/tenant/context";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("members:invite");
    const { id } = await params;
    const repo = getTenantRepository();
    const ok = await repo.revokeInvitation(id, ctx.scope);
    if (!ok) return apiError("NOT_FOUND", "Invitation not found", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Revoke failed";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}

/** Resend invitation email for a pending invite. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePermission("members:invite");
    const { id } = await params;
    const repo = getTenantRepository();
    const invitations = await repo.listInvitations(ctx.scope);
    const invitation = invitations.find((i) => i.id === id) ?? null;
    if (!invitation) return apiError("NOT_FOUND", "Invitation not found", 404);
    if (invitation.status !== "pending") {
      return apiError("INVITE_USED", `Invitation is ${invitation.status}`, 409);
    }

    const [organization, workspace] = await Promise.all([
      repo.getOrganization(invitation.tenantId),
      repo.getWorkspace(invitation.workspaceId),
    ]);

    const emailResult = await sendInvitationEmail({
      invitation,
      organizationName: organization?.name ?? "Aarvanta OS",
      workspaceName: workspace?.name ?? "Workspace",
    });

    return NextResponse.json({
      ok: true,
      emailSent: emailResult.sent,
      acceptUrl: emailResult.acceptUrl,
      emailError: emailResult.sent ? undefined : emailResult.reason,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resend failed";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return apiError("TENANT_ERROR", message, status);
  }
}
