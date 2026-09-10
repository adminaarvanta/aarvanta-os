"use client";

import Link from "next/link";
import { useState } from "react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { ContactManualPanel } from "@/components/crm/contact-manual-panel";
import { CrmAiInsightsPanel } from "@/components/crm/crm-ai-insights-panel";
import {
  CrmAvatar,
  CrmBackLink,
  CrmDetailList,
  CrmSection,
  CrmTag,
  formatCrmMoney,
} from "@/components/crm/crm-shell";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { ScoreContactButton } from "@/components/crm/score-contact-button";
import { VoiceLoopPanel } from "@/components/crm/voice-loop-panel";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/os/empty-state";
import { Button } from "@/components/ui/button";
import { MaturityBadge } from "@/components/ui/maturity-badge";
import type { CustomerTimelineItem } from "@/lib/crm/customer-360";
import { formatRelative } from "@/lib/utils";
import type { Conversation } from "@/types/communication";
import type { CrmCompany, CrmContact, CrmDeal, CrmTask } from "@/types/crm";
import type { FinanceInvoice } from "@/types/platform-modules";
import type { Project } from "@/types/project";
import type { MemberOption } from "@/lib/crm/members";

type TabId =
  | "overview"
  | "timeline"
  | "deals"
  | "conversations"
  | "tasks"
  | "projects"
  | "files"
  | "finance"
  | "notes";

export function Customer360View({
  name,
  contact,
  company,
  companies,
  members,
  currentUserId,
  deals,
  tasks,
  conversations,
  projects,
  invoices,
  timeline,
  nextAction,
  lastInteraction,
}: {
  name: string;
  contact: CrmContact;
  company: CrmCompany | null;
  companies: Array<{ id: string; name: string }>;
  members: MemberOption[];
  currentUserId: string;
  deals: CrmDeal[];
  tasks: CrmTask[];
  conversations: Conversation[];
  projects: Project[];
  invoices: FinanceInvoice[];
  timeline: CustomerTimelineItem[];
  nextAction: string;
  lastInteraction: string;
}) {
  const [tab, setTab] = useState<TabId>("overview");
  const lifecycle = contact.tags.includes("customer")
    ? "Customer"
    : contact.tags.includes("hot_lead")
      ? "Hot lead"
      : "Prospect";

  const tabs: Array<{ id: TabId; label: string; disabled?: boolean; hint?: string }> = [
    { id: "overview", label: "Overview" },
    { id: "timeline", label: "Timeline" },
    { id: "deals", label: "Deals" },
    { id: "conversations", label: "Conversations" },
    { id: "tasks", label: "Tasks" },
    { id: "projects", label: "Projects" },
    {
      id: "files",
      label: "Files",
      disabled: true,
      hint: "No file store is linked to this customer yet.",
    },
    { id: "finance", label: "Finance" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
      <CrmBackLink href="/crm/people" label="People" />
      <header className="mt-3 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-surface-elevated p-4">
        <div className="flex min-w-0 items-start gap-3">
          <CrmAvatar name={name} seed={contact.id} size="lg" />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground">{name}</h1>
            <p className="text-sm text-muted">
              {contact.jobTitle ?? "No title"}
              {company ? (
                <>
                  {" · "}
                  <Link href={`/crm/companies/${company.id}`} className="text-gold hover:underline">
                    {company.name}
                  </Link>
                </>
              ) : null}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
              <span>Lifecycle: {lifecycle}</span>
              <span>Value: {formatCrmMoney(contact.purchaseTotal)}</span>
              <span>Last interaction: {lastInteraction}</span>
              <span>Next: {nextAction}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LeadScoreBadge score={contact.leadScore} />
          <ScoreContactButton contactId={contact.id} />
          <AskAiButton
            module="crm"
            entityType="contact"
            entityId={contact.id}
            entityLabel={name}
          />
          <Button href={`/inbox`} size="sm" variant="secondary">
            Message
          </Button>
        </div>
      </header>

      <div className="mt-4">
        <Tabs tabs={tabs} value={tab} onChange={(id) => setTab(id as TabId)} />
      </div>

      <div className="mt-4 space-y-4">
        {tab === "overview" ? (
          <>
            <AlertSummary
              lastRefreshed={contact.leadScoreUpdatedAt}
              reason={contact.leadScoreReason}
            />
            <ContactManualPanel
              contact={contact}
              companies={companies}
              members={members}
              currentUserId={currentUserId}
            />
            <CrmAiInsightsPanel contactId={contact.id} />
            <VoiceLoopPanel contactId={contact.id} />
            <CrmSection title="Details" accent="navy">
              <CrmDetailList
                items={[
                  { label: "Email", value: contact.email ?? "—" },
                  { label: "Phone", value: contact.phone ?? "—" },
                  {
                    label: "Tags",
                    value:
                      contact.tags.length === 0
                        ? "—"
                        : contact.tags.map((tag) => (
                            <CrmTag key={tag}>{tag.replace(/_/g, " ")}</CrmTag>
                          )),
                  },
                ]}
              />
            </CrmSection>
          </>
        ) : null}

        {tab === "timeline" ? (
          timeline.length === 0 ? (
            <EmptyState
              title="No timeline yet"
              description="Calls, inbox threads, notes, and actions for this customer will appear here in one chronological list."
              action={<Button href="/inbox" size="sm">Open inbox</Button>}
            />
          ) : (
            <ol className="space-y-2">
              {timeline.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted">
                    {formatRelative(item.at)}
                    {item.channel ? ` · ${item.channel}` : ""}
                  </p>
                  {item.detail ? (
                    <p className="mt-1 text-sm text-muted">{item.detail}</p>
                  ) : null}
                  {item.href ? (
                    <Link href={item.href} className="mt-1 inline-block text-xs text-gold">
                      Open
                    </Link>
                  ) : null}
                </li>
              ))}
            </ol>
          )
        ) : null}

        {tab === "deals" ? (
          <EntityList
            empty="No deals linked to this customer."
            items={deals.map((deal) => ({
              href: `/crm/deals/${deal.id}`,
              title: deal.title,
              meta: formatCrmMoney(deal.value),
            }))}
          />
        ) : null}

        {tab === "conversations" ? (
          <EntityList
            empty="No inbox conversations linked."
            items={conversations.map((conversation) => ({
              href: `/inbox/${conversation.id}`,
              title: conversation.contact.name,
              meta: `${conversation.channels.join(", ")} · ${conversation.unreadCount} unread`,
            }))}
          />
        ) : null}

        {tab === "tasks" ? (
          <EntityList
            empty="No tasks linked."
            items={tasks.map((task) => ({
              href: "/crm/tasks",
              title: task.title,
              meta: task.status.replace(/_/g, " "),
            }))}
          />
        ) : null}

        {tab === "projects" ? (
          <EntityList
            empty="No projects linked to this customer."
            items={projects.map((project) => ({
              href: `/projects/${project.id}`,
              title: project.name,
              meta: project.status.replace(/_/g, " "),
            }))}
          />
        ) : null}

        {tab === "finance" ? (
          invoices.length === 0 ? (
            <EmptyState
              title="No matching invoices"
              description="Finance is Beta. Invoices appear here when the client name matches this customer."
              action={<MaturityBadge status="beta" />}
            />
          ) : (
            <EntityList
              empty=""
              items={invoices.map((invoice) => ({
                href: "/finance/invoices",
                title: invoice.number,
                meta: `${invoice.status} · ${invoice.amount}`,
              }))}
            />
          )
        ) : null}

        {tab === "notes" ? (
          <CrmSection title="Notes" accent="gold">
            <p className="whitespace-pre-wrap text-sm text-muted">
              {contact.notes?.trim() || "No notes yet. Add them from the overview panel."}
            </p>
          </CrmSection>
        ) : null}
      </div>
    </div>
  );
}

function AlertSummary({
  lastRefreshed,
  reason,
}: {
  lastRefreshed?: string;
  reason?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted/60 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">AI summary</p>
      <p className="mt-1 text-muted">
        {reason || "No AI summary yet. Score this contact to refresh from CRM records."}
      </p>
      <p className="mt-1 text-xs text-dim">
        Sources: CRM contact, deals, tasks, linked inbox threads.
        {lastRefreshed ? ` Last refreshed ${formatRelative(lastRefreshed)}.` : " Not refreshed yet."}
      </p>
    </div>
  );
}

function EntityList({
  empty,
  items,
}: {
  empty: string;
  items: Array<{ href: string; title: string; meta: string }>;
}) {
  if (items.length === 0) {
    return <EmptyState title={empty} description="This tab only shows records already linked to this contact." />;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.href + item.title}>
          <Link
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-surface-muted"
          >
            <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
            <span className="shrink-0 text-xs text-muted">{item.meta}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
