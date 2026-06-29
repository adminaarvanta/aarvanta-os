import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { isDemoMode } from "@/lib/config/app-mode";
import { WORKSPACE_COOKIE } from "@/lib/tenant/demo-context";

const schema = z.object({
  workspaceId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid workspace switch payload", 400);
    }

    const repo = getTenantRepository();
    const workspace = await repo.getWorkspace(parsed.data.workspaceId);
    if (!workspace || workspace.tenantId !== ctx.scope.tenantId) {
      return apiError("NOT_FOUND", "Workspace not found", 404);
    }

    const membership = await repo.getMemberByUser(ctx.userId, {
      tenantId: workspace.tenantId,
      workspaceId: workspace.id,
      companyId: workspace.defaultCompanyId,
    });
    if (!membership) {
      return apiError("FORBIDDEN", "No access to this workspace", 403);
    }

    const nextScope = {
      tenantId: workspace.tenantId,
      workspaceId: workspace.id,
      companyId: workspace.defaultCompanyId,
    };

    if (isDemoMode()) {
      const response = NextResponse.json({ ok: true, scope: nextScope });
      response.cookies.set(
        WORKSPACE_COOKIE,
        JSON.stringify(nextScope),
        { path: "/", maxAge: 60 * 60 * 24 * 30 }
      );
      return response;
    }

    const session = await getSessionContext();
    const token = await createSessionToken({
      email: session.email,
      name: session.name,
      userId: session.userId,
      role: membership.role,
      ...nextScope,
    });
    const response = NextResponse.json({ ok: true, scope: nextScope });
    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions(undefined, req.url));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Switch failed";
    return apiError("TENANT_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
