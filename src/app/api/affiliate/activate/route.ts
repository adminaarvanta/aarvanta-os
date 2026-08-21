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

function normalizeToken(raw: string): string {
  let token = raw.trim();
  if (!token) return "";
  try {
    if (/%[0-9a-fA-F]{2}/.test(token)) {
      token = decodeURIComponent(token);
    }
  } catch {
    /* keep raw */
  }
  return token.trim();
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

async function resolveActivationAffiliate(token: string) {
  const affiliate = await affiliateStore.getAffiliateByActivationToken(token);
  if (!affiliate) {
    return {
      error: apiError(
        "NOT_FOUND",
        "This activation link is not in our records. If you already created a password, sign in. Otherwise ask Aarvanta to send the password link again — that link will keep working.",
        404
      ),
    } as const;
  }
  if (affiliate.status === "rejected" || affiliate.status === "suspended") {
    return {
      error: apiError(
        "FORBIDDEN",
        `This partner account is ${affiliate.status}. Contact Aarvanta support.`,
        403
      ),
    } as const;
  }
  if (affiliate.status !== "active" && affiliate.status !== "pending") {
    return {
      error: apiError(
        "NOT_FOUND",
        "This activation link is invalid.",
        404
      ),
    } as const;
  }
  const email = affiliate.profile.email.trim().toLowerCase();
  if (affiliate.passwordSetAt || (await hasUserPassword(email))) {
    return {
      error: apiError(
        "ALREADY_ACTIVE",
        "A password is already set. Please sign in at /login.",
        409
      ),
    } as const;
  }
  return { affiliate } as const;
}

export async function GET(req: Request) {
  const token = normalizeToken(
    new URL(req.url).searchParams.get("token") ?? ""
  );
  if (!token) {
    return apiError("VALIDATION_ERROR", "Missing activation token.", 400);
  }

  const resolved = await resolveActivationAffiliate(token);
  if ("error" in resolved) return resolved.error;

  const { affiliate } = resolved;
  return NextResponse.json({
    email: affiliate.profile.email,
    name: affiliate.profile.name,
    referralCode: affiliate.referralCode,
    expiresAt: affiliate.activationExpiresAt,
    status: affiliate.status,
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

  const token = normalizeToken(parsed.data.token);
  const resolved = await resolveActivationAffiliate(token);
  if ("error" in resolved) return resolved.error;

  let affiliate = resolved.affiliate;
  const email = affiliate.profile.email.trim().toLowerCase();
  if (await hasUserPassword(email)) {
    return apiError(
      "ALREADY_ACTIVE",
      "A password is already set. Please sign in at /login.",
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

  const now = crmNow();
  await affiliateStore.saveAffiliate({
    ...affiliate,
    status: "active",
    approvedAt: affiliate.approvedAt ?? now,
    passwordSetAt: now,
    previousActivationTokens: [
      ...new Set(
        [
          ...(affiliate.previousActivationTokens ?? []),
          affiliate.activationToken,
        ].filter((t): t is string => Boolean(t))
      ),
    ],
    updatedAt: now,
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
    next: "/partners",
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
