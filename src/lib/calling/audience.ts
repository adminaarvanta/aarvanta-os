import { getCrmRepository } from "@/lib/data/crm-store";
import type { TenantScope } from "@/types/communication";
import type { CampaignFilters } from "@/types/calling-agent";
import type { CrmCompany, CrmContact } from "@/types/crm";

export type AudienceContact = CrmContact & {
  companyName?: string;
  industry?: string;
};

export async function resolveAudience(
  filters: CampaignFilters,
  scope: TenantScope
): Promise<AudienceContact[]> {
  const crm = getCrmRepository();
  const [contacts, companies] = await Promise.all([
    crm.listContacts(scope),
    crm.listCompanies(scope),
  ]);
  const companyById = new Map(companies.map((c) => [c.id, c]));

  return contacts
    .filter((contact) => matchesFilters(contact, companyById, filters))
    .map((contact) => {
      const company = contact.accountId
        ? companyById.get(contact.accountId)
        : undefined;
      return {
        ...contact,
        companyName: company?.name,
        industry: company?.industry,
      };
    });
}

export async function previewAudienceCount(
  filters: CampaignFilters,
  scope: TenantScope
): Promise<number> {
  const audience = await resolveAudience(filters, scope);
  return audience.length;
}

function matchesFilters(
  contact: CrmContact,
  companies: Map<string, CrmCompany>,
  filters: CampaignFilters
): boolean {
  if (filters.requirePhone !== false && !contact.phone?.trim()) {
    return false;
  }

  // Explicit CRM contact list wins — skip tags/score/industry filters.
  if (filters.contactIds?.length) {
    return filters.contactIds.includes(contact.id);
  }

  if (filters.accountIds?.length) {
    if (!contact.accountId || !filters.accountIds.includes(contact.accountId)) {
      return false;
    }
  }

  if (filters.minLeadScore != null) {
    if ((contact.leadScore ?? 0) < filters.minLeadScore) return false;
  }

  if (filters.tags?.length) {
    const hasTag = filters.tags.some((tag) => contact.tags.includes(tag));
    if (!hasTag) return false;
  }

  if (filters.industries?.length) {
    const company = contact.accountId
      ? companies.get(contact.accountId)
      : undefined;
    const industry = company?.industry?.toLowerCase() ?? "";
    const ok = filters.industries.some(
      (i) => i.toLowerCase() === industry || industry.includes(i.toLowerCase())
    );
    if (!ok) return false;
  }

  return true;
}
