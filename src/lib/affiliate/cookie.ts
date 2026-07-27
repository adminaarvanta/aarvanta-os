import { AFFILIATE_COOKIE } from "@/lib/affiliate/constants";

export function getAffiliateCookieOptions(maxAgeSeconds: number, requestUrl?: string) {
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    (requestUrl ? new URL(requestUrl).protocol === "https:" : false);
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export { AFFILIATE_COOKIE };
