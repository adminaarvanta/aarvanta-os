import { isDemoMode } from "@/lib/config/app-mode";

/** Platform admins for affiliate ops — env allowlist; demo allows any signed-in user. */
export function isAffiliatePlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  if (isDemoMode()) return true;
  const raw = process.env.AFFILIATE_ADMIN_EMAILS ?? "";
  const allow = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length === 0) return false;
  return allow.includes(email.trim().toLowerCase());
}
