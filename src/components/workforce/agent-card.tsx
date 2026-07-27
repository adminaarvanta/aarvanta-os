import Link from "next/link";
import {
  Briefcase,
  Crown,
  Headphones,
  Megaphone,
  Settings2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type {
  AgentDefinition,
  AgentLiveStatus,
  AgentPerformance,
  AgentType,
} from "@/types/workforce";
import { cn } from "@/lib/utils";

const icons: Record<AgentType, LucideIcon> = {
  ceo: Crown,
  coo: Settings2,
  sales_manager: Briefcase,
  marketing_manager: Megaphone,
  hr_manager: Users,
  cfo: Wallet,
  customer_success_manager: Headphones,
};

function StatusBadge({ status }: { status: AgentLiveStatus }) {
  const label =
    status === "working" ? "Working" : status === "waiting" ? "Waiting" : "Offline";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "working" &&
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        status === "waiting" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        status === "offline" && "bg-surface-muted text-muted"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "working" && "bg-emerald-500",
          status === "waiting" && "bg-amber-500",
          status === "offline" && "bg-muted"
        )}
      />
      {label}
    </span>
  );
}

function EfficiencyRing({ value }: { value: number }) {
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative h-12 w-12 shrink-0" aria-label={`${value}% efficiency`}>
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-border"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-gold"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground">
        {value}%
      </span>
    </div>
  );
}

export function AgentCard({
  agent,
  status = "waiting",
  performance,
}: {
  agent: AgentDefinition;
  status?: AgentLiveStatus;
  performance?: AgentPerformance;
}) {
  const Icon = icons[agent.type];
  const efficiency = performance?.efficiency ?? 78;

  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-gold/40">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gold/15 p-2.5 ring-1 ring-gold/30">
          <Icon className="h-5 w-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <StatusBadge status={status} />
          </div>
          <p className="text-[10px] text-gold">{agent.primaryFunction}</p>
          <p className="mt-1 text-xs text-muted">{agent.tagline}</p>
        </div>
        <EfficiencyRing value={efficiency} />
      </div>
      <ul className="mt-4 flex-1 space-y-1.5 text-xs text-muted">
        {agent.responsibilities.slice(0, 3).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-gold">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/workforce/tasks?start=1"
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black hover:bg-gold-bright"
        >
          Assign goal
        </Link>
        <Link
          href={`/workforce/${agent.type}`}
          className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:border-gold/40 hover:text-foreground"
        >
          Profile
        </Link>
      </div>
    </article>
  );
}
