import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowBuilder } from "@/components/voice/flow-builder";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getTenantScope } from "@/lib/tenant/context";

type Params = { params: Promise<{ id: string }> };

export default async function AgentFlowPage({ params }: Params) {
  const { id } = await params;
  const scope = await getTenantScope();
  const agent = await getCallingAgentRepository().getAgent(id, scope);
  if (!agent) notFound();

  return (
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <p className="text-xs text-muted">
          <Link href="/voice/agents" className="hover:text-gold">
            AI Employees
          </Link>
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          {agent.name} · Script / Flow
        </h2>
      </header>
      <FlowBuilder agent={agent} />
    </>
  );
}

export const metadata = { title: "Voice OS · Flow Builder" };
