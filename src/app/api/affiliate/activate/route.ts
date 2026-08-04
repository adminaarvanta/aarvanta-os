import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { upsertUserPassword, hasUserPassword } from "@/lib/auth/user-credentials";
import { isDemoMode } from "@/lib/config/app-mode";
import { affiliateStore } from "@/lib/data/affiliate-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { crmNow } from "@/lib/data/crm-helpers";
import type { Affiliate } from "@/types/affiliate";
import type { WorkspaceMember } from "@/types/tenant";

export const runtime = "nodejs";

function isExpired(expiresAt?: string) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}

async function ensureAffiliateMembership(
  affiliate: Affiliate,
  email: string
): Promise<{ affiliate: Affiliate; membership: WorkspaceMember }> {
  const { provisionPartnerAccountWithoutPassword } = await import(
    "@/lib/affiliate/provision-partner-account"
  );

  let current = affiliate;

  if (current.userId) {
    const memberships = await getTenantRepository().listMembershipsForUser(
      current.userId
    );
    const membership =
      memberships.find((m) => m.tenantId === current.tenantId) ??
      memberships.find((m) => m.email.trim().toLowerCase() === email) ??
      null;
    if (membership) {
      if (
        current.tenantId !== membership.tenantId ||
        current.userId !== membership.userId
      ) {
        current = await affiliateStore.saveAffiliate({
          ...current,
          userId: membership.userId,
          tenantId: membership.tenantId,
          updatedAt: crmNow(),
        });
      }
      return { affiliate: current, membership };
    }
  }

  const provisioned = await provisionPartnerAccountWithoutPassword({
    email,
    name: current.profile.name,
    country: current.profile.country,
    companyName: current.profile.company,
    phone: current.profile.phone,
    preferredUserId: current.userId,
  });

  current = await affiliateStore.saveAffiliate({
    ...current,
    userId: provisioned.userId,
    tenantId: provisioned.organizationId,
    updatedAt: crmNow(),
  });

  const memberships = await getTenantRepository().listMembershipsForUser(
    provisioned.userId
  );
  const membership =
    memberships.find((m) => m.tenantId === provisioned.organizationId) ??
    memberships.find((m) => m.email.trim().toLowerCase() === email);

  if (!membership) {
    throw new Error("Partner membership missing after provision.");
  }

  return { affiliate: current, membership };
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return apiError("VALIDATION_ERROR", "Missing activation token.", 400);
  }

  const affiliate = await affiliateStore.getAffiliateByActivationToken(token);
  if (!affiliate || affiliate.status !== "active") {
    return apiError("NOT_FOUND", "This activation link is invalid.", 404);
  }
  if (isExpired(affiliate.activationExpiresAt)) {
    return apiError(
      "EXPIRED",
      "This activation link has expired. Ask Aarvanta to resend it.",
      410
    );
  }

  return NextResponse.json({
    email: affiliate.profile.email,
    name: affiliate.profile.name,
    referralCode: affiliate.referralCode,
    expiresAt: affiliate.activationExpiresAt,
  });
}

const postSchema = z.object({
  token: z.string().min(16).max(128),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid request.",
      400
    );
  }

  const token = parsed.data.token.trim();
  let affiliate = await affiliateStore.getAffiliateByActivationToken(token);
  if (!affiliate || affiliate.status !== "active") {
    return apiError("NOT_FOUND", "This activation link is invalid.", 404);
  }
  if (isExpired(affiliate.activationExpiresAt)) {
    return apiError(
      "EXPIRED",
      "This activation link has expired. Ask Aarvanta to resend it.",
      410
    );
  }

  const email = affiliate.profile.email.trim().toLowerCase();
  if (await hasUserPassword(email)) {
    return apiError(
      "ALREADY_ACTIVE",
      "A password is already set. Please sign in.",
      409
    );
  }

  let membership: WorkspaceMember;
  try {
    const ensured = await ensureAffiliateMembership(affiliate, email);
    affiliate = ensured.affiliate;
    membership = ensured.membership;
  } catch (err) {
    console.error("[affiliate] activate account recovery failed", err);
    return apiError(
      "NOT_READY",
      "Partner account is not ready. Contact support.",
      400
    );
  }

  await upsertUserPassword({
    email,
    userId: membership.userId,
    password: parsed.data.password,
  });

  await affiliateStore.saveAffiliate({
    ...affiliate,
    activationToken: undefined,
    activationExpiresAt: undefined,
    updatedAt: crmNow(),
  });

  const session = {
    email,
    name: membership.name,
    userId: membership.userId,
    role: membership.role,
    tenantId: membership.tenantId,
    workspaceId: membership.workspaceId,
    companyId: membership.companyId,
  };

  const response = NextResponse.json({
    ok: true,
    next: "/affiliate/dashboard",
  });

  if (!isDemoMode() || process.env.AUTH_SECRET) {
    try {
      const jwt = await createSessionToken(session);
      response.cookies.set(
        SESSION_COOKIE,
        jwt,
        getSessionCookieOptions(60 * 60 * 24 * 7)
      );
    } catch (err) {
      console.warn("[affiliate] session cookie skipped", err);
    }
  }

  return response;
}
