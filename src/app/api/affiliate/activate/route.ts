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
import { isAffiliateActivationExpired } from "@/lib/affiliate/provision-partner-account";
import { affiliateStore } from "@/lib/data/affiliate-store";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { crmNow } from "@/lib/data/crm-helpers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await ensureDatastoreReady();

  const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return apiError("VALIDATION_ERROR", "Missing activation token.", 400);
  }

  const affiliate = await affiliateStore.getAffiliateByActivationToken(token);
  if (!affiliate || affiliate.status !== "active") {
    return apiError("NOT_FOUND", "This activation link is invalid.", 404);
  }
  if (isAffiliateActivationExpired(affiliate.activationExpiresAt)) {
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
  await ensureDatastoreReady();

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
  if (isAffiliateActivationExpired(affiliate.activationExpiresAt)) {
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

  // Repair missing partner workspace so set-password still works for links
  // minted before provision finished, or after orphaned-credential recovery.
  if (!affiliate.userId || !affiliate.tenantId) {
    const { provisionPartnerAccountWithoutPassword } = await import(
      "@/lib/affiliate/provision-partner-account"
    );
    const { getUserCredentials } = await import("@/lib/auth/user-credentials");
    const existingCreds = await getUserCredentials(email);
    const provisioned = await provisionPartnerAccountWithoutPassword({
      email,
      name: affiliate.profile.name,
      country: affiliate.profile.country,
      companyName: affiliate.profile.company,
      phone: affiliate.profile.phone,
      userId: affiliate.userId || existingCreds?.userId,
    });
    affiliate = await affiliateStore.saveAffiliate({
      ...affiliate,
      userId: provisioned.userId,
      tenantId: provisioned.organizationId,
      updatedAt: crmNow(),
    });
  }

  let memberships = await getTenantRepository().listMembershipsForUser(
    affiliate.userId!
  );
  let membership =
    memberships.find((m) => m.tenantId === affiliate!.tenantId) ??
    memberships.find((m) => m.email.trim().toLowerCase() === email) ??
    memberships[0];

  if (!membership) {
    const { provisionPartnerAccountWithoutPassword } = await import(
      "@/lib/affiliate/provision-partner-account"
    );
    const provisioned = await provisionPartnerAccountWithoutPassword({
      email,
      name: affiliate.profile.name,
      country: affiliate.profile.country,
      companyName: affiliate.profile.company,
      phone: affiliate.profile.phone,
      userId: affiliate.userId,
    });
    affiliate = await affiliateStore.saveAffiliate({
      ...affiliate,
      userId: provisioned.userId,
      tenantId: provisioned.organizationId,
      updatedAt: crmNow(),
    });
    memberships = await getTenantRepository().listMembershipsForUser(
      affiliate.userId!
    );
    membership =
      memberships.find((m) => m.tenantId === affiliate!.tenantId) ??
      memberships[0];
  }

  if (!membership) {
    return apiError(
      "NOT_READY",
      "Partner membership missing. Contact support.",
      400
    );
  }

  await upsertUserPassword({
    email,
    userId: affiliate.userId!,
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
