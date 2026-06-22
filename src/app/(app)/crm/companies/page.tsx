import Link from "next/link";
import { CrmNav } from "@/components/crm/crm-nav";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function CompaniesPage() {
  const scope = await getTenantScope();
  const [companies, contacts] = await Promise.all([
    getCrmRepository().listCompanies(scope),
    getCrmRepository().listContacts(scope),
  ]);

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">Companies</h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          Account management — contacts, revenue, and deals per company.
        </p>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => {
            const companyContacts = contacts.filter(
              (c) => c.accountId === company.id
            );
            return (
              <article
                key={company.id}
                className="rounded-xl border border-[#3d3528] bg-[#101010] p-5"
              >
                <h3 className="truncate text-lg font-semibold text-[#F5E6C8]">
                  {company.name}
                </h3>
                {company.domain && (
                  <p className="text-sm text-[#A89878]">{company.domain}</p>
                )}
                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#A89878]">Industry</dt>
                    <dd>{company.industry ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#A89878]">Size</dt>
                    <dd>{company.size ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#A89878]">Revenue</dt>
                    <dd className="font-medium text-[#D4AF37]">
                      £{company.purchaseTotal.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#A89878]">Contacts</dt>
                    <dd>{companyContacts.length}</dd>
                  </div>
                </dl>
                {company.notes && (
                  <p className="mt-3 text-xs text-[#A89878]">{company.notes}</p>
                )}
                {companyContacts.length > 0 && (
                  <ul className="mt-3 border-t border-[#3d3528] pt-3 text-xs text-[#A89878]">
                    {companyContacts.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/crm/contacts/${c.id}`}
                          className="hover:text-[#D4AF37]"
                        >
                          {c.firstName} {c.lastName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
        {companies.length === 0 && (
          <p className="text-center text-sm text-[#A89878]">
            No companies yet. Companies are added from CRM as your pipeline grows.
          </p>
        )}
      </div>
    </>
  );
}

export const metadata = { title: "Companies" };
