import { randomBytes } from "crypto";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getTenantRepository } from "@/lib/data/tenant-store";
import {
  getUserCredentials,
  hasUserPassword,
} from "@/lib/auth/user-credentials";
import { userIdFromEmail } from "@/lib/auth/provision-free-account";
import type { SessionPayload } from "@/lib/auth/session";

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "workspace"
  );
}

export const AFFILIATE_ACTIVATION_DAYS = 7;

export function mintAffiliateActivationToken(): string {
  return randomBytes(24).toString("hex");
}

export function affiliateActivationExpiry(
  fromIso = crmNow(),
  days = AFFILIATE_ACTIVATION_DAYS
): string {
  const d = new Date(fromIso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export type ProvisionPartnerAccountInput = {
  email: string;
  name: string;
  country: string;
  companyName?: string;
  phone?: string;
  /** Prefer this user id when credentials are missing (e.g. already linked affiliate). */
  preferredUserId?: string;
};

export type ProvisionPartnerAccountResult = {
  session: SessionPayload;
  organizationId: string;
  workspaceId: string;
  userId: string;
};

/**
 * Ensure an approved partner has a tenant membership so they can set a password.
 * Reuses Google-only / empty credential records instead of failing with "already exists".
 * Password is set later via the activation link (no credentials written here).
 */
export async function provisionPartnerAccountWithoutPassword(
  input: ProvisionPartnerAccountInput
): Promise<ProvisionPartnerAccountResult> {
  await ensureDatastoreReady();

  const email = input.email.trim().toLowerCase();
  const existingCreds = await getUserCredentials(email);

  if (existingCreds && (await hasUserPassword(email))) {
    throw new Error("An account with this email already exists. Please sign in.");
  }

  const repo = getTenantRepository();
  const userId =
    existingCreds?.userId ||
    input.preferredUserId?.trim() ||
    userIdFromEmail(email);

  const memberships = await repo.listMembershipsForUser(userId);
  const existingMembership = memberships.find(
    (m) => m.email.trim().toLowerCase() === email
  );
  if (existingMembership) {
    return {
      organizationId: existingMembership.tenantId,
      workspaceId: existingMembership.workspaceId,
      userId: existingMembership.userId,
      session: {
        email,
        name: existingMembership.name,
        userId: existingMembership.userId,
        role: existingMembership.role,
        tenantId: existingMembership.tenantId,
        workspaceId: existingMembership.workspaceId,
        companyId: existingMembership.companyId,
      },
    };
  }

  const now = crmNow();
  const displayName = input.name.trim() || email.split("@")[0] || "Partner";
  const companyLabel =
    input.companyName?.trim() || `${displayName}'s partner workspace`;
  const orgSlugBase = slugify(companyLabel);
  const tenantId = crmNewId("org");
  const companyId = crmNewId("co");
  const orgSlug = `${orgSlugBase}-${tenantId.slice(-6)}`;

  await repo.upsertOrganization({
    id: tenantId,
    name: companyLabel,
    slug: orgSlug,
    plan: "free",
    createdAt: now,
    updatedAt: now,
  });

  const workspace = await repo.createWorkspace({
    tenantId,
    name: "Main",
    slug: "main",
    defaultCompanyId: companyId,
  });

  const phone =
    input.phone?.trim() && input.phone.trim().length >= 7
      ? input.phone.trim()
      : "+0000000000";

  const member = await repo.createMember(
    {
      userId,
      email,
      name: displayName,
      role: "owner",
      phone,
      country: input.country.trim() || "United Kingdom",
      companyName: input.companyName?.trim() || undefined,
      authProvider: existingCreds?.authProvider === "google" ? "google" : "password",
      profileComplete: true,
    },
    {
      tenantId,
      workspaceId: workspace.id,
      companyId,
    }
  );

  return {
    organizationId: tenantId,
    workspaceId: workspace.id,
    userId: member.userId,
    session: {
      email,
      name: member.name,
      userId: member.userId,
      role: member.role,
      tenantId: member.tenantId,
      workspaceId: member.workspaceId,
      companyId: member.companyId,
    },
  };
}
