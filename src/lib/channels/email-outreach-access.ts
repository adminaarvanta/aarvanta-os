import { isDemoMode } from "@/lib/config/app-mode";
import { isSuperAdminEmail } from "@/lib/billing/super-admin";
import { getSessionContext, type SessionContext } from "@/lib/tenant/context";

/**
 * Email Outreach (Brevo) is super-admin-only in production.
 * Demo mode is open so the UI can be exercised without Firebase login.
 */
export function canAccessEmailOutreach(
  email: string | null | undefined
): boolean {
  if (isDemoMode()) return true;
  return isSuperAdminEmail(email);
}

export async function requireEmailOutreachSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!canAccessEmailOutreach(ctx.email)) {
    throw new Error("Forbidden");
  }
  return ctx;
}
