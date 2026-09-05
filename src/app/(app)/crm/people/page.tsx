import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CreateContactForm } from "@/components/crm/create-contact-form";
import { CreateLeadForm } from "@/components/crm/create-lead-form";
import { CrmImportForm } from "@/components/crm/crm-import-form";
import { CrmFacet, CrmShell, CrmToolbar } from "@/components/crm/crm-shell";
import { PeopleDirectory } from "@/components/crm/people-directory";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

function isLead(contact: { tags: string[]; leadScore?: number }) {
  return (
    contact.tags.includes("prospect") ||
    contact.tags.includes("hot_lead") ||
    (contact.leadScore ?? 0) >= 50
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
    <CrmShell
      title={leadsOnly ? "Leads" : "People"}
      description="Relationships, scores, and next steps — search like a directory, not a spreadsheet."
      actions={<AskAiButton module="crm" />}
    >
      <CrmToolbar>
        <div className="flex flex-wrap items-center gap-2">
          <CrmFacet href="/crm/people" active={!leadsOnly}>
            All people
          </CrmFacet>
          <CrmFacet href="/crm/people?facet=leads" active={leadsOnly}>
            Leads
          </CrmFacet>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
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
      </CrmToolbar>

      <PeopleDirectory
        leadsOnly={leadsOnly}
        people={people.map((contact) => ({
          id: contact.id,
          name: contactDisplayName(contact),
          jobTitle: contact.jobTitle,
          email: contact.email,
          companyName: companyName(contact.accountId),
          ownerName: memberNameByUserId(members, contact.ownerId),
          score: contact.leadScore,
          tags: contact.tags,
        }))}
      />
    </CrmShell>
  );
}

export const metadata = { title: "People" };
