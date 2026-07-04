import { NextResponse } from "next/server";
import { isSsoConfigured } from "@/lib/auth/sso-oidc";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=invalid_credentials`, req.url));
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(new URL("/login?error=invalid_credentials", req.url));
  }

  let next = "/dashboard";
  let provider = "google";
  try {
    const state = JSON.parse(Buffer.from(stateRaw, "base64url").toString()) as {
      provider?: string;
      next?: string;
    };
    if (state.next) next = state.next;
    if (state.provider) provider = state.provider;
  } catch {
    /* use defaults */
  }

  if (!isSsoConfigured(provider as "google")) {
    return NextResponse.redirect(new URL("/login?error=misconfigured", req.url));
  }

  // Full token exchange requires IdP credentials — redirect to password login with hint.
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", next);
  loginUrl.searchParams.set(
    "error",
    process.env.SSO_AUTO_PROVISION === "true" ? "invalid_credentials" : "misconfigured"
  );
  return NextResponse.redirect(loginUrl);
}
