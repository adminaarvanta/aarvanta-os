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
import { RunAgentButton } from "@/components/workforce/run-agent-button";
import type { AgentDefinition, AgentType } from "@/types/workforce";

const icons: Record<AgentType, LucideIcon> = {
  ceo: Crown,
  coo: Settings2,
  sales_manager: Briefcase,
  marketing_manager: Megaphone,
  hr_manager: Users,
  cfo: Wallet,
  customer_success_manager: Headphones,
};

export function AgentCard({ agent }: { agent: AgentDefinition }) {
  const Icon = icons[agent.type];

  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-gold/40">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gold/15 p-2.5 ring-1 ring-gold/30">
          <Icon className="h-5 w-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">{agent.name}</h3>
          <p className="text-[10px] text-gold">{agent.primaryFunction}</p>
          <p className="mt-1 text-xs text-muted">{agent.tagline}</p>
        </div>
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
        <RunAgentButton agentType={agent.type} label="Run now" />
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
