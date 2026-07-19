import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { isDemoMode } from "@/lib/config/app-mode";
import { getOptionalSession } from "@/lib/tenant/context";

const acceptSchema = z.object({
  token: z.string().min(4).max(120),
  name: z.string().min(1).max(80).optional(),
});

function userIdFromEmail(email: string): string {
  const slug = email.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);
  return `user_${slug}`;
}

export async function POST(req: Request) {
  try {
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid accept payload", 400);
    }

    const repo = getTenantRepository();
    const preview = await repo.getInvitationByToken(parsed.data.token);
    if (!preview) {
      return apiError("NOT_FOUND", "Invitation not found.", 404);
    }
    if (preview.status !== "pending") {
      return apiError(
        "INVITE_USED",
        `Invitation is already ${preview.status}.`,
        409
      );
    }
    if (new Date(preview.expiresAt).getTime() < Date.now()) {
      return apiError("INVITE_EXPIRED", "Invitation has expired.", 410);
    }

    const invitation = await repo.acceptInvitation(parsed.data.token);
    if (!invitation) {
      return apiError("NOT_FOUND", "Invitation could not be accepted.", 404);
    }

    const session = await getOptionalSession();
    const email = invitation.email.toLowerCase();
    const userId =
      session && session.email.toLowerCase() === email
        ? session.userId
        : userIdFromEmail(email);
    const name =
      parsed.data.name?.trim() ||
      session?.name ||
      email.split("@")[0] ||
      "New member";

    const workspace = await repo.getWorkspace(invitation.workspaceId);
    const scope = {
      tenantId: invitation.tenantId,
      workspaceId: invitation.workspaceId,
      companyId: workspace?.defaultCompanyId ?? invitation.companyId,
    };

    const member = await repo.createMember(
      {
        userId,
        email: invitation.email,
        name,
        role: invitation.role,
      },
      scope
    );

    return NextResponse.json({
      invitation,
      member,
      demo: isDemoMode(),
      message: `Joined as ${invitation.role}.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Accept failed";
    return apiError("TENANT_ERROR", message, 500);
  }
}

export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
      return apiError("VALIDATION_ERROR", "token is required", 400);
    }

    const repo = getTenantRepository();
    const invitation = await repo.getInvitationByToken(token);
    if (!invitation) {
      return apiError("NOT_FOUND", "Invitation not found.", 404);
    }

    const [organization, workspace] = await Promise.all([
      repo.getOrganization(invitation.tenantId),
      repo.getWorkspace(invitation.workspaceId),
    ]);

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitedByName: invitation.invitedByName,
      },
      organization: organization
        ? { id: organization.id, name: organization.name }
        : null,
      workspace: workspace
        ? { id: workspace.id, name: workspace.name }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    return apiError("TENANT_ERROR", message, 500);
  }
}
