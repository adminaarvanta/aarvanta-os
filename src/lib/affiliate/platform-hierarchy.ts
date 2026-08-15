import { crmNow } from "@/lib/data/crm-helpers";
import { affiliateStore } from "@/lib/data/affiliate-store";
import {
  AFFILIATE_MAX_DEPTH,
  PLATFORM_ROOT_EMAIL,
  countryToRegionCode,
  generateReferralCode,
  normalizeReferralCode,
} from "@/lib/affiliate/constants";
import { isDemoMode } from "@/lib/config/app-mode";
import { DEMO_ORG_AARVANTA } from "@/lib/data/tenant-demo-seed";
import { getTenantRepository } from "@/lib/data/tenant-store";
import type { Affiliate } from "@/types/affiliate";
import type { MemberRole, WorkspaceMember } from "@/types/tenant";

export { PLATFORM_ROOT_EMAIL };

export function platformTenantId(): string | null {
  if (isDemoMode()) return DEMO_ORG_AARVANTA;
  return process.env.TENANT_ID?.trim() || null;
}

export function isPlatformTenantId(tenantId: string | undefined | null): boolean {
  const platform = platformTenantId();
  return Boolean(platform && tenantId && tenantId === platform);
}

export function isPlatformRootEmail(email: string | undefined | null): boolean {
  return email?.trim().toLowerCase() === PLATFORM_ROOT_EMAIL;
}

async function uniqueInternalCode(seed: string): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    const code = generateReferralCode(seed);
    const clash = await affiliateStore.getAffiliateByCode(code);
    if (!clash) return code;
  }
  return generateReferralCode(`${seed}${Date.now()}`);
}

function memberCountry(member: Pick<WorkspaceMember, "country"> | undefined) {
  return member?.country?.trim() || "United Kingdom";
}

export async function ensurePlatformRootAffiliate(): Promise<Affiliate> {
  const existing = await affiliateStore.getAffiliateByEmail(PLATFORM_ROOT_EMAIL);
  if (existing) {
    if (existing.parentAffiliateId || existing.source !== "internal") {
      return affiliateStore.saveAffiliate({
        ...existing,
        parentAffiliateId: undefined,
        source: "internal",
        status: existing.status === "rejected" ? "active" : existing.status,
        updatedAt: crmNow(),
      });
    }
    return existing;
  }

  const tenantId = platformTenantId();
  let userId: string | undefined;
  let name = "Aarvanta";
  let country = "United Kingdom";
  if (tenantId) {
    const members = await getTenantRepository().listMembersByTenant(tenantId);
    const match = members.find(
      (m) => m.email.trim().toLowerCase() === PLATFORM_ROOT_EMAIL
    );
    if (match) {
      userId = match.userId;
      name = match.name?.trim() || name;
      country = memberCountry(match);
    }
  }

  return affiliateStore.createAffiliate({
    ...(isDemoMode() ? { id: "aff_platform_root" } : {}),
    referralCode: await uniqueInternalCode("AARVANTA"),
    source: "internal",
    status: "active",
    role: "partner",
    userId,
    tenantId: tenantId ?? undefined,
    approvedAt: crmNow(),
    profile: {
      name,
      email: PLATFORM_ROOT_EMAIL,
      company: "Aarvanta",
      country,
      regionCode: countryToRegionCode(country),
    },
  });
}

async function attachUnderRoot(
  affiliate: Affiliate,
  rootId: string
): Promise<Affiliate> {
  if (affiliate.id === rootId || affiliate.parentAffiliateId === rootId) {
    return affiliate;
  }
  const { assertValidParentAssignment } = await import("@/lib/affiliate/service");
  const all = await affiliateStore.listAffiliates();
  try {
    assertValidParentAssignment(all, affiliate.id, rootId);
  } catch {
    return affiliate;
  }
  return affiliateStore.saveAffiliate({
    ...affiliate,
    parentAffiliateId: rootId,
    updatedAt: crmNow(),
  });
}

export async function attachPlatformMemberToHierarchy(input: {
  email: string;
  name: string;
  userId?: string;
  tenantId: string;
  role: MemberRole;
  status?: WorkspaceMember["status"];
  country?: string;
}): Promise<Affiliate | null> {
  if (!isPlatformTenantId(input.tenantId)) return null;
  if (input.role === "guest" || input.status === "suspended") return null;

  const email = input.email.trim().toLowerCase();
  if (!email) return null;

  const root = await ensurePlatformRootAffiliate();
  if (email === PLATFORM_ROOT_EMAIL) {
    if (input.userId && root.userId !== input.userId) {
      return affiliateStore.saveAffiliate({
        ...root,
        userId: input.userId,
        tenantId: input.tenantId,
        profile: {
          ...root.profile,
          name: input.name.trim() || root.profile.name,
        },
        updatedAt: crmNow(),
      });
    }
    return root;
  }

  const country = input.country?.trim() || "United Kingdom";
  const existing =
    (input.userId
      ? await affiliateStore.getAffiliateByUserId(input.userId)
      : null) ?? (await affiliateStore.getAffiliateByEmail(email));

  if (existing) {
    const next = await affiliateStore.saveAffiliate({
      ...existing,
      source: existing.source === "external" ? "internal" : existing.source,
      userId: existing.userId ?? input.userId,
      tenantId: existing.tenantId ?? input.tenantId,
      profile: {
        ...existing.profile,
        name: input.name.trim() || existing.profile.name,
        email,
      },
      updatedAt: crmNow(),
    });
    return attachUnderRoot(next, root.id);
  }

  const created = await affiliateStore.createAffiliate({
    referralCode: await uniqueInternalCode(input.name || email),
    source: "internal",
    status: "active",
    role: "partner",
    parentAffiliateId: root.id,
    userId: input.userId,
    tenantId: input.tenantId,
    approvedAt: crmNow(),
    profile: {
      name: input.name.trim() || email.split("@")[0] || "Team member",
      email,
      company: "Aarvanta",
      country,
      regionCode: countryToRegionCode(country),
    },
  });
  return created;
}

/** Idempotent: admin root + platform members + parentless affiliates. */
export async function ensurePlatformAffiliateHierarchy(): Promise<Affiliate> {
  const root = await ensurePlatformRootAffiliate();
  const tenantId = platformTenantId();

  if (tenantId) {
    const members = await getTenantRepository().listMembersByTenant(tenantId);
    const seen = new Set<string>();
    for (const member of members) {
      const email = member.email.trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      await attachPlatformMemberToHierarchy({
        email,
        name: member.name,
        userId: member.userId,
        tenantId: member.tenantId,
        role: member.role,
        status: member.status,
        country: member.country,
      });
    }
  }

  const all = await affiliateStore.listAffiliates();
  for (const affiliate of all) {
    if (affiliate.id === root.id) continue;
    if (affiliate.parentAffiliateId) continue;
    if (affiliate.status === "rejected") continue;
    await attachUnderRoot(affiliate, root.id);
  }

  return (await affiliateStore.getAffiliate(root.id)) ?? root;
}

/**
 * Valid referral code → that parent. Otherwise the admin@aarvanta.co root.
 * Throws when a code is present but invalid, inactive, or at max depth.
 */
export async function resolveAffiliateParentId(
  parentReferralCode?: string | null
): Promise<string> {
  if (parentReferralCode?.trim()) {
    const parentCode = normalizeReferralCode(parentReferralCode);
    const parent = await affiliateStore.getAffiliateByCode(parentCode);
    if (!parent || parent.status !== "active") {
      throw new Error("Parent referral code is invalid or inactive.");
    }
    const { getAffiliateDepth } = await import("@/lib/affiliate/service");
    const all = await affiliateStore.listAffiliates();
    if (getAffiliateDepth(all, parent.id) >= AFFILIATE_MAX_DEPTH) {
      throw new Error(
        `Parent is already at max hierarchy depth (${AFFILIATE_MAX_DEPTH}).`
      );
    }
    return parent.id;
  }

  const root = await ensurePlatformRootAffiliate();
  return root.id;
}
