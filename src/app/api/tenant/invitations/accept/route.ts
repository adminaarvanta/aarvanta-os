import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import {
  hasUserPassword,
  upsertUserPassword,
} from "@/lib/auth/user-credentials";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { isDemoMode } from "@/lib/config/app-mode";
import { getOptionalSession } from "@/lib/tenant/context";

export const runtime = "nodejs";

const acceptSchema = z.object({
  token: z.string().min(4).max(120),
  name: z.string().min(1).max(80).optional(),
  password: z.string().min(8).max(128),
});

function userIdFromEmail(email: string): string {
  const slug = email.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);
  return `user_${slug}`;
}

export async function POST(req: Request) {
  try {
    await ensureDatastoreReady();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Password must be at least 8 characters.",
        400
      );
    }

    const repo = getTenantRepository();
    const preview = await repo.getInvitationByToken(parsed.data.token);
    if (!preview) {
      return apiError("NOT_FOUND", "Invitation not found.", 404);
    }

    const email = preview.email.trim().toLowerCase();
    const alreadyHasPassword = await hasUserPassword(email);

    // Allow completing signup on an already-accepted invite if no password yet.
    if (preview.status === "accepted" && alreadyHasPassword) {
      return apiError(
        "INVITE_USED",
        "Invitation already accepted. Sign in with your email and password.",
        409
      );
    }
    if (preview.status !== "pending" && preview.status !== "accepted") {
      return apiError(
        "INVITE_USED",
        `Invitation is already ${preview.status}.`,
        409
      );
    }
    if (new Date(preview.expiresAt).getTime() < Date.now()) {
      return apiError("INVITE_EXPIRED", "Invitation has expired.", 410);
    }

    let invitation = preview;
    if (preview.status === "pending") {
      const accepted = await repo.acceptInvitation(parsed.data.token);
      if (!accepted) {
        return apiError("NOT_FOUND", "Invitation could not be accepted.", 404);
      }
      invitation = accepted;
    }

    const session = await getOptionalSession();
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
        email,
        name,
        role: invitation.role,
      },
      scope
    );

    await upsertUserPassword({
      email,
      userId: member.userId,
      password: parsed.data.password,
    });

    const response = NextResponse.json({
      invitation,
      member,
      demo: isDemoMode(),
      message: `Joined as ${invitation.role}. You are signed in.`,
      next: "/dashboard",
    });

    if (!isDemoMode()) {
      const sessionPayload = {
        email,
        name: member.name,
        userId: member.userId,
        role: member.role,
        tenantId: member.tenantId,
        workspaceId: member.workspaceId,
        companyId: member.companyId || scope.companyId,
      };
      const token = await createSessionToken(sessionPayload);
      response.cookies.set(
        SESSION_COOKIE,
        token,
        getSessionCookieOptions(undefined, req.url)
      );
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Accept failed";
    return apiError("TENANT_ERROR", message, 500);
  }
}

export async function GET(req: Request) {
  try {
    await ensureDatastoreReady();
    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
      return apiError("VALIDATION_ERROR", "token is required", 400);
    }

    const repo = getTenantRepository();
    const invitation = await repo.getInvitationByToken(token);
    if (!invitation) {
      return apiError("NOT_FOUND", "Invitation not found.", 404);
    }

    const email = invitation.email.trim().toLowerCase();
    const [organization, workspace, needsPassword] = await Promise.all([
      repo.getOrganization(invitation.tenantId),
      repo.getWorkspace(invitation.workspaceId),
      (async () => {
        if (invitation.status === "pending") return true;
        if (invitation.status === "accepted") {
          return !(await hasUserPassword(email));
        }
        return false;
      })(),
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
      needsPassword,
      canCompleteSignup: needsPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    return apiError("TENANT_ERROR", message, 500);
  }
}
