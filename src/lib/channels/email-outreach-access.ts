import { isDemoMode } from "@/lib/config/app-mode";
import {
  canAccessEmailOutreachForMember,
  resolveCreditOverridesForSession,
} from "@/lib/billing/member-credits";
import { isSuperAdminEmail } from "@/lib/billing/super-admin";
import { getSessionContext, type SessionContext } from "@/lib/tenant/context";
import type { WorkspaceMember } from "@/types/tenant";

/**
 * Email Outreach (Brevo): super admins, demo mode, or users with an
 * unlimitedEmailOutreach grant from Credit access.
 *
 * Prefer the async helper — it reads the email-keyed grant store and every
 * membership for the email (case-insensitive).
 */
export function canAccessEmailOutreach(
  email: string | null | undefined,
  member?: WorkspaceMember | null
): boolean {
  return canAccessEmailOutreachForMember(email, member, isDemoMode());
}

export async function canAccessEmailOutreachAsync(
  email: string | null | undefined,
  member?: WorkspaceMember | null
): Promise<boolean> {
  if (isDemoMode()) return true;
  if (isSuperAdminEmail(email)) return true;
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
