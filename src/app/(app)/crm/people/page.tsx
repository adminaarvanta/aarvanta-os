import Link from "next/link";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CrmNav } from "@/components/crm/crm-nav";
import { CreateContactForm } from "@/components/crm/create-contact-form";
import { CreateLeadForm } from "@/components/crm/create-lead-form";
import { CrmImportForm } from "@/components/crm/crm-import-form";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName, type CrmContact } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function isLead(contact: { tags: string[]; leadScore?: number }) {
  return (
    contact.tags.includes("prospect") ||
    contact.tags.includes("hot_lead") ||
    (contact.leadScore ?? 0) >= 50
  );
}

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
      className="block rounded-xl border border-border bg-surface-elevated p-4 active:bg-surface-muted"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {contactDisplayName(contact)}
          </p>
          {contact.jobTitle && (
            <p className="text-xs text-muted">{contact.jobTitle}</p>
          )}
        </div>
        <LeadScoreBadge score={contact.leadScore} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
        <div>
          <dt className="text-[10px] uppercase tracking-wide">Company</dt>
          <dd className="mt-0.5 truncate text-foreground">{companyName}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide">Owner</dt>
          <dd className="mt-0.5 text-foreground">{ownerName}</dd>
        </div>
      </dl>
    </Link>
  );
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ facet?: string }>;
}) {
  const scope = await getTenantScope();
  const { facet } = await searchParams;
  const leadsOnly = facet === "leads";

  const [contacts, companies, members] = await Promise.all([
    getCrmRepository().listContacts(scope),
    getCrmRepository().listCompanies(scope),
    getTenantRepository().listMembers(scope),
  ]);

  const memberOptions = activeMemberOptions(members);
  const people = (leadsOnly ? contacts.filter(isLead) : contacts).sort(
    (a, b) => (b.leadScore ?? 0) - (a.leadScore ?? 0)
  );

  function companyName(id?: string) {
    if (!id) return "—";
    return companies.find((c) => c.id === id)?.name ?? "—";
  }

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              People
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              Relationships, lead scores, and next steps — not just a contact
              list.
            </p>
          </div>
          <AskAiButton module="crm" />
        </div>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/crm/people"
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              !leadsOnly
                ? "bg-gold text-black"
                : "border border-border text-muted hover:border-gold/40"
            )}
          >
            All people
          </Link>
          <Link
            href="/crm/people?facet=leads"
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              leadsOnly
                ? "bg-gold text-black"
                : "border border-border text-muted hover:border-gold/40"
            )}
          >
            Leads
          </Link>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {leadsOnly ? (
            <CreateLeadForm
              members={memberOptions}
              companies={companies.map((c) => ({ id: c.id, name: c.name }))}
            />
          ) : (
            <CreateContactForm
              members={memberOptions}
              companies={companies.map((c) => ({ id: c.id, name: c.name }))}
            />
          )}
          <CrmImportForm entity="contacts" />
        </div>

        <div className="space-y-3 md:hidden">
          {people.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              companyName={companyName(contact.accountId)}
              ownerName={memberNameByUserId(members, contact.ownerId)}
            />
          ))}
          {people.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">
              No people yet. Add someone you met, or import a spreadsheet.
            </p>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-xl border border-border bg-surface-elevated md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-surface-muted text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {people.map((contact) => (
                  <tr key={contact.id} className="hover:bg-surface-muted/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/contacts/${contact.id}`}
                        className="font-medium text-foreground hover:text-gold"
                      >
                        {contactDisplayName(contact)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {companyName(contact.accountId)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {contact.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <LeadScoreBadge score={contact.leadScore} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            className="bg-surface-muted text-muted ring-border"
                          >
                            {tag.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {people.length === 0 && (
            <p className="p-8 text-center text-sm text-muted">
              No people in this view yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "People" };
