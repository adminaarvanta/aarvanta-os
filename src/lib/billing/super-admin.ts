/**
 * Platform root / super-admin bypass for plan entitlements.
 * Always includes admin@aarvanta.co; also the env bootstrap AUTH_EMAIL owner.
 */

const HARDCODED_SUPER_ADMINS = ["admin@aarvanta.co"] as const;

function envSuperAdminEmails(): string[] {
  const fromList =
    process.env.SUPER_ADMIN_EMAILS?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? [];
  const auth = process.env.AUTH_EMAIL?.trim().toLowerCase();
  return auth ? [...fromList, auth] : fromList;
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (HARDCODED_SUPER_ADMINS.includes(normalized as (typeof HARDCODED_SUPER_ADMINS)[number])) {
    return true;
  }
  return envSuperAdminEmails().includes(normalized);
}

/** Best-effort: true when the current session is the platform super admin. */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  try {
    const { getSessionContext } = await import("@/lib/tenant/context");
    const ctx = await getSessionContext();
    return isSuperAdminEmail(ctx.email);
  } catch {
    return false;
  }
}
