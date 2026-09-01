import { isDemoMode } from "@/lib/config/app-mode";
import { canAccessEmailOutreachForMember } from "@/lib/billing/member-credits";
import { getSessionContext, type SessionContext } from "@/lib/tenant/context";
import type { WorkspaceMember } from "@/types/tenant";

/**
 * Email Outreach (Brevo) is super-admin-only in production, unless a member
 * has unlimitedEmailOutreach from the super-admin credit access panel.
 * Demo mode is open so the UI can be exercised without Firebase login.
 */
export function canAccessEmailOutreach(
  email: string | null | undefined,
  member?: WorkspaceMember | null
): boolean {
  return canAccessEmailOutreachForMember(email, member, isDemoMode());
}

export async function requireEmailOutreachSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!canAccessEmailOutreach(ctx.email, ctx.member)) {
    throw new Error("Forbidden");
  }
  return ctx;
}
