import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowBuilder } from "@/components/voice/flow-builder";
import { VoicePageShell } from "@/components/voice/voice-ui";
import { isDefaultCatalogAgent } from "@/lib/channels/cloned-voice";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getTenantScope } from "@/lib/tenant/context";

type Params = { params: Promise<{ id: string }> };

export default async function AgentFlowPage({ params }: Params) {
  const { id } = await params;
  const scope = await getTenantScope();
  const agent = await getCallingAgentRepository().getAgent(id, scope);
  if (!agent) notFound();
  const catalogDefault = isDefaultCatalogAgent(agent);

  return (
    <VoicePageShell
      title={`${agent.name} · Script / Flow`}
      subtitle={
        catalogDefault
          ? "Default catalog agent — create a new agent to clone a custom voice."
          : "Clone a custom voice for this persona, then tune the conversation flow."
      }
      tone="navy"
      actions={
        <Link
          href="/voice/agents"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          ← Voice Agents
        </Link>
      }
    >
      <FlowBuilder agent={agent} />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Flow Builder" };
