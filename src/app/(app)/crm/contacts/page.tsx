import Link from "next/link";
import { CrmNav } from "@/components/crm/crm-nav";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName, type CrmContact } from "@/types/crm";

function ContactCard({
  contact,
  companyName,
}: {
  contact: CrmContact;
  companyName: string;
}) {
  return (
    <Link
      href={`/crm/contacts/${contact.id}`}
      className="block rounded-xl border border-[#3d3528] bg-[#101010] p-4 active:bg-[#141414]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-[#F5E6C8]">{contactDisplayName(contact)}</p>
          {contact.jobTitle && (
            <p className="text-xs text-[#A89878]">{contact.jobTitle}</p>
          )}
        </div>
        <LeadScoreBadge score={contact.leadScore} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#A89878]">
        <div>
          <dt className="text-[10px] uppercase tracking-wide">Company</dt>
          <dd className="mt-0.5 truncate text-[#F5E6C8]">{companyName}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide">Purchases</dt>
          <dd className="mt-0.5 text-[#F5E6C8]">
            {contact.purchaseTotal > 0
              ? `£${contact.purchaseTotal.toLocaleString()}`
              : "—"}
          </dd>
        </div>
        {contact.email && (
          <div className="col-span-2">
            <dt className="text-[10px] uppercase tracking-wide">Email</dt>
            <dd className="mt-0.5 break-all text-[#F5E6C8]">{contact.email}</dd>
          </div>
        )}
      </dl>
    </Link>
  );
}

export default async function ContactsPage() {
  const scope = await getTenantScope();
  const [contacts, companies] = await Promise.all([
    getCrmRepository().listContacts(scope),
    getCrmRepository().listCompanies(scope),
  ]);

  function companyName(id?: string) {
    if (!id) return "—";
    return companies.find((c) => c.id === id)?.name ?? "—";
  }

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">Contacts</h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          People, communication history, purchases, and AI lead scores.
        </p>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <div className="space-y-3 md:hidden">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              companyName={companyName(contact.accountId)}
            />
          ))}
          {contacts.length === 0 && (
            <p className="py-8 text-center text-sm text-[#A89878]">
              No contacts yet. Qualified inbound conversations create CRM contacts
              automatically.
            </p>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-xl border border-[#3d3528] bg-[#101010] md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-[#3d3528] bg-[#141414] text-left text-xs text-[#A89878]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Lead score</th>
                  <th className="px-4 py-3 font-medium">Purchases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d3528]">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-[#141414]/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/contacts/${contact.id}`}
                        className="font-medium text-[#F5E6C8] hover:text-[#D4AF37]"
                      >
                        {contactDisplayName(contact)}
                      </Link>
                      {contact.jobTitle && (
                        <p className="text-xs text-[#A89878]">{contact.jobTitle}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#A89878]">
                      {companyName(contact.accountId)}
                    </td>
                    <td className="px-4 py-3 text-[#A89878]">
                      {contact.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <LeadScoreBadge score={contact.leadScore} />
                    </td>
                    <td className="px-4 py-3 text-[#A89878]">
                      {contact.purchaseTotal > 0
                        ? `£${contact.purchaseTotal.toLocaleString()}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {contacts.length === 0 && (
            <p className="p-8 text-center text-sm text-[#A89878]">
              No contacts yet. Qualified inbound conversations in the inbox create
              CRM contacts automatically.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Contacts" };
