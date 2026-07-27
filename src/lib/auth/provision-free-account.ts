import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getTenantRepository } from "@/lib/data/tenant-store";
import {
  getUserCredentials,
  upsertGoogleIdentity,
  upsertUserPassword,
} from "@/lib/auth/user-credentials";
import type { SessionPayload } from "@/lib/auth/session";
import type { MemberAuthProvider } from "@/types/tenant";

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "workspace"
  );
}

export function userIdFromEmail(email: string): string {
  const slug = email.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);
  return `user_${slug}`;
}

export type ProvisionFreeAccountInput = {
  email: string;
  name: string;
  phone: string;
  country: string;
  companyName?: string;
  password?: string;
  googleSub?: string;
  authProvider: MemberAuthProvider;
};

export type ProvisionFreeAccountResult = {
  session: SessionPayload;
  organizationId: string;
  workspaceId: string;
};

/**
 * Create a personal free-tier org + workspace + owner membership.
 * Company name is optional — defaults to "{name}'s workspace".
 */
export async function provisionFreeTierAccount(
  input: ProvisionFreeAccountInput
): Promise<ProvisionFreeAccountResult> {
  await ensureDatastoreReady();

  const email = input.email.trim().toLowerCase();
  const existing = await getUserCredentials(email);
  if (existing) {
    throw new Error("An account with this email already exists. Please sign in.");
  }

  const repo = getTenantRepository();
  const now = crmNow();
  const userId = userIdFromEmail(email);
  const displayName = input.name.trim() || email.split("@")[0] || "Owner";
  const companyLabel =
    input.companyName?.trim() || `${displayName}'s workspace`;
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

  const member = await repo.createMember(
    {
      userId,
      email,
      name: displayName,
      role: "owner",
      phone: input.phone.trim(),
      country: input.country.trim(),
      companyName: input.companyName?.trim() || undefined,
      authProvider: input.authProvider,
      profileComplete: true,
    },
    {
      tenantId,
      workspaceId: workspace.id,
      companyId,
    }
  );

  if (input.authProvider === "password") {
    if (!input.password || input.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    await upsertUserPassword({
      email,
      userId: member.userId,
      password: input.password,
    });
  } else {
    await upsertGoogleIdentity({
      email,
      userId: member.userId,
      googleSub: input.googleSub || "",
    });
  }

  return {
    organizationId: tenantId,
    workspaceId: workspace.id,
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
