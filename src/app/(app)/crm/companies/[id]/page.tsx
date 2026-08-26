import Link from "next/link";
import { CompanyManualPanel } from "@/components/crm/company-manual-panel";
import {
  CrmAvatar,
  CrmBackLink,
  CrmDetailList,
  CrmSection,
  CrmShell,
  CrmTag,
  formatCrmMoney,
} from "@/components/crm/crm-shell";
import { CrmTimeline } from "@/components/crm/crm-timeline";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  const { id } = await params;
  const scope = ctx.scope;
  const repo = getCrmRepository();

  const company = await repo.getCompany(id, scope);
  if (!company) {
    return <div className="p-8 text-sm text-muted">Company not found.</div>;
  }

  const [contacts, deals, activities, members] = await Promise.all([
    repo.listContacts(scope, { accountId: id }),
    repo.listDeals(scope, { accountId: id }),
    repo.listActivities(scope, { accountId: id }),
    getTenantRepository().listMembers(scope),
  ]);

  const memberOptions = activeMemberOptions(members);

  return (
    <CrmShell
      title={company.name}
      lead={<CrmAvatar name={company.name} seed={company.id} size="lg" />}
      back={<CrmBackLink href="/crm/companies" label="Companies" />}
      description={[company.industry, company.domain].filter(Boolean).join(" · ")}
    >
      <CompanyManualPanel
        company={company}
        members={memberOptions}
        currentUserId={ctx.userId}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <CrmSection title="Details" accent="navy">
          <CrmDetailList
            items={[
              {
                label: "Owner",
                value: memberNameByUserId(members, company.ownerId),
              },
              {
                label: "Website",
                value: (
                  <span className="break-all">{company.website ?? "—"}</span>
                ),
              },
              { label: "Size", value: company.size ?? "—" },
              {
                label: "Revenue",
                value: (
                  <span className="font-medium text-gold">
                    {formatCrmMoney(company.purchaseTotal)}
                  </span>
                ),
              },
              {
                label: "Tags",
                value: (
                  <div className="flex flex-wrap gap-1">
                    {company.tags.length === 0
                      ? "—"
                      : company.tags.map((tag) => (
                          <CrmTag key={tag}>{tag.replace(/_/g, " ")}</CrmTag>
                        ))}
                  </div>
                ),
              },
            ]}
          />
          {company.notes ? (
            <p className="mt-3 text-xs text-muted">{company.notes}</p>
          ) : null}
        </CrmSection>

        <div className="lg:col-span-2">
          <CrmSection title="People" accent="cyan">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted">No contacts linked.</p>
            ) : (
              <ul className="space-y-2">
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <Link
                      href={`/crm/contacts/${contact.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border/80 px-3 py-2.5 hover:bg-surface-muted"
                    >
                      <CrmAvatar
                        name={contactDisplayName(contact)}
                        seed={contact.id}
                        size="sm"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          {contactDisplayName(contact)}
                        </span>
                        <span className="block text-xs text-muted">
                          {contact.jobTitle ?? contact.email ?? "Contact"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CrmSection>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CrmSection title="Deals" accent="gold">
          {deals.length === 0 ? (
            <p className="text-sm text-muted">No deals linked.</p>
          ) : (
            <ul className="space-y-2">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <Link
                    href={`/crm/deals/${deal.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/80 px-3 py-2.5 text-sm hover:bg-surface-muted"
                  >
                    <span className="min-w-0 truncate">{deal.title}</span>
                    <span className="shrink-0 text-muted">
                      {deal.status} · {formatCrmMoney(deal.value)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CrmSection>

        <CrmSection title="Activities" accent="emerald">
          <CrmTimeline items={activities} />
        </CrmSection>
      </div>
    </CrmShell>
  );
}

export const metadata = { title: "Company" };
