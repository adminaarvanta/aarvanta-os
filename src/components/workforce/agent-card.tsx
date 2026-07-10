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
    <article className="flex flex-col rounded-xl border border-[#243656] bg-[#0D1524] p-5 transition-colors hover:border-[#B8965D]/40">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#B8965D]/15 p-2.5 ring-1 ring-[#B8965D]/30">
          <Icon className="h-5 w-5 text-[#B8965D]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#FFFFFF]">{agent.name}</h3>
          <p className="text-[10px] text-[#B8965D]">{agent.primaryFunction}</p>
          <p className="mt-1 text-xs text-[#9AABC4]">{agent.tagline}</p>
        </div>
      </div>
      <ul className="mt-4 flex-1 space-y-1.5 text-xs text-[#9AABC4]">
        {agent.responsibilities.slice(0, 3).map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-[#B8965D]">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <RunAgentButton agentType={agent.type} label="Run now" />
        <Link
          href={`/workforce/${agent.type}`}
          className="inline-flex items-center justify-center rounded-lg border border-[#243656] px-4 py-2 text-sm font-medium text-[#9AABC4] hover:border-[#B8965D]/40 hover:text-[#FFFFFF]"
        >
          Profile
        </Link>
      </div>
    </article>
  );
}
