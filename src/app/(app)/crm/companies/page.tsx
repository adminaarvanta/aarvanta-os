import Link from "next/link";
import { CrmNav } from "@/components/crm/crm-nav";
import { CreateCompanyForm } from "@/components/crm/create-company-form";
import { CrmImportForm } from "@/components/crm/crm-import-form";
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
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">Companies</h2>
        <p className="text-xs text-muted sm:text-sm">
          Create and manage accounts — assign owners, log activities, and track deals.
        </p>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start gap-2">
          <CreateCompanyForm members={memberOptions} />
          <CrmImportForm entity="companies" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => {
            const companyContacts = contacts.filter(
              (c) => c.accountId === company.id
            );
            return (
              <Link
                key={company.id}
                href={`/crm/companies/${company.id}`}
                className="block rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-gold/30"
              >
                <h3 className="truncate text-lg font-semibold text-foreground">
                  {company.name}
                </h3>
                {company.domain && (
                  <p className="text-sm text-muted">{company.domain}</p>
                )}
                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Owner</dt>
                    <dd>{memberNameByUserId(members, company.ownerId)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Industry</dt>
                    <dd>{company.industry ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Revenue</dt>
                    <dd className="font-medium text-gold">
                      £{company.purchaseTotal.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Contacts</dt>
                    <dd>{companyContacts.length}</dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>
        {companies.length === 0 && (
          <p className="text-center text-sm text-muted">
            No companies yet. Use &quot;Add company&quot; to create your first account.
          </p>
        )}
      </div>
    </>
  );
}

export const metadata = { title: "Companies" };
