import { permittedDatasets, type ExportDataset } from "@/lib/account/export";
import { affiliateStore } from "@/lib/data/affiliate-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { buildAffiliateDashboard } from "@/lib/affiliate/service";
import type { SessionContext } from "@/lib/tenant/context";
import { permissionsForRole } from "@/lib/tenant/permissions";

export type AccountExportPayload = {
  exportedAt: string;
  datasets: ExportDataset[];
  account: {
    email: string;
    name: string;
    role: string;
    phone?: string;
    country?: string;
    location?: string;
    companyName?: string;
  };
  organization?: {
    id: string;
    name: string;
    plan: string;
  };
  workspace?: {
    id: string;
    name: string;
    currency?: string;
    locale?: string;
    timezone?: string;
    countryCode?: string;
  };
  members?: Array<Record<string, unknown>>;
  contacts?: Array<Record<string, unknown>>;
  companies?: Array<Record<string, unknown>>;
  deals?: Array<Record<string, unknown>>;
  affiliate?: Record<string, unknown> | null;
};

export async function buildAccountExport(
  ctx: SessionContext
): Promise<AccountExportPayload> {
  const permissions = permissionsForRole(ctx.role);
  const canReadCrm = permissions.includes("crm:read");
  const canManageOrg = permissions.includes("org:manage");
  const affiliate =
    (await affiliateStore.getAffiliateByUserId(ctx.userId)) ??
    (await affiliateStore.getAffiliateByEmail(ctx.email));

  const datasets = permittedDatasets({
    canReadCrm,
    canManageOrg,
    isAffiliate: Boolean(affiliate),
  });

  const repo = getTenantRepository();
  const [org, workspace, settings, members, contacts, companies, deals, dashboard] =
    await Promise.all([
      repo.getOrganization(ctx.scope.tenantId),
      repo.getWorkspace(ctx.scope.workspaceId),
      getWorkspaceSettings(ctx.scope.workspaceId),
      canManageOrg ? repo.listMembers(ctx.scope) : Promise.resolve([]),
      canReadCrm ? getCrmRepository().listContacts(ctx.scope) : Promise.resolve([]),
      canReadCrm ? getCrmRepository().listCompanies(ctx.scope) : Promise.resolve([]),
      canReadCrm ? getCrmRepository().listDeals(ctx.scope) : Promise.resolve([]),
      affiliate ? buildAffiliateDashboard(affiliate.id) : Promise.resolve(null),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    datasets,
    account: {
      email: ctx.email,
      name: ctx.name,
      role: ctx.role,
      phone: ctx.member?.phone,
      country: ctx.member?.country,
      location: ctx.member?.location,
      companyName: ctx.member?.companyName,
    },
    organization: org
      ? { id: org.id, name: org.name, plan: org.plan }
      : undefined,
    workspace: workspace
      ? {
          id: workspace.id,
          name: workspace.name,
          currency: settings.defaultCurrency,
          locale: settings.locale,
          timezone: settings.timezone,
          countryCode: settings.countryCode,
        }
      : undefined,
    members: canManageOrg
      ? members.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          status: m.status,
          country: m.country,
          phone: m.phone,
        }))
      : undefined,
    contacts: canReadCrm
      ? contacts.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          tags: c.tags,
          leadScore: c.leadScore,
        }))
      : undefined,
    companies: canReadCrm
      ? companies.map((c) => ({
          id: c.id,
          name: c.name,
          domain: c.domain,
          industry: c.industry,
          website: c.website,
        }))
      : undefined,
    deals: canReadCrm
      ? deals.map((d) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          value: d.value,
          currency: d.currency,
        }))
      : undefined,
    affiliate: dashboard
      ? {
          referralCode: dashboard.affiliate.referralCode,
          status: dashboard.affiliate.status,
          regionCode: dashboard.rates.regionCode,
          stats: dashboard.stats,
          balance: dashboard.balance,
          leads: dashboard.leads,
          earnings: dashboard.earnings.map((e) => ({
            id: e.id,
            type: e.type,
            status: e.status,
            amount: e.amount,
            currency: e.currency,
            createdAt: e.createdAt,
          })),
          payouts: dashboard.payouts.map((p) => ({
            id: p.id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            createdAt: p.createdAt,
          })),
        }
      : null,
  };
}

export function datasetRows(
  payload: AccountExportPayload,
  dataset: ExportDataset
): Array<Record<string, unknown>> {
  if (dataset === "account") {
    return [
      {
        ...payload.account,
        organization: payload.organization?.name,
        plan: payload.organization?.plan,
        workspace: payload.workspace?.name,
        exportedAt: payload.exportedAt,
      },
    ];
  }
  if (dataset === "contacts") return payload.contacts ?? [];
  if (dataset === "companies") return payload.companies ?? [];
  if (dataset === "deals") return payload.deals ?? [];
  if (dataset === "members") return payload.members ?? [];
  if (dataset === "affiliate") {
    return payload.affiliate ? [payload.affiliate] : [];
  }
  return [];
}
