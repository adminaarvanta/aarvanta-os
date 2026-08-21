import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getTenantRepository } from "@/lib/data/tenant-store";
import {
  getUserCredentials,
  hasUserPassword,
  upsertGoogleIdentity,
  upsertUserPassword,
} from "@/lib/auth/user-credentials";
import type { SessionPayload } from "@/lib/auth/session";
import type { MemberAuthProvider, WorkspaceMember } from "@/types/tenant";

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
  /** Affiliate referral code from cookie or form (`ref`). */
  referralCode?: string;
};

export type ProvisionFreeAccountResult = {
  session: SessionPayload;
  organizationId: string;
  workspaceId: string;
};

function pickMembership(
  memberships: WorkspaceMember[],
  email: string,
  userId: string
): WorkspaceMember | null {
  const key = email.trim().toLowerCase();
  return (
    memberships.find((m) => m.email.trim().toLowerCase() === key) ??
    memberships.find((m) => m.userId === userId) ??
    memberships[0] ??
    null
  );
}

/**
 * Ensure a free-tier owner membership exists for an authenticated credential.
 * Used when login finds a password but no membership (cold-start / partial signup).
 */
export async function ensureFreeTierMembership(input: {
  email: string;
  userId: string;
  name?: string;
  phone?: string;
  country?: string;
  companyName?: string;
}): Promise<WorkspaceMember> {
  await ensureDatastoreReady();

  const email = input.email.trim().toLowerCase();
  const userId = input.userId.trim();
  const repo = getTenantRepository();

  const byUser = await repo.listMembershipsForUser(userId);
  const existing = pickMembership(byUser, email, userId);
  if (existing) return existing;

  const byEmail = await repo.listMembershipsForEmail(email);
  const fromEmail = pickMembership(byEmail, email, userId);
  if (fromEmail) return fromEmail;

  const displayName = input.name?.trim() || email.split("@")[0] || "Owner";
  const companyLabel =
    input.companyName?.trim() || `${displayName}'s workspace`;
  const orgSlugBase = slugify(companyLabel);
  const now = crmNow();
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
    onboarding: { status: "pending" },
  });

  const workspace = await repo.createWorkspace({
    tenantId,
    name: "Main",
    slug: "main",
    defaultCompanyId: companyId,
  });

  return repo.createMember(
    {
      userId,
      email,
      name: displayName,
      role: "owner",
      phone: input.phone?.trim() || "+0000000000",
      country: input.country?.trim() || "United Kingdom",
      companyName: input.companyName?.trim() || undefined,
      authProvider: "password",
      profileComplete: true,
    },
    {
      tenantId,
      workspaceId: workspace.id,
      companyId,
    }
  );
}

/**
 * Create a personal free-tier org + workspace + owner membership.
 * Company name is optional — defaults to "{name}'s workspace".
 *
 * Reuses an existing membership when the email already has one (e.g. partner
 * auto-activation) and only adds credentials. Google-only records can finish
 * signup by setting a password here.
 */
export async function provisionFreeTierAccount(
  input: ProvisionFreeAccountInput
): Promise<ProvisionFreeAccountResult> {
  await ensureDatastoreReady();

  const email = input.email.trim().toLowerCase();
  const existingCreds = await getUserCredentials(email);
  if (existingCreds && (await hasUserPassword(email))) {
    throw new Error("An account with this email already exists. Please sign in.");
  }

  const repo = getTenantRepository();
  const userId = existingCreds?.userId ?? userIdFromEmail(email);
  const displayName = input.name.trim() || email.split("@")[0] || "Owner";

  let member =
    pickMembership(await repo.listMembershipsForUser(userId), email, userId) ??
    pickMembership(await repo.listMembershipsForEmail(email), email, userId);

  let tenantId: string;
  let workspaceId: string;

  if (member) {
    tenantId = member.tenantId;
    workspaceId = member.workspaceId;
  } else {
    const now = crmNow();
    const companyLabel =
      input.companyName?.trim() || `${displayName}'s workspace`;
    const orgSlugBase = slugify(companyLabel);
    tenantId = crmNewId("org");
    const companyId = crmNewId("co");
    const orgSlug = `${orgSlugBase}-${tenantId.slice(-6)}`;

    await repo.upsertOrganization({
      id: tenantId,
      name: companyLabel,
      slug: orgSlug,
      plan: "free",
      createdAt: now,
      updatedAt: now,
      onboarding: { status: "pending" },
    });

    const workspace = await repo.createWorkspace({
      tenantId,
      name: "Main",
      slug: "main",
      defaultCompanyId: companyId,
    });
    workspaceId = workspace.id;

    member = await repo.createMember(
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
  }

  if (input.authProvider === "password") {
    if (!input.password || input.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    await upsertUserPassword({
      email,
      userId: member.userId,
      password: input.password,
    });
  } else if (!existingCreds) {
    await upsertGoogleIdentity({
      email,
      userId: member.userId,
      googleSub: input.googleSub || "",
    });
  } else if (input.googleSub && !existingCreds.googleSub) {
    await upsertGoogleIdentity({
      email,
      userId: member.userId,
      googleSub: input.googleSub,
    });
  }

  if (input.referralCode?.trim()) {
    try {
      const { attributeSignup, enrollReferredUserAsAffiliate } = await import(
        "@/lib/affiliate/service"
      );
      const result = await attributeSignup({
        referralCode: input.referralCode,
        email,
        userId: member.userId,
        tenantId: member.tenantId,
        workspaceId: member.workspaceId,
        companyId: member.companyId,
        country: input.country,
      });
      if (result.skippedReason) {
        console.info("[affiliate] attribution skipped on signup", {
          email,
          referralCode: input.referralCode,
          reason: result.skippedReason,
        });
      } else if (!result.attribution) {
        console.warn("[affiliate] attribution on signup produced no row", {
          email,
          referralCode: input.referralCode,
        });
      }
      await enrollReferredUserAsAffiliate({
        referralCode: input.referralCode,
        email,
        name: displayName,
        userId: member.userId,
        tenantId: member.tenantId,
        country: input.country,
        company: input.companyName,
      });
    } catch (err) {
      console.warn("[affiliate] attribution on signup failed", {
        email,
        referralCode: input.referralCode,
        err,
      });
    }
  }

  return {
    organizationId: tenantId,
    workspaceId,
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
