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

const icons: Record<AgentType, LucideIcon> = {
  ceo: Crown,
  coo: Settings2,
  sales_manager: Briefcase,
  marketing_manager: Megaphone,
  hr_manager: Users,
  cfo: Wallet,
  customer_success_manager: Headphones,
};

function EfficiencyRing({ value }: { value: number }) {
  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative h-11 w-11 shrink-0" aria-label={`${value}%`}>
      <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="#E8EAF0" strokeWidth="3.5" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="var(--wf-accent)"
          strokeWidth="3.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
        style={{ color: "var(--wf-ink)" }}
      >
        {value}%
      </span>
    </div>
  );
}

/** Single quiet row — matches mockup Workforce list. */
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
  const working = status === "working";

  return (
    <Link
      href={`/workforce/${agent.type}`}
      className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#F8F9FC]"
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--wf-accent-soft)" }}
      >
        <Icon className="h-5 w-5" style={{ color: "var(--wf-accent)" }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[15px] font-semibold" style={{ color: "var(--wf-ink)" }}>
            {agent.name}
          </h3>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: working ? "var(--wf-ok-soft)" : "var(--wf-wait-soft)",
              color: working ? "var(--wf-ok)" : "#B45309",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: working ? "var(--wf-ok)" : "var(--wf-wait)" }}
            />
            {working ? "Working" : "Waiting"}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm" style={{ color: "var(--wf-muted)" }}>
          {agent.tagline}
        </p>
      </div>

      <EfficiencyRing value={efficiency} />
    </Link>
  );
}
