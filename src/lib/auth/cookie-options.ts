/** Safe internal redirect target after login. */
export function sanitizeNextPath(raw: string | null | undefined): string {
  const fallback = "/dashboard";
  if (!raw) return fallback;

  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.startsWith("/login")) return fallback;

  return path;
}

/**
 * Secure cookies only on HTTPS unless explicitly overridden.
 * Avoids broken login on local `npm start` (NODE_ENV=production over HTTP).
 */
export function shouldUseSecureCookies(requestUrl?: string): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;

  if (requestUrl) {
    try {
      return new URL(requestUrl).protocol === "https:";
    } catch {
      return false;
    }
  }

  return false;
}

export function getSessionCookieOptions(
  maxAge = 60 * 60 * 24 * 7,
  requestUrl?: string
) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(requestUrl),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
