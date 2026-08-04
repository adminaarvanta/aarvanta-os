import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildOidcAuthorizeUrl, isSsoConfigured } from "@/lib/auth/sso-oidc";
import { AFFILIATE_COOKIE } from "@/lib/affiliate/cookie";
import { normalizeReferralCode } from "@/lib/affiliate/constants";
import type { SsoProvider } from "@/types/platform-modules";

const VALID_PROVIDERS: SsoProvider[] = ["entra", "google", "okta", "onelogin"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provider = (url.searchParams.get("provider") ?? "google") as SsoProvider;
  const next = url.searchParams.get("next") ?? "/build";
  const intent = url.searchParams.get("intent") === "register" ? "register" : "login";

  const fromQuery = url.searchParams.get("ref")?.trim() || "";
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(AFFILIATE_COOKIE)?.value?.trim() || "";
  const referralCode = normalizeReferralCode(fromQuery || fromCookie) || undefined;

  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_credentials", req.url)
    );
  }

  if (!isSsoConfigured(provider)) {
    return NextResponse.redirect(new URL("/login?error=misconfigured", req.url));
  }

  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/sso/callback`;
  const state = Buffer.from(
    JSON.stringify({ provider, next, intent, ref: referralCode })
  ).toString("base64url");
  const authorizeUrl = buildOidcAuthorizeUrl({ provider, redirectUri, state });

  if (!authorizeUrl) {
    return NextResponse.redirect(new URL("/login?error=misconfigured", req.url));
  }

  return NextResponse.redirect(authorizeUrl);
}
