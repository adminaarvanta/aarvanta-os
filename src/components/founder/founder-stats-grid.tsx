"use client";

import Link from "next/link";
import {
  Brain,
  Inbox,
  Kanban,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { StatTile } from "@/components/ui/os/stat-tile";
import type { FounderSnapshot } from "@/types/founder";

export function FounderStatsGrid({ snapshot }: { snapshot: FounderSnapshot }) {
  const cards = [
    {
      label: "Pipeline",
      value: `£${snapshot.revenue.pipelineValue.toLocaleString()}`,
      sub: `Forecast £${snapshot.revenue.weightedForecast.toLocaleString()}`,
      icon: TrendingUp,
      href: "/crm/pipelines",
    },
    {
      label: "Hot leads",
      value: String(snapshot.sales.hotLeads),
      sub: `${snapshot.sales.totalContacts} contacts`,
      icon: Target,
      href: "/crm/leads",
    },
    {
      label: "Inbox",
      value: String(snapshot.inbox.totalConversations),
      sub: `${snapshot.inbox.urgentCount} urgent`,
      icon: Inbox,
      href: "/inbox",
    },
    {
      label: "Projects",
      value: String(snapshot.projects.active),
      sub: `${snapshot.projects.overdueTasks} overdue tasks`,
      icon: Kanban,
      href: "/projects",
    },
    {
      label: "Knowledge",
      value: String(snapshot.knowledge.documentCount),
      sub: `${snapshot.knowledge.readyDocuments} indexed`,
      icon: Brain,
      href: "/knowledge",
    },
    {
      label: "AI activity",
      value: String(snapshot.workforce.recentRuns),
      sub:
        snapshot.workforce.pendingWorkflowApprovals > 0
          ? `${snapshot.workforce.pendingWorkflowApprovals} approvals pending`
          : "Recent agent runs",
      icon: Sparkles,
      href: "/workforce",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <StatTile key={card.label} {...card} />
      ))}

      {snapshot.workforce.pendingWorkflowApprovals > 0 && (
        <Link
          href="/workflows"
          className="flex items-center gap-2 rounded-xl border border-gold/35 bg-navy/40 px-4 py-3 text-sm text-gold-bright transition-colors hover:border-gold/50 sm:col-span-2 xl:col-span-3"
        >
          <Workflow className="h-4 w-4 shrink-0" />
          {snapshot.workforce.pendingWorkflowApprovals} workflow(s) awaiting approval
        </Link>
      )}
    </div>
  );
}
