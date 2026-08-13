import { isDemoMode } from "@/lib/config/app-mode";

/**
 * Affiliate platform admins (global affiliate data):
 * - demo: any signed-in user (local testing)
 * - production: email must be in AFFILIATE_ADMIN_EMAILS or AUTH_EMAIL
 *
 * Workspace owner/admin roles alone do NOT grant global affiliate access.
 */
export function isAffiliatePlatformAdmin(
  email: string | null | undefined
): boolean {
  if (!email) return false;
  if (isDemoMode()) return true;
  return listAffiliateAdminEmails().includes(email.trim().toLowerCase());
}

/** Notify / allowlist emails for partner application ops. */
export function listAffiliateAdminEmails(): string[] {
  const raw = [
    process.env.AFFILIATE_ADMIN_EMAILS ?? "",
    process.env.AUTH_EMAIL ?? "",
  ].join(",");
  return [
    ...new Set(
      raw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}
