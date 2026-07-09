import Link from "next/link";
import { CrmNav } from "@/components/crm/crm-nav";
import { CreateContactForm } from "@/components/crm/create-contact-form";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName, type CrmContact } from "@/types/crm";

function ContactCard({
  contact,
  companyName,
  ownerName,
}: {
  contact: CrmContact;
  companyName: string;
  ownerName: string;
}) {
  return (
    <Link
      href={`/crm/contacts/${contact.id}`}
      className="block rounded-xl border border-[#243656] bg-[#0D1524] p-4 active:bg-[#121E32]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-[#FFFFFF]">{contactDisplayName(contact)}</p>
          {contact.jobTitle && (
            <p className="text-xs text-[#9AABC4]">{contact.jobTitle}</p>
          )}
        </div>
        <LeadScoreBadge score={contact.leadScore} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#9AABC4]">
        <div>
          <dt className="text-[10px] uppercase tracking-wide">Company</dt>
          <dd className="mt-0.5 truncate text-[#FFFFFF]">{companyName}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide">Purchases</dt>
          <dd className="mt-0.5 text-[#FFFFFF]">
            {contact.purchaseTotal > 0
              ? `£${contact.purchaseTotal.toLocaleString()}`
              : "—"}
          </dd>
        </div>
        {contact.email && (
          <div className="col-span-2">
            <dt className="text-[10px] uppercase tracking-wide">Email</dt>
            <dd className="mt-0.5 break-all text-[#FFFFFF]">{contact.email}</dd>
          </div>
        )}
        <div>
          <dt className="text-[10px] uppercase tracking-wide">Owner</dt>
          <dd className="mt-0.5 text-[#FFFFFF]">{ownerName}</dd>
        </div>
      </dl>
    </Link>
  );
}

export default async function ContactsPage() {
  const scope = await getTenantScope();
  const [contacts, companies, members] = await Promise.all([
    getCrmRepository().listContacts(scope),
    getCrmRepository().listCompanies(scope),
    getTenantRepository().listMembers(scope),
  ]);

  const memberOptions = activeMemberOptions(members);

  function companyName(id?: string) {
    if (!id) return "—";
    return companies.find((c) => c.id === id)?.name ?? "—";
  }

  function ownerName(id?: string) {
    return memberNameByUserId(members, id);
  }

  return (
    <>
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#FFFFFF] sm:text-xl">Contacts</h2>
        <p className="text-xs text-[#9AABC4] sm:text-sm">
          People, communication history, purchases, and AI lead scores.
        </p>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
        <CreateContactForm
          members={memberOptions}
          companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        />

        <div className="space-y-3 md:hidden">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              companyName={companyName(contact.accountId)}
              ownerName={ownerName(contact.ownerId)}
            />
          ))}
          {contacts.length === 0 && (
            <p className="py-8 text-center text-sm text-[#9AABC4]">
              No contacts yet. Qualified inbound conversations create CRM contacts
              automatically.
            </p>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-xl border border-[#243656] bg-[#0D1524] md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-[#243656] bg-[#121E32] text-left text-xs text-[#9AABC4]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Lead score</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Purchases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243656]">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-[#121E32]/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/contacts/${contact.id}`}
                        className="font-medium text-[#FFFFFF] hover:text-[#B8965D]"
                      >
                        {contactDisplayName(contact)}
                      </Link>
                      {contact.jobTitle && (
                        <p className="text-xs text-[#9AABC4]">{contact.jobTitle}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#9AABC4]">
                      {companyName(contact.accountId)}
                    </td>
                    <td className="px-4 py-3 text-[#9AABC4]">
                      {contact.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <LeadScoreBadge score={contact.leadScore} />
                    </td>
                    <td className="px-4 py-3 text-[#9AABC4]">
                      {ownerName(contact.ownerId)}
                    </td>
                    <td className="px-4 py-3 text-[#9AABC4]">
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
            <p className="p-8 text-center text-sm text-[#9AABC4]">
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
