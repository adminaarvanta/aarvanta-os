import Link from "next/link";
import { format } from "date-fns";
import { CompanyManualPanel } from "@/components/crm/company-manual-panel";
import { CrmNav } from "@/components/crm/crm-nav";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";
import { Badge } from "@/components/ui/badge";

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
    return (
      <div className="p-8 text-sm text-muted">Company not found.</div>
    );
  }

  const [contacts, deals, activities, members] = await Promise.all([
    repo.listContacts(scope, { accountId: id }),
    repo.listDeals(scope, { accountId: id }),
    repo.listActivities(scope, { accountId: id }),
    getTenantRepository().listMembers(scope),
  ]);

  const memberOptions = activeMemberOptions(members);

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0">
          <Link
            href="/crm/companies"
            className="text-xs text-gold hover:underline"
          >
            ← Companies
          </Link>
          <h2 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
            {company.name}
          </h2>
          <p className="text-xs text-muted sm:text-sm">
            {company.industry}
            {company.domain ? ` · ${company.domain}` : ""}
          </p>
        </div>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <CompanyManualPanel
          company={company}
          members={memberOptions}
          currentUserId={ctx.userId}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-border bg-surface-elevated p-5 lg:col-span-1">
            <h3 className="text-sm font-semibold text-foreground">Details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-muted">Owner</dt>
                <dd>{memberNameByUserId(members, company.ownerId)}</dd>
              </div>
              <div>
                <dt className="text-muted">Website</dt>
                <dd className="break-all">{company.website ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Size</dt>
                <dd>{company.size ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Revenue</dt>
                <dd className="font-medium text-gold">
                  £{company.purchaseTotal.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {company.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-surface-muted text-muted ring-border"
                    >
                      {tag.replace("_", " ")}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>
            {company.notes && (
              <p className="mt-3 text-xs text-muted">{company.notes}</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface-elevated p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground">Contacts</h3>
            {contacts.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No contacts linked.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <Link
                      href={`/crm/contacts/${contact.id}`}
                      className="block rounded-lg border border-border px-3 py-2 hover:bg-surface-muted"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {contactDisplayName(contact)}
                      </p>
                      <p className="text-xs text-muted">
                        {contact.jobTitle ?? contact.email ?? "Contact"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface-elevated p-5">
            <h3 className="text-sm font-semibold text-foreground">Deals</h3>
            <ul className="mt-3 space-y-2">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <Link
                    href={`/crm/deals/${deal.id}`}
                    className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-surface-muted sm:flex-row sm:justify-between sm:gap-2"
                  >
                    <span>{deal.title}</span>
                    <span className="text-muted">
                      {deal.status} · £{deal.value.toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
              {deals.length === 0 && (
                <p className="text-sm text-muted">No deals linked.</p>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-surface-elevated p-5">
            <h3 className="text-sm font-semibold text-foreground">Activities</h3>
            <ul className="mt-3 space-y-3">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="border-l-2 border-gold/40 pl-3 text-sm"
                >
                  <p className="font-medium text-foreground">
                    [{activity.type}] {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-muted">{activity.description}</p>
                  )}
                  <p className="text-xs text-muted">
                    {format(new Date(activity.occurredAt), "dd MMM yyyy HH:mm")}
                    {activity.authorName ? ` · ${activity.authorName}` : ""}
                  </p>
                </li>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-muted">No activities logged.</p>
              )}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Company" };
