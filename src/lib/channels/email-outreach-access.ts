import { isDemoMode } from "@/lib/config/app-mode";
import {
  canAccessEmailOutreachForMember,
  resolveCreditOverridesForSession,
} from "@/lib/billing/member-credits";
import { getSessionContext, type SessionContext } from "@/lib/tenant/context";
import type { WorkspaceMember } from "@/types/tenant";

/**
 * Email Outreach (Brevo) is super-admin-only in production, unless a member
 * has unlimitedEmailOutreach from the super-admin credit access panel.
 * Demo mode is open so the UI can be exercised without Firebase login.
 *
 * Prefer passing the session member (with resolved creditOverrides).
 */
export function canAccessEmailOutreach(
  email: string | null | undefined,
  member?: WorkspaceMember | null
): boolean {
  return canAccessEmailOutreachForMember(email, member, isDemoMode());
}

/**
 * Super-admin-only Email Outreach (Brevo), unless a member has
 * unlimitedEmailOutreach from the credit access panel.
 * Demo mode is open so the UI can be exercised without Firebase login.
 *
 * Async variant resolves grants across all memberships for the email.
 */
export async function canAccessEmailOutreachAsync(
  email: string | null | undefined,
  member?: WorkspaceMember | null
): Promise<boolean> {
  if (isDemoMode()) return true;
  if (canAccessEmailOutreachForMember(email, member, false)) return true;
  const overrides = await resolveCreditOverridesForSession({ email, member });
  return Boolean(overrides.unlimitedEmailOutreach);
}

export async function requireEmailOutreachSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!(await canAccessEmailOutreachAsync(ctx.email, ctx.member))) {
    throw new Error("Forbidden");
  }
  return ctx;
}
