import { SignJWT, jwtVerify } from "jose";
import { getSessionCookieOptions } from "@/lib/auth/cookie-options";

export const PENDING_SIGNUP_COOKIE = "aarvanta_pending_signup";

export type PendingSignupPayload = {
  email: string;
  name: string;
  googleSub: string;
  next?: string;
  /** Affiliate referral code preserved across Google OAuth. */
  referralCode?: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for Google signup.");
  }
  return new TextEncoder().encode(secret);
}

export async function createPendingSignupToken(
  payload: PendingSignupPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(getSecret());
}

export async function verifyPendingSignupToken(
  token: string
): Promise<PendingSignupPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.googleSub !== "string"
    ) {
      return null;
    }
    return {
      email: payload.email,
      name: payload.name,
      googleSub: payload.googleSub,
      next: typeof payload.next === "string" ? payload.next : undefined,
      referralCode:
        typeof payload.referralCode === "string"
          ? payload.referralCode
          : undefined,
    };
  } catch {
    return null;
  }
}

export function getPendingSignupCookieOptions(requestUrl?: string) {
  return getSessionCookieOptions(60 * 30, requestUrl);
}
