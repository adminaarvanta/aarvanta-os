import Link from "next/link";
import { CrmNav } from "@/components/crm/crm-nav";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";
import { Badge } from "@/components/ui/badge";

function isLead(contact: {
  tags: string[];
  leadScore?: number;
}) {
  return (
    contact.tags.includes("prospect") ||
    contact.tags.includes("hot_lead") ||
    (contact.leadScore ?? 0) >= 50
  );
}

export default async function LeadsPage() {
  const scope = await getTenantScope();
  const contacts = await getCrmRepository().listContacts(scope);
  const leads = contacts
    .filter(isLead)
    .sort((a, b) => (b.leadScore ?? 0) - (a.leadScore ?? 0));

  return (
    <>
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#FFFFFF] sm:text-xl">Leads</h2>
        <p className="text-xs text-[#9AABC4] sm:text-sm">
          Prospects and hot leads with AI lead scoring
        </p>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        {leads.length === 0 ? (
          <p className="text-sm text-[#9AABC4]">
            No leads yet. Contacts qualify from inbound conversations or manual
            entry.
          </p>
        ) : (
          <ul className="space-y-3">
            {leads.map((contact) => (
              <li key={contact.id}>
                <Link
                  href={`/crm/contacts/${contact.id}`}
                  className="block rounded-xl border border-[#243656] bg-[#0D1524] p-4 hover:border-[#B8965D]/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#FFFFFF]">
                        {contactDisplayName(contact)}
                      </p>
                      <p className="text-xs text-[#9AABC4]">
                        {contact.jobTitle}
                        {contact.email ? ` · ${contact.email}` : ""}
                      </p>
                      {contact.leadScoreReason && (
                        <p className="mt-2 text-xs text-[#9AABC4] line-clamp-2">
                          {contact.leadScoreReason}
                        </p>
                      )}
                    </div>
                    <LeadScoreBadge score={contact.leadScore} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-[#121E32] text-[#9AABC4] ring-[#243656]"
                      >
                        {tag.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export const metadata = { title: "Leads" };
