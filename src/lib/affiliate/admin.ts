import { isDemoMode } from "@/lib/config/app-mode";
import type { MemberRole } from "@/types/tenant";

/**
 * Affiliate platform admins:
 * - demo: any signed-in user
 * - production: workspace owner/admin, or emails in AFFILIATE_ADMIN_EMAILS
 */
export function isAffiliatePlatformAdmin(
  email: string | null | undefined,
  role?: MemberRole | null
): boolean {
  if (!email) return false;
  if (isDemoMode()) return true;
  if (role === "owner" || role === "admin") return true;

  const raw = process.env.AFFILIATE_ADMIN_EMAILS ?? "";
  const allow = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length === 0) return false;
  return allow.includes(email.trim().toLowerCase());
}
