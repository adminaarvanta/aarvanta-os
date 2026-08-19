import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CompaniesDirectory } from "@/components/crm/companies-directory";
import { CreateCompanyForm } from "@/components/crm/create-company-form";
import { CrmImportForm } from "@/components/crm/crm-import-form";
import { CrmShell, CrmToolbar } from "@/components/crm/crm-shell";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function CompaniesPage() {
  const scope = await getTenantScope();
  const [companies, contacts, members] = await Promise.all([
    getCrmRepository().listCompanies(scope),
    getCrmRepository().listContacts(scope),
    getTenantRepository().listMembers(scope),
  ]);

  const memberOptions = activeMemberOptions(members);

  return (
    <CrmShell
      title="Companies"
      description="Accounts and the people behind them."
      actions={<AskAiButton module="crm" />}
    >
      <CrmToolbar>
        <CreateCompanyForm members={memberOptions} />
        <CrmImportForm entity="companies" />
      </CrmToolbar>
      <CompaniesDirectory
        companies={companies.map((company) => ({
          id: company.id,
          name: company.name,
          domain: company.domain,
          industry: company.industry,
          ownerName: memberNameByUserId(members, company.ownerId),
          revenue: company.purchaseTotal,
          contactCount: contacts.filter((c) => c.accountId === company.id)
            .length,
        }))}
      />
    </CrmShell>
  );
}

export const metadata = { title: "Companies" };
