import { NextResponse } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";
import {
  PENDING_SIGNUP_COOKIE,
  createPendingSignupToken,
  getPendingSignupCookieOptions,
} from "@/lib/auth/pending-signup";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { exchangeOidcCode, isSsoConfigured } from "@/lib/auth/sso-oidc";
import {
  findCredentialsByGoogleSub,
  getUserCredentials,
  upsertGoogleIdentity,
} from "@/lib/auth/user-credentials";
import {
  AFFILIATE_COOKIE,
  getAffiliateCookieOptions,
} from "@/lib/affiliate/cookie";
import {
  DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  normalizeReferralCode,
} from "@/lib/affiliate/constants";
import { isDemoMode } from "@/lib/config/app-mode";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getTenantRepository } from "@/lib/data/tenant-store";
import type { SsoProvider } from "@/types/platform-modules";

export const runtime = "nodejs";

function applyAffiliateCookie(
  response: NextResponse,
  referralCode: string | undefined,
  requestUrl: string
) {
  const code = referralCode ? normalizeReferralCode(referralCode) : "";
  if (!code) return;
  response.cookies.set(
    AFFILIATE_COOKIE,
    code,
    getAffiliateCookieOptions(
      DEFAULT_ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60,
      requestUrl
    )
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=invalid_credentials`, req.url)
    );
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_credentials", req.url)
    );
  }

  let next = "/dashboard";
  let provider: SsoProvider = "google";
  let intent: "login" | "register" = "login";
  let referralCode: string | undefined;
  try {
    const state = JSON.parse(
      Buffer.from(stateRaw, "base64url").toString()
    ) as {
      provider?: SsoProvider;
      next?: string;
      intent?: "login" | "register";
      ref?: string;
    };
    if (state.next) next = sanitizeNextPath(state.next);
    if (state.provider) provider = state.provider;
    if (state.intent === "register") intent = "register";
    if (state.ref?.trim()) {
      referralCode = normalizeReferralCode(state.ref) || undefined;
    }
  } catch {
    /* defaults */
  }

  if (!isSsoConfigured(provider)) {
    return NextResponse.redirect(new URL("/login?error=misconfigured", req.url));
  }

  try {
    await ensureDatastoreReady();
    const redirectUri = `${url.origin}/api/auth/sso/callback`;
    const { user } = await exchangeOidcCode({
      provider,
      code,
      redirectUri,
    });

    const email = user.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_credentials", req.url)
      );
    }

    const name =
      user.name?.trim() ||
      [user.given_name, user.family_name].filter(Boolean).join(" ").trim() ||
      email.split("@")[0] ||
      "User";

    const bySub = await findCredentialsByGoogleSub(user.sub);
    const byEmail = await getUserCredentials(email);
    const creds = bySub ?? byEmail;

    if (creds) {
      if (!creds.googleSub) {
        await upsertGoogleIdentity({
          email: creds.email,
          userId: creds.userId,
          googleSub: user.sub,
        });
      }

      const repo = getTenantRepository();
      const memberships = await repo.listMembershipsForUser(creds.userId);
      const member = memberships[0];
      if (!member) {
        // Credentials without membership — treat as incomplete signup
        const pending = await createPendingSignupToken({
          email,
          name,
          googleSub: user.sub,
          next,
          referralCode,
        });
        const completeUrl = new URL("/register/complete", req.url);
        completeUrl.searchParams.set("next", next);
        if (referralCode) completeUrl.searchParams.set("ref", referralCode);
        const response = NextResponse.redirect(completeUrl);
        response.cookies.set(
          PENDING_SIGNUP_COOKIE,
          pending,
          getPendingSignupCookieOptions(req.url)
        );
        applyAffiliateCookie(response, referralCode, req.url);
        return response;
      }

      const session = {
        email: member.email,
        name: member.name,
        userId: member.userId,
        role: member.role,
        tenantId: member.tenantId,
        workspaceId: member.workspaceId,
        companyId: member.companyId,
      };

      if (!isDemoMode() || process.env.AUTH_SECRET) {
        const token = await createSessionToken(session);
        const response = NextResponse.redirect(new URL(next, req.url));
        response.cookies.set(
          SESSION_COOKIE,
          token,
          getSessionCookieOptions(undefined, req.url)
        );
        return response;
      }

      return NextResponse.redirect(new URL(next, req.url));
    }

    // New Google user — collect phone/country before provisioning.
    const pending = await createPendingSignupToken({
      email,
      name,
      googleSub: user.sub,
      next,
      referralCode,
    });
    const completeUrl = new URL("/register/complete", req.url);
    completeUrl.searchParams.set("next", next);
    if (intent === "register") {
      completeUrl.searchParams.set("from", "register");
    }
    if (referralCode) completeUrl.searchParams.set("ref", referralCode);
    const response = NextResponse.redirect(completeUrl);
    response.cookies.set(
      PENDING_SIGNUP_COOKIE,
      pending,
      getPendingSignupCookieOptions(req.url)
    );
    applyAffiliateCookie(response, referralCode, req.url);
    return response;
  } catch (err) {
    console.error("[sso/callback]", err);
    const dest =
      intent === "register"
        ? `/register?error=sso_failed`
        : `/login?error=invalid_credentials`;
    return NextResponse.redirect(new URL(dest, req.url));
  }
}
