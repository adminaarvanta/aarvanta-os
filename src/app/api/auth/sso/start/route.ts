import { NextResponse } from "next/server";
import { buildOidcAuthorizeUrl, isSsoConfigured } from "@/lib/auth/sso-oidc";
import type { SsoProvider } from "@/types/platform-modules";

const VALID_PROVIDERS: SsoProvider[] = ["entra", "google", "okta", "onelogin"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provider = (url.searchParams.get("provider") ?? "google") as SsoProvider;
  const next = url.searchParams.get("next") ?? "/dashboard";

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
  const state = Buffer.from(JSON.stringify({ provider, next })).toString("base64url");
  const authorizeUrl = buildOidcAuthorizeUrl({ provider, redirectUri, state });

  if (!authorizeUrl) {
    return NextResponse.redirect(new URL("/login?error=misconfigured", req.url));
  }

  return NextResponse.redirect(authorizeUrl);
}
