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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-[#3d3528] bg-[#101010] p-4 transition-colors hover:border-[#D4AF37]/40"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm text-[#A89878]">{card.label}</p>
              <Icon className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-[#F5E6C8]">{card.value}</p>
            <p className="mt-1 text-xs text-[#A89878]">{card.sub}</p>
          </Link>
        );
      })}

      {snapshot.workforce.pendingWorkflowApprovals > 0 && (
        <Link
          href="/workflows"
          className="rounded-xl border border-violet-800/50 bg-violet-950/20 p-4 sm:col-span-2 xl:col-span-3"
        >
          <div className="flex items-center gap-2 text-sm text-violet-300">
            <Workflow className="h-4 w-4" />
            {snapshot.workforce.pendingWorkflowApprovals} workflow(s) awaiting approval
          </div>
        </Link>
      )}
    </div>
  );
}
