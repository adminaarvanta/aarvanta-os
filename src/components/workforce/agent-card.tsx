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
    <article className="flex flex-col rounded-xl border border-[#3d3528] bg-[#101010] p-5 transition-colors hover:border-[#D4AF37]/40">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#D4AF37]/15 p-2.5 ring-1 ring-[#D4AF37]/30">
          <Icon className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#F5E6C8]">{agent.name}</h3>
          <p className="text-[10px] text-[#D4AF37]">{agent.primaryFunction}</p>
          <p className="mt-1 text-xs text-[#A89878]">{agent.tagline}</p>
        </div>
      </div>
      <ul className="mt-4 flex-1 space-y-1.5 text-xs text-[#A89878]">
        {agent.responsibilities.slice(0, 3).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-[#D4AF37]">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <RunAgentButton agentType={agent.type} label="Run now" />
        <Link
          href={`/workforce/${agent.type}`}
          className="inline-flex items-center justify-center rounded-lg border border-[#3d3528] px-4 py-2 text-sm font-medium text-[#A89878] hover:border-[#D4AF37]/40 hover:text-[#F5E6C8]"
        >
          Profile
        </Link>
      </div>
    </article>
  );
}
