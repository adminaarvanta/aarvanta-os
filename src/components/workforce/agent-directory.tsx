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
import {
  AGENT_DEFINITIONS,
  agentDepartmentLabel,
} from "@/lib/workforce/agents";
import type { AgentDefinition, AgentType } from "@/types/workforce";
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

const departmentOrder: AgentDefinition["department"][] = [
  "leadership",
  "operations",
  "sales",
  "marketing",
  "hr",
  "finance",
  "customer_success",
];

export function AgentDirectory() {
  const byDepartment = departmentOrder.map((dept) => ({
    department: dept,
    agents: AGENT_DEFINITIONS.filter((a) => a.department === dept),
  }));

  return (
    <div className="space-y-8">
      {byDepartment.map(({ department, agents }) => (
        <section key={department}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            {agentDepartmentLabel(department)}
          </h3>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden sm:block" />
            <div className="space-y-3">
              {agents.map((agent) => {
                const Icon = icons[agent.type];
                return (
                  <Link
                    key={agent.type}
                    href={`/workforce/${agent.type}`}
                    className={cn(
                      "relative flex items-center gap-4 rounded-xl border border-border bg-surface-elevated p-4",
                      "transition-colors hover:border-gold/40 hover:bg-surface-muted"
                    )}
                  >
                    <div className="relative z-10 rounded-lg bg-gold/15 p-2.5 ring-1 ring-gold/30">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{agent.name}</p>
                        <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold-bright ring-1 ring-gold/20">
                          {agent.primaryFunction}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{agent.title}</p>
                      <p className="mt-1 text-xs text-muted/80 line-clamp-1">
                        {agent.tagline}
                      </p>
                    </div>
                    <span className="text-xs text-gold">Open →</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
